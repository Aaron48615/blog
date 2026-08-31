import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { EChartsOption } from "echarts";

interface ChartRenderProps {
  option: EChartsOption;
  height?: CSSProperties["height"];
}

const ChartRenderImpl = lazy(() => import("./ChartRenderImpl"));

export default function ChartRender(props: ChartRenderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    let isNearViewport = false;
    let hasInteraction = window.scrollY > 0;
    const maybeLoad = () => {
      if (isNearViewport && hasInteraction) {
        setShouldLoad(true);
        observer.disconnect();
        removeInteractionListeners();
      }
    };
    const handleInteraction = () => {
      hasInteraction = true;
      maybeLoad();
    };
    const interactionEvents = [
      "pointerdown",
      "keydown",
      "focusin",
      "wheel",
      "touchmove",
    ];
    const removeInteractionListeners = () => {
      for (const event of interactionEvents) {
        window.removeEventListener(event, handleInteraction);
      }
      document.removeEventListener("scroll", handleInteraction, true);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting;
        maybeLoad();
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    for (const event of interactionEvents) {
      window.addEventListener(event, handleInteraction, {
        once: true,
        passive: true,
      });
    }
    document.addEventListener("scroll", handleInteraction, {
      capture: true,
      once: true,
      passive: true,
    });
    return () => {
      observer.disconnect();
      removeInteractionListeners();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: props.height ?? 300 }}>
      {shouldLoad ? (
        <Suspense fallback={<div>图表加载中...</div>}>
          <ChartRenderImpl {...props} />
        </Suspense>
      ) : (
        <div>图表加载中...</div>
      )}
    </div>
  );
}
