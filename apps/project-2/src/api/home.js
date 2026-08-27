import { getWay } from "../utils/request";

// 轮播图
export const bannerInfo = () => getWay("/indexImgs");

// 通知
export const noticeInfo = () => getWay("/shop/notice/noticeList");

// 商品
export const prodInfo = () => getWay("/prod/tagProdList");
