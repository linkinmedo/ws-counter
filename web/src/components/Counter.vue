<template>
  <div class="counter">
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
    add: Function
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.row {
  display: flex;
  align-items: center;
}
span {
  color: #42b983;
}
button {
  border-radius: 10px;
  width: 100px;
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
}
h3 {
  margin: 40px 0 0;
}
h1,
h2 {
  transition: width 500ms;
}
</style>
