<template>
  <div>
    <van-tabbar
      v-model="active"
      class="shop-tabbar"
      active-color="#c9432e"
      inactive-color="#716b66"
    >
      <van-tabbar-item to="/home" icon="wap-home">首页</van-tabbar-item>
      <van-tabbar-item to="/category" icon="bag">分类</van-tabbar-item>
      <van-tabbar-item to="/cart" icon="cart">购物车</van-tabbar-item>
      <van-tabbar-item to="/mine" icon="contact">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const active = ref(0);
const tabMap: Record<string, number> = {
  "/home": 0,
  "/category": 1,
  "/cart": 2,
  "/mine": 3,
};

const route = useRoute();
watch(
  () => route.path,
  (val) => {
    // console.log(val);
    active.value = tabMap[val] ?? 0;
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>

<style scoped lang="scss">
/* 底部导航与商城首页的暖柿红主题保持一致 */
.shop-tabbar {
  --van-border-color: #e9e3dd;
  --van-tabbar-background: #fff;
  --van-tabbar-item-active-background: #fff;

  box-shadow: 0 -0.026667rem 0.213333rem rgba(45, 41, 38, 0.05);
}
</style>
