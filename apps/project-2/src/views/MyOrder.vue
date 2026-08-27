<template>
  <div
    class="my-order"
    :aria-busy="
      tabs[active]?.state.initialLoading || tabs[active]?.state.loading
    "
  >
    <van-nav-bar
      title="我的订单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    <van-tabs v-model:active="active" sticky @click-tab="onClickTab">
      <van-tab v-for="item in tabs" :key="item.status" :title="item.title">
        <!-- 每个标签页首次加载时显示简化订单骨架 -->
        <div v-if="item.state.initialLoading" class="my-order-skeleton">
          <van-skeleton
            v-for="index in 2"
            :key="index"
            class="my-order-skeleton__card"
            title
            :row="3"
            avatar
            avatar-shape="square"
            animate
          />
        </div>
        <!-- 空状态 -->
        <van-empty
          class="order-empty"
          description="暂时还没有订单"
          v-else-if="newList.length == 0 && item.state.finished"
        />
        <!-- 列表 -->
        <van-list
          v-else
          v-model:loading="item.state.loading"
          :finished="item.state.finished"
          finished-text="没有更多了"
          @load="onLoad(item)"
        >
          <div v-for="(order, index) in newList" :key="index" class="main">
            <van-card
              v-for="(tab1, index1) in order.orderItemDtos"
              :key="index1"
              :num="tab1.prodCount"
              :price="tab1.price"
              :desc="tab1.skuName"
              :title="tab1.prodName"
              :thumb="tab1.pic"
            />
            <van-cell-group>
              <van-cell
                title="订单号"
                :value="order.orderNumber"
                :label="`¥${order.actualTotal}`"
              />
            </van-cell-group>
            <van-button
              type="primary"
              class="btn"
              size="small"
              v-if="item.status == 1"
              @click="handlePay(order)"
              >确认付款</van-button
            >
            <van-button
              type="primary"
              class="btn"
              size="small"
              v-if="item.status == 3"
              @click="handleReceipt(order)"
              >确认收货</van-button
            >
          </div>
        </van-list>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { myOrderInfo, payInfo, receiptInfo } from "../api/order";
import { showDialog } from "vant";
import { showConfirmDialog } from "vant";
import "vant/es/dialog/style";

interface OrderSummary {
  orderNumber: string;
  actualTotal: number;
  status: number;
  orderItemDtos: {
    prodCount: number;
    price: number;
    skuName: string;
    prodName: string;
    pic: string;
  }[];
}
interface OrderTabState {
  current: number;
  loading: boolean;
  initialLoading: boolean;
  finished: boolean;
  list: OrderSummary[];
}

const active = ref(0);
const tabs = reactive([
  {
    title: "待付款",
    status: 1,
    state: createTabState(),
  },
  {
    title: "待发货",
    status: 2,
    state: createTabState(),
  },
  {
    title: "待收货",
    status: 3,
    state: createTabState(),
  },
  {
    title: "已完成",
    status: 5,
    state: createTabState(),
  },
]);
// const tab = ref({});
type OrderTab = (typeof tabs)[number];
const newList = ref<OrderSummary[]>([]);
function createTabState(): OrderTabState {
  return {
    // 返出数据
    current: 0,
    loading: false,
    initialLoading: true,
    finished: false,
    list: [],
  };
}

onMounted(() => {
  const firstTab = tabs[active.value];
  if (!firstTab) return;
  firstTab.state.current = 1;
  loadData(firstTab);
});

// 加载数据
function onLoad(val: OrderTab) {
  val.state.current += 1;
  loadData(val);
}
// 请求不同状态的数据
const loadData = async (tab: OrderTab) => {
  const isFirstPage = tab.state.current <= 1 && tab.state.list.length === 0;
  if (isFirstPage) tab.state.initialLoading = true;
  tab.state.loading = true;
  try {
    let { data } = await myOrderInfo({
      status: tab.status,
      current: tab.state.current,
    });
    // console.log(records);
    if (tab.state.current == 1) {
      tab.state.list = data.records || [];
    } else {
      tab.state.list = [...tab.state.list, ...(data.records || [])];
    }
    newList.value = tab.state.list;
    if (data.current >= data.pages) {
      tab.state.finished = true;
    }
  } catch (err) {
    newList.value = [];
    tab.state.finished = true;
    console.error("订单列表加载失败：", err);
  } finally {
    tab.state.loading = false;
    tab.state.initialLoading = false;
  }
};
// 切换标签事件
const onClickTab = () => {
  const tabItem = tabs[active.value];
  if (!tabItem) return;
  newList.value = tabItem.state.list;
  if (tabItem.state.current === 0) {
    tabItem.state.current = 1;
    loadData(tabItem);
  }
};
// 确认支付
const handlePay = (val: OrderSummary) => {
  showConfirmDialog({
    title: "确认付款",
    message: "确认支付该订单吗？",
  })
    .then(async () => {
      await payInfo({
        orderNumbers: val.orderNumber,
        payType: val.status,
      });
      await showDialog({
        message: "支付成功",
        theme: "round-button",
      }).then(async () => {
        // onClickTab();
        await reloadTab(tabs[active.value]);
      });
    })
    .catch(() => {});
};
// 清除上一次的分页状态
const reloadTab = async (tab: OrderTab | undefined) => {
  if (!tab) return;
  tab.state.current = 1;
  tab.state.loading = false;
  tab.state.initialLoading = true;
  tab.state.finished = false;
  tab.state.list = [];
  newList.value = [];
  // 从第一页重新请求
  await loadData(tab);
};
// 确认收货
const handleReceipt = (val: OrderSummary) => {
  showConfirmDialog({
    title: "确认收货",
    message: "您是否已经收到了商品？",
  })
    .then(async () => {
      await receiptInfo(val.orderNumber);
      await showDialog({
        message: "收货成功",
        theme: "round-button",
      }).then(async () => {
        // onClickTab();
        await reloadTab(tabs[active.value]);
      });
    })
    .catch(() => {});
};
// 返回
const onClickLeft = () => history.back();
</script>

<style scoped lang="scss">
.my-order {
  --shop-primary: #c9432e;
  --shop-primary-dark: #ad3524;
  --shop-primary-light: #fff0eb;
  --shop-page-bg: #f7f5f2;
  --shop-surface: #fff;
  --shop-text: #2d2926;
  --shop-text-secondary: #716b66;
  --shop-text-muted: #a49d97;
  --shop-border: #e9e3dd;

  --van-primary-color: var(--shop-primary);
  --van-text-color: var(--shop-text);
  --van-text-color-2: var(--shop-text-secondary);
  --van-text-color-3: var(--shop-text-muted);
  --van-border-color: var(--shop-border);
  --van-card-background: var(--shop-surface);
  --van-card-price-color: var(--shop-primary);
  --van-tab-active-text-color: var(--shop-primary);
  --van-tab-text-color: var(--shop-text-secondary);
  --van-tabs-bottom-bar-color: var(--shop-primary);
  --van-tabs-nav-background: var(--shop-surface);
  --van-button-primary-background: var(--shop-primary);
  --van-button-primary-border-color: var(--shop-primary);

  min-height: 100vh;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

.my-order :deep(.van-nav-bar) {
  background: var(--shop-surface);
}

.my-order :deep(.van-nav-bar::after) {
  border-color: var(--shop-border);
}

.my-order :deep(.van-nav-bar__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.my-order :deep(.van-nav-bar__text),
.my-order :deep(.van-nav-bar .van-icon) {
  color: var(--shop-primary);
}

.my-order :deep(.van-tabs__wrap) {
  border-bottom: 0.026667rem solid var(--shop-border);
}

.my-order :deep(.van-tabs__content) {
  background: var(--shop-page-bg);
}

.my-order-skeleton {
  padding: 0.32rem;
}

.my-order-skeleton__card {
  padding: 0.4rem;
  margin-bottom: 0.32rem;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
  --van-skeleton-avatar-size: 2.133333rem;
  --van-skeleton-paragraph-height: 0.32rem;
}

.order-empty {
  min-height: calc(100dvh - 3.2rem);
  justify-content: center;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 0.266667rem 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;
  box-shadow: 0 0.08rem 0.266667rem rgba(45, 41, 38, 0.04);

  :deep(.van-card) {
    margin: 0;
    padding: 0.32rem;
    background: var(--shop-surface);
  }

  :deep(.van-card:not(:last-of-type)) {
    border-bottom: 0.026667rem solid var(--shop-border);
  }

  :deep(.van-card__thumb) {
    overflow: hidden;
    background: var(--shop-page-bg);
    border-radius: 0.16rem;
  }

  :deep(.van-card__title) {
    color: var(--shop-text);
    font-weight: 600;
  }

  :deep(.van-card__desc) {
    color: var(--shop-text-secondary);
  }

  :deep(.van-card__price) {
    color: var(--shop-primary);
    font-weight: 600;
  }

  :deep(.van-card__num) {
    color: var(--shop-text-muted);
  }

  :deep(.van-cell-group) {
    width: 100%;
    background: var(--shop-surface);
  }

  /* 订单信息下方直接衔接操作按钮，不再显示底部分割线 */
  :deep(.van-cell-group::after) {
    border-bottom-width: 0;
  }

  :deep(.van-cell) {
    padding: 0.266667rem 0.32rem;
    color: var(--shop-text);
    background: var(--shop-surface);
    border-top: 0.026667rem solid var(--shop-border);
  }

  :deep(.van-cell::after) {
    display: none;
  }

  :deep(.van-cell__value),
  :deep(.van-cell__label) {
    color: var(--shop-text-secondary);
  }

  .btn {
    align-self: flex-end;
    min-width: 2.133333rem;
    height: 0.853333rem;
    margin: 0 0.32rem 0.32rem;
    padding: 0 0.32rem;
    border-radius: 0.426667rem;
  }
}

.my-order :deep(.van-list__finished-text),
.my-order :deep(.van-list__loading) {
  color: var(--shop-text-muted);
}
</style>
