<template>
  <main class="compare-page">
    <header>
      <button
        @click="
          router.options.history.state.back
            ? router.back()
            : router.replace('/home')
        "
      >
        ‹ 返回
      </button>
    </header>
    <section class="intro">
      <h1>商品对比</h1>
      <p>核对规格与价格，还可以按你的需要分析</p>
    </section>
    <div v-if="store.selected.length < 2" class="panel">
      <h2>选两件商品来对比</h2>
      <p>首页、分类、搜索和详情里的商品都能加入，一次最多比较两件。</p>
      <button class="primary" @click="router.push('/category')">
        继续选商品
      </button>
    </div>
    <template v-else>
      <div v-if="loading" class="panel" role="status">正在核实商品与库存…</div>
      <div v-else-if="loadError" class="panel" role="alert">
        {{ loadError }} <button @click="load">重新加载</button>
        <button
          v-for="item in store.selected"
          :key="item.prodId"
          @click="store.remove(item.prodId)"
        >
          移除商品 {{ item.prodId }}
        </button>
      </div>
      <template v-else>
        <section class="product-grid">
          <article v-for="p in products" :key="p.prodId" class="product-card">
            <button
              class="remove"
              @click="store.remove(p.prodId)"
              :aria-label="`移除${p.prodName}`"
            >
              ×
            </button>
            <img
              :src="p.pic"
              :alt="p.prodName"
              @error="
                ($event.target as HTMLImageElement).style.visibility = 'hidden'
              "
            />
            <h2>{{ p.prodName }}</h2>
            <p class="price">
              {{ chosen(p) ? `原价 ¥${chosen(p)!.price}` : "暂无可用规格原价" }}
            </p>
            <p class="muted">现价 ¥{{ p.price }}</p>
            <p
              v-if="chosen(p) && originalPrice(chosen(p)) === null"
              class="warning"
            >
              所选规格原价可能是演示数据，预算待核实
            </p>
            <label
              >选择规格<select
                :value="chosen(p)?.skuId ?? ''"
                @change="
                  store.sku(
                    p.prodId,
                    Number(($event.target as HTMLSelectElement).value),
                  )
                "
              >
                <option v-if="!chosen(p)" value="">暂无可用规格</option>
                <option
                  v-for="sku in p.skuList"
                  :key="sku.skuId"
                  :value="sku.skuId"
                  :disabled="sku.stocks <= 0"
                >
                  {{ skuLabel(p, sku) }} ·
                  {{ sku.stocks > 0 ? "有货" : "缺货" }}
                </option>
              </select></label
            >
            <p class="stock">
              {{
                chosen(p) ? `当前规格库存 ${chosen(p)?.stocks} 件` : "商品缺货"
              }}
            </p>
            <button class="primary" :disabled="!chosen(p)" @click="buy(p)">
              去选购 →
            </button>
          </article>
        </section>
        <section class="panel">
          <div class="section-heading">
            <h2>规格对比</h2>
            <label class="switch"
              ><input v-model="onlyDiff" type="checkbox" />只看差异</label
            >
          </div>
          <div
            v-for="row in visibleRows"
            :key="row.label"
            class="fact-row"
            :class="{ different: row.different }"
          >
            <h3>{{ row.label }}</h3>
            <div class="fact-values">
              <p v-for="(v, i) in row.values" :key="i">{{ v }}</p>
            </div>
          </div>
          <p v-if="!visibleRows.length">当前已知字段没有差异。</p>
          <div v-for="p in products" :key="p.prodId" class="source">
            <p>
              {{ supplement(p)?.note }}
            </p>
            <a
              v-if="supplement(p)"
              :href="supplement(p)!.source"
              target="_blank"
              rel="noopener noreferrer"
              >查看品牌系列资料 ↗</a
            >
          </div>
        </section>
        <section class="panel advice">
          <h2>让选购助手帮你理一理</h2>
          <div class="inputs">
            <label
              >预算（选填）<input
                v-model="budget"
                type="number"
                min="1"
                placeholder="例如 1000 元" /></label
            ><label
              >规格偏好（选填）<input
                v-model="size"
                maxlength="30"
                placeholder="例如 42 码、256GB、100ml"
            /></label>
          </div>
          <label
            >主要有什么需求？<textarea
              v-model="needs"
              maxlength="500"
              rows="3"
              placeholder="例如：日常使用，预算有限，希望比较所选规格和已知卖点。"
            />
          </label>
          <div class="chips">
            <button v-for="s in quickNeeds" :key="s" @click="needs = s">
              {{ s }}
            </button>
          </div>
          <button
            v-if="status !== 'generating'"
            class="primary"
            :disabled="!allAvailable"
            @click="analyze"
          >
            {{ status === "idle" ? "开始分析" : "重新分析" }}</button
          ><button v-else class="primary" @click="stop">停止生成</button>
          <p class="status" role="status">{{ statusText }}</p>
          <p v-if="error" class="warning" role="alert">{{ error }}</p>
          <div class="answer" aria-live="polite">{{ answer }}</div>
        </section>
      </template>
    </template>
  </main>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCompare } from "../stores/compare";
import {
  chooseSku,
  normalized,
  supplement,
  originalPrice,
  isShoe,
  skuLabel,
  attributeNames,
  type Product,
} from "../compare/model";
import { readSSE, RequestGeneration } from "../compare/stream";
import { getWay } from "../utils/request";
const router = useRouter(),
  store = useCompare();
const products = ref<Product[]>([]),
  loading = ref(false),
  loadError = ref(""),
  onlyDiff = ref(false);
const budget = ref(""),
  size = ref(""),
  needs = ref(""),
  answer = ref(""),
  error = ref("");
const status = ref<"idle" | "generating" | "done" | "stopped" | "failed">(
  "idle",
);
const invalidated = ref(false);
let controller: AbortController | undefined;
const generation = new RequestGeneration();
let loadVersion = 0;
const chosen = (p: Product) =>
  chooseSku(p, store.selected.find((x) => x.prodId === p.prodId)?.skuId);
const quickNeeds = computed(() =>
  products.value.length === 2 && products.value.every(isShoe)
    ? ["日常通勤", "休闲穿搭", "轻户外"]
    : ["日常使用", "预算优先", "送礼选购"],
);
const allAvailable = computed(
  () => products.value.length === 2 && products.value.every((p) => chosen(p)),
);
const statusText = computed(
  () =>
    ({
      idle: invalidated.value
        ? "选择或需求已变化，请重新分析。"
        : "建议只参考当前商品已知资料。",
      generating: "正在分析，可随时停止…",
      done: "分析完成，请结合商品详情核实。",
      stopped: "已停止，以上为未完成内容。",
      failed: "分析未完成，商品对比仍可使用。",
    })[status.value],
);
function invalidate() {
  generation.next();
  controller?.abort();
  answer.value = "";
  error.value = "";
  status.value = "idle";
  invalidated.value = true;
}
async function load() {
  const version = ++loadVersion;
  invalidate();
  products.value = [];
  if (store.selected.length !== 2) return;
  loading.value = true;
  loadError.value = "";
  try {
    const result = await Promise.all(
      store.selected.map(async (item) => {
        const response = (await getWay("/prod/prodInfo", {
          prodId: item.prodId,
        })) as unknown as { success: boolean; data: Product };
        if (
          !response.success ||
          !response.data ||
          response.data.prodId !== item.prodId ||
          !Array.isArray(response.data.skuList)
        )
          throw new Error("商品已失效或接口暂不可用");
        return response.data;
      }),
    );
    if (version !== loadVersion) return;
    products.value = result;
    for (const p of result) {
      const sku = chosen(p);
      if (sku) store.sku(p.prodId, sku.skuId);
    }
  } catch (e) {
    if (version === loadVersion)
      loadError.value = e instanceof Error ? e.message : "商品加载失败";
  } finally {
    if (version === loadVersion) loading.value = false;
  }
}
watch(() => store.selected.map((x) => x.prodId).join(","), load, {
  immediate: true,
});
watch(
  () => JSON.stringify([store.selected, budget.value, size.value, needs.value]),
  invalidate,
  { flush: "sync" },
);
const facts = computed(() => {
  const attributes: [string, (p: Product) => string][] = attributeNames(
    products.value,
  ).map((key) => [
    key,
    (p) =>
      [
        ...new Set(
          p.skuList
            .map((s) => normalized(s.properties, isShoe(p))[key])
            .filter(Boolean),
        ),
      ].join("、") || "暂无资料",
  ]);
  const fields: [string, (p: Product) => string][] = [
    ...attributes,
    ["当前规格", (p) => (chosen(p) ? skuLabel(p, chosen(p)!) : "暂无可用规格")],
    ["原价", (p) => (chosen(p) ? `¥${chosen(p)!.price}` : "暂无可用规格")],
    ["库存", (p) => (chosen(p) ? `${chosen(p)!.stocks} 件` : "缺货")],
    [
      "预算（按原价）",
      (p) => {
        const price = originalPrice(chosen(p));
        if (!chosen(p)) return "暂无可用规格";
        if (price === null) return "原价待核实";
        return budget.value && Number(budget.value) > 0
          ? price <= Number(budget.value)
            ? "原价在预算内"
            : "原价超出预算"
          : "尚未填写预算";
      },
    ],
    ["商品说明（商家提供）", (p) => p.brief || "暂无资料"],
    ["补充型号", (p) => supplement(p)?.model || "暂无资料"],
  ];
  return fields.map(([label, get]) => {
    const values = products.value.map(get);
    return {
      label,
      values,
      different: values.length === 2 && values[0] !== values[1],
    };
  });
});
const visibleRows = computed(() =>
  facts.value.filter((r) => !onlyDiff.value || r.different),
);
function buy(p: Product) {
  const sku = chosen(p);
  if (sku)
    router.push({
      path: "/prodinfo",
      query: { ids: p.prodId, skuId: sku.skuId },
    });
}
function stop() {
  generation.next();
  controller?.abort();
  status.value = "stopped";
}
async function analyze() {
  if (!allAvailable.value) return;
  if (
    budget.value &&
    (!Number.isFinite(Number(budget.value)) || Number(budget.value) <= 0)
  ) {
    error.value = "请填写有效的正数预算";
    return;
  }
  invalidate();
  const id = generation.next();
  controller = new AbortController();
  const requestController = controller;
  const signal = requestController.signal;
  const timer = setTimeout(() => requestController.abort(), 65000);
  status.value = "generating";
  try {
    const response = await fetch("/api/compare/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        items: store.selected,
        needs: needs.value,
        size: size.value,
        budget: budget.value ? Number(budget.value) : null,
      }),
    });
    if (!response.ok) {
      let message = "分析接口暂不可用";
      try {
        message = (await response.json()).error || message;
      } catch {
        /* 静态预览没有开发接口 */
      }
      throw new Error(message);
    }
    if (!response.body) throw new Error("未收到流式响应");
    let done = false;
    for await (const data of readSSE(response.body, signal)) {
      if (!generation.current(id)) return;
      const event = JSON.parse(data);
      if (event.type === "delta" && typeof event.text === "string")
        answer.value += event.text;
      else if (event.type === "error") throw new Error(event.message);
      else if (event.type === "done") {
        done = true;
        break;
      }
    }
    if (!done) throw new Error("连接提前结束，请重新分析");
    if (generation.current(id)) {
      if (!answer.value.trim()) throw new Error("模型返回了空内容");
      status.value = "done";
    }
  } catch (e) {
    if (generation.current(id)) {
      status.value = "failed";
      error.value = signal.aborted
        ? "请求超时，请重试"
        : e instanceof Error
          ? e.message
          : "分析失败";
    }
  } finally {
    clearTimeout(timer);
  }
}
onBeforeUnmount(() => {
  loadVersion++;
  generation.next();
  controller?.abort();
});
</script>
<style scoped>
.compare-page {
  box-sizing: border-box;
  max-width: 10rem;
  margin: auto;
  padding: 0.36rem 0.32rem 1rem;
  background: var(--compare-bg);
  color: var(--compare-text);
  min-height: 100vh;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 0.32rem;
  line-height: 1.6;
}
.compare-page * {
  box-sizing: border-box;
}
.compare-page button,
.compare-page input,
.compare-page select,
.compare-page textarea {
  font: inherit;
}
.compare-page button {
  cursor: pointer;
}
.compare-page header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.28rem;
}
.compare-page header button {
  border: 0;
  background: none;
  color: inherit;
}
.intro {
  padding: 0.5rem 0.08rem;
}
.intro h1 {
  font-size: 0.62rem;
  line-height: 1.4;
  letter-spacing: -0.025rem;
  margin: 0.15rem 0;
  font-family: "Songti SC", serif;
}
.intro p {
  margin: 0.15rem 0;
}
.panel {
  background: #fff;
  border: 1px solid var(--compare-border);
  border-radius: 0.28rem;
  padding: 0.35rem;
  margin: 0.28rem 0;
}
.panel h2 {
  font-size: 0.4rem;
  margin: 0 0 0.22rem;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.2rem;
}
.product-card {
  position: relative;
  background: #fff;
  border-radius: 0.24rem;
  padding: 0.26rem;
  border: 1px solid var(--compare-border);
  min-width: 0;
}
.product-card img {
  width: 100%;
  height: 2.8rem;
  object-fit: contain;
}
.product-card h2 {
  font-size: 0.33rem;
  min-height: 1.55rem;
  margin: 0.15rem 0;
  overflow-wrap: anywhere;
}
.remove {
  position: absolute;
  right: 0.15rem;
  top: 0.12rem;
  background: var(--compare-bg);
  border: 0;
  border-radius: 50%;
  width: 0.55rem;
  height: 0.55rem;
}
.price {
  font-size: 0.58rem;
  font-weight: 650;
  margin: 0.14rem 0;
  color: var(--compare-primary);
}
.primary {
  border: 0;
  background: var(--compare-primary);
  color: #fff;
  border-radius: 0.18rem;
  padding: 0.25rem 0.3rem;
  width: 100%;
  font-weight: 600;
}
.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.warning {
  font-size: 0.27rem;
  color: var(--compare-primary-dark);
  background: var(--compare-primary-light);
  padding: 0.15rem;
  border-radius: 0.12rem;
}
.stock,
.muted,
.source {
  font-size: 0.27rem;
  color: var(--compare-muted);
}
label {
  display: block;
  font-size: 0.28rem;
}
select,
input,
textarea {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0.12rem 0;
  padding: 0.18rem;
  border: 1px solid var(--compare-border);
  border-radius: 0.12rem;
  background: #fff;
  color: var(--compare-text);
}
select {
  font-size: 0.26rem !important;
}
.section-heading {
  display: flex;
  gap: 0.2rem;
  align-items: center;
  justify-content: space-between;
}
.switch {
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 0.1rem;
}
.switch input {
  width: auto;
  accent-color: var(--compare-primary);
}
.fact-row {
  padding: 0.18rem 0.16rem;
  border-top: 1px solid var(--compare-border);
}
.fact-row.different {
  background: var(--compare-primary-light);
  border-radius: 0.12rem;
}
.fact-row h3 {
  font-size: 0.25rem;
  color: var(--compare-muted);
  margin: 0.08rem 0;
}
.fact-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.28rem;
}
.fact-values p {
  margin: 0.08rem 0;
  font-size: 0.29rem;
  overflow-wrap: anywhere;
}
.source a {
  color: var(--compare-primary);
}
.inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin: 0.2rem 0;
}
.chips button {
  border: 1px solid var(--compare-accent-border);
  background: var(--compare-primary-light);
  border-radius: 1rem;
  padding: 0.1rem 0.24rem;
  font-size: 0.27rem;
  color: var(--compare-primary);
}
.answer {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.33rem;
}
.status {
  font-size: 0.27rem;
  color: var(--compare-muted);
}
.advice {
  border-top: 0.08rem solid var(--compare-primary);
}
.primary:not(:disabled):active {
  background: var(--compare-primary-dark);
}
.remove {
  color: var(--compare-muted);
}
.compare-page input::placeholder,
.compare-page textarea::placeholder {
  color: #a49d97;
}
</style>
