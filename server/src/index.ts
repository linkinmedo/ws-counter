import url from "url";
import mongoose from "mongoose";
// import WebSocket, { WebSocketServer } from "ws";
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
import { ServerWebSocket } from "bun";
import { WebSocketServer } from "ws";

export interface WSData {
  count: number;
  countUser: number;
  countToday: number;
  fouls: number;
  country?: string;
  topCountries?: any[];
  connected?: boolean;
  clicks?: number;
  name?: string;
  terminated?: Boolean;
  allCountries?: Boolean;
  oldDate?: Date;
  robot?: boolean;
  // limitCount?: number;
  // last: number;
}

mongoose.set("strictQuery", true);
mongoose.connect(
  `mongodb://${Config.db.host}:${Config.db.port}/${Config.db.db_name}`,
);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

// Rate limiter
let [initializeClient, limiter, removeClient] = rateLimit(1000, 9);

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
          }),
        );
      }
      // const wss = startServer();
      // setWebSocket(wss);
      startBunServer();
    });
  });

new CronJob(
  "0 0 0 * * *",
  () => {
    clicksData.todayClicks = 0;
  },
  undefined,
  true,
);

const startBunServer = () => {
  Bun.serve({
    port: Config.server.port || 8999,
    async fetch(req, server) {
      const data: Partial<WSData> = {
        fouls: 0,
        allCountries: false,
      };
      const urlParams = new URLSearchParams(url.parse(req.url).search ?? "");
      const name = urlParams.get("name");
      const ip = req.headers.get("origin");
      if (!ip || ip === null || !Config.server.allawed_origins.includes(ip)) {
        return new Response("Couldn't find location :(", { status: 500 });
      }
      if (!name) {
        const name = await createUser();
        data.countUser = 0;
        data.name = name;
        // ws.send(JSON.stringify({ name: ws.name }));
        data.country = await getGeoLocation(ip);
      } else {
        const { robot, clicks } = await checkUser(name);
        data.country = !robot ? await getGeoLocation(ip) : "Other";
        data.countUser = clicks ?? 0;
        data.clicks = clicks;
        data.robot = robot;
      }
      data.topCountries = clicksData.countries.slice(0, 5);
      data.count = clicksData.clicks;
      data.countToday = clicksData.todayClicks;
      //
      // limiter(ws);
      if (server.upgrade(req, { data })) {
        return; // do not return a Response
      }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
      message(ws: ServerWebSocket<WSData>, message) {
        //       const message = isBinary ? data : data.toString();
        ws.data.oldDate = new Date();
        //
        let msg = JSON.parse(message as string);

        console.log('hello', limiter(ws))

        if (limiter(ws)) {
          ws.data.fouls++;
          console.log("------------foul", ws.data.fouls);
          if (ws.data.fouls && ws.data.fouls >= 5) {
            blockUser(msg.user, ws);
            return;
          }
        }
        if ("allCountries" in msg) {
          ws.data.allCountries = msg.allCountries;
          if (msg.allCountries)
            ws.send(
              JSON.stringify({
                updateAllCountries: true,
                allCountries: clicksData.countries,
              }),
            );
        }
        if (msg.add) {
          UserModel.findOne(
            { name: msg.user, blocked: false },
            (err: any, user: any) => {
              if (err) return console.error(err);
              if (!user) ws.terminate();
              if (!ws.data.name) ws.data.name = msg.user;
              clicksData.clicks++;
              clicksData.todayClicks++;
              ws.data.clicks !== undefined && ws.data.clicks++;
              clicksData.countries.find((country, index) => {
                if (country.name === ws.data.country) {
                  clicksData.countries[index].clicks++;
                  sendData(ws);
                  return true;
                }
                return false;
              });
            },
          ).clone();
        }
      }, // a message is received
      open(ws: ServerWebSocket<WSData>) {
        if (ws.data?.robot) {
          ws.send(JSON.stringify({ robot: true }));
          ws.close();
        } else {
          if (ws.data.name) {
            ws.send(JSON.stringify({ name: ws.data.name }));
          }
          ws.send(JSON.stringify({ ...ws.data, connected: true }));
          ws.subscribe("broadcast");
          initializeClient(ws);
        }
      }, // a socket is opened
      close(ws: ServerWebSocket<WSData>, code, message) {
        console.log("I am closing");
        UserModel.updateOne(
          { name: ws.data?.name },
          { clicks: ws.data?.clicks },
          (err: any) => {
            if (err) return console.error(err);
          },
        );
        ws.unsubscribe("broadcast");
        removeClient(ws);
      }, // a socket is closed
      drain(ws) {}, // the socket is ready to receive more data
    },
  });
  setInterval(() => {
    if (clicksData.oldClicks !== clicksData.clicks) updateDb();
  }, 5000);
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
        },
      );
    });
  });
};

function sendData(ws: ServerWebSocket<WSData>) {
  clicksData.countries.sort((obj1, obj2) => obj2.clicks - obj1.clicks);
  ws.send(
    JSON.stringify({
      count: clicksData.clicks,
      countUser: ws.data.clicks,
      countToday: clicksData.todayClicks,
      topCountries: clicksData.countries.slice(0, 5),
      allCountries: ws.data.allCountries && clicksData.countries,
    }),
  );
  ws.publish(
    "broadcast",
    JSON.stringify({
      count: clicksData.clicks,
      countToday: clicksData.todayClicks,
      topCountries: clicksData.countries.slice(0, 5),
      allCountries: ws.data.allCountries && clicksData.countries,
    }),
  );
}
//
const blockUser = (name: string, ws: ServerWebSocket<WSData>) => {
  ws.send(JSON.stringify({ robot: true }));
  ws.data.terminated = true;
  ws.terminate();
  UserModel.updateOne({ name }, { blocked: true }, (err: any, user: User) => {
    if (err) return console.error(err);
    console.log(`user ${name} has been blocked!`);
  });
};
//
async function createUser() {
  const name = nanoid();
  let newUser = new UserModel({ name });
  newUser.save((err: any) => {
    if (err) return console.error(err);
  });
  return name;
}

async function checkUser(name: any) {
  try {
    const user = await UserModel.findOne({ name: name });
    if (user === undefined || user?.blocked) {
      return { robot: true };
    } else {
      return { robot: false, userName: name, clicks: user?.clicks };
    }
  } catch (error) {
    console.error(error);
    return { robot: true };
  }
}

async function getGeoLocation(ip: string) {
  try {
    const response = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.GEO_KEY}&ip=${
        process.env.NODE_ENV === "production" ? ip : "5.45.143.9"
      }&fields=country_name,country_flag`,
    );
    const data = await response.json();

    if (
      !clicksData.countries.find(
        (country) => country.name === data.country_name,
      )
    ) {
      clicksData.countries.push({
        name: data.country_name,
        flag: data.country_flag,
        clicks: 0,
      });
    }
    return data.country_name;
  } catch (error) {
    console.error(error);
    return "Other";
  }
}
//
// const setWebSocket = (wss: any) => {
//   wss.on("connection", (ws: Client, req: any) => {
//     ws.fouls = 0;
//     ws.allCountries = false;
//     // const query = url.parse(req.url, true).query;
//     const ip = req.connection.remoteAddress;
//     // const ip =
//     //   (req.headers["x-forwarded-for"] || "").split(",").pop() ||
//     //   req.connection.remoteAddress ||
//     //   req.socket.remoteAddress ||
//     //   req.connection.socket.remoteAddress;
//     const { name } = url.parse(req.url, true).query;
//
//     if (
//       !ip ||
//       ip === null ||
//       !Config.server.allawed_origins.includes(req.headers.origin)
//     ) {
//       ws.terminate();
//       return;
//     }
//
//     if (!name) {
//       createUser(ws).then(() => {
//         ws.clicks = 0;
//         ws.send(JSON.stringify({ name: ws.name }));
//         getGeoLocation(ws, ip);
//       });
//     } else {
//       checkUser(name, ws).then(() => {
//         if (!ws.terminated) getGeoLocation(ws, ip);
//       });
//     }
//
//     limiter(ws);
//
//     ws.on("close", () => {
//       UserModel.updateOne(
//         { name: ws.name },
//         { clicks: ws.clicks },
//         (err: any) => {
//           if (err) return console.error(err);
//         }
//       );
//     });
//     //connection is up, let's add a simple simple event
//     ws.on("message", (data: string, isBinary: boolean) => {
//       const message = isBinary ? data : data.toString();
//       ws.oldDate = new Date();
//
//       let msg = JSON.parse(message);
//       if ("allCountries" in msg) {
//         ws.allCountries = msg.allCountries;
//         if (msg.allCountries)
//           ws.send(
//             JSON.stringify({
//               updateAllCountries: true,
//               allCountries: clicksData.countries,
//             })
//           );
//       }
//       if (ws.connected && msg.add) {
//         UserModel.findOne(
//           { name: msg.user, blocked: false },
//           (err: any, user: any) => {
//             if (err) return console.error(err);
//             if (!user) ws.terminate();
//             clicksData.clicks++;
//             clicksData.todayClicks++;
//             ws.clicks !== undefined && ws.clicks++;
//             clicksData.countries.find((country, index) => {
//               if (country.name === ws.country) {
//                 clicksData.countries[index].clicks++;
//                 sendData(ws, wss);
//                 return true;
//               }
//               return false;
//             });
//           }
//         ).clone();
//       }
//     });
//
//     ws.on("limited", (data: any) => {
//       ws.fouls++;
//       let d = JSON.parse(data);
//       if (ws.fouls && ws.fouls >= 5) {
//         blockUser(d.user, ws);
//       }
//     });
//   });
// };
