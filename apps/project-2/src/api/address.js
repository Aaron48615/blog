import { getWay, postWay, putWay, delWay } from "../utils/request";

// 获取地址
export const addrInfo = (addrId) => getWay(`/p/address/addrInfo/${addrId}`);

// 获取用户地址列表
export const addrListInfo = () => getWay("/p/address/list");

// 新增地址
export const addAddrInfo = (data) => postWay("/p/address/addAddr", data);

// 修改地址
export const updateAddrInfo = (data) => putWay("/p/address/updateAddr", data);

// 获取省市区ID
export const areaInfo = (data) => getWay("/p/area/listByPid", data);

// 设置默认地址
export const defaultAddrInfo = (addrId) =>
  putWay(`/p/address/defaultAddr/${addrId}`);

// 删除地址
export const deleteAddrInfo = (addrId) =>
  delWay(`/p/address/deleteAddr/${addrId}`);
