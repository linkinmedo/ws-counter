import fs from "fs";
import url from "url";
import express from "express";
import mongoose from "mongoose";
import https from "https";
import http from "http";
import axios from "axios";
import WebSocket from "ws";
import nanoid from "nanoid";
import { CronJob } from "cron";
import Config from "./config";
import {
  Data,
  Click,
  User,
  Message,
  TodayClick,
  Country,
  Client
} from "./interfaces";
import { ClickModel, TodayClickModel, CountryModel, UserModel } from "./models";
import Secrets from "./secrets.json";
var rateLimit = require("ws-rate-limit");

mongoose.connect(
  `mongodb://${Config.db.host}:${Config.db.port}/${Config.db.db_name}`,
  { useNewUrlParser: true }
);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

// Rate limiter
let limiter = rateLimit("1s", 9);

// Clicks variables
let clicksData: Data = {
  clicks: 0,
  oldClicks: 0,
  todayClicks: 0,
  countries: []
};
let wss: any;

// Get inital click count
ClickModel.findOne()
  .sort({ time: -1 })
  .exec((err, click: Click) => {
    if (err) return console.error(err);
    if (!click) return;
    console.log(click.time.toDateString());
    clicksData.clicks = click ? click.amount : 0;
    clicksData.oldClicks = click ? click.amount : 0;
    clicksData.todayClicks =
      click && click.time.toDateString() === new Date().toDateString()
        ? click.clicksToday
        : 0;
    CountryModel.find((err: Error, countries: Array<Country>) => {
      if (err) return console.error(err);
      countries.forEach(country =>
        clicksData.countries.push({
          name: country.name,
          flag: country.flag,
          clicks: country.clicks
        })
      );
      const wss = startServer();
      setWebSocket(wss);
    });
  });

new CronJob(
  "0 0 0 * * *",
  () => {
    clicksData.todayClicks = 0;
  },
  null,
  true
);

const startServer = () => {
  let server: any;
  const app = express();

  // SSL Cert
  if (process.env.NODE_ENV === "production") {
    const privateKey = fs.readFileSync(
      "/etc/letsencrypt/live/mohsh.com/privkey.pem",
      "utf8"
    );
    const certificate = fs.readFileSync(
      "/etc/letsencrypt/live/mohsh.com/cert.pem",
      "utf8"
    );
    const ca = fs.readFileSync(
      "/etc/letsencrypt/live/mohsh.com/fullchain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca
    };

    //initialize a simple https server
    server = https.createServer(credentials, app);
  } else {
    //initialize a simple http server
    server = http.createServer(app);
  }

  //initialize the WebSocket server instance
  const wss = new WebSocket.Server({ server });

  //start our server
  server.listen(Config.server.port || 8999, () => {
    console.log(`Server started on port ${Config.server.port || 8999} :)`);
  });

  setInterval(() => {
    if (clicksData.oldClicks !== clicksData.clicks) updateDb();
  }, 2000);

  return wss;
};

// update db clicks
const updateDb = () => {
  let newClick = new ClickModel({
    amount: clicksData.clicks,
    new: clicksData.clicks - clicksData.oldClicks,
    clicksToday: clicksData.todayClicks
  });
  newClick.save((err, newClick) => {
    if (err) return console.error(err);
    clicksData.oldClicks = clicksData.clicks;
    clicksData.countries.forEach(country => {
      CountryModel.updateOne(
        { name: country.name },
        { clicks: country.clicks, name: country.name, flag: country.flag },
        { upsert: true },
        err => {
          if (err) return console.error(err);
        }
      );
    });
  });
};

const sendData = (ws: Client, wss: any) => {
  clicksData.countries.sort((obj1, obj2) => obj2.clicks - obj1.clicks);
  ws.send(
    JSON.stringify({
      count: clicksData.clicks,
      countUser: ws.clicks,
      countToday: clicksData.todayClicks,
      topCountries: clicksData.countries.slice(0, 5)
    })
  );
  wss.clients.forEach((client: Client) => {
    if (client !== ws)
      client.send(
        JSON.stringify({
          count: clicksData.clicks,
          countToday: clicksData.todayClicks,
          topCountries: clicksData.countries.slice(0, 5)
        })
      );
  });
};

const blockUser = (name: String, ws: WebSocket) => {
  ws.terminate();
  UserModel.updateOne({ name }, { blocked: true }, (err, user) => {
    if (err) return console.error(err);
    console.log(`user ${user.name} has been blocked!`);
  });
};

const createUser = (ws: Client) => {
  const name = nanoid();
  let newUser = new UserModel({ name });
  newUser.save((err, newUser) => {
    if (err) return console.error(err);
  });
  console.log("user saved");
  ws.name = name;
};

const checkUser = (name: any, ws: Client) => {
  UserModel.findOne({ name: name }, (err, user: User) => {
    if (err) return console.error(err);
    if (user === undefined || user.blocked) ws.terminate();
    ws.name = name;
    ws.clicks = user.clicks;
  });
};

const setWebSocket = (wss: any) => {
  wss.on("connection", (ws: Client, req: any) => {
    console.log("Url: ", req.url);
    const query = url.parse(req.url, true).query;
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",").pop() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    console.log("User ip: ", ip);
    const { name } = url.parse(req.url, true).query;

    if (
      !Config.server.allawed_origins.includes(req.headers.origin) ||
      ip === null
    ) {
      ws.terminate();
    }

    if (!name) {
      console.log("creating user");
      createUser(ws);
      ws.clicks = 0;
      ws.send(JSON.stringify({ name: ws.name }));
    } else {
      console.log("checking user");
      checkUser(name, ws);
    }

    axios
      .get(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${Secrets.geo_key}&ip=${
          process.env.NODE_ENV === "production" ? ip : "5.45.143.9"
        }&fields=country_name,country_flag`
      )
      .then(response => {
        if (
          !clicksData.countries.find(
            country => country.name === response.data.country_name
          )
        ) {
          clicksData.countries.push({
            name: response.data.country_name,
            flag: response.data.country_flag,
            clicks: 0
          });
        }
        ws.country = response.data.country_name;
        // ws.send(JSON.stringify({ connected: true }));
        ws.send(
          JSON.stringify({
            count: clicksData.clicks,
            countUser: ws.clicks,
            countToday: clicksData.todayClicks,
            topCountries: clicksData.countries.slice(0, 5),
            connected: true
          })
        );
        ws.connected = true;
      })
      .catch(error => {
        console.error(error);
        ws.country = "Other";
        // ws.send(JSON.stringify({ connected: true }));
        ws.send(
          JSON.stringify({
            count: clicksData.clicks,
            countUser: ws.clicks,
            countToday: clicksData.todayClicks,
            topCountries: clicksData.countries.slice(0, 5),
            connected: true
          })
        );
        ws.connected = true;
      });

    ws.fouls = 0;
    limiter(ws);

    ws.on("close", () => {
      UserModel.updateOne({ name: ws.name }, { clicks: ws.clicks }, err => {
        if (err) return console.error(err);
      });
    });
    //connection is up, let's add a simple simple event
    ws.on("message", (message: string) => {
      var msg = JSON.parse(message);
      let userClicks: number, countryClicks: number;
      UserModel.findOne(
        { name: msg.user, blocked: false },
        (err, user: any) => {
          if (err) return console.error(err);
          if (!user) ws.terminate();
          if (ws.connected && msg.add) {
            clicksData.clicks++;
            clicksData.todayClicks++;
            ws.clicks !== undefined && ws.clicks++;
            clicksData.countries.find((country, index) => {
              if (country.name === ws.country) {
                clicksData.countries[index].clicks++;
                sendData(ws, wss);
                return true;
              }
              return false;
            });
          }
        }
      );
    });

    ws.on("limited", (data: any) => {
      ws.fouls && ws.fouls++;
      let d = JSON.parse(data);
      if (ws.fouls && ws.fouls >= 5) {
        blockUser(d.user, ws);
      }
    });
  });
};
