<template>
  <div class="home-page" :aria-busy="isLoading">
    <!-- 搜索，点击跳转搜索页面  -->
    <van-search placeholder="点此搜索" @click="goSearch"></van-search>
    <div v-if="!isLoading && failedSections.length" role="alert">
      {{ failedSections.join("、") }}加载失败
      <van-button size="small" @click="init">重试</van-button>
    </div>

    <!-- 首页数据加载完成前，骨架结构与真实轮播图保持同高 -->
    <van-skeleton
      v-if="isLoading"
      class="home-skeleton home-skeleton--banner"
      animate
    >
      <template #template>
        <van-skeleton-paragraph
          class="home-skeleton__banner"
          row-width="100%"
        />
      </template>
    </van-skeleton>
    <!-- 轮播图 -->
    <van-swipe
      v-else
      class="my-swipe"
      :autoplay="3000"
      indicator-color="white"
      lazy-render
    >
      <van-swipe-item v-for="item in bannerList" :key="item.seq">
        <van-image width="100%" height="185" :src="item.imgUrl" />
      </van-swipe-item>
    </van-swipe>
    <!-- 商品导航 -->
    <van-grid>
      <van-grid-item icon="new-arrival-o" text="新品推荐" />
      <van-grid-item icon="discount-o" text="限时秒杀" />
      <van-grid-item icon="hot-o" text="现金大转盘" />
      <van-grid-item icon="hot-sale-o" text="一分钱特卖" />
    </van-grid>

    <!-- 公告与商品区骨架屏：保留真实页面的间距和三列结构 -->
    <van-skeleton
      v-if="isLoading"
      class="home-skeleton home-skeleton--content"
      animate
    >
      <template #template>
        <div class="home-skeleton__content">
          <div class="home-skeleton__notice">
            <van-skeleton-paragraph
              class="home-skeleton__notice-icon"
              row-width="100%"
            />
            <van-skeleton-paragraph
              class="home-skeleton__notice-line"
              row-width="72%"
            />
          </div>

          <section
            v-for="section in 2"
            :key="section"
            class="home-skeleton__section"
          >
            <div class="home-skeleton__header">
              <van-skeleton-paragraph
                class="home-skeleton__section-title"
                row-width="28%"
              />
              <van-skeleton-paragraph
                class="home-skeleton__more"
                row-width="16%"
              />
            </div>
            <div class="home-skeleton__grid">
              <div v-for="card in 3" :key="card" class="home-skeleton__card">
                <van-skeleton-paragraph
                  class="home-skeleton__image"
                  row-width="100%"
                />
                <van-skeleton-paragraph
                  class="home-skeleton__text"
                  row-width="88%"
                />
                <van-skeleton-paragraph
                  class="home-skeleton__text"
                  row-width="64%"
                />
                <van-skeleton-paragraph
                  class="home-skeleton__price"
                  row-width="46%"
                />
              </div>
            </div>
          </section>
        </div>
      </template>
    </van-skeleton>

    <template v-else>
      <!-- 通知 -->
      <van-notice-bar class="notice" left-icon="volume-o" :scrollable="false">
        <van-swipe
          vertical
          class="notice-swipe"
          :autoplay="3000"
          :touchable="false"
          :show-indicators="false"
        >
          <van-swipe-item v-for="item in noticeList" :key="item.id">{{
            item.title
          }}</van-swipe-item>
        </van-swipe>
      </van-notice-bar>
      <!-- 商品 -->
      <div class="products" v-for="(item, index) in prodList" :key="item.id">
        <div class="prod-header">
          <p class="prod-category">{{ item.title }}</p>
          <p class="prod-more" @click="goToCategory(item)">查看更多</p>
        </div>
        <van-grid :column-num="3" :center="false" :border="false" :gutter="5">
          <van-grid-item
            class="prod-item"
            v-for="item in prodList[index]?.productDtoList"
            :key="item.prodId"
            @click="goProdInfo(item)"
          >
            <van-image width="2.72rem" height="2.72rem" :src="item.pic" />
            <van-text-ellipsis
              class="prod-title"
              :content="item.prodName"
              rows="2"
            />
            <p class="prod-price">¥{{ item.price }}</p>
          </van-grid-item>
        </van-grid>
      </div>
    </template>
    <div class="space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { bannerInfo, noticeInfo, prodInfo } from "../api/home";
import { loadHomeData } from "../utils/homeData";
import {
  type banner,
  type notice,
  type prod,
  type prodItem,
} from "../types/home";
import "vant/es/toast/style";

const router = useRouter();
const bannerList = ref<banner[]>([]);
const noticeList = ref<notice[]>([]);
const prodList = ref<prod[]>([]);
const isLoading = ref(true);
const failedSections = ref<string[]>([]);

const goSearch = () => {
  router.push("/search");
};

onBeforeMount(() => {
  init();
});
const init = async () => {
  isLoading.value = true;
  failedSections.value = [];
  try {
    // 三个首页接口互不依赖，并行请求可以缩短骨架屏停留时间
    const data = await loadHomeData({
      banners: bannerInfo,
      notices: noticeInfo,
      products: prodInfo,
    });
    bannerList.value = data.banners;
    noticeList.value = data.notices;
    prodList.value = data.products;
    failedSections.value = data.failed;
  } catch (error) {
    failedSections.value = ["首页数据"];
    console.error("首页数据加载失败：", error);
  } finally {
    // 请求失败时也必须结束骨架屏，避免页面一直处于加载状态
    isLoading.value = false;
  }
};

const goToCategory = (val: prod) => {
  sessionStorage.setItem("fromHome", "1");
  router.push({
    path: "/category",
    query: {
      val: val.title,
    },
  });
};
// 跳转商品详情
const goProdInfo = (val: prodItem) => {
  router.push({
    path: "/prodinfo",
    query: {
      ids: val.prodId,
    },
  });
};
</script>

<style scoped lang="scss">
.home-page {
  /* 首页主题色只在当前页面生效，暂不影响商城的其他页面 */
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
  --van-text-color: var(--shop-text);
  --van-text-color-2: var(--shop-text-secondary);
  --van-text-color-3: var(--shop-text-muted);
  --van-border-color: var(--shop-border);
  --van-background: var(--shop-page-bg);
  --van-background-2: var(--shop-surface);

  min-height: 100vh;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

/* 搜索区保留原有位置，仅用留白和圆角强化输入区域 */
.home-page :deep(.van-search) {
  padding: 0.24rem 0.32rem;
  background: var(--shop-page-bg);
}

.home-page :deep(.van-search__content) {
  background: var(--shop-surface);
  border: 0.026667rem solid var(--shop-border);
  border-radius: 0.266667rem;
}

.home-page :deep(.van-search__field) {
  color: var(--shop-text);
}

.home-page :deep(.van-search .van-icon-search) {
  color: var(--shop-primary);
}

.home-skeleton {
  padding: 0;
}

.home-skeleton__banner {
  width: calc(100% - 0.64rem);
  height: 4.933333rem;
  margin: 0 0.32rem;
  border-radius: 0.266667rem;
}

.home-skeleton__content {
  width: 100%;
}

.home-skeleton__notice {
  display: flex;
  align-items: center;
  height: 1.066667rem;
  padding: 0 0.32rem;
  margin: 0.266667rem 0.32rem;
  background: var(--shop-primary-light);
  border-radius: 0.213333rem;
}

.home-skeleton__notice-icon {
  flex: 0 0 auto;
  width: 0.426667rem;
  height: 0.426667rem;
  margin: 0 0.266667rem 0 0;
  border-radius: 50%;
}

.home-skeleton__notice-line {
  height: 0.32rem;
  margin: 0;
}

.home-skeleton__section {
  padding: 0.32rem;
  margin: 0.266667rem 0.32rem 0;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.home-skeleton__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin-bottom: 0.2rem;
}

.home-skeleton__section-title,
.home-skeleton__more {
  height: 0.32rem;
  margin: 0;
}

.home-skeleton__more {
  height: 0.266667rem;
}

.home-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.066667rem;
  padding: 0;
}

.home-skeleton__card {
  min-width: 0;
  padding: 0.2rem 0.133333rem 0.266667rem;
}

.home-skeleton__image {
  width: 2.72rem;
  height: 2.72rem;
  margin: 0 auto 0.2rem;
  border-radius: 0.213333rem;
}

.home-skeleton__text {
  height: 0.293333rem;
  margin-top: 0.106667rem;
}

.home-skeleton__price {
  height: 0.373333rem;
  margin-top: 0.2rem;
}

.my-swipe .van-swipe-item {
  color: #fff;
  line-height: 0;
  text-align: center;
}

.my-swipe {
  width: calc(100% - 0.64rem);
  margin: 0 0.32rem;
  overflow: hidden;
  border-radius: 0.266667rem;
  box-shadow: 0 0.106667rem 0.32rem rgba(45, 41, 38, 0.08);
}

/* 首页快捷入口做成轻量卡片，不改变四等分布局 */
.home-page > :deep(.van-grid) {
  margin: 0.266667rem 0.32rem;
  overflow: hidden;
  border-radius: 0.266667rem;
}

.home-page > :deep(.van-grid .van-grid-item__content) {
  padding: 0.373333rem 0.08rem;
  color: var(--shop-text-secondary);
  background: var(--shop-surface);
}

.home-page > :deep(.van-grid .van-grid-item__icon) {
  color: var(--shop-primary);
}

.home-page > :deep(.van-grid .van-grid-item:nth-child(2) .van-grid-item__icon),
.home-page > :deep(.van-grid .van-grid-item:nth-child(3) .van-grid-item__icon) {
  color: var(--shop-accent);
}

.notice {
  margin: 0.266667rem 0.32rem;
  color: var(--shop-primary-dark);
  background: var(--shop-primary-light);
  border-radius: 0.213333rem;
}

.notice :deep(.van-notice-bar__left-icon) {
  color: var(--shop-primary);
}

.notice-swipe {
  height: 1.066667rem;
  line-height: 1.066667rem;
}

.space {
  height: 2.4rem;
  width: 100vw;
}

.products {
  padding: 0.32rem 0.133333rem 0.266667rem;
  margin: 0.266667rem 0.32rem 0;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.prod-header {
  padding: 0 0.2rem 0.2rem;
}

.prod-header::after {
  content: "";
  display: block;
  clear: both;
}

.prod-category,
.prod-more {
  margin: 0;
}

.prod-category {
  font-size: 0.45rem;
  font-weight: bold;
  color: var(--shop-text);
  float: left;
}

.prod-more {
  font-size: 0.4rem;
  color: var(--shop-text-muted);
  float: right;
}

.prod-item {
  min-width: 0;
  height: auto;
  box-sizing: border-box;
}

.prod-title {
  font-size: 0.35rem;
  line-height: 0.4rem;
  margin-top: 0.266667rem;
  color: var(--shop-text);
}

.prod-price {
  color: var(--shop-primary);
  font-size: 0.5rem;
  font-weight: 600;
  line-height: 0.5rem;
  margin: 0.266667rem 0 0;
}

.prod-item :deep(.van-image) {
  overflow: hidden;
  background: var(--shop-page-bg);
  border-radius: 0.213333rem;
}

.prod-item :deep(.van-grid-item__content) {
  padding: 0.2rem 0 0.266667rem;
}
</style>
