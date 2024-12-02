import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

const CoordinateFinder = ({
  currentMousePos,
  animateJumpToCell,
}: {
  currentMousePos: { x: number; y: number };
  animateJumpToCell: (x: number, y: number) => void;
}) => {
  const [localPos, setLocalPos] = useState(currentMousePos);

  useEffect(() => {
    setLocalPos(currentMousePos);
  }, [currentMousePos]);

  const debouncedAnimateJumpToCell = useDebouncedCallback((x: number, y: number) => {
    animateJumpToCell(x, y);
  }, 180);

  const handleInputChange = (axis: "x" | "y", value: number) => {
    setLocalPos((prev) => ({ ...prev, [axis]: value }));
    debouncedAnimateJumpToCell(axis === "x" ? value : localPos.x, axis === "y" ? value : localPos.y);
  };

  return (
    <div className="fixed top-[60px] right-4 p-2 lg:p-3 rounded-lg bg-linear-to-br from-white/50 to-white/30 backdrop-blur-xs shadow-lg">
      <div className="flex items-center space-x-2">
        <label htmlFor="x" className="flex items-center text-white lg:font-semibold text-xs lg:text-base h-full">
          X:
          <input
            type="number"
            id="x"
            value={localPos.x}
            className="text-xs rounded-md focus:outline-hidden focus:border-slate-900 p-1 ml-1 bg-transparent w-fit max-w-[6ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) => handleInputChange("x", Number(e.target.value) || 0)}
          />
        </label>
        <label htmlFor="y" className="flex items-center text-white lg:font-semibold text-xs lg:text-base h-full">
          Y:
          <input
            type="number"
            id="y"
            value={localPos.y}
            className="text-xs rounded-md focus:outline-hidden focus:border-slate-900 p-1 ml-1 bg-transparent w-fit max-w-[6ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) => handleInputChange("y", Number(e.target.value) || 0)}
          />
        </label>
      </div>
    </div>
  );
};

export { CoordinateFinder };
