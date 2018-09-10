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
.today {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  border: 1px solid grey;
  border-radius: 20px;
  margin-right: 10px;
}
.count {
  color: red;
}
</style>
