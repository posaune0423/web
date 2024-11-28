import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { BASE_CELL_SIZE, COLOR_PALETTE } from "../constants/webgl.ts";
import { type Color } from "../types/index.ts";
import { useDojo } from "../hooks/useDojo.ts";
import { rgbaToHex } from "../utils/index.ts";
import { useSound } from "use-sound";
import { sounds } from "../constants/index.ts";
import { usePixels } from "../hooks/usePixels.ts";
import { useGridState } from "../hooks/useGridState.ts";
import { useWebGL } from "../hooks/useWebGL.ts";
import { CoordinateFinder } from "../components/CoordinateFinder.tsx";
import { ColorPalette } from "../components/ColorPallette.tsx";
import { CanvasGrid } from "../components/CanvasGrid.tsx";
import { useHaptic } from "use-haptic";
// import { useApp } from "@/hooks/useApp";
// import { Direction } from "@/libs/dojo/typescript/models.gen";
import { SDK } from "@dojoengine/sdk";
import { type PixelawSchemaType } from "../libs/dojo/typescript/models.gen.ts";
import { useSystemCalls } from "../hooks/useSystemCalls.ts";

type PixelViewerProps = {
  sdk: SDK<PixelawSchemaType>;
};

export const PixelViewer: React.FC<PixelViewerProps> = ({ sdk }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [selectedColor, setSelectedColor] = useState<Color>(COLOR_PALETTE[0]);
  const [currentMousePos, setCurrentMousePos] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // Other Hooks
  const {
    setup: {
      account: { account },
      connectedAccount,
    },
  } = useDojo();
  const { vibe } = useHaptic();

  const { gridState, setGridState } = useGridState();
  const { drawPixels } = useWebGL(canvasRef, gridState);
  const { optimisticPixels, setOptimisticPixels, throttledFetchPixels } = usePixels(canvasRef, gridState, sdk);
  const activeAccount = useMemo(() => connectedAccount || account, [connectedAccount, account]);
  // const { currentApp } = useApp();
  const { interact } = useSystemCalls();

  const [play] = useSound(sounds.placeColor, { volume: 0.5 });

  // Handlers
  const onCellClick = useCallback(
    (x: number, y: number) => {
      startTransition(async () => {
        setOptimisticPixels({ x, y, color: selectedColor });
        play();
        vibe();
        await interact(activeAccount, {
          player_override: 1n,
          system_override: 1n,
          area_hint: 1,
          position: { x, y },
          color: rgbaToHex(selectedColor),
        });
      });
    },
    [
      // currentApp,
      selectedColor,
      activeAccount,
      interact,
      setOptimisticPixels,
      play,
      vibe,
    ],
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
    [throttledFetchPixels],
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
    [gridState, setGridState, setCurrentMousePos],
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
