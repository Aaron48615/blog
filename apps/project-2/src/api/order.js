import { postWay, getWay, putWay } from "../utils/request";

// 根据下单商品结算订单
export const confirmInfo = (data) => postWay("/p/order/confirm", data);

// 提交订单返回流水号
export const submitInfo = (data) => postWay("/p/order/submit", data);

// 订单列表信息
export const myOrderInfo = (data) => getWay("/p/myOrder/myOrder", data);

// 根据订单号确认支付
export const payInfo = (data) => postWay("/p/order/pay", data);

// 根据订单号确认收货
export const receiptInfo = (orderNumber) =>
  putWay(`/p/myOrder/receipt/${orderNumber}`);
