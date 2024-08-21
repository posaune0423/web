import React from "react";
import { COLOR_PALETTE, DEFAULT_BACKGROUND_COLOR, DEFAULT_GRID_COLOR } from "./const";
import { usePixelViewer } from "./hooks";
import { type Color } from "./types";

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
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-x-0 bottom top-[50px]"
        style={{ width: "100%", height: "calc(100% - 50px)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="fixed bottom-[10px] right-4 p-3 rounded-lg bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm shadow-lg">
        <div className="flex items-center space-x-2">
          <label htmlFor="x" className="flex items-center text-white font-semibold">
            X:
            <input
              type="number"
              value={currentMousePos?.x ?? 0}
              className="p-1 rounded ml-1 bg-transparent w-fit max-w-[4ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              onChange={(e) => animateJumpToCell(Number(e.target.value) || 0, currentMousePos?.y ?? 0)}
            />
          </label>
          <label htmlFor="y" className="flex items-center text-white font-semibold">
            Y:
            <input
              type="number"
              value={currentMousePos?.y ?? 0}
              className="rounded p-1 ml-1 bg-transparent w-fit max-w-[4ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              onChange={(e) => animateJumpToCell(currentMousePos?.x ?? 0, Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </div>
      <div className="rounded-md px-4 bg-slate-900 max-w-fit fixed mx-auto bottom-1 left-0 right-0 flex h-[50px] items-center justify-center space-x-8 shadow-md">
        <div className="flex items-center space-x-2">
          {COLOR_PALETTE.map((color, index) => (
            <button
              key={index}
              className={`size-8 rounded-full ${selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""}`}
              style={{
                backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`,
              }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { PixelViewer };
