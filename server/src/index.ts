// import fs from "fs";
import "dotenv/config";
import url from "url";
import mongoose from "mongoose";
import axios from "axios";
import WebSocket, { WebSocketServer } from "ws";
import { nanoid } from "nanoid";
import { CronJob } from "cron";
import * as Config from "./config/index.js";
import {
  Data,
  Click,
  User,
  Message,
  TodayClick,
  Country,
} from "./interfaces.js";
import {
  ClickModel,
  TodayClickModel,
  CountryModel,
  UserModel,
} from "./models.js";
// import rateLimit from 'ws-rate-limit';
import rateLimit from "./rateLimit.js";

interface Client extends WebSocket {
  fouls: number;
  country?: string;
  connected?: boolean;
  clicks?: number;
  name?: string;
  terminated?: Boolean;
  allCountries: Boolean;
  oldDate: Date;
}

mongoose.connect(
  `mongodb://${Config.db.host}:${Config.db.port}/${Config.db.db_name}`
);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

// Rate limiter
let limiter = rateLimit(1000, 9);

// Clicks variables
let clicksData: Data = {
  clicks: 0,
  oldClicks: 0,
  todayClicks: 0,
  countries: [],
};

// Get inital click count
ClickModel.findOne()
  .clone()
  .sort({ time: -1 })
  .exec((err: any, click: any) => {
    if (err) return console.error(err);
    if (click) {
      clicksData.clicks = click ? click.amount : 0;
      clicksData.oldClicks = click ? click.amount : 0;
      clicksData.todayClicks =
        click && click.time.toDateString() === new Date().toDateString()
          ? click.clicksToday
          : 0;
    }
    CountryModel.find((err: Error, countries: Array<Country>) => {
      if (err) return console.error(err);
      if (countries.length > 0) {
        countries.forEach((country) =>
          clicksData.countries.push({
            name: country.name,
            flag: country.flag,
            clicks: country.clicks,
          })
        );
      }
      const wss = startServer();
      setWebSocket(wss);
    });
  });

new CronJob(
  "0 0 0 * * *",
  () => {
    clicksData.todayClicks = 0;
  },
  undefined,
  true
);

const startServer = () => {
  //initialize the WebSocket server instance
  const wss = new WebSocketServer({
    port: Config.server.port || 8999,
  });

  setInterval(() => {
    if (clicksData.oldClicks !== clicksData.clicks) updateDb();
  }, 5000);

  return wss;
};

// update db clicks
const updateDb = () => {
  let newClick = new ClickModel({
    amount: clicksData.clicks,
    new: clicksData.clicks - clicksData.oldClicks,
    clicksToday: clicksData.todayClicks,
  });
  newClick.save((err: any) => {
    if (err) return console.error(err);
    clicksData.oldClicks = clicksData.clicks;
    clicksData.countries.forEach((country) => {
      CountryModel.updateOne(
        { name: country.name },
        {
          clicks: country.clicks,
          name: country.name,
          flag: country.flag,
        },
        { upsert: true },
        (err) => {
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
      topCountries: clicksData.countries.slice(0, 5),
      allCountries: ws.allCountries && clicksData.countries,
    })
  );
  wss.clients.forEach((client: Client) => {
    if (client !== ws && !client.terminated)
      try {
        client.send(
          JSON.stringify({
            count: clicksData.clicks,
            countToday: clicksData.todayClicks,
            topCountries: clicksData.countries.slice(0, 5),
            allCountries: client.allCountries && clicksData.countries,
          })
        );
      } catch (err) {
        // ignore
      }
  });
};

const blockUser = (name: string, ws: Client) => {
  ws.send(JSON.stringify({ robot: true }));
  ws.terminated = true;
  ws.terminate();
  UserModel.updateOne({ name }, { blocked: true }, (err: any, user: User) => {
    if (err) return console.error(err);
    console.log(`user ${user.name} has been blocked!`);
  });
};

const createUser = async (ws: Client) => {
  const name = nanoid();
  let newUser = new UserModel({ name });
  await newUser.save((err: any) => {
    if (err) return console.error(err);
  });
  ws.name = name;
};

const checkUser = async (name: any, ws: Client) => {
  await UserModel.findOne({ name: name }, (err: any, user: User) => {
    if (err) return console.error(err);
    if (user === undefined || user.blocked) {
      ws.send(JSON.stringify({ robot: true }));
      ws.terminated = true;
      ws.terminate();
      return false;
    } else {
      ws.name = name;
      ws.clicks = user.clicks;
      return true;
    }
  }).clone();
};

const getLocation = (ws: Client, ip: string) => {
  axios
    .get(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.GEO_KEY}&ip=${process.env.NODE_ENV === "production" ? ip : "5.45.143.9"
      }&fields=country_name,country_flag`
    )
    .then((response) => {
      if (
        !clicksData.countries.find(
          (country) => country.name === response.data.country_name
        )
      ) {
        clicksData.countries.push({
          name: response.data.country_name,
          flag: response.data.country_flag,
          clicks: 0,
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
          connected: true,
        })
      );
      ws.connected = true;
    })
    .catch((error) => {
      console.error(error);
      ws.country = "Other";
      // ws.send(JSON.stringify({ connected: true }));
      ws.send(
        JSON.stringify({
          count: clicksData.clicks,
          countUser: ws.clicks,
          countToday: clicksData.todayClicks,
          topCountries: clicksData.countries.slice(0, 5),
          connected: true,
        })
      );
      ws.connected = true;
    });
};

const setWebSocket = (wss: any) => {
  wss.on("connection", (ws: Client, req: any) => {
    ws.fouls = 0;
    ws.allCountries = false;
    // const query = url.parse(req.url, true).query;
    const ip = req.connection.remoteAddress;
    // const ip =
    //   (req.headers["x-forwarded-for"] || "").split(",").pop() ||
    //   req.connection.remoteAddress ||
    //   req.socket.remoteAddress ||
    //   req.connection.socket.remoteAddress;
    const { name } = url.parse(req.url, true).query;

    if (
      !ip ||
      ip === null ||
      !Config.server.allawed_origins.includes(req.headers.origin)
    ) {
      ws.terminate();
      return;
    }

    if (!name) {
      createUser(ws).then(() => {
        ws.clicks = 0;
        ws.send(JSON.stringify({ name: ws.name }));
        getLocation(ws, ip);
      });
    } else {
      checkUser(name, ws).then(() => {
        if (!ws.terminated) getLocation(ws, ip);
      });
    }

    limiter(ws);

    ws.on("close", () => {
      UserModel.updateOne(
        { name: ws.name },
        { clicks: ws.clicks },
        (err: any) => {
          if (err) return console.error(err);
        }
      );
    });
    //connection is up, let's add a simple simple event
    ws.on("message", (data: string, isBinary: boolean) => {
      const message = isBinary ? data : data.toString();
      ws.oldDate = new Date();

      let msg = JSON.parse(message);
      if ("allCountries" in msg) {
        ws.allCountries = msg.allCountries;
        if (msg.allCountries)
          ws.send(
            JSON.stringify({
              updateAllCountries: true,
              allCountries: clicksData.countries,
            })
          );
      }
      if (ws.connected && msg.add) {
        UserModel.findOne(
          { name: msg.user, blocked: false },
          (err: any, user: any) => {
            if (err) return console.error(err);
            if (!user) ws.terminate();
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
        ).clone();
      }
    });

    ws.on("limited", (data: any) => {
      ws.fouls++;
      let d = JSON.parse(data);
      if (ws.fouls && ws.fouls >= 5) {
        blockUser(d.user, ws);
      }
    });
  });
};
