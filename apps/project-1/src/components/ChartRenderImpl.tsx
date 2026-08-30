import * as echarts from "echarts";
import type { EChartsOption, EChartsType } from "echarts";
import { memo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";

interface ChartRenderProps {
  option: EChartsOption;
  height?: CSSProperties["height"];
}

const ChartRenderImpl = memo(({ option, height = 300 }: ChartRenderProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<EChartsType | null>(null);
  const { mode } = useSelector((state: RootState) => state.themeSlice);

  useEffect(() => {
    if (!chartRef.current) return;
    const instance =
      mode === "light"
        ? echarts.init(chartRef.current)
        : echarts.init(chartRef.current, "dark");
    instanceRef.current = instance;
    const handleResize = () => instance.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      instance.dispose();
      instanceRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (option && instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, [option, mode]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
});

export default ChartRenderImpl;
