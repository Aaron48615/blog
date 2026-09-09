<template>
  <button
    v-if="validId(Number(prodId))"
    :aria-label="added ? '已加入对比，点击移除' : '加入对比'"
    class="compare-add"
    @click.stop="toggle"
  >
    {{
      compact
        ? added
          ? "已选"
          : "对比"
        : added
          ? "已加入对比 ✓"
          : "＋ 加入对比"
    }}
  </button>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { showToast } from "vant";
import { useCompare } from "../stores/compare";
import { validId } from "../compare/model";
const props = defineProps<{ prodId: number | string; compact?: boolean }>();
const store = useCompare();
const added = computed(() =>
  store.selected.some((x) => x.prodId === Number(props.prodId)),
);
const toggle = () => {
  if (added.value) {
    store.remove(Number(props.prodId));
    return;
  }
  if (store.selected.length >= 2) {
    showToast("一次最多对比两件商品，请先移除一件");
    return;
  }
  store.add(Number(props.prodId));
};
</script>
<style scoped>
.compare-add {
  font: inherit;
  font-size: 0.29rem;
  padding: 0.14rem 0.2rem;
  margin: 0.12rem 0;
  border: 1px solid var(--compare-accent-border);
  border-radius: 0.16rem;
  background: var(--compare-primary-light);
  color: var(--compare-primary);
  cursor: pointer;
}
</style>
