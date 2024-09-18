import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { COLOR_PALETTE, BASE_CELL_SIZE } from "@/constants/webgl";
import { type Color } from "@/types";
import { useDojo } from "@/hooks/useDojo";
import { rgbaToHex } from "@/utils";
import { useSound } from "use-sound";
import { sounds } from "@/constants";
import { usePixels } from "@/hooks/usePixels";
import { useGridState } from "@/hooks/useGridState";
import { useWebGL } from "@/hooks/useWebGL";
import { CoordinateFinder } from "@/components/CoordinateFinder";
import { ColorPalette } from "@/components/ColorPallette";
import { CanvasGrid } from "@/components/CanvasGrid";

export const PixelViewer: React.FC = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [selectedColor, setSelectedColor] = useState<Color>(COLOR_PALETTE[0]);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Other Hooks
  const {
    setup: {
      systemCalls: { interact },
      account: { account },
      connectedAccount,
    },
  } = useDojo();

  const { gridState, setGridState } = useGridState();
  const { drawPixels } = useWebGL(canvasRef, gridState);
  const { optimisticPixels, setOptimisticPixels, throttledFetchPixels } = usePixels(canvasRef, gridState);
  const activeAccount = useMemo(() => connectedAccount || account, [connectedAccount, account]);

  const [play] = useSound(sounds.placeColor, { volume: 0.5 });

  // Handlers
  const onCellClick = useCallback(
    async (x: number, y: number) => {
      startTransition(async () => {
        setOptimisticPixels({ x, y, color: selectedColor });
        play();
        await interact(activeAccount, { x, y, color: rgbaToHex(selectedColor) });
      });
    },
    [selectedColor, activeAccount, interact, setOptimisticPixels, play]
  );

  const onDrawGrid = useCallback(() => {
    drawPixels(optimisticPixels);
  }, [optimisticPixels, drawPixels]);

  const onPan = useCallback(
    (dx: number, dy: number) => {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        throttledFetchPixels();
      }
    },
    [throttledFetchPixels]
  );

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
    [gridState, setGridState, setCurrentMousePos]
  );

  return (
    <section className="relative h-full w-full">
      <CanvasGrid
        canvasRef={canvasRef}
        className="fixed inset-x-0 bottom top-[50px] h-[calc(100%-50px)] w-full bg-black/80"
        onCellClick={onCellClick}
        onSwipe={onPan}
        onPan={onPan}
        // onTap={onCellClick} // NOTE: somehow tap and mouseup events are called duplicated
        onDrawGrid={onDrawGrid}
        setCurrentMousePos={setCurrentMousePos}
        gridState={gridState}
        setGridState={setGridState}
      />
      <CoordinateFinder currentMousePos={currentMousePos} animateJumpToCell={animateJumpToCell} />
      <ColorPalette selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
    </section>
  );
};
