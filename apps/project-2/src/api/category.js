import { getWay, postWay } from "../utils/request";

// 分类菜单
export const categoryInfo = (data) => getWay("/category/categoryInfo", data);

// 通过id获取商品菜单
export const pageProdInfo = (data) => getWay("/prod/pageProd", data);
