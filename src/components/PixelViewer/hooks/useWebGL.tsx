import { useCallback, useEffect, useRef } from "react";
import { BASE_CELL_SIZE, MIN_SCALE } from "../const";
import { initShaderProgram } from "../webgl";
import { Color, GridState, Pixel, ProgramInfo } from "@/types";

export const useWebGL = ({
  canvasRef,
  backgroundColor,
  gridColor,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  backgroundColor: Color;
  gridColor: Color;
}) => {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programInfoRef = useRef<ProgramInfo | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
        lineWidth: gl.getUniformLocation(shaderProgram, "uLineWidth"), //
      },
    };

    positionBufferRef.current = gl.createBuffer();
  }, [canvasRef]);

  const drawGrid = useCallback(
    (gridState: GridState, optimisticPixels: Pixel[]) => {
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

      const centerX = gridState.offsetX + canvasWidth / (2 * gridState.scale);
      const centerY = gridState.offsetY + canvasHeight / (2 * gridState.scale);

      const getDrawOrder = (x: number, y: number): number => {
        const dx = x - centerX;
        const dy = y - centerY;
        return dx * dx + dy * dy; // 中心からの距離の二乗
      };

      optimisticPixels.sort((a, b) => getDrawOrder(a.x, a.y) - getDrawOrder(b.x, b.y));

      // Draw colored cells in visible area
      optimisticPixels.forEach((pixel) => {
        const x = pixel.x * BASE_CELL_SIZE;
        const y = pixel.y * BASE_CELL_SIZE;
        if (x >= startX && x < endX && y >= startY && y < endY) {
          gl.uniform4f(programInfo.uniformLocations.color, pixel.color.r, pixel.color.g, pixel.color.b, pixel.color.a);
          const positions = [
            x,
            y,
            x + BASE_CELL_SIZE,
            y,
            x,
            y + BASE_CELL_SIZE,
            x + BASE_CELL_SIZE,
            y + BASE_CELL_SIZE,
          ];
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      });

      // Draw grid lines
      const BUFFER_RATIO = 1.5;
      const darker = gridState.scale > MIN_SCALE * BUFFER_RATIO ? 1.0 : 0.5;

      gl.uniform4f(
        programInfo.uniformLocations.color,
        gridColor.r * darker,
        gridColor.g * darker,
        gridColor.b * darker,
        gridColor.a
      );

      const baseLineWidth = 1.0;
      const lineWidth = baseLineWidth * gridState.scale;
      gl.uniform1f(programInfo.uniformLocations.lineWidth, lineWidth);

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
    },
    [backgroundColor, gridColor, programInfoRef, positionBufferRef]
  );

  return { drawGrid };
};
