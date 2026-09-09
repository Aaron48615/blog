<template>
  <div>
    <RouterView></RouterView>
    <CompareDock />
  </div>
</template>

<script setup lang="ts">
import CompareDock from "./components/CompareDock.vue";
import "./compare/theme.css";
import { ref, reactive, onMounted } from "vue";
import { RouterView, RouterLink } from "vue-router";
</script>

<style scoped lang="scss"></style>
