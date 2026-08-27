import CryptoJS from "crypto-js";

const keyword = "shopkey-password";

/**
 * AES加密
 * @param val 传入的明文密码
 * @returns base64格式加密的字符串
 */
export const encrypt = (val: string): string => {
  // 此处使用时间戳加密，获取当前时间戳：
  const time = Date.now();
  // 明文 + 时间戳
  const content = `${time}${val}`;
  // 转码
  const keyStr = CryptoJS.enc.Utf8.parse(keyword);
  const contentStr = CryptoJS.enc.Utf8.parse(content);
  // 加密
  const enCryptStr = CryptoJS.AES.encrypt(contentStr, keyStr, {
    // 模式
    mode: CryptoJS.mode.ECB,
    // Pkcs填充加密（补零）
    padding: CryptoJS.pad.Pkcs7,
  });

  return enCryptStr.toString();
};
