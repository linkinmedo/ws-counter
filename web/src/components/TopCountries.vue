<template>
  <div class="top-countries">
    <h2>Top 5 Countries:</h2>
    <ol>
      <li v-for="country in topCountries" :key="country.name">
        <div class="country">
          <img :src="country.flag" :alt="country.name" />
          <p>{{ country.name }}</p>
        </div>
        <p class="count">{{ country.clicks }}</p>
      </li>
    </ol>
    <p class="see-all-countries" @click="toggleAllCountries">
      see all countries
    </p>
  </div>
</template>

<script>
export default {
  name: "TopCountries",
  props: {
    topCountries: Array,
    toggleAllCountries: Function,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../assets/_variables.scss";

.top-countries {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  // border: 1px solid lightgrey;
  box-shadow: 0px 0px 20px #999;
  border-radius: 20px;
  margin: 20px 10px;
  z-index: 10;
}
ol {
  width: 100%;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  margin: 0 10px;
  padding: 0 50px;
  &:last-child {
    border-bottom: none;
  }
  .country {
    display: flex;
    align-items: center;
  }
}
img {
  height: 14px;
  margin-right: 10px;
}
.count {
  color: $primary;
}
.see-all-countries {
  cursor: pointer;
}
</style>
