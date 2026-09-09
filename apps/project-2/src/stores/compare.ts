import { defineStore } from "pinia";
import { ref, watch } from "vue";
import {
  restore,
  storageKey,
  addSelection,
  type Selection,
} from "../compare/model";
export const useCompare = defineStore("compare", () => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(storageKey);
  } catch {
    /* 私密模式仍可使用内存状态 */
  }
  const selected = ref<Selection[]>(restore(saved));
  watch(
    selected,
    (value) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        /* 存储不可用不阻断交互 */
      }
    },
    { deep: true, flush: "sync" },
  );
  function add(id: number) {
    selected.value = addSelection(selected.value, id);
  }
  function remove(id: number) {
    selected.value = selected.value.filter((x) => x.prodId !== id);
  }
  function sku(id: number, skuId: number) {
    const item = selected.value.find((x) => x.prodId === id);
    if (item) item.skuId = skuId;
  }
  return {
    selected,
    add,
    remove,
    sku,
    clear: () => {
      selected.value = [];
    },
  };
});
