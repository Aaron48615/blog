<template>
  <van-cell
    class="address-card"
    icon="location-o"
    center
    is-link
    @click="selectAddress"
  >
    <template #title>
      <div class="receiver">
        <strong>{{ address.name }}</strong>
        <span>{{ address.tel }}</span>
      </div>

      <div class="address-text">
        <van-tag v-if="address.isDefault" type="danger">默认</van-tag>
        {{ address.address }}
      </div>
    </template>
  </van-cell>
</template>

<script setup>
const address = {
  name: "张三",
  tel: "138****8888",
  address: "广东省深圳市南山区科技园 XX 号",
  isDefault: true,
};

const selectAddress = () => {
  // 跳转到地址选择页面
};
</script>

<style scoped>
.address-card {
  padding: var(--van-padding-md);
}

/* 模拟 ContactCard 底部红蓝条纹 */
.address-card::before {
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

.receiver {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--van-text-color);
  font-size: 15px;
}

.address-text {
  margin-top: 6px;
  color: var(--van-text-color-2);
  font-size: 13px;
  line-height: 20px;
}

.address-text .van-tag {
  margin-right: 4px;
}
</style>
