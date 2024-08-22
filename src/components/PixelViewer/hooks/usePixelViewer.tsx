import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { BASE_CELL_SIZE, COLOR_PALETTE, MAX_SCALE, MIN_SCALE, SWIPE_THRESHOLD } from "../const";
import { ColoredCell, type Color, type GridState, type ProgramInfo } from "../types";
import { initShaderProgram } from "../webgl";
import { useDojo } from "@/hooks/useDojo";
import { hexToRgba, rgbaToHex } from "@/utils";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has } from "@dojoengine/recs";
import { getPinchDistance, getTouchPositions } from "@/utils/gestures";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { setIdleTask } from "idle-task";
import { useWebGL } from "./useWebGL";
import { convertClientPosToCanvasPos } from "@/utils/canvas";
import { sounds } from "@/constants";
import { useSound } from "use-sound";

export const usePixelViewer = (backgroundColor: Color, gridColor: Color) => {
  // LocalStorage
  const [storedLastGridState, setStoredLastGridState] = useLocalStorage("lastGridState", {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programInfoRef = useRef<ProgramInfo | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const gestureRef = useRef({
    lastPinchDistance: null as number | null,
    lastTouchPositions: null as { x: number; y: number }[] | null,
    isGesture: false,
    gestureType: null as string | null,
    gestureStartTime: null as number | null,
  });

  // States
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gridState, setGridState] = useState<GridState>(storedLastGridState);
  const [selectedColor, setSelectedColor] = useState<Color>(COLOR_PALETTE[0]);

  //Other Hooks
  const {
    setup: {
      systemCalls: { interact },
      burnerManager: { account: burnerAccount },
      contractComponents: { Pixel },
    },
  } = useDojo();

  const pixelEntities = useEntityQuery([Has(Pixel)]);
  const pixels = useMemo(
    () =>
      pixelEntities
        .map((entity) => {
          const data = getComponentValue(Pixel, entity);
          if (!data) return;
          return {
            x: data.x,
            y: data.y,
            color: hexToRgba(data.color),
          };
        })
        .filter((pixel): pixel is ColoredCell => pixel !== undefined),
    [pixelEntities, Pixel]
  );

  const [play] = useSound(sounds.placeColor, { volume: 0.5 });

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(pixels, (pixels, newPixel: ColoredCell) => {
    return [...pixels, newPixel];
  });

  const { drawGrid } = useWebGL({ canvasRef, backgroundColor, gridColor });

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
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        updateCurrentMousePos(x, y);
        touchStartPosRef.current = { x, y };
        lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [updateCurrentMousePos]
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
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * zoomFactor));
            return { ...prev, scale: newScale };
          });
        } else {
          setGridState((prev) => ({
            ...prev,
            offsetX: Math.max(0, prev.offsetX - moveDelta.x / prev.scale),
            offsetY: Math.max(0, prev.offsetY - moveDelta.y / prev.scale),
          }));
        }

        gestureRef.current.lastPinchDistance = currentDistance;
        gestureRef.current.lastTouchPositions = currentPositions;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const { x, y } = convertClientPosToCanvasPos(canvasRef, touch.clientX, touch.clientY);

        startTransition(() => {
          updateCurrentMousePos(x, y);
        });

        const dx = x - touchStartPosRef.current.x;
        const dy = y - touchStartPosRef.current.y;

        if (!isDraggingRef.current && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD)) {
          isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
          setGridState((prev) => ({
            ...prev,
            offsetX: Math.max(0, prev.offsetX - dx / prev.scale),
            offsetY: Math.max(0, prev.offsetY - dy / prev.scale),
          }));
          touchStartPosRef.current = { x, y };
        }
      }
    },
    [updateCurrentMousePos]
  );

  const handleTouchEnd = useCallback(
    async (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      gestureRef.current.isGesture = false;
      gestureRef.current.gestureType = null;

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!isDraggingRef.current) {
        const x = touchStartPosRef.current.x;
        const y = touchStartPosRef.current.y;

        const worldX = gridState.offsetX + x / gridState.scale;
        const worldY = gridState.offsetY + y / gridState.scale;

        const cellX = Math.floor(worldX / BASE_CELL_SIZE);
        const cellY = Math.floor(worldY / BASE_CELL_SIZE);

        if (!burnerAccount) {
          console.error("Burner account not found");
          return;
        }

        startTransition(async () => {
          setOptimisticPixels({ x: cellX, y: cellY, color: selectedColor });
          play();
          await interact(burnerAccount, { x: cellX, y: cellY, color: rgbaToHex(selectedColor) });
        });
      }

      isDraggingRef.current = false;
    },
    [gridState, selectedColor, burnerAccount, interact, setOptimisticPixels, play]
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

        if (!burnerAccount) {
          console.error("Burner account not found");
          return;
        }

        startTransition(async () => {
          setOptimisticPixels({ x: cellX, y: cellY, color: selectedColor });
          play();
          await interact(burnerAccount, { x: cellX, y: cellY, color: rgbaToHex(selectedColor) });
        });
      }

      mouseDownPosRef.current = null;
      isDraggingRef.current = false;
    },
    [gridState, selectedColor, burnerAccount, interact, setOptimisticPixels, play]
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
      } else {
        // Regular mouse wheel
        setGridState((prev) => ({
          ...prev,
          offsetX: Math.max(0, prev.offsetX + e.deltaX / prev.scale),
          offsetY: Math.max(0, prev.offsetY + e.deltaY / prev.scale),
        }));
      }

      startTransition(() => {
        updateCurrentMousePos(x, y);
      });
    },
    [updateCurrentMousePos]
  );

  const handlePinchZoom = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

    const { x: centerX, y: centerY } = convertClientPosToCanvasPos(
      canvasRef,
      (touch1.clientX + touch2.clientX) / 2,
      touch1.clientY + touch2.clientY
    );

    setGridState((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (dist / (prev.lastPinchDist || dist))));

      const worldCenterX = prev.offsetX + centerX / prev.scale;
      const worldCenterY = prev.offsetY + centerY / prev.scale;

      const newOffsetX = worldCenterX - centerX / newScale;
      const newOffsetY = worldCenterY - centerY / newScale;

      return {
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        scale: newScale,
        lastPinchDist: dist,
      };
    });
  }, []);

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
    drawGrid(gridState, optimisticPixels);
  }, [drawGrid, gridState, optimisticPixels]);

  // Effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    const shaderProgram = initShaderProgram(gl);
    if (!shaderProgram) return;

    programInfoRef.current = {
      program: shaderProgram,
      attribLocations: {
        position: gl.getAttribLocation(shaderProgram, "aPosition"),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, "uResolution"),
        offset: gl.getUniformLocation(shaderProgram, "uOffset"),
        scale: gl.getUniformLocation(shaderProgram, "uScale"),
        color: gl.getUniformLocation(shaderProgram, "uColor"),
      },
    };

    positionBufferRef.current = gl.createBuffer();

    canvas.addEventListener("touchmove", handlePinchZoom);

    animate();

    return () => {
      canvas.removeEventListener("touchmove", handlePinchZoom);
    };
  }, [handlePinchZoom, animate]);

  setIdleTask(() => {
    setStoredLastGridState(gridState);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = glRef.current;
    if (!gl) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      animate();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Initialize the position of the canvas
    setGridState(storedLastGridState);
  }, []);

  return {
    canvasRef,
    selectedColor,
    currentMousePos,
    setSelectedColor,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    animateJumpToCell,
  };
};
