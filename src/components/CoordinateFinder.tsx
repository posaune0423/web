const CoordinateFinder = ({
  currentMousePos,
  animateJumpToCell,
}: {
  currentMousePos: { x: number; y: number };
  animateJumpToCell: (x: number, y: number) => void;
}) => {
  return (
    <div className="fixed top-[60px] right-4 p-2 lg:p-3 rounded-lg bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm shadow-lg">
      <div className="flex items-center space-x-2">
        <label
          htmlFor="x"
          className="flex items-center text-white lg:font-semibold text-xs lg:text-base h-full"
        >
          X:
          <input
            type="number"
            id="x"
            value={currentMousePos?.x ?? 0}
            className="rounded-md focus:outline-none focus:border-slate-900 p-1 ml-1 bg-transparent w-fit max-w-[5ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) =>
              animateJumpToCell(Number(e.target.value) || 0, currentMousePos?.y ?? 0)
            }
          />
        </label>
        <label
          htmlFor="y"
          className="flex items-center text-white lg:font-semibold text-xs lg:text-base h-full"
        >
          Y:
          <input
            type="number"
            id="y"
            value={currentMousePos?.y ?? 0}
            className="rounded-md focus:outline-none focus:border-slate-900 p-1 ml-1 bg-transparent w-fit max-w-[5ch] appearance-none border border-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(e) =>
              animateJumpToCell(currentMousePos?.x ?? 0, Number(e.target.value) || 0)
            }
          />
        </label>
      </div>
    </div>
  );
};

export { CoordinateFinder };
