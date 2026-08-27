// The legacy image host has no working HTTPS certificate. Keep all its images
// (including product HTML and comma-separated galleries) on our fixed proxy.
export function rewriteShopImages<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(
      /(?:https?:)?\/\/shop-static\.edu\.koobietech\.com\//g,
      "/shop-images/",
    ) as T;
  }
  if (Array.isArray(value)) return value.map(rewriteShopImages) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteShopImages(item),
      ]),
    ) as T;
  }
  return value;
}
