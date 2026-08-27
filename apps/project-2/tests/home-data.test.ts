import assert from "node:assert/strict";
import { test } from "node:test";
import { loadHomeData, type HomeLoaders } from "../src/utils/homeData.ts";

const loaders: HomeLoaders = {
  banners: async () => ({
    success: true,
    data: [
      {
        imgUrl: "/shop-images/banner.jpg",
        seq: 1,
        uploadTime: "",
        type: 0,
        relation: 1,
      },
    ],
  }),
  notices: async () => ({ success: true, data: { records: [] } }),
  products: async () => ({
    success: true,
    data: [{ id: 1, title: "商品", seq: 1, style: "", productDtoList: [] }],
  }),
};

test("an unavailable notice API does not hide successful banners and products", async () => {
  const result = await loadHomeData({
    ...loaders,
    notices: async () => {
      throw new Error("timeout");
    },
  });
  assert.equal(result.banners.length, 1);
  assert.equal(result.products.length, 1);
  assert.deepEqual(result.notices, []);
  assert.deepEqual(result.failed, ["公告"]);
});

test("business errors and invalid payloads identify their own failed section", async () => {
  const result = await loadHomeData({
    ...loaders,
    banners: async () => ({ success: false, data: [] }),
    notices: async () => ({ success: true, data: null as never }),
  });
  assert.equal(result.products.length, 1);
  assert.deepEqual(result.banners, []);
  assert.deepEqual(result.notices, []);
  assert.deepEqual(result.failed, ["轮播图", "公告"]);
});

test("successful empty sections are not errors", async () => {
  const result = await loadHomeData(loaders);
  assert.deepEqual(result.failed, []);
});
