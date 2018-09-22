<template>
  <div id="app">
    <div class="container" v-if="connection !== 'loading'">
      <Counter  :count=count :add=add :countSession=countSession :countUser=countUser :connection=connection />
      <div class="row">
        <Today :countToday=countToday />
        <TopCountries :topCountries=topCountries />
      </div>
    </div>
    <h2 v-else>loading...</h2>
  </div>
</template>

<script>
import Counter from "./components/Counter.vue";
import Today from "./components/Today.vue";
import TopCountries from "./components/TopCountries.vue";
import request from "request";
import nanoid from "nanoid";

export default {
  name: "app",
  data() {
    return {
      connection: "loading",
      count: 0,
      countSession: -1,
      countUser: 0,
      countToday: 0,
      topCountries: [],
      country: "",
      flag: "",
      user: ""
    };
  },
  components: {
    Counter,
    Today,
    TopCountries
  },
  beforeMount() {
    request(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.VUE_APP_IP_KEY}`,
      (error, response, body) => {
        this.country = JSON.parse(body).country_name;
        this.flag = JSON.parse(body).country_flag;
        if (!this.$cookies.isKey("ws-counter"))
          this.$cookies.set("ws-counter", nanoid(), Infinity);
        this.user = this.$cookies.get("ws-counter");
        this.connect(false);
      }
    );
  },
  methods: {
    add() {
      if (this.connection != "connected") {
        this.connect(true);
      } else {
        this.socket.send(
          JSON.stringify({
            user: this.user,
            country: this.country,
            flag: this.flag,
            add: true
          })
        );
      }
    },
    connect(add) {
      this.socket = new WebSocket(
        `${process.env.NODE_ENV === "production" ? "wss" : "ws"}://${
          process.env.VUE_APP_WS_HOST
        }:8999`
      );
      this.socket.addEventListener("open", () => {
        this.socket.send(
          JSON.stringify({
            user: this.user,
            country: this.country,
            add: add
          })
        );
      });
      this.socket.addEventListener("message", event => {
        this.connection = "connected";
        var data = JSON.parse(event.data);
        this.count = data.count;
        if (data.countUser) {
          this.countSession++;
          this.countUser = data.countUser;
        }
        this.countToday = data.countToday;
        this.topCountries = data.topCountries;
      });
      this.socket.addEventListener("close", () => {
        this.connection = "lost";
      });
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  .container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    .row {
      display: flex;
    }
  }
}
</style>
