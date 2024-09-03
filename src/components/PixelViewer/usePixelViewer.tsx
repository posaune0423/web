import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_CELL_SIZE, COLOR_PALETTE, MAX_SCALE, MIN_SCALE, SWIPE_THRESHOLD } from "@/constants/webgl";
import { type Color } from "@/types";
import { useDojo } from "@/hooks/useDojo";
import { rgbaToHex } from "@/utils";
import { useWebGL } from "@/hooks/useWebGL";
import { convertClientPosToCanvasPos } from "@/utils/canvas";
import { sounds } from "@/constants";
import { useSound } from "use-sound";
import { useGridState } from "@/hooks/useGridState";
import { usePixels } from "@/hooks/usePixels";

export const usePixelViewer = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // States
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState<Color>(COLOR_PALETTE[0]);

  //Other Hooks
  const {
    setup: {
      systemCalls: { interact },
      account: { account },
      connectedAccount,
    },
  } = useDojo();
  const { gridState, setGridState } = useGridState();
  const { drawGrid, drawPixels } = useWebGL(canvasRef, gridState);
  const { optimisticPixels, setOptimisticPixels, fetchPixels } = usePixels(canvasRef, gridState);
  const activeAccount = useMemo(() => connectedAccount || account, [connectedAccount, account]);

  const [play] = useSound(sounds.placeColor, { volume: 0.5 });

  // Handlers
  const updateCurrentMousePos = useCallback(
    (canvasX: number, canvasY: number) => {
      const worldX = gridState.offsetX + canvasX / gridState.scale;
      const worldY = gridState.offsetY + canvasY / gridState.scale;

      const cellX = Math.floor(worldX / BASE_CELL_SIZE);
      const cellY = Math.floor(worldY / BASE_CELL_SIZE);

      setCurrentMousePos({ x: cellX, y: cellY });
    },
    [gridState]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

    mouseDownPosRef.current = { x, y };
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

      startTransition(() => {
        updateCurrentMousePos(x, y);
      });

      if (!mouseDownPosRef.current) return;

      const dx = x - mouseDownPosRef.current.x;
      const dy = y - mouseDownPosRef.current.y;

      if (!isDraggingRef.current && (Math.abs(dx) > SWIPE_THRESHOLD / 2 || Math.abs(dy) > SWIPE_THRESHOLD / 2)) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        setGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
          offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
        }));

        mouseDownPosRef.current = { x, y };
      }
    },
    [updateCurrentMousePos]
  );

  const handleMouseUp = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      if (!isDraggingRef.current && mouseDownPosRef.current) {
        const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

        const worldX = gridState.offsetX + x / gridState.scale;
        const worldY = gridState.offsetY + y / gridState.scale;

        const cellX = Math.floor(worldX / BASE_CELL_SIZE);
        const cellY = Math.floor(worldY / BASE_CELL_SIZE);

        startTransition(async () => {
          setOptimisticPixels({ x: cellX, y: cellY, color: selectedColor });
          play();
          await interact(activeAccount, { x: cellX, y: cellY, color: rgbaToHex(selectedColor) });
          console.log(optimisticPixels[optimisticPixels.length - 1]);
        });
      }

      mouseDownPosRef.current = null;
      isDraggingRef.current = false;
    },
    [gridState, selectedColor, activeAccount, interact, setOptimisticPixels, play]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

      if (e.ctrlKey) {
        // TrackPad pinch gesture
        const delta = -e.deltaY * 0.01;
        setGridState((prev) => {
          const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (1 + delta)));
          const worldX = prev.offsetX + x / prev.scale;
          const worldY = prev.offsetY + y / prev.scale;
          const newOffsetX = Math.max(0, worldX - x / newScale);
          const newOffsetY = Math.max(0, worldY - y / newScale);
          return { ...prev, scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
        });
        if (Math.abs(e.deltaY) < 2) {
          console.log("fetching pixels");
          fetchPixels();
        }
      } else {
        // Regular mouse wheel
        setGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX + e.deltaX / prev.scale),
          offsetY: Math.max(0, prev.offsetY + e.deltaY / prev.scale),
        }));

        if (Math.abs(e.deltaX) < 2 && Math.abs(e.deltaY) < 2) {
          console.log("fetching pixels");
          fetchPixels();
        }
      }

      startTransition(() => {
        updateCurrentMousePos(x, y);
      });
    },
    [updateCurrentMousePos, fetchPixels, setGridState]
  );

  const animateJumpToCell = useCallback(
    (x: number, y: number, duration: number = 500) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const startTime = performance.now();
      const startOffsetX = gridState.offsetX;
      const startOffsetY = gridState.offsetY;

      const targetOffsetX = Math.max(0, x * BASE_CELL_SIZE + BASE_CELL_SIZE / 2 - canvasWidth / (2 * gridState.scale));
      const targetOffsetY = Math.max(0, y * BASE_CELL_SIZE + BASE_CELL_SIZE / 2 - canvasHeight / (2 * gridState.scale));

      const animateFrame = () => {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // easing function (optional: smooth movement)
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        setGridState((prev) => ({
          ...prev,
          offsetX: startOffsetX + (targetOffsetX - startOffsetX) * easeProgress,
          offsetY: startOffsetY + (targetOffsetY - startOffsetY) * easeProgress,
        }));

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          startTransition(() => {
            setCurrentMousePos({ x, y });
          });
        }
      };

      requestAnimationFrame(animateFrame);
    },
    [gridState, setCurrentMousePos]
  );

  const animate = useCallback(() => {
    drawGrid();
    drawPixels(optimisticPixels);
  }, [drawGrid, drawPixels, optimisticPixels]);

  // Effects
  useEffect(() => {
    animate();
  }, [animate]);

  // initial fetch
  useEffect(() => {
    fetchPixels();
  }, []);

  return {
    canvasRef,
    selectedColor,
    currentMousePos,
    setSelectedColor,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    animateJumpToCell,
  };
};
