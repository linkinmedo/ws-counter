import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import VueCookies from "vue-cookies";

Vue.config.productionTip = false;
Vue.use(VueCookies);

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
