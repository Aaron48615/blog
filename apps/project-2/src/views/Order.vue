<template>
  <div class="order-page" :aria-busy="isInitialLoading">
    <!-- 导航栏 -->
    <van-nav-bar
      title="确认订单 "
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 确认订单数据加载前显示简化骨架 -->
    <van-skeleton v-if="isInitialLoading" class="order-skeleton" animate>
      <template #template>
        <div class="order-skeleton__content">
          <van-skeleton-paragraph
            class="order-skeleton__address"
            row-width="100%"
          />
          <div v-for="item in 2" :key="item" class="order-skeleton__card">
            <van-skeleton-paragraph
              class="order-skeleton__image"
              row-width="100%"
            />
            <div class="order-skeleton__info">
              <van-skeleton-paragraph row-width="82%" />
              <van-skeleton-paragraph row-width="62%" />
              <van-skeleton-paragraph row-width="34%" />
            </div>
          </div>
          <van-skeleton-paragraph
            v-for="item in 5"
            :key="`row-${item}`"
            class="order-skeleton__row"
            :row-width="item % 2 ? '100%' : '88%'"
          />
        </div>
      </template>
    </van-skeleton>

    <template v-else>
      <!-- 本次订单使用的收货地址 -->
      <OrderAddressCard
        :receiver="defaultReceiver"
        :mobile="defaultMobile"
        :address="defaultAddress"
        @click="goAddress"
      />
      <!-- 商品信息 -->
      <div class="container">
        <div v-for="(item, index) in confirmData.shopCartOrders" :key="index">
          <div
            v-for="(item1, index1) in item.shopCartItemDiscounts[0]
              .shopCartItems"
            :key="index1"
          >
            <div class="shop-name">{{ item.shopName }}</div>
            <van-card
              :num="item1.prodCount"
              :price="item1.price"
              :desc="item1.skuName"
              :title="item1.prodName"
              :thumb="item1.pic"
            >
              <template #footer>
                <van-stepper v-model="item1.prodCount" disabled />邮费{{
                  item.transfee
                }}元
              </template>
            </van-card>
          </div>
        </div>

        <van-cell-group>
          <van-cell title="订单备注">
            <template #value>
              <van-field
                v-model="remark"
                name="remark"
                placeholder="请输入备注信息"
                style="padding: 0"
              />
            </template>
          </van-cell>
          <van-coupon-cell />
          <van-divider class="order-divider" />
          <van-cell title="总金额">
            <template #value> ¥ {{ confirmData.total }} </template>
          </van-cell>
          <van-cell title="优惠金额">
            <template #value> ¥ {{ confirmData.orderReduce }} </template>
          </van-cell>
          <van-cell title="商品总数" :value="confirmData.totalCount" />
          <van-cell title="支付金额">
            <template #value> ¥ {{ confirmData.actualTotal }} </template>
          </van-cell>
        </van-cell-group>
        <van-submit-bar
          :price="actualTotal"
          button-text="提交订单"
          @submit="onSubmit"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { confirmInfo, payInfo, submitInfo } from "../api/order";
import { showToast } from "vant";
import { useRouter } from "vue-router";
import { showConfirmDialog } from "vant";
import "vant/es/dialog/style";
import OrderAddressCard from "../components/OrderAddressCard.vue";

const router = useRouter();
const defaultReceiver = ref("");
const defaultMobile = ref("");
const defaultAddress = ref("");
const confirmMessage = sessionStorage.getItem("confirm");
const msg = confirmMessage ? JSON.parse(confirmMessage) : {};
const confirmData = ref<any>({});
const remark = ref("");
const actualTotal = ref(0);
const isInitialLoading = ref(true);

const goAddress = () => {
  router.push({
    path: "/address",
    query: { mode: "order" },
  });
};

onMounted(() => {
  confirm();
});

const confirm = async () => {
  isInitialLoading.value = true;
  try {
    let { data } = await confirmInfo(msg);
    console.log(data);
    confirmData.value = data;
    actualTotal.value = confirmData.value.actualTotal * 100;

    const address = confirmData.value.userAddr;
    if (!address) return;

    defaultReceiver.value = address.receiver;
    defaultMobile.value = address.mobile;
    defaultAddress.value = [
      address.province,
      address.city,
      address.area,
      address.addr,
    ]
      .filter(Boolean)
      .join("");
  } catch (err) {
    console.error("确认订单加载失败：", err);
    showToast("确认订单加载失败，请稍后重试");
  } finally {
    isInitialLoading.value = false;
  }
};

const onClickLeft = () => history.back();
const onSubmit = async () => {
  const cartInfo = confirmData.value.shopCartOrders;
  const orderShopParam = [];
  for (let i = 0; i < cartInfo.length; i++) {
    orderShopParam.push({
      shopId: cartInfo[i].shopId,
      remarks: remark.value,
    });
  }
  let {
    data: { orderNumbers },
  } = await submitInfo({ orderShopParam });
  if (orderNumbers) {
    showConfirmDialog({
      title: "确认付款",
      message: "确认支付该订单吗？",
    })
      .then(() => {
        // 用户确认付款后，按支付接口要求传递订单号和支付类型
        return payInfo({
          orderNumbers,
          payType: 1,
        })
          .then((result: { success: boolean; msg?: string | null }) => {
            if (!result.success) {
              showToast({
                message: result.msg || "支付失败，请稍后重试",
              });
              return;
            }
            showToast({
              message: "支付成功",
            });
            router.back();
          })
          .catch(() => {
            showToast({
              message: "支付失败，请稍后重试",
            });
          });
      })
      .catch(() => {
        showToast({
          message: "已下单，请及时支付",
        });
        router.back();
      });
  }
};
</script>

<style scoped lang="scss">
.order-page {
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
  --van-warning-color: var(--shop-accent);
  --van-text-color: var(--shop-text);
  --van-text-color-2: var(--shop-text-secondary);
  --van-text-color-3: var(--shop-text-muted);
  --van-border-color: var(--shop-border);
  --van-card-background: var(--shop-surface);
  --van-card-price-color: var(--shop-primary);
  --van-submit-bar-price-color: var(--shop-primary);
  --van-submit-bar-button-background: var(--shop-primary);

  min-height: 100vh;
  padding-bottom: 1.6rem;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

.order-page :deep(.van-nav-bar) {
  background: var(--shop-surface);
}

.order-page :deep(.van-nav-bar::after) {
  border-color: var(--shop-border);
}

.order-page :deep(.van-nav-bar__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.order-page :deep(.van-nav-bar__text),
.order-page :deep(.van-nav-bar .van-icon) {
  color: var(--shop-primary);
}

/* 地址卡与页面留出间距，保持订单信息层级清晰 */
.order-page :deep(.order-address-card) {
  width: auto;
  margin: 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;
  box-shadow: 0 0.08rem 0.266667rem rgba(45, 41, 38, 0.04);
}

.order-page :deep(.order-address-card .van-cell__left-icon) {
  color: var(--shop-primary);
}

.order-page :deep(.order-address-card .van-cell__right-icon) {
  color: var(--shop-text-muted);
}

.container > div {
  margin: 0 0.32rem 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;
  box-shadow: 0 0.08rem 0.266667rem rgba(45, 41, 38, 0.04);
}

.order-skeleton {
  padding: 0;
  background: var(--shop-page-bg);
}

.order-skeleton__content {
  width: 100%;
  padding: 0.32rem;
}

.order-skeleton__address {
  width: 100%;
  height: 2.133333rem;
  margin: 0 0 0.32rem;
  border-radius: 0.266667rem;
}

.order-skeleton__card {
  display: flex;
  gap: 0.266667rem;
  padding: 0.266667rem;
  margin-bottom: 0.266667rem;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.order-skeleton__image {
  flex: 0 0 2.133333rem;
  width: 2.133333rem;
  height: 2.133333rem;
  margin: 0;
  border-radius: 0.16rem;
}

.order-skeleton__info {
  flex: 1;
  min-width: 0;
  padding-top: 0.16rem;
}

.order-skeleton__row {
  height: 0.426667rem;
  margin-top: 0.4rem;
}

.shop-name {
  position: relative;
  padding: 0.32rem 0.32rem 0.16rem 0.533333rem;
  color: var(--shop-text);
  font-size: 0.4rem;
  font-weight: 600;
  line-height: 0.56rem;
}

.shop-name::before {
  position: absolute;
  top: 0.373333rem;
  left: 0.32rem;
  width: 0.08rem;
  height: 0.453333rem;
  background: var(--shop-primary);
  border-radius: 0.04rem;
  content: "";
}

.container :deep(.van-card) {
  margin: 0;
  padding: 0.266667rem 0.32rem 0.32rem;
  background: var(--shop-surface);
}

.container :deep(.van-card__thumb) {
  overflow: hidden;
  background: var(--shop-page-bg);
  border-radius: 0.16rem;
}

.container :deep(.van-card__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.container :deep(.van-card__desc) {
  color: var(--shop-text-secondary);
}

.container :deep(.van-card__price) {
  color: var(--shop-primary);
  font-weight: 600;
}

.container :deep(.van-card__num),
.container :deep(.van-card__footer) {
  color: var(--shop-text-secondary);
}

.container :deep(.van-stepper--disabled) {
  opacity: 0.72;
}

.container > :deep(.van-cell-group) {
  margin: 0 0.32rem 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;
  box-shadow: 0 0.08rem 0.266667rem rgba(45, 41, 38, 0.04);
}

.container > :deep(.van-cell-group::after) {
  display: none;
}

.container :deep(.van-cell) {
  padding: 0.32rem;
  color: var(--shop-text);
  background: var(--shop-surface);
}

.container :deep(.van-cell::after) {
  right: 0.32rem;
  left: 0.32rem;
  border-color: var(--shop-border);
}

.container :deep(.van-cell__value) {
  color: var(--shop-text-secondary);
}

.container :deep(.van-field) {
  background: transparent;
}

.container :deep(.van-field__control) {
  color: var(--shop-text-secondary);
  text-align: right;
}

.container :deep(.van-field__control::placeholder) {
  color: var(--shop-text-muted);
}

.container :deep(.order-divider) {
  height: 0.32rem;
  margin: 0;
  background: var(--shop-page-bg);
  border: 0;
}

.container :deep(.van-cell:last-child .van-cell__value) {
  color: var(--shop-primary);
  font-weight: 600;
}

.order-page :deep(.van-submit-bar) {
  background: var(--shop-surface);
  border-top: 0.026667rem solid var(--shop-border);
  box-shadow: 0 -0.08rem 0.266667rem rgba(45, 41, 38, 0.05);
}

.order-page :deep(.van-submit-bar__text) {
  color: var(--shop-text-secondary);
}

.order-page :deep(.van-submit-bar__price) {
  color: var(--shop-primary);
  font-weight: 600;
}

.order-page :deep(.van-submit-bar__button) {
  min-width: 2.933333rem;
  height: 0.96rem;
  background: var(--shop-primary);
  border: 0;
  border-radius: 0.48rem;
}

.order-page :deep(.van-submit-bar__button:active) {
  background: var(--shop-primary-dark);
}
</style>
