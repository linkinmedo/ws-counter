<template>
  <div id="app">
    <div class="container" v-if="connection !== 'loading'">
      <Animation v-if="isAnimated" ref="animation"/>
      <Counter
        :count=count
        :add=add
        :countSession=countSession
        :countUser=countUser
        :connection=connection />
      <div class="row">
        <Today :countToday=countToday />
        <TopCountries :topCountries=topCountries />
      </div>
      <AnimationToggle :isAnimated=isAnimated v-on:toggle="isAnimated = !isAnimated" />
    </div>
    <Loading v-else />
  </div>
</template>

<script>
import Animation from "./components/Animation.vue";
import Counter from "./components/Counter.vue";
import Today from "./components/Today.vue";
import TopCountries from "./components/TopCountries.vue";
import Loading from "./components/Loading.vue";
import AnimationToggle from "./components/AnimationToggle.vue";
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
    Animation,
    Counter,
    Today,
    TopCountries,
    Loading,
    AnimationToggle
  },
  beforeMount() {
    if (this.$cookies.isKey("ws-user"))
      this.user = this.$cookies.get("ws-user");
    this.connect();
  },
  methods: {
    add: _.throttle(function() {
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
      if (this.$refs.animation) this.$refs.animation.animate();
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
  user-select: none;
  // background: linear-gradient(-45deg, #0f0c29, #302b63, #24243e);
  background: linear-gradient(#0f0c29, #302b63, #24243e);
  // background: linear-gradient(#141E30, #243B55);
}

#app {
  // font-family: "Avenir", Helvetica, Arial, sans-serif;
  font-family: "K2D", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  width: 100vw;
  min-height: 100vh;
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
