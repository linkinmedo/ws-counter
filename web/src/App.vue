<template>
  <div id="app">
    <div class="container" v-if="connection !== 'loading'">
      <Counter
        :count=count
        :add=add
        :countSession=countSession
        :countUser=countUser
        :connection=connection
        :isAnimated=isAnimated />
      <div class="row">
        <Today :countToday=countToday />
        <TopCountries :topCountries=topCountries />
      </div>
    </div>
    <Loading v-else />
  </div>
</template>

<script>
import Counter from "./components/Counter.vue";
import Today from "./components/Today.vue";
import TopCountries from "./components/TopCountries.vue";
import Loading from "./components/Loading.vue";
import _ from "lodash";

export default {
  name: "app",
  data() {
    return {
      connection: "loading",
      count: 0,
      countSession: 0,
      countUser: 0,
      countToday: 0,
      topCountries: [],
      user: "",
      isAnimated: false
    };
  },
  components: {
    Counter,
    Today,
    TopCountries,
    Loading
  },
  beforeMount() {
    if (this.$cookies.isKey("ws-user"))
      this.user = this.$cookies.get("ws-user");
    this.connect();
  },
  methods: {
    add: _.throttle(function() {
      this.isAnimated = true;
      setTimeout(() => (this.isAnimated = false), 500);
      if (this.connection != "connected") {
        this.connect();
      } else {
        this.socket.send(
          JSON.stringify({
            user: this.user,
            add: true
          })
        );
      }
    }, 100),
    connect() {
      this.socket = new WebSocket(
        `${process.env.NODE_ENV === "production" ? "wss" : "ws"}://${
          process.env.VUE_APP_WS_HOST
        }:8999${this.user !== "" ? "?name=" + this.user : ""}`
      );
      this.socket.addEventListener("message", event => {
        var data = JSON.parse(event.data);
        this.actions(data);
      });
      this.socket.addEventListener("close", () => {
        this.connection = "lost";
      });
    },
    actions(data) {
      if (data.name) {
        this.user = data.name;
        this.$cookies.set("ws-user", data.name, Infinity);
      } else if (data.connected) {
        this.connection = "connected";
        this.updateCount(data);
      } else {
        this.updateCount(data);
      }
    },
    updateCount(data) {
      this.count = data.count;
      if (data.countUser != undefined) {
        if (!data.connected) {
          this.countSession++;
        }
        this.countUser = data.countUser;
      }
      this.countToday = data.countToday;
      this.topCountries = data.topCountries;
    }
  }
};
</script>

<style lang="scss">
body {
  margin: 0;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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
