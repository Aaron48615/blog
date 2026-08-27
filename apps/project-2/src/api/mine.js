import { getWay } from "../utils/request";

// 获取用户信息
export const userInfo = () => getWay("/p/user/userInfo");

// 获取订单数量
export const orderCountInfo = () => getWay("/p/myOrder/orderCount");

// 获取用户收藏数量
export const collectionCountInfo = () => getWay("/p/user/collection/count");
