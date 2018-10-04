import fs from 'fs';
import url from 'url';
import express from 'express';
import mongoose from 'mongoose';
import https from 'https';
import http from 'http';
import axios from 'axios';
import WebSocket from 'ws';
import nanoid from 'nanoid';
import Config from './config';
var rateLimit = require('ws-rate-limit');

mongoose.connect(`mongodb://${ Config.db.host }:${ Config.db.port }/${ Config.db.db_name }`, { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Typescript Interface
interface Message {
    user: string;
    country: string;
    add: boolean;
};

interface Click {
  amount: number,
  new: number,
  clicksToday: number,
  time: Date
};

interface TodayClick {
  amount: number,
  time: Date
};

interface Country {
  name: string,
  flag: string,
  clicks: number,
};

interface User {
  name: string,
  clicks: number,
  blocked: boolean,
};

interface Client extends WebSocket {
  fouls?: number,
  country?: string
}

// Mongoose Schema
let clickSchema = new mongoose.Schema({
  amount: Number,
  new: Number,
  clicksToday: Number,
  time: { type: Date, default: Date.now },
});

let todayClickSchema = new mongoose.Schema({
  amount: Number,
  time: { type: Date, default: Date.now },
});

let countrySchema = new mongoose.Schema({
  name: String,
  flag: String,
  clicks: { type: Number, default: 0},
});

let userSchema = new mongoose.Schema({
  name: String,
  clicks: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false },
})

// Mongoose Model
let Click = mongoose.model('Click', clickSchema);
let TodayClick = mongoose.model('TodayClick', todayClickSchema);
let Country = mongoose.model('Country', countrySchema);
let User = mongoose.model('User', userSchema);

// Rate limiter
let limiter = rateLimit('1s', 9);

// Clicks variables
let oldClicks: number, clicks: number, todayClicks: number, wss: any;

// Today date
let today = new Date().toDateString();

// Get inital click count
Click.findOne().sort({ time: -1 }).exec((err, click: Click) => {
  if (err) return console.error(err);
  console.log(click);
  clicks = click ? click.amount : 0;
  oldClicks = click ? click.amount : 0;
  todayClicks = clicks && today === new Date().toDateString() ? click.clicksToday : 0;
  const wss = startServer();
  setWebSocket(wss);
});

const startServer = () => {
  let server :any;
  const app = express();

  // SSL Cert
  if ( process.env.NODE_ENV === "production" ) {
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/mohsh.com/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/mohsh.com/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/mohsh.com/fullchain.pem', 'utf8');

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
      console.log(`Server started on port ${ Config.server.port || 8999 } :)`);
  });

  setInterval(() => {if(oldClicks !== clicks) updateDb()}, 2000);

  return wss;
}


// update db clicks
const updateDb = () => {
  if (today !== new Date().toDateString()) todayClicks = 0;
  let newClick = new Click({ amount: clicks, new: (clicks - oldClicks), clicksToday: todayClicks  })
  newClick.save((err, newClick) => {
    if (err) return console.error(err);
    oldClicks = clicks;
  })
}


const sendData = (userClicks: number, countryClicks: number, ws: Client, wss: any) => {
  Country.find().sort({ clicks: -1 }).limit(5).exec((err, countries) => {
    console.log(countries);
    ws.send(JSON.stringify({ count: clicks, countUser: userClicks, countToday: todayClicks, topCountries: countries }));
    wss.clients
        .forEach((client: Client) => {
          if (client !== ws)
            client.send(JSON.stringify({ count: clicks, countToday: todayClicks, topCountries: countries }));
        });
  })
}

const blockUser = (name: String, ws: WebSocket) => {
  ws.terminate();
  User.updateOne({ name }, { blocked: true } , (err, user) => {
    if (err) return console.error(err);
    console.log(`user ${ user.name } has been blocked!`);
  });
}

const createUser = () => {
  const name = nanoid();
  let newUser = new User({ name });
  newUser.save((err, newUser) => {if (err) return console.error(err);});
  console.log('saved')
  return name;
}

const checkUser = (name: any, ws: Client) => {
  User.findOne({ name: name }, (err, user: User) => {
    if (err) return console.error(err);
    if (user === undefined || user.blocked) ws.terminate();
  });
}

const setWebSocket = (wss: any) => {
  wss.on('connection', (ws: Client, req: any) => {
    const query = url.parse(req.url, true).query;
    const ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.connection.socket.remoteAddress;
    console.log(ip);
    const { name } = url.parse(req.url, true).query;

    if(!Config.server.allawed_origins.includes(req.headers.origin) || ip === null) {
      ws.terminate();
    }

    if(name === undefined) {
      console.log('create');
      const user = createUser();
      ws.send(`{ name: ${ user } }`);
    } else {
      console.log('check');
      checkUser(name, ws);
    }

    axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=cbf2e106a8b145288271e6d860bfdf75&ip=5.45.143.9&fields=country_name,country_flag`)
    .then(response => {
      console.log('done');
      Country.findOne({ name: response.data.country_name }, (err, country) => {
        if (err) return console.error(err);
        if (!country) {
          let newCountry = new Country({ name: response.data.country_name, flag: response.data.country_flag })
          newCountry.save((err, newCountry) => {
            if (err) return console.error(err);
            ws.country = response.data.country_name;
          })
        } else { ws.country = response.data.country_name }
      })
    })
    .catch(error => {
      console.error(error);
      ws.country = "Other";
    });

    ws.fouls = 0;
    limiter(ws);


  //connection is up, let's add a simple simple event
  ws.on('message', (message: string) => {
    var msg = JSON.parse(message);
    User.findOne({ name: "x4VfQbduzeyQWBPEhjam7", blocked: false }, (err, user: any) => {
      if (err) return console.error(err);
      if (!user) ws.terminate();
      if (msg) {
        user.clicks++;
        user.save((err: Error, user: User) => {
          if (err) return console.error(err);
          Country.findOne({ name: ws.country }, (err, country: any) => {
            if (err) return console.error(err);
            country.clicks++;
            country.save((err: Error, user: User) => {
              if (err) return console.error(err);
              clicks++;
              todayClicks++;
              sendData(user.clicks, country.clicks, ws, wss);
            })
          });
        })
      };
    });
   });

   ws.on('limited', (data: any) => {
     ws.fouls && ws.fouls++;
     let d = JSON.parse(data);
     if (ws.fouls && (ws.fouls >= 5)) {
       blockUser(d.user, ws);
     }
   })

});
}

