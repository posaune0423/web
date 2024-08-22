import { COLOR_PALETTE } from "./PixelViewer/const";
import { Color } from "./PixelViewer/types";

const ColorPalette = ({
  selectedColor,
  setSelectedColor,
}: {
  selectedColor: Color;
  setSelectedColor: (color: Color) => void;
}) => {
  return (
    <div className="px-4 bg-slate-900 max-w-fit fixed mx-auto bottom-1 left-0 right-0 flex h-[50px] items-center justify-center shadow-md">
      <div className="flex items-center space-x-2 h-full w-full">
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
  );
};

export { ColorPalette };
