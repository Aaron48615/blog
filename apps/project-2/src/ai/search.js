import { isAvailable, generate as DeepseekGenerate } from "./providers/openai";

async function tryAI(name, promptText, fallback) {
  if (await isAvailable()) {
    try {
      const { text } = await DeepseekGenerate(promptText);
      if (text) {
        console.log(`AI ${name} DeepSeek生成成功`);
        return {
          result: text,
          source: "openai",
        };
      }
    } catch (err) {
      console.log(`AI模型请求异常`);
      const r = typeof fallback === "function" ? fallback() : fallback;
      return {
        result: r,
        source: "fallback",
        error: "DeepSeek请求异常",
      };
    }
  }
  console.log(`AI ${name} DeepSeek模型未配置, 将使用本地规则`);
  const r = typeof fallback === "function" ? fallback() : fallback;
  return {
    result: r,
    source: "fallback",
    error: "DeepSeek未配置",
  };
}

// 搜索联想
export async function getSearchSuggestion(keyWord) {
  const { result, source } = await tryAI(
    "搜索联想",
    `你现在是一个商品文案专家，用户正在搜索${keyWord}，你要给出5条相关的搜索建议词条，只能输出电商相关的，每一条不能超过10个字，不需要在前面加序号，每条之间用换行隔开。`,
    () => {},
  );
  return { result, source };
}

// 卖点生成
export async function getSellingPoint(product) {
  const { brief, price, prodName } = product;
  const prodDesc = [
    `商品名称: ${prodName}`,
    `商品价格: ${price}`,
    `商品描述: ${brief}`,
  ].join("\n");
  const { result, source } = await tryAI(
    "卖点联想",
    `你现在是一个商品卖点文案专家，用户正在搜索一个商品，根据商品信息${prodDesc}生成对应文案
        文案要求：
        1. 每一条不能可以少于8个字,不超过20字，带emoji表情开头，中间也可以穿插emoji，不需要在前面加序号。
        2. 文案要能够吸引用户进行购买，从多角度分析卖点，比如品质、价格、优势、性价比等
        3. 你总共要给出4条相关的卖点词条，每条之间用换行隔开
        4. 生成的卖点不可以重复
        `,
    () => {
      const name = prodName || "";
      const defaults = [];
      if (name.includes("鞋") || name.includes("跑") || name.includes("运动")) {
        defaults.push("轻盈舒适，每一步都自在", "潮流设计，百搭不出错");
      } else if (name.includes("手机") || name.includes("数码")) {
        defaults.push("性能强劲，畅快体验", "超长续航，告别电量焦虑");
      }
      defaults.push(
        "品质保证，正品承诺",
        "现货速发，急速物流",
        "售后无忧，退换便捷",
      );
      return defaults.slice(0, 4);
    },
  );
  return { result, source };
}
