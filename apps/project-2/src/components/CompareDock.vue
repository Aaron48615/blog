<template>
  <template v-if="visible">
    <button
      v-if="collapsed"
      class="compare-handle"
      :aria-label="`展开对比栏，已选${store.selected.length}件商品`"
      aria-expanded="false"
      @click="collapsed = false"
    >
      对比 {{ store.selected.length }} ›
    </button>
    <div v-else class="compare-dock" role="region" aria-label="商品对比栏">
      <button
        class="compare-collapse"
        aria-label="收起对比栏"
        aria-expanded="true"
        @click="collapsed = true"
      >
        收起 ‹
      </button>
      <div class="compare-picked">
        <button
          v-for="p in store.selected"
          :key="p.prodId"
          @click="store.remove(p.prodId)"
          :aria-label="`移除${names[p.prodId] || `商品 ${p.prodId}`}`"
        >
          {{ names[p.prodId] || `商品 ${p.prodId}` }} ×</button
        ><button @click="store.clear">清空</button>
      </div>
      <button class="compare-go" @click="go">
        对比 {{ store.selected.length }}/2 →
      </button>
    </div>
  </template>
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { useCompare } from "../stores/compare";
import { getWay } from "../utils/request";
const collapsed = ref(false);
const names = ref<Record<number, string>>({});
let version = 0;
const store = useCompare(),
  route = useRoute(),
  router = useRouter();
const visible = computed(
  () =>
    store.selected.length > 0 &&
    ["/home", "/category", "/search", "/prodinfo"].includes(route.path),
);
watch(
  () => store.selected.length,
  (count, previous) => {
    if (count === 0 || previous === 0) collapsed.value = false;
  },
);
watch(
  () => store.selected.map((x) => x.prodId).join(","),
  async () => {
    const current = ++version;
    const entries = await Promise.all(
      store.selected.map(async (p) => {
        try {
          const r = (await getWay("/prod/prodInfo", {
            prodId: p.prodId,
          })) as unknown as {
            success: boolean;
            data: { prodId: number; prodName: string };
          };
          return [
            p.prodId,
            r.success && r.data?.prodId === p.prodId
              ? r.data.prodName
              : `商品 ${p.prodId}`,
          ] as const;
        } catch {
          return [p.prodId, `商品 ${p.prodId}`] as const;
        }
      }),
    );
    if (current === version) names.value = Object.fromEntries(entries);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  version++;
});
function go() {
  if (store.selected.length < 2) {
    showToast("再选一件商品即可开始对比");
    return;
  }
  router.push("/compare");
}
</script>
<style scoped>
.compare-dock {
  position: fixed;
  z-index: 90;
  bottom: calc(1.55rem + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 0.48rem);
  max-width: 9.2rem;
  box-sizing: border-box;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.12rem;
  background: #fff;
  border: 1px solid var(--compare-accent-border);
  border-radius: 0.24rem;
  box-shadow: 0 0.08rem 0.4rem #552c1e18;
  font-size: 0.27rem;
}
.compare-picked {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
}
.compare-dock button {
  font: inherit;
  cursor: pointer;
  border: 0;
  border-radius: 0.13rem;
  padding: 0.16rem;
  background: var(--compare-primary-light);
  color: var(--compare-primary);
}
.compare-picked button {
  max-width: 2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.compare-dock .compare-go {
  background: var(--compare-primary);
  color: white;
  white-space: nowrap;
}
.compare-dock .compare-collapse {
  flex-shrink: 0;
  background: transparent;
  padding: 0.16rem 0.04rem;
  color: var(--compare-muted);
  white-space: nowrap;
}
/* 收起入口放在侧边，释放底部商品操作区，不再为浮层撑高页面。 */
.compare-handle {
  position: fixed;
  z-index: 90;
  left: max(0px, calc((100% - var(--shop-viewport-width, 10rem)) / 2));
  top: 45%;
  writing-mode: vertical-rl;
  font: inherit;
  font-size: 0.28rem;
  letter-spacing: 0.04rem;
  padding: 0.24rem 0.12rem;
  border: 1px solid var(--compare-accent-border);
  border-left: 0;
  border-radius: 0 0.18rem 0.18rem 0;
  background: var(--compare-primary);
  color: #fff;
  box-shadow: 0 0.04rem 0.18rem #552c1e18;
  cursor: pointer;
}
</style>
