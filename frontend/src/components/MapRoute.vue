<template>
  <div>
    <input v-model="start" class="route-input" placeholder="起点" />
    <input v-model="end" class="route-input" placeholder="终点" />
    <button @click="planRoute">规划路线</button>
  </div>
</template>

<script>
export default {
  data() {
    return { start: "", end: "" };
  },
  methods: {
    planRoute() {
      if (this.start && this.end) {
        this.$emit("planRoute", { start: this.start, end: this.end });
      } else {
        alert("请输入起点和终点");
      }
    },
  },
};
</script>

<style>
.route-input {
  width: 150px;
  padding: 5px;
  margin-right: 10px;
}
</style>
