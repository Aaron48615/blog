import { getWay, postWay } from "../utils/request";

// 商品详情
export const prodInfo = (data) => getWay("/prod/prodInfo", data);

// 查看商品是否收藏
export const isCollectionInfo = (data) =>
  getWay("/p/user/collection/isCollection", data);

// 添加/取消收藏
export const addOrCancelInfo = (data) =>
  postWay("/p/user/collection/addOrCancel", data);

// 获取评论
export const prodCommentInfo = (data) => getWay("/prodComm/prodCommData", data);
