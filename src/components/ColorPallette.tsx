import { useCallback, useState } from "react";
import { COLOR_PALETTE } from "@/components/PixelViewer/const";
import { type Color } from "@/types";
import { rgbaToHex } from "@/utils";

const ColorPalette = ({
  selectedColor,
  setSelectedColor,
}: {
  selectedColor: Color;
  setSelectedColor: (color: Color) => void;
}) => {
  const [customColors, setCustomColors] = useState<Color[]>([]);
  const [pickedColor, setPickedColor] = useState<Color | null>(null);

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const newColor: Color = { r, g, b, a: 1 };
    setPickedColor(newColor);
  }, []);

  const onSelectColor = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!pickedColor) return;

      console.log("pickedColor", pickedColor);
      console.log(
        "hex",
        rgbaToHex({
          r: pickedColor.r,
          g: pickedColor.g,
          b: pickedColor.b,
          a: pickedColor.a,
        }),
      );
      setSelectedColor(pickedColor);
      setCustomColors([...customColors, pickedColor]);
      setPickedColor(null);
    },
    [pickedColor, customColors, setSelectedColor],
  );

  return (
    <div className="px-4 bg-slate-900 max-w-fit fixed mx-auto bottom-1 left-0 right-0 flex h-[50px] items-center justify-center shadow-md">
      <div className="flex items-center space-x-2 h-full w-full">
        {[...COLOR_PALETTE, ...customColors].map((color, index) => (
          <button
            key={index}
            className={`size-8 rounded-full ${
              selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""
            }`}
            style={{
              backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${
                color.a
              })`,
            }}
            onClick={() => setSelectedColor(color)}
          />
        ))}

        <label className="size-8 rounded-full bg-white text-black flex items-center justify-center font-bold relative cursor-pointer">
          <input
            type="color"
            onChange={handleColorPickerChange}
            className="opacity-0 absolute bottom-[10px] right-0 left-0 w-full h-full z-10"
          />
          {pickedColor ? (
            <button className="size-8 rounded-full bg-white z-20" onClick={onSelectColor}>
              👍
            </button>
          ) : (
            <span className="z-20">+</span>
          )}
        </label>
      </div>
    </div>
  );
};

export { ColorPalette };
