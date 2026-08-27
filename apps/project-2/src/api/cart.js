import { postWay, delWay } from "../utils/request";

// 添加/修改用户购物车商品
export const changeItemInfo = (data) => postWay("/p/shopCart/changeItem", data);

// 获取购物车信息
export const shopCartInfo = (data) => postWay("/p/shopCart/info", data);

// 获取购物车中价格
export const totalPayInfo = (data) => postWay("/p/shopCart/totalPay", data);

// 删除购物车物品
export const deleteItemInfo = (data) => delWay("/p/shopCart/deleteItem", data);

// 清空购物车商品
export const deleteAllInfo = () => delWay("/p/shopCart/deleteAll");
