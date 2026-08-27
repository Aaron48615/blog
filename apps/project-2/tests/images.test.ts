import assert from "node:assert/strict";
import { test } from "node:test";
import axios from "axios";

test("the real axios response interceptor rewrites nested shop image URLs, including product HTML", async (t) => {
  const original = {
    success: true,
    data: [
      {
        imgUrl: "http://shop-static.edu.koobietech.com/2019/04/banner.jpg",
        productDtoList: [
          { pic: "https://shop-static.edu.koobietech.com/2019/04/product.png" },
        ],
        content:
          '<img src="//shop-static.edu.koobietech.com/2019/04/detail.jpg">',
        imgs: "http://shop-static.edu.koobietech.com/a.jpg,http://shop-static.edu.koobietech.com/b.jpg",
        other: "https://other.example/image.jpg",
        lookalike:
          "http://shop-static.edu.koobietech.com.evil.example/image.jpg",
        absent: null,
        price: 20,
      },
    ],
  };
  const originalAdapter = axios.defaults.adapter;
  const storageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  t.after(() => {
    axios.defaults.adapter = originalAdapter;
    if (storageDescriptor)
      Object.defineProperty(globalThis, "localStorage", storageDescriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  axios.defaults.adapter = async (config) => ({
    data: original,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null },
  });
  const { getWay } = await import("../src/utils/request.ts");
  const response = await getWay("/indexImgs");
  assert.equal(response.data[0].imgUrl, "/shop-images/2019/04/banner.jpg");
  assert.equal(
    response.data[0].productDtoList[0].pic,
    "/shop-images/2019/04/product.png",
  );
  assert.equal(
    response.data[0].content,
    '<img src="/shop-images/2019/04/detail.jpg">',
  );
  assert.equal(response.data[0].imgs, "/shop-images/a.jpg,/shop-images/b.jpg");
  assert.equal(response.data[0].other, original.data[0]!.other);
  assert.equal(response.data[0].lookalike, original.data[0]!.lookalike);
  assert.equal(response.data[0].absent, null);
  assert.equal(response.data[0].price, 20);
  assert.match(original.data[0]!.imgUrl, /^http:/);
});
