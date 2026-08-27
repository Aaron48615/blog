import { getWay } from "../utils/request";

// 商品搜索
export const searchInfo = (data) => getWay("/search/searchProdPage", data);

// 热搜
export const hotInfo = (data) => getWay("/search/hotSearch", data);
