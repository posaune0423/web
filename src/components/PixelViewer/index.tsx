import React from "react";
import { usePixelViewer } from "./usePixelViewer";
import { type Color } from "@/types";
import { CoordinateFinder } from "../CoordinateFinder";
import { ColorPalette } from "../ColorPallette";

interface PixelViewerProps {
  backgroundColor?: Color;
  gridColor?: Color;
}

const PixelViewer: React.FC<PixelViewerProps> = () => {
  const {
    canvasRef,
    currentMousePos,
    selectedColor,
    setSelectedColor,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    animateJumpToCell,
  } = usePixelViewer();

  return (
    <section className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-x-0 bottom top-[50px] h-[calc(100%-50px)] w-full bg-black/80"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={(e) => {
          console.log("scroll", e);
        }}
      />
      <CoordinateFinder currentMousePos={currentMousePos} animateJumpToCell={animateJumpToCell} />
      <ColorPalette selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
    </section>
  );
};

export { PixelViewer };
