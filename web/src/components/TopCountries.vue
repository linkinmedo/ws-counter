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
  </div>
</template>

<script>
export default {
  name: "TopCountries",
  props: {
    topCountries: Array
  },
  data() {
    return {
      countries: [
        {
          name: "Jordan",
          clicks: 100
        },
        {
          name: "USA",
          clicks: 99
        },
        {
          name: "KSA",
          clicks: 75
        },
        {
          name: "Tunis",
          clicks: 50
        },
        {
          name: "Russia",
          clicks: 45
        }
      ]
    };
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
  border: 1px solid lightgrey;
  // border-radius: 20px;
  margin-left: 10px;
}
ol {
  width: 100%;
  padding: 0;
}
li {
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-bottom: 1px solid lightgrey;
  margin: 0 10px;
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
  color: #42b983;
}
</style>
