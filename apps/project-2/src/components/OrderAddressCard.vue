<template>
  <van-cell
    class="order-address-card"
    center
    icon="contact"
    is-link
    clickable
    @click="emit('click')"
  >
    <template #title>
      <template v-if="receiver && address">
        <div class="order-address-card__line">
          <span class="order-address-card__label">收件人：</span>
          <span>{{ receiver }}</span>
          <span v-if="mobile" class="order-address-card__mobile">
            {{ mobile }}
          </span>
        </div>
        <div class="order-address-card__line order-address-card__address">
          <span class="order-address-card__label">地址：</span>
          <span>{{ address }}</span>
        </div>
      </template>
      <div v-else class="order-address-card__empty">请选择收货地址</div>
    </template>
  </van-cell>
</template>

<script setup lang="ts">
defineProps<{
  receiver?: string;
  mobile?: string;
  address?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
.order-address-card {
  padding: var(--van-contact-card-padding, var(--van-padding-md));

  &::before {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: repeating-linear-gradient(
      -45deg,
      var(--van-warning-color) 0,
      var(--van-warning-color) 20%,
      transparent 0,
      transparent 25%,
      var(--van-primary-color) 0,
      var(--van-primary-color) 45%,
      transparent 0,
      transparent 50%
    );
    background-size: 80px;
    content: "";
  }

  :deep(.van-cell__title) {
    min-width: 0;
    margin-left: 5px;
    line-height: var(--van-line-height-md);
  }

  &__line {
    display: flex;
    align-items: flex-start;
    min-width: 0;
  }

  &__label {
    flex: none;
  }

  &__address {
    color: var(--van-text-color-2);
    font-size: var(--van-font-size-sm);
    line-height: 20px;
  }

  &__mobile {
    margin-left: 12px;
    color: var(--van-text-color-2);
    font-size: var(--van-font-size-sm);
  }

  &__empty {
    color: var(--van-text-color-2);
  }
}
</style>
