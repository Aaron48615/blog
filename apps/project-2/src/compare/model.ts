export interface Sku {
  skuId: number;
  price: number;
  stocks: number;
  properties: string | null;
  skuName?: string;
}
export interface Product {
  prodId: number;
  prodName: string;
  brief?: string;
  pic?: string;
  price: number;
  categoryId?: number;
  skuList: Sku[];
}
export interface Selection {
  prodId: number;
  skuId?: number;
}
export function validId(id: unknown): id is number {
  return Number.isSafeInteger(id) && Number(id) > 0;
}
export const storageKey = "shop-compare-v1";
export function restore(raw: string | null): Selection[] {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (x, i, a) =>
          x &&
          validId(x.prodId) &&
          a.findIndex((y) => y?.prodId === x.prodId) === i,
      )
      .slice(0, 2)
      .map((x) => ({
        prodId: x.prodId,
        ...(validId(x.skuId) ? { skuId: x.skuId } : {}),
      }));
  } catch {
    return [];
  }
}
export function properties(raw: string | null = ""): Record<string, string> {
  return Object.fromEntries(
    (raw || "").split(";").flatMap((part) => {
      const pos = part.indexOf(":");
      if (pos < 0) return [];
      const key = part.slice(0, pos).trim();
      const value = part.slice(pos + 1).trim();
      return key && value ? [[key, value]] : [];
    }),
  );
}
export function isShoe(p: Product) {
  return /鞋|NITE\s*JOGGER|XA\s*PRO\s*3D/i.test(
    `${p.prodName} ${p.brief || ""}`,
  );
}
export function normalized(raw: string | null, shoe = false) {
  return Object.fromEntries(
    Object.entries(properties(raw)).map(([k, v]) => [
      (
        {
          鞋码: "尺码",
          颜色分类: "颜色",
          ...(shoe ? { 尺寸: "尺码" } : {}),
        } as Record<string, string>
      )[k] || k,
      v,
    ]),
  );
}
export function skuLabel(p: Product, s: Sku) {
  return (
    Object.entries(normalized(s.properties, isShoe(p)))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}：${v}`)
      .join("；") ||
    s.skuName ||
    "默认规格"
  );
}
export function attributeNames(products: Product[]) {
  return [
    ...new Set(
      products.flatMap((p) =>
        p.skuList.flatMap((s) =>
          Object.keys(normalized(s.properties, isShoe(p))),
        ),
      ),
    ),
  ];
}
// 根据用户向后端确认的语义，SKU price 为原价；列表价不影响有效原价的比较。
export function originalPrice(s?: Sku) {
  return s && !suspectPrice(Number(s.price)) ? Number(s.price) : null;
}
export function matches(raw: string | null, selected: Record<string, string>) {
  const actual = properties(raw);
  return (
    Object.keys(actual).length === Object.keys(selected).length &&
    Object.entries(selected).every(([k, v]) => actual[k] === v)
  );
}
export function chooseSku(p: Product, id?: number) {
  return (
    p.skuList.find((s) => s.skuId === id && s.stocks > 0) ||
    p.skuList.find((s) => s.stocks > 0)
  );
}
export function suspectPrice(price: number) {
  return !Number.isFinite(price) || price <= 0.01;
}
export function supplement(p: Product) {
  const name = `${p.prodName} ${p.brief || ""}`;
  if (p.prodId === 69 && /NITE\s*JOGGER/i.test(name) && /BD7956/i.test(name))
    return {
      category: "鞋类",
      model: "NITE JOGGER BD7956",
      note: "型号来自商城商品名称；系列资料仅供查阅，不据此推断本配色的重量或运动性能。",
      source:
        "https://news.adidas.com/originals/nite-jogger-returns-with-a-new-city-inspired-pack/s/8b08b461-d7bd-4a47-96e8-362839950cf2",
    };
  if (
    p.prodId === 81 &&
    /Salomon|萨洛蒙/i.test(name) &&
    /XA\s*PRO\s*3D/i.test(name) &&
    !/V\d|GTX|GORE/i.test(name)
  )
    return {
      category: "鞋类",
      model: "XA PRO 3D（具体版本待核实）",
      note: "商城未提供版本和货号。官方另有多个版本，因此不补写防水、重量和越野性能。",
      source: "https://sg.salomon.com/products/xa-pro-3d-3",
    };
  return null;
}

export function addSelection(items: Selection[], id: number): Selection[] {
  return !validId(id) || items.some((x) => x.prodId === id) || items.length >= 2
    ? items
    : [...items, { prodId: id }];
}
