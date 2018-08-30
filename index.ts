import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import WebSocket from 'ws';
import Config from './config';

console.log(Config);

mongoose.connect(`mongodb://${ Config.db.host }:${ Config.db.port }/${ Config.db.db_name }`, { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Mongoose Schema
let clickSchema = new mongoose.Schema({
  user: String,
  country: String,
  date: { type: Date, default: Date.now },
});

// Mongoose Model
let Click = mongoose.model('Click', clickSchema);

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

    Click.count({}, ( err, count) => {
      console.log( "Number of users:", count );
      wss.clients
          .forEach(client => {
            ws.send(`${count}`)
          });
    });
    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        let newClick = new Click({ country: "Jordan", user: "linkinmedo" });
        newClick.save((err, newClick) => {
          if (err) return console.error(err);
          Click.count({}, ( err, count) => {
            console.log( "Number of users:", count );
            wss.clients
                .forEach(client => {
                  client.send(`${count}`);
                });
          });
        } );

        // const broadcastRegex = /^broadcast\:/;
        //
        // if (broadcastRegex.test(message)) {
        //     message = message.replace(broadcastRegex, '');
        //
        //     //send back the message to the other clients
        //     wss.clients
        //         .forEach(client => {
        //             if (client != ws) {
        //                 client.send(`Hello, broadcast message -> ${message}`);
        //             }
        //         });
        // } else {
        //     ws.send(`Hello, you sent -> ${message}`);
        // }
    });
});

//start our server
server.listen(Config.server.port || 8999, () => {
    console.log(`Server started on port ${ Config.server.port || 8999 } :)`);
});
