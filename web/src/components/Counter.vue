<template>
  <div class="counter">
    <div v-if="connection === 'lost'" class="lost">
      <p>Connection to the server lost, click the button to reconnect.</p>
    </div>
    <div class="row">
      <h1>This </h1>
      <button v-on:click="add">button</button>
      <h1> has been clicked <span>{{ count }}</span> times.</h1>
    </div>
    <div class="row">
      <h2>You have clicked the button <span>{{ countSession }}</span> times this session.</h2>
    </div>
    <div class="row">
      <h2>You have clicked the button <span>{{ countUser }}</span> times overall.</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: "Counter",
  props: {
    count: Number,
    countSession: Number,
    countUser: Number,
    add: Function,
    connection: String
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../assets/_variables.scss";

.counter {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}
.row {
  display: flex;
  align-items: center;
}
span {
  color: $primary;
}
h3 {
  margin: 40px 0 0;
}
h1,
h2 {
  transition: width 500ms;
}
button {
  position: relative;
  border-radius: 10px;
  padding: 0 20px;
  height: 50px;
  text-transform: uppercase;
  margin: 0 10px;
  background-color: $primary;
  outline: none;
  cursor: pointer;
  color: white;
  font-weight: bold;
  font-size: 16px;
  font-family: "K2D";
  border: none;
  box-shadow: 0px 0px 20px #999;
  transition: box-shadow 100ms;
  &:hover {
    box-shadow: 0px 0px 30px #999;
  }
  &:active {
    box-shadow: 0px 0px 20px #999;
  }
}

.lost {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.6);
  padding: 0 10px;
  border-radius: 10px;
  box-shadow: 2px 2px 20px #999;
  p {
    color: white;
  }
}
</style>
