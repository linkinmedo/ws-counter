import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import WebSocket from 'ws';
import Config from './config';

console.log(Config);

mongoose.connect(`mongodb://${ Config.db.host }:${ Config.db.port }/${ Config.db.db_name }`, { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Typescript Interface
interface Message {
    user: string;
    country: string;
    add: boolean;
}

// Mongoose Schema
let clickSchema = new mongoose.Schema({
  user: String,
  country: String,
  date: { type: Date, default: Date.now },
});

let countrySchema = new mongoose.Schema({
  name: String,
  flag: String,
  clicks: Number
});

// Mongoose Model
let Click = mongoose.model('Click', clickSchema);
let Country = mongoose.model('Country', countrySchema);

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const sendData = (msg: Message) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  Promise.all<any> ([Click.count({}),
                    Click.count({user: msg.user}),
                    Click.count({ date: {$gt: today} }),
                    Country.find({}).sort({clicks: -1}).limit(5)]).then( function(values: Array<Number | Array <Object>>) {
    wss.clients
        .forEach(client => {
          client.send(JSON.stringify({ count: values[0], countUser: values[1], countToday: values[2], topCountries: values[3] }));
        });
  })
}

wss.on('connection', (ws: WebSocket) => {

    // var clicks: Number, userClicks: Number, todayClicks: Number;

    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        //log the received message and send it back to the client
        console.log('received: %s', message);
        var msg = JSON.parse(message);
        if (msg.add) {
          let newClick = new Click({ country: msg.country, user: msg.user });
          newClick.save((err, newClick) => {
            if (err) return console.error(err);
            Country.find({ name: msg.country }, (err, country) => {
              if (err) return console.error(err);
              if (country.length === 0) {
                let newCountry = new Country({ name: msg.country, clicks: 1, flag: msg.flag });
                newCountry.save((err, newCountry) => {
                  if (err) return console.error(err);
                  sendData(msg);
                })
              } else {
                Country.updateOne({ name: msg.country }, { $inc: {clicks:1} }, (err, country) => {
                  if (err) return console.error(err);
                  sendData(msg);
                });
              }
            })
          } );
        } else {
          sendData(msg);
        }
    });
});

//start our server
server.listen(Config.server.port || 8999, () => {
    console.log(`Server started on port ${ Config.server.port || 8999 } :)`);
});
