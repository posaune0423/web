import { useEffect, useState } from "react";
import type { GridState } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { setIdleTask } from "idle-task";

export const useGridState = () => {
  // LocalStorage
  const [storedLastGridState, setStoredLastGridState] = useLocalStorage("lastGridState", {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [gridState, setGridState] = useState<GridState>(storedLastGridState);

  setIdleTask(() => {
    setStoredLastGridState(gridState);
  });

  useEffect(() => {
    // Initialize the position of the canvas
    setGridState(storedLastGridState);
  }, []);

  return {
    gridState,
    setGridState,
    setStoredLastGridState,
  };
};
