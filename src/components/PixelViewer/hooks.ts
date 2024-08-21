import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { BASE_CELL_SIZE, COLOR_PALETTE, MAX_SCALE, MIN_SCALE, SWIPE_THRESHOLD } from "./const";
import { ColoredCell, type Color, type GridState, type ProgramInfo } from "./types";
import { initShaderProgram } from "./webgl";
import { useDojo } from "@/libs/dojo/useDojo";
import { hexToRgba, rgbaToHex } from "@/utils";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has } from "@dojoengine/recs";
import { getPinchDistance, getTouchPositions } from "@/utils/gestures";

export const usePixelViewer = (backgroundColor: Color, gridColor: Color) => {
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
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [gridState, setGridState] = useState<GridState>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [selectedColor, setSelectedColor] = useState<Color>(COLOR_PALETTE[0]);

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

  const [optimisticPixels, setOptimisticPixels] = useOptimistic(pixels, (pixels, newPixel: ColoredCell) => {
    return [...pixels, newPixel];
  });

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

  const drawGrid = useCallback(() => {
    const gl = glRef.current;
    const programInfo = programInfoRef.current;
    if (!gl || !programInfo) return;

    gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;

    gl.uniform2f(programInfo.uniformLocations.resolution, canvasWidth, canvasHeight);
    gl.uniform2f(programInfo.uniformLocations.offset, gridState.offsetX, gridState.offsetY);
    gl.uniform1f(programInfo.uniformLocations.scale, gridState.scale);

    const visibleWidth = canvasWidth / gridState.scale;
    const visibleHeight = canvasHeight / gridState.scale;

    const startX = Math.max(0, Math.floor(gridState.offsetX / BASE_CELL_SIZE) * BASE_CELL_SIZE);
    const startY = Math.max(0, Math.floor(gridState.offsetY / BASE_CELL_SIZE) * BASE_CELL_SIZE);
    const endX = startX + visibleWidth + BASE_CELL_SIZE;
    const endY = startY + visibleHeight + BASE_CELL_SIZE;

    // Draw colored cells
    optimisticPixels.forEach((pixel) => {
      const x = pixel.x * BASE_CELL_SIZE;
      const y = pixel.y * BASE_CELL_SIZE;
      if (x >= startX && x < endX && y >= startY && y < endY) {
        gl.uniform4f(programInfo.uniformLocations.color, pixel.color.r, pixel.color.g, pixel.color.b, pixel.color.a);
        const positions = [x, y, x + BASE_CELL_SIZE, y, x, y + BASE_CELL_SIZE, x + BASE_CELL_SIZE, y + BASE_CELL_SIZE];
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    });

    // Draw grid lines
    gl.uniform4f(programInfo.uniformLocations.color, gridColor.r, gridColor.g, gridColor.b, gridColor.a);
    const positions: number[] = [];

    for (let x = startX; x <= endX; x += BASE_CELL_SIZE) {
      positions.push(x, startY, x, endY);
    }

    for (let y = startY; y <= endY; y += BASE_CELL_SIZE) {
      positions.push(startX, y, endX, y);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(programInfo.attribLocations.position);
    gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, positions.length / 2);
  }, [gridState, backgroundColor, gridColor, optimisticPixels]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        gestureRef.current.isGesture = true;
        gestureRef.current.gestureStartTime = Date.now();
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
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

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
          await interact(burnerAccount, { x: cellX, y: cellY, color: rgbaToHex(selectedColor) });
        });
      }

      isDraggingRef.current = false;
    },
    [gridState, selectedColor, burnerAccount, interact, setOptimisticPixels]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseDownPosRef.current = { x, y };
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

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
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!isDraggingRef.current && mouseDownPosRef.current) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
          await interact(burnerAccount, { x: cellX, y: cellY, color: rgbaToHex(selectedColor) });
        });
      }

      mouseDownPosRef.current = null;
      isDraggingRef.current = false;
    },
    [gridState, selectedColor, burnerAccount, interact, setOptimisticPixels]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.ctrlKey) {
        // Trackpad pinch gesture
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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
    const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

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

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = glRef.current;
    if (!gl) return;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const animateJumpToCell = useCallback(
    (x: number, y: number, duration: number = 500) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const startTime = Date.now();
      const startOffsetX = gridState.offsetX;
      const startOffsetY = gridState.offsetY;

      const targetOffsetX = Math.max(0, x * BASE_CELL_SIZE + BASE_CELL_SIZE / 2 - canvasWidth / (2 * gridState.scale));
      const targetOffsetY = Math.max(0, y * BASE_CELL_SIZE + BASE_CELL_SIZE / 2 - canvasHeight / (2 * gridState.scale));

      const animateFrame = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // イージング関数（オプション：スムーズな動きにする）
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
    resizeCanvas();
    drawGrid();
    requestAnimationFrame(animate);
  }, [resizeCanvas, drawGrid]);

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

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("touchmove", handlePinchZoom);
    };
  }, [handlePinchZoom, resizeCanvas, animate]);

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
