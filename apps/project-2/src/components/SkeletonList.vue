<template>
  <div class="skeleton-list" aria-hidden="true">
    <van-skeleton
      v-for="item in count"
      :key="item"
      class="skeleton-list__card"
      :title="title"
      :row="row"
      :avatar="avatar"
      :avatar-size="avatarSize"
      :avatar-shape="avatarShape"
      animate
    />
  </div>
</template>

<script setup lang="ts">
// 只负责列表占位；页面通过 v-if 控制加载状态，尺寸统一使用 rem。
withDefaults(
  defineProps<{
    count?: number;
    row?: number;
    title?: boolean;
    avatar?: boolean;
    avatarSize?: string;
    avatarShape?: "square" | "round";
  }>(),
  {
    count: 3,
    row: 2,
    title: true,
    avatar: true,
    avatarSize: "2.133333rem",
    avatarShape: "square",
  },
);
</script>

<style scoped>
/* 页面可在组件根节点覆盖这些变量，无需穿透组件内部样式。 */
.skeleton-list__card {
  padding: var(--skeleton-card-padding, 0.4rem);
  margin-bottom: var(--skeleton-card-gap, 0.266667rem);
  background: var(--skeleton-card-background, var(--shop-surface, #fff));
  border-radius: var(--skeleton-card-radius, 0.266667rem);
  --van-skeleton-paragraph-height: var(--skeleton-row-height, 0.32rem);
}
</style>
