import React from "react";
import { usePixelViewer } from "./usePixelViewer";
import { CoordinateFinder } from "../CoordinateFinder";
import { ColorPalette } from "../ColorPallette";
import { CanvasGrid } from "@/components/CanvasGrid";

const PixelViewer: React.FC = () => {
  const {
    canvasRef,
    currentMousePos,
    selectedColor,
    setSelectedColor,
    onCellClick,
    animateJumpToCell,
    setCurrentMousePos,
    onDrawGrid,
    onPan,
    setGridState,
  } = usePixelViewer();

  return (
    <section className="relative h-full w-full">
      <CanvasGrid
        canvasRef={canvasRef}
        className="fixed inset-x-0 bottom top-[50px] h-[calc(100%-50px)] w-full bg-black/80"
        onCellClick={onCellClick}
        onSwipe={onPan}
        onPan={onPan}
        onDrawGrid={onDrawGrid}
        onGridStateChange={setGridState}
        setCurrentMousePos={setCurrentMousePos}
      />
      <CoordinateFinder currentMousePos={currentMousePos} animateJumpToCell={animateJumpToCell} />
      <ColorPalette selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
    </section>
  );
};

export { PixelViewer };
