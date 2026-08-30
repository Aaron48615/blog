import { lazy, Suspense } from "react";
import type { CSSProperties } from "react";
import type { EChartsOption } from "echarts";

interface ChartRenderProps {
  option: EChartsOption;
  height?: CSSProperties["height"];
}

const ChartRenderImpl = lazy(() => import("./ChartRenderImpl"));

export default function ChartRender(props: ChartRenderProps) {
  return (
    <Suspense fallback={<div>图表加载中...</div>}>
      <ChartRenderImpl {...props} />
    </Suspense>
  );
}
