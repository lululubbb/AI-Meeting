<template>
  <div>
    <input
      v-model="location"
      class="search-input"
      placeholder="请输入地点"
      @keyup.enter="searchLocation"
    />
    <button @click="searchLocation">搜索</button>
  </div>
</template>

<script>
export default {
  data() {
    return { location: "" };
  },
  methods: {
    searchLocation() {
      if (this.location) {
        this.$emit("search", this.location);
      }
    },
  },
};
</script>

<style>
.search-input {
  width: 300px;
  padding: 5px;
  margin-right: 10px;
}
</style>
