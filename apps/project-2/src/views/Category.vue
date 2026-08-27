<template>
  <div class="category" :aria-busy="isInitialLoading || isProductLoading">
    <!-- 搜索，点击跳转搜索页面  -->
    <van-search placeholder="点此搜索" @click="goSearch"></van-search>

    <!-- 首次进入分类页时显示简化骨架 -->
    <van-skeleton v-if="isInitialLoading" class="category-skeleton" animate>
      <template #template>
        <div class="category-skeleton__layout">
          <div class="category-skeleton__nav">
            <van-skeleton-paragraph
              v-for="item in 6"
              :key="item"
              class="category-skeleton__nav-item"
              row-width="62%"
            />
          </div>
          <div class="category-skeleton__content">
            <van-skeleton-paragraph
              class="category-skeleton__banner"
              row-width="100%"
            />
            <div v-for="item in 3" :key="item" class="category-skeleton__card">
              <van-skeleton-paragraph
                class="category-skeleton__image"
                row-width="100%"
              />
              <div class="category-skeleton__info">
                <van-skeleton-paragraph row-width="86%" />
                <van-skeleton-paragraph row-width="64%" />
                <van-skeleton-paragraph row-width="36%" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </van-skeleton>

    <!-- 分类页 -->
    <van-tree-select
      v-else
      v-model:main-active-index="activeIndex"
      :items="list"
      @click-nav="handleNav"
    >
      <template #content>
        <!-- 切换分类时只替换右侧内容，保留左侧菜单 -->
        <van-skeleton
          v-if="isProductLoading"
          class="category-content-skeleton"
          title
          :row="8"
          animate
        />
        <template v-else>
          <van-image :src="list[activeIndex]?.pic" />
          <van-card
            v-for="item in prodList"
            :key="item.prodId"
            :num="item.totalStocks ?? undefined"
            :price="item.price"
            :desc="item.brief"
            :title="item.prodName"
            :thumb="item.pic"
            @click="goProdInfo(item)"
          />
        </template>
      </template>
    </van-tree-select>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { prodItem } from "../types/home";
import { categoryInfo, pageProdInfo } from "../api/category";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const activeIndex = ref(0);
const items = [
  {
    text: "浙江",
    children: [
      { text: "杭州", id: 1 },
      { text: "温州", id: 2 },
      { text: "宁波", id: 3, disabled: true },
    ],
  },
  {
    text: "江苏",
    children: [
      { text: "南京", id: 4 },
      { text: "无锡", id: 5 },
      { text: "徐州", id: 6 },
    ],
  },
  { text: "福建", disabled: true },
];
const parentNum = ref(0);
interface CategoryItem {
  categoryId: number;
  categoryName: string;
  text: string;
  pic?: string;
}
const list = ref<CategoryItem[]>([]);
const prodList = ref<prodItem[]>([]);
const newId = ref(0);
const isInitialLoading = ref(true);
const isProductLoading = ref(false);

onMounted(() => {
  init();
});

const goSearch = () => {
  router.push("/search");
};

const navMapRecord: Record<string, number> = {
  数码好物: 0,
  运动装备: 2,
  美妆护肤: 1,
  新鲜水果: 3,
};
const init = async () => {
  isInitialLoading.value = true;
  try {
    // 获取分类商品菜单的数据
    let { data } = await categoryInfo({ parentId: parentNum.value });
    list.value = data;
    // 根据接口为取到的数据添加字段
    list.value.map((item) => {
      item.text = item.categoryName;
    });
    // 跳转进分类页面的要匹配一下点进来的是哪个分类
    const targetVal = route.query.val;
    if (targetVal && sessionStorage.getItem("fromHome")) {
      Object.entries(navMapRecord).forEach((item) => {
        if (item[0] == targetVal) {
          activeIndex.value = item[1];
        }
      });
      sessionStorage.removeItem("fromHome");
    }
    console.log(activeIndex.value);
    // 刚进页面就要把右侧商品数据拿到，不然不能渲染
    const category = list.value[activeIndex.value];
    if (category) await changeList(category.categoryId);
  } catch (err: any) {
    console.error("分类页数据加载失败：", err);
  } finally {
    isInitialLoading.value = false;
  }
};

// 获取右侧分类商品列表
const handleNav = (index: number) => {
  const category = list.value[index];
  if (category) changeList(category.categoryId);
};
const changeList = async (val: number) => {
  isProductLoading.value = true;
  try {
    let {
      data: { records },
    } = await pageProdInfo({ categoryId: val });
    prodList.value = records;
    console.log(prodList.value);
  } catch (err) {
    prodList.value = [];
    console.error("分类商品加载失败：", err);
  } finally {
    isProductLoading.value = false;
  }
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
.category {
  --shop-primary: #c9432e;
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
  --van-card-background: var(--shop-surface);
  --van-card-price-color: var(--shop-primary);

  min-height: calc(100vh - var(--van-tabbar-height));
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

/* 搜索区沿用首页样式，保证两个商品入口的视觉连续性 */
.category :deep(.van-search) {
  padding: 0.24rem 0.32rem;
  background: var(--shop-page-bg);
}

.category :deep(.van-search__content) {
  background: var(--shop-surface);
  border: 0.026667rem solid var(--shop-border);
  border-radius: 0.266667rem;
}

.category :deep(.van-search .van-icon-search) {
  color: var(--shop-primary);
}

.category-skeleton {
  padding: 0;
}

.category-skeleton__layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 2.773333rem);
}

.category-skeleton__nav {
  flex: 0 0 2.133333rem;
  padding-top: 0.213333rem;
  background: #f1ede9;
}

.category-skeleton__nav-item {
  height: 0.32rem;
  margin: 0.48rem auto;
}

.category-skeleton__content {
  flex: 1;
  min-width: 0;
  padding: 0.32rem;
  background: var(--shop-page-bg);
}

.category-skeleton__banner {
  width: 100%;
  height: 2.4rem;
  margin: 0 0 0.32rem;
  border-radius: 0.213333rem;
}

.category-skeleton__card {
  display: flex;
  gap: 0.266667rem;
  margin-bottom: 0.32rem;
}

.category-skeleton__image {
  flex: 0 0 2.133333rem;
  width: 2.133333rem;
  height: 2.133333rem;
  margin: 0;
  border-radius: 0.213333rem;
}

.category-skeleton__info {
  flex: 1;
  min-width: 0;
  padding-top: 0.16rem;
}

.category-content-skeleton {
  padding: 0.426667rem 0.32rem 0;
}

.category :deep(.van-tree-select__nav) {
  flex: 0 0 2.4rem;
  height: calc(100vh - 2.773333rem);
  background: #f1ede9;
}

.category :deep(.van-sidebar-item) {
  padding: 0.426667rem 0.266667rem;
  color: var(--shop-text-secondary);
  background: transparent;
}

.category :deep(.van-sidebar-item--select) {
  color: var(--shop-primary);
  font-weight: 600;
  background: var(--shop-surface);
}

.category :deep(.van-sidebar-item--select::before) {
  width: 0.08rem;
  height: 0.533333rem;
  background: var(--shop-primary);
  border-radius: 0 0.08rem 0.08rem 0;
}

.category :deep(.van-tree-select__content) {
  flex: 1;
  height: calc(100vh - 2.773333rem);
  padding-bottom: 0.32rem;
  background: var(--shop-page-bg);
}

.category :deep(.van-tree-select__content > .van-image) {
  display: block;
  width: calc(100% - 0.64rem);
  height: 2.4rem;
  margin: 0.32rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.213333rem;
}

.category :deep(.van-tree-select__content > .van-image img) {
  object-fit: cover;
}

.category :deep(.van-card) {
  margin: 0 0.32rem 0.266667rem;
  padding: 0.266667rem;
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.213333rem;
}

.category :deep(.van-card__thumb) {
  overflow: hidden;
  background: var(--shop-page-bg);
  border-radius: 0.16rem;
}

.category :deep(.van-card__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.category :deep(.van-card__desc) {
  color: var(--shop-text-secondary);
}

.category :deep(.van-card__price) {
  color: var(--shop-primary);
  font-weight: 600;
}

.category :deep(.van-card__num) {
  color: var(--shop-text-muted);
}
</style>
