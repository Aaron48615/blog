<template>
  <div
    class="search"
    :aria-busy="isInitialLoading || isSearchLoading || aiLoading"
  >
    <!-- 导航栏 -->
    <van-nav-bar
      title="搜索"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    <!-- 搜索框：回车才搜索，只是失焦则显示ai搜索建议。搜索到东西展示商品，没搜到展示空页 -->
    <form action="/">
      <van-search
        show-action
        placeholder="搜索你喜欢的商品"
        v-model="keyWord"
        @search="onSearch"
        @update:model-value="onInput"
      >
        <template #action>
          <div @click="onClickButton">搜索</div>
        </template>
      </van-search>
    </form>

    <!-- 商品展示 -->
    <div class="main">
      <!-- 搜索请求期间显示简化商品卡片骨架 -->
      <div class="search-result-skeleton" v-if="isSearchLoading">
        <van-skeleton
          v-for="item in 3"
          :key="item"
          class="search-result-skeleton__card"
          title
          :row="2"
          avatar
          avatar-shape="square"
          animate
        />
      </div>
      <!-- 商品卡 -->
      <div class="prod-list" v-else-if="prodList.length">
        <van-card
          class="prod-card"
          v-for="item in prodList"
          :key="item.prodId"
          :price="item.price"
          :title="item.prodName"
          :thumb="item.pic"
          @click="goProdInfo(item)"
        />
      </div>
      <!-- 搜索为空 -->
      <van-empty v-else-if="isShow" image="search" description="什么都没有">
        <van-button
          round
          type="primary"
          class="bottom-button"
          @click="
            () => {
              keyWord = '';
            }
          "
          >重新搜索</van-button
        >
      </van-empty>
    </div>

    <!-- 搜索历史：存入输入过的字段，满十条把之前的删掉 -->
    <div class="history" v-if="!prodList.length && histList.length && !isShow">
      <div class="history-header">
        <div class="history-title">🕔 搜索历史</div>
        <div class="history-clear" @click="clearHistory">
          <van-icon name="delete-o" />清空
        </div>
      </div>
      <div class="hist-tags">
        <van-tag
          class="hist-tag"
          plain
          round
          closeable
          size="medium"
          color="#fff0eb"
          text-color="#ad3524"
          v-for="(item, index) in histList"
          :key="index"
          @close="delHistory(index)"
          @click="tagSearch(item)"
          >{{ item }}</van-tag
        >
      </div>
    </div>
    <!-- 热门搜索
            存在条件：hotTags存在，ai不存在，ai不加载
        -->
    <div
      class="hot"
      v-if="
        isInitialLoading &&
        !prodList.length &&
        !isShow &&
        !hasAiSuggestionStarted
      "
    >
      <van-skeleton class="search-hot-skeleton" animate>
        <template #template>
          <div class="search-hot-skeleton__content">
            <van-skeleton-paragraph
              class="search-hot-skeleton__title"
              row-width="28%"
            />
            <div class="search-hot-skeleton__tags">
              <van-skeleton-paragraph
                v-for="item in 5"
                :key="item"
                class="search-hot-skeleton__tag"
                round
                :row-width="item % 2 ? '1.6rem' : '2rem'"
              />
            </div>
          </div>
        </template>
      </van-skeleton>
    </div>
    <div
      class="hot"
      v-else-if="
        hotTags.length && !prodList.length && !isShow && !hasAiSuggestionStarted
      "
    >
      <div class="hot-title">🔥 热门搜索</div>
      <div class="hot-tags">
        <van-tag
          class="hot-tag"
          plain
          round
          size="medium"
          color="#fff0eb"
          text-color="#ad3524"
          v-for="item in hotTags"
          :key="item.hotSearchId"
          @click="tagSearch(item.title)"
          >{{ item.title }}</van-tag
        >
      </div>
    </div>
    <!-- ai搜索建议
            1.远程的ai模型
            2.ai降级
            3.显示兜底数据
        -->
    <div class="ai-suggestion" v-if="hasAiSuggestionStarted">
      <!-- 标题 -->
      <div class="ai-header">
        <div class="ai-title">🤖 AI 智能建议</div>
        <van-tag
          class="ai-tip"
          round
          size="medium"
          :color="aiTheme.background"
          :text-color="aiTheme.text"
          :style="{ borderColor: aiTheme.border }"
        >
          {{
            aiLoading ? "AI思考中..." : aiSource == "fallback" ? "本地" : "AI"
          }}
        </van-tag>
      </div>
      <!-- 骨架屏 -->
      <van-skeleton class="ai-skeleton" v-if="aiLoading" animate>
        <template #template>
          <div class="ai-skeleton-tags">
            <van-skeleton-paragraph
              v-for="(width, index) in aiSkeletonWidths"
              :key="index"
              round
              :row-width="width"
            />
          </div>
        </template>
      </van-skeleton>
      <!-- 建议内容 -->
      <div class="ai-tags" v-if="!aiLoading">
        <van-tag
          class="ai-tag"
          plain
          round
          size="medium"
          :color="aiTheme.border"
          :text-color="aiTheme.text"
          :style="{ backgroundColor: aiTheme.background }"
          v-for="(item, index) in aiSuggestion"
          :key="index"
          @click="tagSearch(item)"
          >{{ item }}</van-tag
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import type { prodItem } from "../types/home";
import { hotInfo, searchInfo } from "../api/search";
import { getSearchSuggestion } from "../ai/search";

const router = useRouter();
const onClickLeft = () => history.back();
const keyWord = ref("");
const hotTags = ref<{ hotSearchId: number; title: string }[]>([]);
// 热门搜索兜底数据
const hotBasedList = [
  {
    hotSearchId: 1,
    title: "iPhone",
  },
  {
    hotSearchId: 2,
    title: "运动鞋",
  },
  {
    hotSearchId: 3,
    title: "兰蔻",
  },
  {
    hotSearchId: 4,
    title: "阿迪达斯",
  },
  {
    hotSearchId: 5,
    title: "新鲜水果",
  },
  {
    hotSearchId: 6,
    title: "蓝牙耳机",
  },
];
const prodList = ref<prodItem[]>([]);
const histList = ref<string[]>([]);
const isShow = ref(false);
const aiSuggestion = ref<string[]>([]);
const aiLoading = ref(false);
const aiSource = ref("fallback");
const isInitialLoading = ref(true);
const isSearchLoading = ref(false);
// 首次进入不展示 AI 区域；用户输入后再显示，并保留已生成的建议
const hasAiSuggestionStarted = ref(false);
const aiSkeletonWidths = ["64px", "64px", "64px", "64px", "64px"];
const aiTheme = computed(() => {
  if (aiLoading.value) {
    return { background: "#fff7e8", border: "#f1c06b", text: "#a86710" };
  }
  if (aiSource.value === "openai") {
    return { background: "#fff0eb", border: "#e6a092", text: "#ad3524" };
  }
  return { background: "#f6f1ed", border: "#d7c8be", text: "#716b66" };
});
// ai降级，兜底数据
const SUGGEST_RULES = {
  鞋: ["运动鞋", "跑鞋", "板鞋", "帆布鞋", "篮球鞋"],
  手机: ["iPhone 15", "华为Mate 60", "小米14", "OPP0 Find X7", "vivo X100"],
  水果: ["啤梨", "蓝莓", "车厘子", "猕猴桃", "苹果"],
  护肤: ["兰蔻小黑瓶", "雅诗兰黛", "SK-II神仙水", "资生堂", "科颜氏"],
  数码: ["蓝牙耳机", "智能手表", "平板电脑", "充电宝", "数据线"],
  运动: ["阿迪达斯", "耐克跑鞋", "瑜伽垫", "运动T恤", "健身器材"],
};

onMounted(() => {
  init();
  const savedHistory = localStorage.getItem("search-history-list");
  histList.value = savedHistory ? JSON.parse(savedHistory) : [];
});
const init = async () => {
  isInitialLoading.value = true;
  try {
    let res = await hotInfo({
      number: 10,
      sort: 0,
    });
    hotTags.value = res.data?.length ? res.data : hotBasedList;
  } catch (err) {
    hotTags.value = hotBasedList;
    console.error("热门搜索加载失败，已使用本地数据：", err);
  } finally {
    isInitialLoading.value = false;
  }
};
// 按下回车再搜索
const onSearch = async () => {
  // keyWord是空格直接结束
  if (!keyWord.value.trim()) return (keyWord.value = "");
  await doSearch();
  saveHistory(keyWord.value);
};
// 保存历史记录
const saveHistory = (val: string) => {
  const trimStr = val.trim();
  if (!trimStr) return;
  // 保证历史记录至少是个空数组
  if (!histList.value) return (histList.value = []);
  const newList = histList.value.filter((item) => item !== trimStr);
  newList.unshift(trimStr);
  histList.value = newList.slice(0, 10);
  localStorage.setItem("search-history-list", JSON.stringify(histList.value));
};
// 实际的搜索功能
const doSearch = async () => {
  isSearchLoading.value = true;
  try {
    let res = await searchInfo({
      prodName: keyWord.value.trim(),
      shopId: 1,
      sort: 0,
      orderBy: 0,
      current: 1,
      size: 10,
    });
    prodList.value = res.data.records;
    isShow.value = true;
  } catch (err) {
    prodList.value = [];
    isShow.value = true;
    console.error("商品搜索失败：", err);
  } finally {
    isSearchLoading.value = false;
  }
};
// 删除历史记录
const delHistory = (index: number) => {
  histList.value.splice(index, 1);
  localStorage.setItem("search-history-list", JSON.stringify(histList.value));
};
// 清空历史记录
const clearHistory = () => {
  histList.value = [];
  localStorage.setItem("search-history-list", JSON.stringify(histList.value));
};
// 按搜索键搜索
const onClickButton = () => {
  onSearch();
};
// 点击标签可以搜索
const tagSearch = async (text: string) => {
  keyWord.value = text;
  await onSearch();
};
// 定义一个有防抖的函数，输入发生变化时触发，ai搜索建议功能
const requestAiSuggestion = debounce(async () => {
  // 去空
  if (!keyWord.value.trim()) {
    aiLoading.value = false;
    return;
  }
  // 非空
  const word = keyWord.value.trim();
  const loadingStartedAt = Date.now();
  aiLoading.value = true;
  aiSuggestion.value = [];

  // 先等待 AI；AI 不可用或请求失败时，再展示本地兜底建议
  try {
    const main = await getSearchSuggestion(word);
    if (word !== keyWord.value.trim()) return;
    if (main?.source == "openai" && typeof main.result === "string") {
      const suggestions = main.result
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean);
      if (!suggestions.length) throw new Error("AI建议为空");
      aiSource.value = main.source;
      aiSuggestion.value = suggestions;
    } else {
      aiSource.value = "fallback";
      aiSuggestion.value = localList(word) || [];
    }
  } catch (err) {
    if (word !== keyWord.value.trim()) return;
    aiSource.value = "fallback";
    aiSuggestion.value = localList(word) || [];
    console.warn("AI搜索建议获取失败，已使用本地建议", err);
  } finally {
    // 保证“思考中”和骨架屏能被用户看到，再展示最终建议
    const restTime = Math.max(0, 400 - (Date.now() - loadingStartedAt));
    if (restTime) await new Promise((resolve) => setTimeout(resolve, restTime));
    if (word === keyWord.value.trim()) aiLoading.value = false;
  }
}, 500);

const onInput = () => {
  const hasKeyWord = !!keyWord.value.trim();
  if (hasKeyWord) {
    hasAiSuggestionStarted.value = true;
    aiLoading.value = true;
  } else {
    aiLoading.value = false;
    // 尚未生成建议便清空输入时，恢复首次进入页面的状态
    if (!aiSuggestion.value.length) hasAiSuggestionStarted.value = false;
  }
  requestAiSuggestion();
};
// ai失败本地函数
const localList = (word: string) => {
  for (let [key, list] of Object.entries(SUGGEST_RULES)) {
    if (word.includes(key)) return list;
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

// 防抖函数
// 传入的函数可以接收任意数量、任意类型的参数，并且不要求返回结果
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: any = null;
  return function (...args: any[]) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

watch(keyWord, (newVal) => {
  console.log(newVal);
  if (!newVal) {
    prodList.value = [];
    isShow.value = false;
  }
});
</script>

<style scoped lang="scss">
.search {
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
  --van-search-background: var(--shop-page-bg);
  --van-search-content-background: var(--shop-surface);
  --van-search-action-text-color: var(--shop-primary);

  min-height: 100vh;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

.search :deep(.van-nav-bar) {
  background: var(--shop-surface);
}

.search :deep(.van-nav-bar::after) {
  border-color: var(--shop-border);
}

.search :deep(.van-nav-bar__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.search :deep(.van-nav-bar__text),
.search :deep(.van-nav-bar .van-icon) {
  color: var(--shop-primary);
}

.search form {
  background: var(--shop-page-bg);
}

.search :deep(.van-search) {
  padding: 0.24rem 0.32rem;
}

.search :deep(.van-search__content) {
  border: 0.026667rem solid var(--shop-border);
  border-radius: 0.266667rem;
}

.search :deep(.van-search .van-icon-search) {
  color: var(--shop-primary);
}

.search-result-skeleton {
  padding: 0 0.32rem;
}

.search-result-skeleton__card {
  padding: 0.32rem;
  margin-bottom: 0.213333rem;
  background: var(--shop-surface);
  border-radius: 0.213333rem;
  --van-skeleton-avatar-size: 2.346667rem;
  --van-skeleton-paragraph-height: 0.32rem;
}

.search-hot-skeleton {
  padding: 0;
}

.search-hot-skeleton__content {
  width: 100%;
}

.search-hot-skeleton__title {
  height: 0.32rem;
  margin: 0 0 0.266667rem;
}

.search-hot-skeleton__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.search-hot-skeleton__tag {
  height: 0.64rem;
  margin: 0;
}

.history,
.hot,
.ai-suggestion {
  padding: 0.32rem;
  margin: 0.266667rem 0.32rem 0;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.history-header::after {
  content: "";
  display: block;
  clear: both;
}

.history-title,
.hot-title,
.ai-title {
  font-size: 0.4rem;
  margin-bottom: 0.266667rem;
  color: var(--shop-text);
  font-weight: 600;
}

.history-title {
  float: left;
}

.history-clear {
  font-size: 0.35rem;
  color: var(--shop-text-muted);
  float: right;
}

.hot-tags {
  line-height: 0;

  .hot-tag {
    margin: 0 0.2rem 0.133333rem 0;
  }
}

.hist-tags {
  line-height: 0;

  .hist-tag {
    margin: 0 0.2rem 0.133333rem 0;
  }
}

.prod-list {
  padding: 0.266667rem 0.32rem;
}

.prod-card {
  margin-bottom: 0.266667rem;
  padding: 0.266667rem;
  overflow: hidden;
  font-size: 0.35rem;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.213333rem;
}

.prod-card :deep(.van-card__thumb) {
  overflow: hidden;
  background: var(--shop-page-bg);
  border-radius: 0.16rem;
}

.prod-card :deep(.van-card__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.prod-card :deep(.van-card__price) {
  color: var(--shop-primary);
  font-weight: 600;
}

.bottom-button {
  width: 2.666667rem;
  height: 1.066667rem;
  background: var(--shop-primary);
  border-color: var(--shop-primary);
}

.ai-suggestion {
  font-size: 0;
}

.ai-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.266667rem;
}

.ai-title {
  margin-bottom: 0;
}

.ai-tip {
  font-size: 0.3rem;
  margin-left: 0.16rem;
  border: 0.026667rem solid;
}

.ai-skeleton {
  padding: 0;
  --van-skeleton-paragraph-height: 0.72rem;
  --van-skeleton-paragraph-margin-top: 0;
}

.ai-skeleton-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  width: 100%;
}

.ai-tags {
  font-size: 0.4rem;

  .ai-tag {
    margin: 0 0.2rem 0.133333rem 0;
  }
}
</style>
