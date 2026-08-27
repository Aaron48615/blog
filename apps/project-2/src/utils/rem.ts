// ui设计稿宽度
const baseWidth = 750;
// 根字体大小
const baseFontSize = 75;

// 动态设置rem
function setRem() {
  // 获取视口宽度
  const clientWidth =
    document.documentElement.clientWidth || document.body.clientWidth;
  // 桌面端也按 375px 手机宽度显示，与全局容器的 10rem 对齐。
  const width = Math.min(clientWidth, 375);
  // 计算当前的html fontsize：最大宽度 / 设计稿 * 根字体大小
  const fontSize = (width / baseWidth) * baseFontSize;
  document.documentElement.style.fontSize = `${fontSize}px`;
}

setRem();

// 窗口变化后监听
window.addEventListener("resize", setRem);
// 窗口旋转
window.addEventListener("orientationchange", setRem);

export default setRem;
