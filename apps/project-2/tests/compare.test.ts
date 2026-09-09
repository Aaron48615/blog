import test from "node:test";
import assert from "node:assert/strict";
import {
  addSelection,
  restore,
  properties,
  matches,
  normalized,
  chooseSku,
  originalPrice,
  attributeNames,
  skuLabel,
  suspectPrice,
  supplement,
  type Product,
} from "../src/compare/model.ts";
import { readSSE, RequestGeneration } from "../src/compare/stream.ts";
const p: Product = {
  prodId: 69,
  prodName: "adidas NITE JOGGER BD7956",
  price: 0.01,
  skuList: [
    { skuId: 1, price: 0.01, stocks: 0, properties: "颜色:黑;鞋码:42" },
    { skuId: 2, price: 0.01, stocks: 3, properties: "鞋码:43;颜色:黑" },
  ],
};
const body = (parts: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      parts.forEach((p) => c.enqueue(p));
      c.close();
    },
  });
test("恢复仅保存ID、SKU；剔除重复、非法ID及额外字段", () => {
  assert.deepEqual(
    restore(
      '[{"prodId":69,"skuId":2,"price":5},{"prodId":69},{"prodId":81},{"prodId":82}]',
    ),
    [{ prodId: 69, skuId: 2 }, { prodId: 81 }],
  );
  assert.deepEqual(restore("broken"), []);
});
test("SKU不依赖属性顺序，归一尺码颜色，缺货不选", () => {
  assert.ok(matches("鞋码:43;颜色:黑", properties("颜色:黑;鞋码:43")));
  assert.equal(normalized("颜色分类:黑;尺寸:42", true).尺码, "42");
  assert.equal(chooseSku(p, 1)?.skuId, 2);
  assert.equal(chooseSku({ ...p, skuList: [] }), undefined);
});
test("型号变化停用资料，异常价格不可作为优势", () => {
  assert.ok(supplement(p));
  assert.equal(supplement({ ...p, prodName: "不同商品" }), null);
  assert.equal(
    supplement({ ...p, prodId: 81, prodName: "Salomon XA PRO 3D V9" }),
    null,
  );
  assert.ok(suspectPrice(0.01));
  assert.ok(!suspectPrice(998));
});
test("SSE逐字节中文、合块、多行和CRLF", async () => {
  const bytes = new TextEncoder().encode(
    'data: {"text":"北京"}\r\n\r\ndata: first\ndata: second\n\n',
  );
  const result = [];
  for await (const d of readSSE(body([...bytes].map((n) => Uint8Array.of(n)))))
    result.push(d);
  assert.deepEqual(result, ['{"text":"北京"}', "first\nsecond"]);
});
test("SSE中途断开和取消", async () => {
  await assert.rejects(async () => {
    for await (const _ of readSSE(
      body([new TextEncoder().encode("data: half")]),
    )) {
    }
  });
  const c = new AbortController();
  c.abort();
  await assert.rejects(async () => {
    for await (const _ of readSSE(body([]), c.signal)) {
    }
  });
});
test("旧请求失效不能覆盖新文本、错误和结束状态", () => {
  const g = new RequestGeneration();
  const old = g.next();
  const latest = g.next();
  assert.equal(g.current(old), false);
  assert.equal(g.current(latest), true);
});
test("重复添加不产生重复项，最多两件且支持任意有效商品", () => {
  const one = addSelection([], 69);
  assert.equal(addSelection(one, 69), one);
  const two = addSelection(one, 81);
  assert.equal(two.length, 2);
  assert.equal(addSelection(two, 88), two);
  assert.deepEqual(restore(JSON.stringify(two)), two);
});
test("全品类商品恢复，不合法ID和SKU不会进入持久化", () => {
  assert.deepEqual(
    restore(
      '[{"prodId":18,"skuId":3,"name":"不保存"},{"prodId":78,"skuId":-1}]',
    ),
    [{ prodId: 18, skuId: 3 }, { prodId: 78 }],
  );
  for (const id of [-1, 0, 1.2, NaN, Infinity])
    assert.deepEqual(addSelection([], id), []);
  assert.deepEqual(addSelection([], 78), [{ prodId: 78 }]);
});
test("1199按SKU原价比较，列表0.01不影响；所选原价0.01仍待核实", () => {
  const shoe = { ...p, skuList: [{ ...p.skuList[1]!, price: 1199 }] };
  assert.equal(originalPrice(chooseSku(shoe)), 1199);
  assert.equal(originalPrice(p.skuList[1]), null);
});
test("手机尺寸不被映射为鞋码，动态属性保留容量净含量，空属性回退默认规格", () => {
  const phone: Product = {
    prodId: 18,
    prodName: "手机",
    price: 2000,
    skuList: [
      {
        skuId: 5,
        price: 2000,
        stocks: 1,
        properties: "颜色分类:黑;容量:256GB;尺寸:6.5英寸",
      },
    ],
  };
  const water: Product = {
    prodId: 78,
    prodName: "精萃水",
    price: 670,
    skuList: [{ skuId: 6, price: 670, stocks: 1, properties: "净含量:100ml" }],
  };
  assert.deepEqual(attributeNames([phone, water]), [
    "颜色",
    "容量",
    "尺寸",
    "净含量",
  ]);
  assert.ok(!skuLabel(phone, phone.skuList[0]!).includes("尺码"));
  assert.equal(
    skuLabel(phone, { ...phone.skuList[0]!, properties: null }),
    "默认规格",
  );
});
