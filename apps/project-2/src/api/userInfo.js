import { postWay } from "../utils/request";

// 登录
export const loginInfo = (data) => postWay("/login", data);

// 注册
export const registerInfo = (data) => postWay("/user/register", data);
