<template>
  <div class="prod-info-page" :aria-busy="isInitialLoading || aiLoading">
    <!-- 商品主体加载前显示简化骨架，AI 卖点使用原有独立加载状态 -->
    <van-skeleton v-if="isInitialLoading" class="prod-info-skeleton" animate>
      <template #template>
        <div class="prod-info-skeleton__content">
          <van-skeleton-paragraph
            class="prod-info-skeleton__banner"
            row-width="100%"
          />
          <div class="prod-info-skeleton__body">
            <van-skeleton-paragraph
              class="prod-info-skeleton__title"
              row-width="72%"
            />
            <van-skeleton-paragraph row-width="90%" />
            <van-skeleton-paragraph
              class="prod-info-skeleton__price"
              row-width="28%"
            />
            <van-skeleton-paragraph
              class="prod-info-skeleton__panel"
              row-width="100%"
            />
            <van-skeleton-paragraph
              v-for="item in 4"
              :key="item"
              class="prod-info-skeleton__row"
              :row-width="item % 2 ? '100%' : '82%'"
            />
          </div>
        </div>
      </template>
    </van-skeleton>

    <template v-else>
      <!-- 轮播 -->
      <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="item in skuList" :key="item.skuId">
          <van-image :src="item.pic" width="100%" height="10rem" fit="cover" />
        </van-swipe-item>
      </van-swipe>
      <div class="container">
        <!-- 商品信息介绍 -->
        <div class="prod-content">
          <div class="prod-name">{{ prodList.prodName }}</div>
          <div class="prod-desc">{{ prodList.brief }}</div>
          <div class="prod-price">¥{{ prodList.price }}</div>
          <div class="prod-collect" @click="changeCollection">
            <van-icon name="like-o" v-if="!isCollection" size="0.5rem" />
            <van-icon name="like" color="#c9432e" v-else size="0.5rem" />
            <span>收藏</span>
          </div>
        </div>
        <!-- 分割线 -->
        <van-divider />
        <!-- ai卖点 -->
        <div class="ai">
          <div class="ai-header">
            <div class="ai-title">🤖 AI 智能卖点</div>
            <van-tag class="ai-tip" plain>{{
              aiSource == "openai"
                ? "DeepSeek AI"
                : aiSource == "fallback" && tipList.length > 3
                  ? "智能推荐"
                  : "本地"
            }}</van-tag>
          </div>
          <div class="ai-content">
            <!-- 状态一：加载中 -->
            <van-loading
              v-if="aiLoading"
              class="ai-loading"
              size="1rem"
              vertical
              >正在分析商品卖点...</van-loading
            >
            <!-- 状态二：展示列表 -->
            <div v-else class="ai-suggestion">
              <div
                class="ai-item"
                v-for="(item, index) in tipList"
                :key="index"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
        <!-- 分割线 -->
        <van-divider />
        <!-- 类别 -->
        <!-- <van-space class="prod-category" :size="20" fill>
        <span>已选</span>
        <span>金色</span>
      </van-space> -->
        <div class="prod-category" @click="show = true">
          <span>已选：{{ defaultProd.skuName }}</span>
          <span>...</span>
        </div>
        <!-- 评价 -->
        <van-cell-group :border="false">
          <van-cell value="共 0 条" is-link>
            <template #title>
              <span class="custom-title"
                >评价：好评 {{ commentList.positiveRating }} %</span
              >
            </template>
            <template #value>
              <span class="custom-value">共 {{ commentList.number }} 条</span>
            </template>
          </van-cell>
        </van-cell-group>
        <van-grid
          class="comment-option"
          :border="false"
          :gutter="8"
          :column-num="5"
        >
          <van-grid-item>
            <van-tag color="#fff0eb" text-color="#ad3524"
              >全部 {{ commentList.number }}</van-tag
            >
          </van-grid-item>
          <van-grid-item>
            <van-tag color="#fff0eb" text-color="#ad3524"
              >好评 {{ commentList.praiseNumber }}</van-tag
            >
          </van-grid-item>
          <van-grid-item>
            <van-tag color="#fff0eb" text-color="#ad3524"
              >中评 {{ commentList.secondaryNumber }}</van-tag
            >
          </van-grid-item>
          <van-grid-item>
            <van-tag color="#fff0eb" text-color="#ad3524"
              >差评 {{ commentList.negativeNumber }}</van-tag
            >
          </van-grid-item>
          <van-grid-item>
            <van-tag color="#fff0eb" text-color="#ad3524"
              >有图 {{ commentList.picNumber }}</van-tag
            >
          </van-grid-item>
        </van-grid>
        <!-- 商品图 -->
        <div
          class="prod-detail-html"
          v-html="formatHtmlValue"
          v-if="isShow"
        ></div>
        <div v-else>
          <!-- 分割线 -->
          <van-divider />
          <div class="context">
            <h3>{{ prodList.prodName }}</h3>
            <div class="desc">{{ prodList.brief }}</div>
            <van-image :src="prodList.pic" />
          </div>
        </div>
        <!-- 购物面板 -->
        <van-action-bar class="prod-action-bar">
          <van-action-bar-icon
            icon="cart-o"
            text="购物车"
            @click="onClickCart"
          />
          <van-action-bar-icon icon="shop-o" text="店铺" @click="onClickHome" />
          <van-action-bar-button
            type="danger"
            text="立即购买"
            @click="onClickButton"
          />
        </van-action-bar>
        <!-- 商品分类面板 -->
        <van-action-sheet
          class="prod-tags-sheet"
          v-model:show="show"
          title="分类"
        >
          <template v-if="defaultProd">
            <SkuTags
              :list="map"
              :defaultSelect="selectTag"
              @select="selectTagFn"
            ></SkuTags>
            <van-button
              class="sheet-confirm"
              type="primary"
              block
              @click="show = false"
              >确定</van-button
            >
          </template>
        </van-action-sheet>
        <!-- 购买面板 -->
        <van-action-sheet class="purchase-sheet" v-model:show="open">
          <div class="content">
            <van-card
              :num="num"
              :price="prodList.price"
              :desc="prodList.brief"
              :title="defaultProd.skuName"
              :thumb="defaultProd.pic"
            >
              <template #footer>
                <van-stepper v-model="num" />
              </template>
            </van-card>
            <template v-if="defaultProd">
              <SkuTags
                :list="map"
                :defaultSelect="selectTag"
                @select="selectTagFn"
              ></SkuTags>
            </template>
            <div class="prodBtn">
              <van-button color="#c9432e" plain @click="addToCart"
                >加入购物车</van-button
              >
              <van-button color="#c9432e" @click="toPay">立即购买</van-button>
            </div>
          </div>
        </van-action-sheet>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { prodItem } from "../types/home";
import {
  prodInfo,
  isCollectionInfo,
  addOrCancelInfo,
  prodCommentInfo,
} from "../api/prod";
import { changeItemInfo } from "../api/cart";
import { showSuccessToast, showToast } from "vant";
import "vant/es/toast/style";
import { getSellingPoint } from "../ai/search";
import { formatHtml } from "../utils/utils";
import SkuTags from "../components/SkuTags.vue";

const route = useRoute();
const router = useRouter();
const prodId = route.query.ids;
interface Sku {
  skuId: number;
  skuName: string;
  pic: string;
  properties: string;
}
interface CommentSummary {
  positiveRating: number;
  number: number;
  praiseNumber: number;
  secondaryNumber: number;
  negativeNumber: number;
  picNumber: number;
}
const prodList = ref<Partial<prodItem>>({});
const skuList = ref<Sku[]>([]);
const isCollection = ref(false);
const tipList = ref<string[]>([]);
const aiLoading = ref(true);
const isInitialLoading = ref(true);
const aiSource = ref();
const commentList = ref<Partial<CommentSummary>>({});
const formatHtmlValue = ref(null);
const isShow = ref(false);
// 商品种类默认字段
const defaultProd = ref<Partial<Sku>>({});
const show = ref(false);
// 处理商品分类数据
const map = ref<Record<string, Set<string>>>({});
const selectTag = ref<Record<string, string>>({});
const open = ref(false);
const num = ref(1);
// 购物车
const cart = reactive({
  basketId: 0,
  prodId: 0,
  skuId: 0,
  shopId: 0,
  count: 0,
  distributionCardNo: "",
});
// 生成订单信息
const confirm = reactive({
  basketIds: [],
  orderItem: {
    prodId: 0,
    skuId: 0,
    prodCount: 1,
    shopId: 0,
    distributionCardNo: "",
  },
  addrId: 0,
  userChangeCoupon: 0,
  couponIds: [],
});

onMounted(() => {
  init();
});

const init = async () => {
  isInitialLoading.value = true;
  aiLoading.value = true;
  let productData;

  try {
    // 获取商品主体数据
    let { data } = await prodInfo({ prodId });
    productData = data;
    prodList.value = data;
    skuList.value = data.skuList;
    defaultProd.value = skuList.value[0] ?? {};
    loadSku();
    isShow.value = data.content != "";
    formatHtmlValue.value = formatHtml(data.content);

    // 收藏和评价互不依赖，并行加载
    const [collection, comment] = await Promise.all([
      isCollectionInfo({ prodId }),
      prodCommentInfo({ prodId }),
    ]);
    isCollection.value = collection.data;
    commentList.value = comment.data;
  } catch (err) {
    console.error("商品详情加载失败：", err);
  } finally {
    isInitialLoading.value = false;
  }

  if (!productData) {
    aiLoading.value = false;
    return;
  }

  // AI 卖点不阻塞商品主体展示
  try {
    let { result, source } = await getSellingPoint(productData);
    tipList.value = Array.isArray(result)
      ? result
      : (result || "").split("\n").filter((item: string) => item.trim());
    aiSource.value = source;
  } catch (err) {
    console.error("商品卖点加载失败：", err);
  } finally {
    aiLoading.value = false;
  }
};

// 添加或取消收藏
const changeCollection = async () => {
  let res = await addOrCancelInfo(prodId);
  isCollection.value = !isCollection.value;
  showSuccessToast("修改成功");
  init();
};

const onClickCart = () => router.push("/cart");
const onClickHome = () => router.push("/");
const loadSku = () => {
  skuList.value.map((item) => {
    item.properties.split(";").forEach((prop) => {
      const [key, value] = prop.split(":");
      if (!key || value === undefined) return;
      if (!map.value[key]) {
        map.value[key] = new Set();
      }
      map.value[key].add(value);
    });
  });
  const firstProp = skuList.value[0]?.properties;
  if (!firstProp) return;
  // console.log(firstProp);
  firstProp.split(";").forEach((item) => {
    const [key, value] = item.split(":");
    if (!key || value === undefined) return;
    selectTag.value[key] = value;
  });
};
const selectTagFn = (key: string, value: string) => {
  selectTag.value[key] = value;
  const targetProp = Object.entries(selectTag.value)
    .map(([x, y]) => {
      return `${x}:${y}`;
    })
    .join(";");
  const result = skuList.value.find((item) => item.properties == targetProp);
  // console.log(result);
  if (result) {
    defaultProd.value = result;
  }
};
const onClickButton = () => {
  open.value = true;
};
// 加入购物车
const addToCart = async () => {
  if (
    prodList.value.prodId == null ||
    prodList.value.shopId == null ||
    defaultProd.value.skuId == null
  ) {
    showToast("商品信息尚未加载完成");
    return;
  }
  // console.log('选中', defaultProd.value);
  // console.log('整体', prodList.value);
  cart.prodId = prodList.value.prodId;
  cart.skuId = defaultProd.value.skuId;
  cart.shopId = prodList.value.shopId;
  cart.count = num.value;

  try {
    await changeItemInfo(cart);
    showToast({
      message: "添加购物车成功",
      icon: "like-o",
    });
    open.value = false;
  } catch (err) {
    throw err;
  }
};
// 点击购买到订单页面
const toPay = () => {
  if (
    prodList.value.prodId == null ||
    prodList.value.shopId == null ||
    defaultProd.value.skuId == null
  ) {
    showToast("商品信息尚未加载完成");
    return;
  }
  confirm.orderItem.prodId = prodList.value.prodId;
  confirm.orderItem.skuId = defaultProd.value.skuId;
  confirm.orderItem.prodCount = num.value;
  confirm.orderItem.shopId = prodList.value.shopId;
  sessionStorage.setItem("confirm", JSON.stringify(confirm));
  router.push("/order");
};
</script>

<style scoped lang="scss">
.prod-info-page {
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
  --van-divider-border-color: var(--shop-border);
  --van-card-background: var(--shop-surface);
  --van-card-price-color: var(--shop-primary);
  --van-action-bar-background: var(--shop-surface);
  --van-action-bar-button-danger-color: var(--shop-primary);
  --van-action-bar-icon-active-color: var(--shop-primary);
  --van-action-bar-icon-color: var(--shop-text-secondary);
  --van-action-bar-icon-text-color: var(--shop-text-secondary);

  min-height: 100vh;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

.prod-info-skeleton {
  padding: 0;
  background: var(--shop-page-bg);
}

.prod-info-skeleton__content {
  width: 100%;
}

.prod-info-skeleton__banner {
  width: 100%;
  height: 10rem;
  margin: 0;
  border-radius: 0;
}

.prod-info-skeleton__body {
  padding: 0.4rem;
}

.prod-info-skeleton__title {
  height: 0.48rem;
  margin-bottom: 0.266667rem;
}

.prod-info-skeleton__price {
  height: 0.533333rem;
  margin-top: 0.32rem;
}

.prod-info-skeleton__panel {
  height: 2.133333rem;
  margin-top: 0.48rem;
  border-radius: 0.213333rem;
}

.prod-info-skeleton__row {
  height: 0.426667rem;
  margin-top: 0.32rem;
}

.my-swipe {
  overflow: hidden;
  background: var(--shop-surface);
}

.my-swipe :deep(.van-swipe__indicator--active) {
  background: var(--shop-primary);
}

.container {
  padding: 0.266667rem 0.32rem calc(1.8rem + env(safe-area-inset-bottom));
}

.prod-content {
  position: relative;
  padding: 0.373333rem;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.prod-name {
  padding-right: 1.6rem;
  color: var(--shop-text);
  font-size: 0.5rem;
  font-weight: 600;
  line-height: 0.693333rem;
}

.prod-desc {
  margin-top: 0.106667rem;
  padding-right: 1.6rem;
  color: var(--shop-text-secondary);
  font-size: 0.35rem;
  line-height: 0.506667rem;
}

.prod-price {
  margin-top: 0.213333rem;
  color: var(--shop-primary);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 0.853333rem;
}

.prod-collect {
  position: absolute;
  right: 0.373333rem;
  bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.08rem;
  color: var(--shop-primary);

  span {
    font-size: 0.373333rem;
  }
}

.container :deep(.van-divider) {
  margin: 0.266667rem 0;
}

.ai {
  width: 100%;
  padding: 0.32rem;
  background: var(--shop-primary-light);
  border: 0.026667rem solid rgba(201, 67, 46, 0.08);
  border-radius: 0.266667rem;
  box-sizing: border-box;

  .ai-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.266667rem;

    .ai-title {
      color: var(--shop-primary-dark);
      font-size: 0.4rem;
      font-weight: 600;
    }

    .ai-tip {
      margin-left: 0.16rem;
      color: var(--shop-primary);
      background: var(--shop-surface);
      border-color: rgba(201, 67, 46, 0.24);
    }
  }

  .ai-suggestion {
    display: flex;
    flex-direction: column;
    gap: 0.213333rem;
  }

  .ai-item {
    width: 100%;
    min-height: 0.906667rem;
    height: auto;
    padding: 0.2rem 0.266667rem;
    color: var(--shop-text-secondary);
    font-size: 0.35rem;
    line-height: 0.506667rem;
    background: var(--shop-surface);
    border-left: 0.08rem solid var(--shop-primary);
    border-radius: 0.16rem;
    box-sizing: border-box;
  }
}

.ai-loading {
  padding: 0.426667rem 0;
  color: var(--shop-text-secondary);
}

.prod-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.173333rem;
  padding: 0 0.373333rem;
  color: var(--shop-text-secondary);
  font-size: 0.4rem;
  background: var(--shop-surface);
  border-radius: 0.213333rem;
}

.container :deep(.van-cell-group) {
  margin-top: 0.266667rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.213333rem 0.213333rem 0 0;
}

.container :deep(.van-cell) {
  color: var(--shop-text);
  background: var(--shop-surface);
}

.custom-value {
  color: var(--shop-text-muted);
}

.comment-option {
  --van-grid-item-content-padding: 0 0.106667rem;
  --van-grid-item-content-background: var(--shop-surface);

  padding: 0.266667rem 0.16rem;
  margin-bottom: 0.266667rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0 0 0.213333rem 0.213333rem;
}

.comment-option :deep(.van-tag) {
  white-space: nowrap;
}

.prod-detail-html {
  padding-bottom: 0.266667rem;
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.213333rem;
}

.prod-detail-html :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}

.prod-detail-html :deep(p) {
  margin: 0;
}

.context {
  padding: 0.373333rem 0.373333rem 0.533333rem;
  background: var(--shop-surface);
  border-radius: 0.213333rem;

  h3 {
    margin: 0;
    color: var(--shop-text);
    font-size: 0.56rem;
    line-height: 0.746667rem;
  }

  .desc {
    padding: 0.106667rem 0 0.3rem;
    color: var(--shop-text-secondary);
    font-size: 0.4rem;
    line-height: 0.56rem;
  }

  :deep(.van-image) {
    display: block;
    width: 100%;
    margin: 0.3rem auto 0;
    overflow: hidden;
    border-radius: 0.213333rem;
  }
}

/* 固定操作栏为长内容预留底部空间，并突出唯一主操作 */
.prod-action-bar {
  --van-action-bar-height: 1.466667rem;
  --van-action-bar-button-height: 1.066667rem;
  --van-action-bar-icon-width: 1.6rem;

  border-top: 0.026667rem solid var(--shop-border);
  box-shadow: 0 -0.106667rem 0.32rem rgba(45, 41, 38, 0.06);
}

.prod-action-bar :deep(.van-action-bar-button--danger) {
  margin-right: 0.213333rem;
  background: var(--shop-primary);
}

.prod-action-bar :deep(.van-action-bar-icon:active) {
  color: var(--shop-primary);
}

:global(.prod-tags-sheet),
:global(.purchase-sheet) {
  /* ActionSheet 会挂载到页面浮层，需在浮层根节点重新声明主题变量 */
  --shop-primary: #c9432e;
  --shop-text: #2d2926;
  --shop-surface: #fff;
  --van-primary-color: var(--shop-primary);
  --van-danger-color: var(--shop-primary);
  --van-card-price-color: var(--shop-primary);
  --van-button-primary-background: var(--shop-primary);
  --van-button-primary-border-color: var(--shop-primary);
  --van-tag-danger-color: var(--shop-primary);
  --van-action-sheet-header-font-size: 0.453333rem;

  overflow: hidden;
  border-radius: 0.32rem 0.32rem 0 0;
}

:global(.prod-tags-sheet .skuTags),
:global(.purchase-sheet .skuTags) {
  padding: 0 0.32rem;
  color: var(--shop-text);
}

:global(.prod-tags-sheet .skuTags .prop-selected),
:global(.purchase-sheet .skuTags .prop-selected) {
  background: var(--shop-primary) !important;
  border-color: var(--shop-primary) !important;
}

.sheet-confirm {
  width: calc(100% - 0.64rem);
  height: 1.173333rem;
  margin: 0 0.32rem calc(0.32rem + env(safe-area-inset-bottom));
  border-radius: 0.586667rem;
}

:global(.purchase-sheet .content) {
  padding-top: 0.266667rem;
}

:global(.purchase-sheet .van-card) {
  margin: 0 0.32rem;
  padding: 0.266667rem;
  border-radius: 0.213333rem;
}

.prodBtn {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.266667rem;
  padding: 0.32rem 0.32rem calc(0.32rem + env(safe-area-inset-bottom));
}

.prodBtn :deep(.van-button) {
  width: 100%;
  height: 1.173333rem;
  border-radius: 0.586667rem;
}
</style>
