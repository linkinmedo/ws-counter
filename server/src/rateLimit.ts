// function rateLimit(rate: number, max: number) {
//   const clients: any = [];
//
//   // Create an interval that resets message counts
//   setInterval(() => {
//     let i = clients.length;
//     while (i--) clients[i].messageCount = 0;
//   }, rate);
//
//   // Apply limiting to client:
//   return function limit(client: any) {
//     client.messageCount = 0;
//     client.on("newListener", function(name: any, listener: any) {
//       if (name !== "message" || listener._rated) return;
//
//       // Rate limiting wrapper over listener:
//       function ratedListener(data: any, flags: any) {
//         if (client.messageCount++ < max) listener(data, flags);
//         else client.emit("limited", data, flags);
//       }
//       ratedListener._rated = true;
//       client.on("message", ratedListener);
//
//       // Unset user's listener:
//       process.nextTick(() => client.removeListener("message", listener));
//     });
//
//     // Push on clients array, and add handler to remove from array:
//     clients.push(client);
//     client.on("close", () => clients.splice(clients.indexOf(client), 1));
//   };
// }

import { ServerWebSocket } from "bun";
import { WSData } from ".";

export default function rateLimit(rate: number, max: number) {
  const clients: ServerWebSocket<WSData>[] = [];

  const count = Symbol() as unknown as keyof WSData;

  // Create an interval that resets message counts
  setInterval(() => {
    let i = clients.length;
    // console.log(clients);
    console.log(Date.now())
    while (i--) clients[i].data[count] = 0 as never;
  }, rate);

  // Apply limiting to client:
  return [
    function initialize(client: ServerWebSocket<WSData>) {
      client.data[count] = 0 as never;
      clients.push(client);
    },
    function limiter(client: ServerWebSocket<WSData>) {
      console.log('count', client.data[count])
      return ++client.data[count] > max;
    },
    function remove(client: ServerWebSocket<WSData>) {
      clients.splice(clients.indexOf(client), 1);
    },
  ];
}

// import { ServerWebSocket } from "bun";
// import { WSData } from ".";
//
// function rateLimit(limit: number, interval: number) {
//   let now = 0;
//   // const last = Symbol(),
//   //   count = Symbol();
//   const last = Symbol() as unknown as keyof WSData;
//   const count = Symbol() as unknown as keyof WSData;
//   setInterval(() => ++now, interval);
//   return (ws: ServerWebSocket<WSData>) => {
//     console.log("now", now);
//     console.log("last", ws.data[last]);
//     console.log("count", ws.data[count]);
//     if (ws.data[last] != now) {
//       ws.data[last] = now as never;
//       ws.data[count] = 1 as never;
//     } else {
//       return ++ws.data[count] > limit;
//     }
//   };
// }
//
// export default rateLimit;
