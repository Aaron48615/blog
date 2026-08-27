<template>
  <div class="skuTags">
    <div v-for="(item, index) in list" :key="index">
      <div>{{ index }}</div>
      <van-tag
        type="danger"
        plain
        v-for="(newItem, newIndex) in item"
        :key="newIndex"
        :class="{ 'prop-selected': defaultSelect[index] == newItem }"
        @click="$emit('select', index, newItem)"
        >{{ newItem }}</van-tag
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";

defineProps({
  list: { type: Object, required: true },
  defaultSelect: { type: Object, required: true },
});
defineEmits(["select"]);
</script>

<style scoped lang="scss">
.skuTags {
  font-size: 0.4rem;
  .prop-selected {
    color: #fff !important;
    background-color: red;
  }
  ::v-deep .van-tag--danger.van-tag--plain {
    color: var(--van-tag-danger-color);
    margin-left: 0.3rem;
    padding: 0.2rem;
    margin: 0.4rem 0.2rem;
  }
}
</style>
