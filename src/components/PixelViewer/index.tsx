import React from "react";
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_GRID_COLOR } from "./const";
import { usePixelViewer } from "./hooks/usePixelViewer";
import { type Color } from "./types";
import { CoordinateFinder } from "../CoordinateFinder";
import { ColorPalette } from "../ColorPallette";

interface PixelViewerProps {
  backgroundColor?: Color;
  gridColor?: Color;
}

const PixelViewer: React.FC<PixelViewerProps> = ({
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  gridColor = DEFAULT_GRID_COLOR,
}) => {
  const {
    canvasRef,
    currentMousePos,
    selectedColor,
    setSelectedColor,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    animateJumpToCell,
  } = usePixelViewer(backgroundColor, gridColor);

  return (
    <section className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-x-0 bottom top-[50px] h-[calc(100%-50px)] w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      <CoordinateFinder currentMousePos={currentMousePos} animateJumpToCell={animateJumpToCell} />
      <ColorPalette selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
    </section>
  );
};

export { PixelViewer };
