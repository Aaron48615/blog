<template>
  <div class="layout">
    <RouterView></RouterView>
    <Tabbar></Tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { RouterView } from "vue-router";
import Tabbar from "./Tabbar.vue";
</script>

<style scoped lang="scss"></style>
