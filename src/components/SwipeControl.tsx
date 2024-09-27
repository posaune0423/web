import { detectMobile } from "@/utils/devices";
import React, { useEffect, useLayoutEffect } from "react";
import { useSwipeable } from "react-swipeable";

const SwipeControl = ({ children }: { children: React.ReactNode }) => {
  const isMobile = detectMobile();

  useLayoutEffect(() => {
    // ブラウザの履歴にダミーのエントリを追加
    window.history.pushState(null, "", window.location.pathname);

    // popstateイベントのリスナーを追加
    const handlePopState = (e: PopStateEvent) => {
      e.stopImmediatePropagation();
      // ブラウザバックを防止
      window.history.pushState(null, "", window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    // コンポーネントのアンマウント時にリスナーを削除
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    // NOTE: improve mobile scroll experience
    window.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
      },
      { passive: false },
    );
  }, [isMobile]);

  const handlers = useSwipeable({
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return <div {...handlers}>{children}</div>;
};

export default SwipeControl;
