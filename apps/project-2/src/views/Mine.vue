<template>
  <main class="mine-page">
    <section class="profile" aria-label="用户信息">
      <van-image
        round
        width="2.133333rem"
        height="2.133333rem"
        fit="cover"
        src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg"
        alt="张三的头像"
      >
        <template #error>
          <van-icon class="avatar-placeholder" name="contact" />
        </template>
      </van-image>
      <p class="user-name">我是用户名</p>
    </section>

    <div class="section-gap" aria-hidden="true"></div>

    <section class="orders" aria-labelledby="order-title">
      <header class="section-header">
        <h2 id="order-title">我的订单</h2>
        <span class="view-all" @click="goMyOrder">查看全部</span>
      </header>

      <div class="order-list">
        <div class="order-item">
          <van-badge :content="countList.unPay">
            <van-icon name="pending-payment" />
          </van-badge>
          <span>待支付</span>
        </div>
        <div class="order-item">
          <van-badge :content="countList.payed">
            <van-icon name="logistics" />
          </van-badge>
          <span>待发货</span>
        </div>
        <div class="order-item">
          <van-badge :content="countList.confirm">
            <van-icon name="tosend" />
          </van-badge>
          <span>待签收</span>
        </div>
        <div class="order-item">
          <van-badge :content="countList.success">
            <van-icon name="completed-o" />
          </van-badge>
          <span>已完成</span>
        </div>
      </div>
    </section>

    <div class="section-gap" aria-hidden="true"></div>

    <section class="account-data" aria-label="我的数据">
      <div class="data-item">
        <strong>{{ collectionCount }}</strong>
        <span>我的收藏</span>
      </div>
      <div class="data-item">
        <strong>0</strong>
        <span>我的消息</span>
      </div>
      <div class="data-item">
        <strong>0</strong>
        <span>我的足迹</span>
      </div>
    </section>

    <section class="service-list" aria-label="我的服务">
      <van-cell title="分销中心" icon="cart-o" is-link />
      <van-cell title="领券中心" icon="coupon-o" is-link />
      <van-cell title="我的优惠券" icon="records-o" is-link />
      <van-cell title="收货地址" icon="location-o" is-link @click="goAddr" />
    </section>

    <div class="logout-area">
      <van-button class="logout-button" type="danger" @click="logout">
        退出登录
      </van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { orderCountInfo, collectionCountInfo } from "../api/mine";
import { useRouter } from "vue-router";
import { delToken } from "../utils/auth";

const router = useRouter();
// const countList = ref([]);
const countList = ref<
  Partial<Record<"unPay" | "payed" | "confirm" | "success", number>>
>({});
const collectionCount = ref(0);

onMounted(() => {
  init();
});

const init = async () => {
  // try{
  //   let {data} = await orderCountInfo();
  //   countList.value = data;
  //   // console.log(countList.value)
  // }catch(err){
  //   throw new Error(err);
  // }
  try {
    const [orderResult, collectionResult] = await Promise.all([
      orderCountInfo(),
      collectionCountInfo(),
    ]);

    countList.value = orderResult.data;
    collectionCount.value = Number(collectionResult.data ?? 0);
  } catch (error) {
    collectionCount.value = 0;
    console.error("获取个人中心数据失败：", error);
  }
};

const goAddr = () => {
  router.push("/address");
};
const goMyOrder = () => {
  router.push("/myorder");
};
const logout = () => {
  delToken();
  router.push("/login");
};
</script>

<style scoped lang="scss">
.mine-page {
  --shop-primary: #c9432e;
  --shop-primary-dark: #ad3524;
  --shop-primary-light: #fff0eb;
  --shop-accent: #e9a23b;
  --shop-page-bg: #f7f5f2;
  --shop-surface: #fff;
  --shop-text: #2d2926;
  --shop-text-secondary: #716b66;
  --shop-text-muted: #a49d97;
  --shop-border: #e9e3dd;

  --van-primary-color: var(--shop-primary);
  --van-danger-color: var(--shop-primary);
  --van-text-color: var(--shop-text);
  --van-text-color-2: var(--shop-text-secondary);
  --van-text-color-3: var(--shop-text-muted);
  --van-border-color: var(--shop-border);
  --van-badge-background: var(--shop-primary);

  width: 100%;
  min-height: calc(100vh - 1.333333rem);
  margin: 0 auto;
  padding-bottom: 1.333333rem;
  color: var(--shop-text);
  background: var(--shop-page-bg);
  box-sizing: border-box;
}

.profile {
  height: 4.426667rem;
  padding-top: 0.853333rem;
  text-align: center;
  background: linear-gradient(
    180deg,
    var(--shop-primary-light) 0%,
    var(--shop-surface) 100%
  );
  box-sizing: border-box;
}

.profile :deep(.van-image) {
  display: block;
  margin: 0 auto;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.08rem solid var(--shop-surface);
  box-shadow: 0 0.106667rem 0.32rem rgba(45, 41, 38, 0.12);
}

.profile :deep(.van-image__error) {
  color: var(--shop-text-muted);
  background: var(--shop-surface);
}

.avatar-placeholder {
  font-size: 1.066667rem;
}

.user-name {
  margin: 0.106667rem 0 0;
  font-size: 0.426667rem;
  line-height: 0.586667rem;
  color: var(--shop-text);
  font-weight: 600;
}

.section-gap {
  height: 0.32rem;
  background: var(--shop-page-bg);
}

.orders {
  height: 3.68rem;
  margin: 0 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.333333rem;
  padding: 0 0.426667rem;
  border-bottom: 0.026667rem solid var(--shop-border);
  box-sizing: border-box;
}

.section-header h2 {
  margin: 0;
  font-size: 0.426667rem;
  font-weight: 600;
  line-height: 0.586667rem;
  color: var(--shop-text);
}

.view-all {
  font-size: 0.346667rem;
  line-height: 0.48rem;
  color: var(--shop-text-muted);
}

.order-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: 2.346667rem;
}

.order-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.346667rem;
  font-size: 0.373333rem;
  line-height: 0.533333rem;
  box-sizing: border-box;
}

.order-item :deep(.van-icon) {
  display: block;
  font-size: 0.666667rem;
  line-height: 0.72rem;
  color: var(--shop-primary);
}

.order-item > span {
  margin-top: 0.213333rem;
  color: var(--shop-text-secondary);
}

.order-item :deep(.van-badge) {
  min-width: 0.426667rem;
  height: 0.426667rem;
  padding: 0 0.08rem;
  border-width: 0.026667rem;
  font-size: 0.293333rem;
  line-height: 0.373333rem;
  box-sizing: border-box;
}

.account-data {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: 2.4rem;
  margin: 0 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
}

.data-item strong {
  font-size: 0.453333rem;
  font-weight: 400;
  line-height: 0.64rem;
  color: var(--shop-primary);
}

.data-item span {
  font-size: 0.426667rem;
  line-height: 0.586667rem;
  color: var(--shop-text-secondary);
}

.service-list {
  margin: 0.32rem 0.32rem 0;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.service-list :deep(.van-cell) {
  height: 1.173333rem;
  padding: 0.266667rem 0.426667rem;
  color: var(--shop-text);
  background: var(--shop-surface);
}

.service-list :deep(.van-cell__left-icon) {
  margin-right: 0.133333rem;
  color: var(--shop-primary);
  font-size: 0.426667rem;
}

.service-list :deep(.van-cell__title) {
  font-size: 0.373333rem;
  line-height: 0.586667rem;
}

.service-list :deep(.van-cell__right-icon) {
  color: var(--shop-text-muted);
  font-size: 0.426667rem;
}

.logout-area {
  display: flex;
  justify-content: center;
  min-height: 3.146667rem;
  padding-top: 0.426667rem;
  background: var(--shop-page-bg);
  box-sizing: border-box;
}

.logout-button {
  width: 2.346667rem;
  height: 1.173333rem;
  padding: 0;
  color: var(--shop-primary);
  background: var(--shop-primary-light);
  border-color: transparent;
  border-radius: 0.266667rem;
  font-size: 0.373333rem;
}
</style>
