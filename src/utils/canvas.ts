export const convertClientPosToCanvasPos = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  clientX: number,
  clientY: number
) => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return { x, y };
};
