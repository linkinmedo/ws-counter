<template>
  <div class="top-countries">
    <h2>Top 5 Countries:</h2>
    <ol>
      <li v-for="country in topCountries" :key="country.name">
        <h4>{{ country.name }}</h4>
        <h4 class="count">{{ country.clicks }}</h4>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  name: "TopCountries",
  props: {
    topCountries: Array
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.top-countries {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  border: 1px solid grey;
  border-radius: 20px;
  margin-left: 10px;
}
ol {
  width: 100%;
  padding: 0;
}
li {
  display: flex;
  justify-content: space-around;
}
.count {
  color: red;
}
</style>
