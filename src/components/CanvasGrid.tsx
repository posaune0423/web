import React, { useRef, useEffect, useCallback } from "react";
import { BASE_CELL_SIZE, MAX_SCALE, MIN_SCALE, SWIPE_THRESHOLD } from "@/constants/webgl";
import { useWebGL } from "@/hooks/useWebGL";
import { convertClientPosToCanvasPos } from "@/utils/canvas";
import { getPinchDistance, getTouchPositions } from "@/utils/gestures";
import { GridState } from "@/types";
import { resizeCanvasToDisplaySize } from "twgl.js";

export const INERTIA_DAMPING = 0.97;
export const INERTIA_STOP_THRESHOLD = 0.05;

interface CanvasGridProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width?: number;
  height?: number;
  gridState: GridState;
  className?: string;
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
  initialScale?: number;
  initialOffset?: { x: number; y: number };
  maxZoom?: number;
  minZoom?: number;
  damping?: boolean;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  maxZoom = MAX_SCALE,
  minZoom = MIN_SCALE,
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
  const { glRef, drawGrid } = useWebGL(canvasRef, gridState);

  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gestureRef = useRef({
    lastPinchDistance: null as number | null,
    lastTouchPositions: null as { x: number; y: number }[] | null,
    isGesture: false,
    gestureType: null as string | null,
    gestureStartTime: null as number | null,
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
        setGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
          offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
        }));

        onSwipe?.(dx, dy);

        mouseDownPosRef.current = { x, y };
      }
    },
    [canvasRef, updateCurrentMousePos, onSwipe, setGridState]
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

        console.log("click");
        onCellClick?.(cellX, cellY);
      }

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
        setGridState((prev) => {
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
        setGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX + e.deltaX / prev.scale),
          offsetY: Math.max(0, prev.offsetY + e.deltaY / prev.scale),
        }));
        onPan?.(e.deltaX, e.deltaY);
      }

      updateCurrentMousePos(x, y);
    },
    [canvasRef, minZoom, maxZoom, updateCurrentMousePos, onZoom, setGridState, onPan]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        gestureRef.current.isGesture = true;
        gestureRef.current.gestureStartTime = performance.now();
        gestureRef.current.lastPinchDistance = getPinchDistance(e.touches);
        gestureRef.current.lastTouchPositions = getTouchPositions(e.touches);
        gestureRef.current.gestureType = null;
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
    },
    [canvasRef, updateCurrentMousePos]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2 && gestureRef.current.isGesture) {
        const currentDistance = getPinchDistance(e.touches);
        const currentPositions = getTouchPositions(e.touches);
        const pinchDelta = currentDistance - (gestureRef.current.lastPinchDistance || 0);
        const moveDelta = {
          x:
            (currentPositions[0].x + currentPositions[1].x) / 2 -
            ((gestureRef.current.lastTouchPositions?.[0].x || 0) +
              (gestureRef.current.lastTouchPositions?.[1].x || 0)) /
              2,
          y:
            (currentPositions[0].y + currentPositions[1].y) / 2 -
            ((gestureRef.current.lastTouchPositions?.[0].y || 0) +
              (gestureRef.current.lastTouchPositions?.[1].y || 0)) /
              2,
        };

        if (!gestureRef.current.gestureType) {
          if (Math.abs(pinchDelta) > Math.abs(moveDelta.x) && Math.abs(pinchDelta) > Math.abs(moveDelta.y)) {
            gestureRef.current.gestureType = "pinch";
          } else {
            gestureRef.current.gestureType = "swipe";
          }
        }

        if (gestureRef.current.gestureType === "pinch") {
          setGridState((prev) => {
            const zoomFactor = currentDistance / (gestureRef.current.lastPinchDistance || currentDistance);
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
        } else {
          setGridState((prev) => ({
            ...prev,
            offsetX: Math.max(0, prev.offsetX - moveDelta.x / prev.scale),
            offsetY: Math.max(0, prev.offsetY - moveDelta.y / prev.scale),
          }));
          onSwipe?.(moveDelta.x, moveDelta.y);
        }

        gestureRef.current.lastPinchDistance = currentDistance;
        gestureRef.current.lastTouchPositions = currentPositions;
      } else if (e.touches.length === 1) {
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
          inertiaRef.current.speedX = (dx / deltaTime) * 15;
          inertiaRef.current.speedY = (dy / deltaTime) * 15;
          inertiaRef.current.lastTime = currentTime;

          setGridState((prev) => ({
            ...prev,
            offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
            offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
          }));
          onSwipe?.(dx, dy);
          touchStartPosRef.current = { x, y };
        }
      }
    },
    [canvasRef, minZoom, maxZoom, updateCurrentMousePos, setGridState, onPinch, onSwipe]
  );

  const handleInertia = useCallback(() => {
    const { speedX, speedY, animationFrame } = inertiaRef.current;

    if (Math.abs(speedX) > INERTIA_STOP_THRESHOLD || Math.abs(speedY) > INERTIA_STOP_THRESHOLD) {
      setGridState((prev) => ({
        ...prev,
        offsetX: Math.max(0, prev.offsetX - speedX / prev.scale),
        offsetY: Math.max(0, prev.offsetY - speedY / prev.scale),
      }));

      inertiaRef.current.speedX *= INERTIA_DAMPING;
      inertiaRef.current.speedY *= INERTIA_DAMPING;

      inertiaRef.current.animationFrame = requestAnimationFrame(handleInertia);
    } else {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        inertiaRef.current.animationFrame = null;
      }
    }
  }, [setGridState]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const wasPinchGesture = gestureRef.current.isGesture;
      gestureRef.current.isGesture = false;
      gestureRef.current.gestureType = null;

      if (isDraggingRef.current && damping) {
        if (inertiaRef.current.animationFrame) {
          cancelAnimationFrame(inertiaRef.current.animationFrame);
        }
        inertiaRef.current.animationFrame = requestAnimationFrame(handleInertia);
      } else if (!isDraggingRef.current && !wasPinchGesture && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const { x, y } = convertClientPosToCanvasPos(canvasRef, touch.clientX, touch.clientY);

        const worldX = gridState.offsetX + x / gridState.scale;
        const worldY = gridState.offsetY + y / gridState.scale;

        const cellX = Math.floor(worldX / BASE_CELL_SIZE);
        const cellY = Math.floor(worldY / BASE_CELL_SIZE);

        onTap?.(cellX, cellY);
      }

      isDraggingRef.current = false;
    },
    [canvasRef, damping, gridState, handleInertia, onTap]
  );

  const animate = useCallback(() => {
    drawGrid();
    onDrawGrid?.();
  }, [drawGrid, onDrawGrid]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrame);
    };
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
