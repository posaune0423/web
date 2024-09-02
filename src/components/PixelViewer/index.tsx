import React from "react";
import { usePixelViewer } from "./hooks/usePixelViewer";
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
    animateJumpToCell,
  } = usePixelViewer();

  return (
    <section className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-x-0 bottom top-[50px] h-[calc(100%-50px)] w-full"
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
