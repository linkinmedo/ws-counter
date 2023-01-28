function rateLimit(rate: number, max: number) {
  const clients: any = [];

  // Create an interval that resets message counts
  setInterval(() => {
    let i = clients.length;
    while (i--) clients[i].messageCount = 0;
  }, rate);

  // Apply limiting to client:
  return function limit(client: any) {
    client.messageCount = 0;
    client.on("newListener", function(name: any, listener: any) {
      if (name !== "message" || listener._rated) return;

      // Rate limiting wrapper over listener:
      function ratedListener(data: any, flags: any) {
        if (client.messageCount++ < max) listener(data, flags);
        else client.emit("limited", data, flags);
      }
      ratedListener._rated = true;
      client.on("message", ratedListener);

      // Unset user's listener:
      process.nextTick(() => client.removeListener("message", listener));
    });

    // Push on clients array, and add handler to remove from array:
    clients.push(client);
    client.on("close", () => clients.splice(clients.indexOf(client), 1));
  };
}

export default rateLimit;
