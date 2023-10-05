<template>
  <div id="app">
    <div class="container" v-if="connection !== 'loading'">
      <AnimationComponent v-if="isAnimated" ref="animation" />
      <CounterComponent
        :count="count"
        :add="add"
        :countSession="countSession"
        :countUser="countUser"
        :robot="robot"
        :connection="connection"
      />
      <div class="row">
        <TodayComponent :countToday="countToday" />
        <TopCountries
          :topCountries="topCountries"
          :toggleAllCountries="toggleAllCountries"
        />
      </div>
      <AnimationToggle
        :isAnimated="isAnimated"
        v-on:toggle="isAnimated = !isAnimated"
      />
      <AllCountries
        v-if="showAllCountries"
        :allCountries="allCountries"
        :toggleAllCountries="toggleAllCountries"
      />
    </div>
    <LoadingComponent v-else />
  </div>
</template>

<script>
import AnimationComponent from "./components/Animation.vue";
import CounterComponent from "./components/Counter.vue";
import TodayComponent from "./components/Today.vue";
import TopCountries from "./components/TopCountries.vue";
import AllCountries from "./components/AllCountries.vue";
import LoadingComponent from "./components/Loading.vue";
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
      allCountries: [],
      showAllCountries: false,
      user: "",
      isAnimated: false,
      robot: false,
    };
  },
  components: {
    AnimationComponent,
    CounterComponent,
    TodayComponent,
    TopCountries,
    AllCountries,
    LoadingComponent,
    AnimationToggle,
  },
  beforeMount() {
    if (this.$cookies.isKey("ws-user"))
      this.user = this.$cookies.get("ws-user");
    this.connect();
  },
  methods: {
    add: _.throttle(function () {
      if (this.connection != "connected") {
        if (!this.robot) this.connect();
      } else {
        this.socket.send(
          JSON.stringify({
            user: this.user,
            add: true,
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
      this.socket.addEventListener("message", (event) => {
        var data = JSON.parse(event.data);
        this.actions(data);
      });
      this.socket.addEventListener("close", () => {
        this.connection = "lost";
      });
    },
    actions(data) {
      console.log('data', data);
      if (data.name) {
        this.user = data.name;
        this.$cookies.set("ws-user", data.name, Infinity);
      } else if (data.connected) {
        this.connection = "connected";
        this.updateCount(data);
      } else if (data.robot) {
        this.robot = true;
      } else if (data.updateAllCountries) {
        this.allCountries = data.allCountries;
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
      if (this.showAllCountries) this.allCountries = data.allCountries;
    },
    toggleAllCountries() {
      document.body.style.overflow = this.showAllCountries ? "auto" : "hidden";
      this.showAllCountries = !this.showAllCountries;
      this.socket.send(JSON.stringify({ allCountries: this.showAllCountries }));
    },
  },
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
      @media (max-width: 800px) {
        flex-direction: column;
      }
    }
  }
}
</style>
