<template>
  <div class="counter">
    <div v-if="connection === 'lost'" class="lost">
      <p>Connection to the server lost, click the button to reconnect.</p>
    </div>
    <div class="row">
      <h1>This </h1>
      <button v-on:click="add" :class="{ animate: isAnimated }">button</button>
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
    connection: String,
    isAnimated: Boolean
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
$primary: #42b983;
.counter {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background-color: #42b983;
  outline: none;
  cursor: pointer;
  color: white;
  font-weight: bold;
  font-size: 16px;
  border: none;
  box-shadow: 2px 2px 20px #999;
  transition: box-shadow 100ms;
  &:hover {
    box-shadow: 5px 5px 20px #999;
  }
  &:active {
    box-shadow: 2px 2px 20px #999;
  }
  &:before,
  &:after {
    position: absolute;
    content: "";
    display: block;
    width: 140%;
    height: 100%;
    left: -20%;
    z-index: -1000;
    transition: all ease-in-out 0.5s;
    background-repeat: no-repeat;
  }

  &:before {
    display: none;
    top: -75%;
    background-image: radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, transparent 20%, $primary 20%, transparent 30%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, transparent 10%, $primary 15%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%);
    background-size: 10% 10%, 20% 20%, 15% 15%, 20% 20%, 18% 18%, 10% 10%,
      15% 15%, 10% 10%, 18% 18%;
  }

  &:after {
    display: none;
    bottom: -75%;
    background-image: radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, transparent 10%, $primary 15%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%),
      radial-gradient(circle, $primary 20%, transparent 20%);
    background-size: 15% 15%, 20% 20%, 18% 18%, 20% 20%, 15% 15%, 10% 10%,
      20% 20%;
  }
  &.animate {
    &:before {
      display: block;
      animation: topBubbles ease-in-out 0.75s forwards;
    }
    &:after {
      display: block;
      animation: bottomBubbles ease-in-out 0.75s forwards;
    }
  }
}

@keyframes topBubbles {
  0% {
    background-position: 5% 90%, 10% 90%, 10% 90%, 15% 90%, 25% 90%, 25% 90%,
      40% 90%, 55% 90%, 70% 90%;
  }
  50% {
    background-position: 0% 80%, 0% 20%, 10% 40%, 20% 0%, 30% 30%, 22% 50%,
      50% 50%, 65% 20%, 90% 30%;
  }
  100% {
    background-position: 0% 70%, 0% 10%, 10% 30%, 20% -10%, 30% 20%, 22% 40%,
      50% 40%, 65% 10%, 90% 20%;
    background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
  }
}

@keyframes bottomBubbles {
  0% {
    background-position: 10% -10%, 30% 10%, 55% -10%, 70% -10%, 85% -10%,
      70% -10%, 70% 0%;
  }
  50% {
    background-position: 0% 80%, 20% 80%, 45% 60%, 60% 100%, 75% 70%, 95% 60%,
      105% 0%;
  }
  100% {
    background-position: 0% 90%, 20% 90%, 45% 70%, 60% 110%, 75% 80%, 95% 70%,
      110% 10%;
    background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
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
