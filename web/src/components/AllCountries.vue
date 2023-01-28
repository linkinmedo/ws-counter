<template>
  <div class="all-countries">
    <h2>All Countries:</h2>
    <div class="close" @click="toggleAllCountries">x</div>
    <ol>
      <li v-for="country in allCountries" :key="country.name">
        <div class="country">
          <img :src="country.flag" :alt="country.name" />
          <p>{{ country.name }}</p>
        </div>
        <p class="count">{{ country.clicks }}</p>
      </li>
    </ol>
  </div>
</template>

<script>
export default {
  name: "AllCountries",
  props: {
    allCountries: Array,
    toggleAllCountries: Function,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../assets/_variables.scss";

.all-countries {
  height: 90vh;
  width: 50vw;
  position: fixed;
  top: 5vh;
  background: black;
  left: 50%;
  margin-left: -25vw;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  // background: linear-gradient(#0f0c29, #302b63, #24243e);
  background: #0f0c29;
  // border: 1px solid lightgrey;
  box-shadow: 0px 0px 20px #999;
  border-radius: 20px;
  z-index: 100;
  overflow-y: scroll;
  @media screen and (max-width: 800px) {
    width: 90vw;
    margin-left: -45vw;
  }
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
.close {
  height: 25px;
  width: 25px;
  position: absolute;
  right: 25px;
  top: 25px;
  border: 1px solid white;
  border-radius: 50%;
  cursor: pointer;
}
</style>
