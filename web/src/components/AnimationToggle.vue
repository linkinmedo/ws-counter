<template>
  <div class="animation-toggle" :class="{ disabled: !isAnimated }" v-on:click="toggle" title="Party?">
    <p>🎉</p>
  </div>
</template>

<script>
export default {
  name: "AnimationToggle",
  props: {
    isAnimated: Boolean
  },
  methods: {
    toggle() {
      this.$emit("toggle");
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../assets/_variables.scss";

.animation-toggle {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  cursor: pointer;
  transition: opacity 300ms;
  border-radius: 50%;
  background: $primary;
  font-size: 1.5em;
  box-shadow: 0px 0px 20px #999;
  &:hover {
    box-shadow: 0px 0px 30px #999;
  }
  &:active {
    box-shadow: 0px 0px 20px #999;
  }
  &.disabled {
    opacity: 0.4;
  }
}
</style>
