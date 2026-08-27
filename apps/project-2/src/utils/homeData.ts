import type { banner, notice, prod } from "../types/home.ts";

interface Result<T> {
  success: boolean;
  data: T;
}
export interface HomeLoaders {
  banners: () => Promise<Result<banner[]>>;
  notices: () => Promise<Result<{ records: notice[] }>>;
  products: () => Promise<Result<prod[]>>;
}

export async function loadHomeData(loaders: HomeLoaders) {
  const [banners, notices, products] = await Promise.allSettled([
    loaders.banners(),
    loaders.notices(),
    loaders.products(),
  ]);
  const failed: string[] = [];
  function read<T, U>(
    result: PromiseSettledResult<Result<T>>,
    label: string,
    select: (data: T) => U[],
  ): U[] {
    if (result.status === "fulfilled" && result.value?.success === true) {
      try {
        const data = select(result.value.data);
        if (Array.isArray(data)) return data;
      } catch {
        /* A malformed section must not discard other successful data. */
      }
    }
    failed.push(label);
    return [];
  }
  return {
    banners: read(banners, "轮播图", (data) => data),
    notices: read(notices, "公告", (data) => data.records),
    products: read(products, "商品", (data) => data),
    failed,
  };
}
