import axios from "axios";
import type { AxiosInstance } from "axios";
import { getToken } from "./auth";

interface apiResponse<T> {
  code: string;
  data: T;
  fail: boolean;
  msg: string | null;
  sign: string | null;
  success: boolean;
  timestamp: string | null;
  version: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 50000,
  headers: {
    "X-Custom-Header": "foobar",
    "X-Requested-With": "XMLHttpRequest",
    "Content-type": "application/json",
  },
});

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 在请求发送之前执行某些操作
    const token = getToken();

    if (token) {
      config.headers["Authorization"] = token;
    }
    return config;
  },
  function (error) {
    // 处理请求错误
    return Promise.reject(error);
  },
);

// 添加响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 状态码在 2xx 范围内的响应会触发此函数
    // 处理响应数据
    return response.data;
  },
  function (error) {
    // 状态码不在 2xx 范围内的响应会触发此函数
    // 处理响应错误
    return Promise.reject(error);
  },
);

// The interceptor unwraps AxiosResponse; legacy JS APIs still have untyped payloads.
const postWay = <T = any>(url: string, data?: any) => {
  return instance.post<apiResponse<T>, apiResponse<T>>(url, data);
};
const getWay = <T = any>(url: string, data?: any) => {
  return instance.get<apiResponse<T>, apiResponse<T>>(url, { params: data });
};
const delWay = <T = any>(url: string, data?: any) => {
  return instance.request<apiResponse<T>, apiResponse<T>>({
    url,
    method: "delete",
    data,
  });
};
const putWay = <T = any>(url: string, data?: any) => {
  return instance.put<apiResponse<T>, apiResponse<T>>(url, data);
};

// export default instance;
export { postWay, getWay, delWay, putWay };
