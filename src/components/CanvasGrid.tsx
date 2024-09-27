import React, { useRef, useEffect, useCallback } from "react";
import { BASE_CELL_SIZE, MAX_SCALE, MIN_SCALE, SWIPE_THRESHOLD } from "@/constants/webgl";
import { useWebGL } from "@/hooks/useWebGL";
import { convertClientPosToCanvasPos } from "@/utils/canvas";
import { getPinchDistance, getTouchPositions } from "@/utils/gestures";
import { GridState } from "@/types";
import { resizeCanvasToDisplaySize } from "twgl.js";

export const INERTIA_DAMPING = 0.97;
export const INERTIA_STOP_THRESHOLD = 0.05;

const PINCH_COOLDOWN = 300; // ミリ秒

interface CanvasGridProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width?: number;
  height?: number;
  gridState: GridState;
  className?: string;
  initialScale?: number;
  initialOffset?: { x: number; y: number };
  maxZoom?: number;
  minZoom?: number;
  maxCellSize?: number;
  damping?: boolean;
  setGridState: React.Dispatch<React.SetStateAction<GridState>>;
  onDrawGrid?: () => void;
  onCellClick?: (x: number, y: number) => void;
  onCellHover?: (x: number, y: number) => void;
  onPinch?: (scale: number, x: number, y: number) => void;
  onTap?: (x: number, y: number) => void;
  onSwipe?: (dx: number, dy: number) => void;
  onPan?: (dx: number, dy: number) => void;
  onZoom?: (scale: number, x: number, y: number) => void;
  setCurrentMousePos?: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
    }>
  >;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  maxZoom = MAX_SCALE,
  minZoom = MIN_SCALE,
  maxCellSize,
  damping = true,
  gridState,
  canvasRef,
  width,
  height,
  className,
  setGridState,
  onDrawGrid,
  onCellClick,
  onCellHover,
  onPan,
  onPinch,
  onTap,
  onSwipe,
  onZoom,
  setCurrentMousePos,
}) => {
  // Hooks
  const { glRef, drawGrid } = useWebGL(canvasRef, gridState);

  // Refs
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gestureRef = useRef<{
    gestureType: string | null;
    isGesture: boolean;
    gestureStartTime: number | null;
    lastPinchDistance: number | null;
    lastTouchPositions: { x: number; y: number }[] | null;
    lastPinchEndTime: number;
  }>({
    gestureType: null,
    isGesture: false,
    gestureStartTime: null,
    lastPinchDistance: null,
    lastTouchPositions: null,
    lastPinchEndTime: 0,
  });
  const inertiaRef = useRef<{
    speedX: number;
    speedY: number;
    lastTime: number;
    animationFrame: number | null;
  }>({
    speedX: 0,
    speedY: 0,
    lastTime: 0,
    animationFrame: null,
  });

  // Handlers
  const setLimitedGridState = useCallback(
    (updater: (prev: GridState) => GridState) => {
      setGridState((prev) => {
        const newState = updater(prev);
        if (maxCellSize) {
          const maxOffsetX = Math.max(
            0,
            maxCellSize * BASE_CELL_SIZE - (canvasRef.current?.width || 0) / newState.scale
          );
          const maxOffsetY = Math.max(
            0,
            maxCellSize * BASE_CELL_SIZE - (canvasRef.current?.height || 0) / newState.scale
          );
          return {
            ...newState,
            offsetX: Math.min(Math.max(0, newState.offsetX), maxOffsetX),
            offsetY: Math.min(Math.max(0, newState.offsetY), maxOffsetY),
          };
        }
        return newState;
      });
    },
    [setGridState, maxCellSize, canvasRef]
  );

  const updateCurrentMousePos = useCallback(
    (canvasX: number, canvasY: number) => {
      const worldX = gridState.offsetX + canvasX / gridState.scale;
      const worldY = gridState.offsetY + canvasY / gridState.scale;

      const cellX = Math.floor(worldX / BASE_CELL_SIZE);
      const cellY = Math.floor(worldY / BASE_CELL_SIZE);

      setCurrentMousePos?.({ x: cellX, y: cellY });
      onCellHover?.(cellX, cellY);
    },
    [gridState, onCellHover, setCurrentMousePos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

      mouseDownPosRef.current = { x, y };
      isDraggingRef.current = false;
    },
    [canvasRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

      updateCurrentMousePos(x, y);

      if (!mouseDownPosRef.current) return;

      const dx = x - mouseDownPosRef.current.x;
      const dy = y - mouseDownPosRef.current.y;

      if (!isDraggingRef.current && (Math.abs(dx) > SWIPE_THRESHOLD / 2 || Math.abs(dy) > SWIPE_THRESHOLD / 2)) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        setLimitedGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
          offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
        }));

        onSwipe?.(dx, dy);

        mouseDownPosRef.current = { x, y };
      }
    },
    [canvasRef, updateCurrentMousePos, onSwipe, setLimitedGridState]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isDraggingRef.current && mouseDownPosRef.current) {
        const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

        const worldX = gridState.offsetX + x / gridState.scale;
        const worldY = gridState.offsetY + y / gridState.scale;

        const cellX = Math.floor(worldX / BASE_CELL_SIZE);
        const cellY = Math.floor(worldY / BASE_CELL_SIZE);

        onCellClick?.(cellX, cellY);
      }

      // Reset gesture states after mouse up
      gestureRef.current.isGesture = false;
      gestureRef.current.gestureType = null;

      mouseDownPosRef.current = null;
      isDraggingRef.current = false;
    },
    [canvasRef, gridState, onCellClick]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const { x, y } = convertClientPosToCanvasPos(canvasRef, e.clientX, e.clientY);

      if (e.ctrlKey) {
        // TrackPad pinch gesture
        const delta = -e.deltaY * 0.01;
        setLimitedGridState((prev) => {
          const newScale = Math.max(minZoom, Math.min(maxZoom, prev.scale * (1 + delta)));
          const worldX = prev.offsetX + x / prev.scale;
          const worldY = prev.offsetY + y / prev.scale;
          const newOffsetX = Math.max(0, worldX - x / newScale);
          const newOffsetY = Math.max(0, worldY - y / newScale);

          onZoom?.(newScale, x, y);

          return { ...prev, scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
        });
      } else {
        // Regular mouse wheel or swipe
        setLimitedGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX + e.deltaX / prev.scale),
          offsetY: Math.max(0, prev.offsetY + e.deltaY / prev.scale),
        }));
        onPan?.(e.deltaX, e.deltaY);
      }

      updateCurrentMousePos(x, y);
    },
    [canvasRef, minZoom, maxZoom, updateCurrentMousePos, onZoom, setLimitedGridState, onPan]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        gestureRef.current.isGesture = true;
        gestureRef.current.gestureType = "pinch";
        gestureRef.current.gestureStartTime = performance.now();
        gestureRef.current.lastPinchDistance = getPinchDistance(e.touches);
        gestureRef.current.lastTouchPositions = getTouchPositions(e.touches);
      } else {
        isDraggingRef.current = false;
        const touch = e.touches[0];
        const { x, y } = convertClientPosToCanvasPos(canvasRef, touch.clientX, touch.clientY);

        updateCurrentMousePos(x, y);
        touchStartPosRef.current = { x, y };
        lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

        gestureRef.current.gestureStartTime = performance.now();

        if (inertiaRef.current.animationFrame) {
          cancelAnimationFrame(inertiaRef.current.animationFrame);
        }
      }

      // 慣性スクロールのための時間をリセット
      inertiaRef.current.lastTime = performance.now();
    },
    [canvasRef, updateCurrentMousePos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        gestureRef.current.isGesture = true;
        gestureRef.current.gestureType = "pinch";

        const currentPositions = getTouchPositions(e.touches);
        const currentDistance = getPinchDistance(e.touches);

        if (!gestureRef.current.lastPinchDistance) {
          gestureRef.current.lastPinchDistance = currentDistance;
          gestureRef.current.lastTouchPositions = currentPositions;
          return;
        }

        const zoomFactor = currentDistance / gestureRef.current.lastPinchDistance;

        setLimitedGridState((prev) => {
          const newScale = Math.max(minZoom, Math.min(maxZoom, prev.scale * zoomFactor));

          // Calculate the center point of the pinch gesture
          const centerX = (currentPositions[0].x + currentPositions[1].x) / 2;
          const centerY = (currentPositions[0].y + currentPositions[1].y) / 2;

          // Convert center point to world coordinates
          const worldCenterX = prev.offsetX + centerX / prev.scale;
          const worldCenterY = prev.offsetY + centerY / prev.scale;

          // Calculate new offsets to keep the center point stationary
          const newOffsetX = worldCenterX - centerX / newScale;
          const newOffsetY = worldCenterY - centerY / newScale;

          onPinch?.(newScale, centerX, centerY);

          return {
            ...prev,
            scale: newScale,
            offsetX: Math.max(0, newOffsetX),
            offsetY: Math.max(0, newOffsetY),
          };
        });

        gestureRef.current.lastPinchDistance = currentDistance;
        gestureRef.current.lastTouchPositions = currentPositions;
      } else if (e.touches.length === 1) {
        if (!gestureRef.current.isGesture) {
          gestureRef.current.gestureType = "swipe";
        }

        const touch = e.touches[0];
        const { x, y } = convertClientPosToCanvasPos(canvasRef, touch.clientX, touch.clientY);

        updateCurrentMousePos(x, y);

        const dx = x - touchStartPosRef.current.x;
        const dy = y - touchStartPosRef.current.y;

        if (!isDraggingRef.current && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD)) {
          isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
          const currentTime = performance.now();
          const deltaTime = currentTime - inertiaRef.current.lastTime;

          // deltaTimeが0の場合を防ぐ
          if (deltaTime > 0) {
            inertiaRef.current.speedX = (dx / deltaTime) * 15;
            inertiaRef.current.speedY = (dy / deltaTime) * 15;
          }

          inertiaRef.current.lastTime = currentTime;

          setLimitedGridState((prev) => ({
            ...prev,
            offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
            offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
          }));
          onSwipe?.(dx, dy);
          touchStartPosRef.current = { x, y };
        }
      }
    },
    [canvasRef, minZoom, maxZoom, updateCurrentMousePos, setLimitedGridState, onPinch, onSwipe]
  );

  const handleInertia = useCallback(() => {
    inertiaRef.current.animationFrame = null;

    const { speedX, speedY } = inertiaRef.current;

    if (Math.abs(speedX) > INERTIA_STOP_THRESHOLD || Math.abs(speedY) > INERTIA_STOP_THRESHOLD) {
      setLimitedGridState((prev) => ({
        ...prev,
        offsetX: Math.max(0, prev.offsetX - speedX / prev.scale),
        offsetY: Math.max(0, prev.offsetY - speedY / prev.scale),
      }));

      inertiaRef.current.speedX *= INERTIA_DAMPING;
      inertiaRef.current.speedY *= INERTIA_DAMPING;

      inertiaRef.current.animationFrame = requestAnimationFrame(handleInertia);
    }
  }, [setLimitedGridState]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const wasPinchGesture = gestureRef.current.gestureType === "pinch";
      const wasDragging = isDraggingRef.current;

      gestureRef.current.isGesture = false;
      gestureRef.current.gestureType = null;
      gestureRef.current.lastPinchDistance = null;
      gestureRef.current.lastTouchPositions = null;

      if (wasPinchGesture) {
        gestureRef.current.lastPinchEndTime = Date.now();
      } else if (wasDragging && damping) {
        if (inertiaRef.current.animationFrame) {
          cancelAnimationFrame(inertiaRef.current.animationFrame);
        }
        inertiaRef.current.animationFrame = requestAnimationFrame(handleInertia);
      } else if (!wasPinchGesture && !wasDragging && e.changedTouches.length === 1) {
        const currentTime = Date.now();
        if (currentTime - gestureRef.current.lastPinchEndTime > PINCH_COOLDOWN) {
          const touch = e.changedTouches[0];
          const { x, y } = convertClientPosToCanvasPos(canvasRef, touch.clientX, touch.clientY);

          const worldX = gridState.offsetX + x / gridState.scale;
          const worldY = gridState.offsetY + y / gridState.scale;

          const cellX = Math.floor(worldX / BASE_CELL_SIZE);
          const cellY = Math.floor(worldY / BASE_CELL_SIZE);

          onTap?.(cellX, cellY);
        }
      }

      // reset state
      isDraggingRef.current = false;
      touchStartPosRef.current = { x: 0, y: 0 };

      // reset time for inertia scroll
      inertiaRef.current.lastTime = 0;
    },
    [canvasRef, damping, gridState, handleInertia, onTap]
  );

  const animate = useCallback(() => {
    drawGrid();
    onDrawGrid?.();
  }, [drawGrid, onDrawGrid]);

  // Effects
  useEffect(() => {
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const gl = glRef.current;
    if (!gl) {
      console.error("WebGL context not found");
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
      animate();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, glRef, animate]);

  // Prevent from browser back motion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
