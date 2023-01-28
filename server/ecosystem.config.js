module.exports = {
  apps: [
    {
      name: "CounterButton",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
