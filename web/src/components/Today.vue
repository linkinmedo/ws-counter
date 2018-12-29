<template>
  <div class="today">
    <h1>The button has been clicked</h1>
    <h1 class="count">{{ countToday }}</h1>
    <h1>times today!</h1>
  </div>
</template>

<script>
export default {
  name: "Today",
  props: {
    countToday: Number
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../assets/_variables.scss";

.today {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // border: 1px solid lightgrey;
  box-shadow: 0px 0px 20px #999;
  border-radius: 20px;
  margin: 20px 10px;
  z-index: 10;
}
.count {
  color: $primary;
}
</style>
