import { useCallback, useState } from "react";
import { COLOR_PALETTE } from "@/constants/webgl";
import { type Color } from "@/types";
import { rgbaToHex, cn } from "@/utils";
import { Palette } from "lucide-react";

export const ColorPalette = ({
  selectedColor,
  setSelectedColor,
}: {
  selectedColor: Color;
  setSelectedColor: (color: Color) => void;
}) => {
  const [customColors, setCustomColors] = useState<Color[]>([]);
  const [pickedColor, setPickedColor] = useState<Color | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const toggleOpen = () => setIsOpen((prev) => !prev);

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
    <div
      className={cn(
        "bg-slate-900 fixed mx-auto bottom-1 left-0 right-0 flex items-center justify-center shadow-md transition-all duration-300 ease-in-out rounded-full",
        isOpen ? "max-w-[340px] px-4 h-[50px]" : "w-12 h-12 rounded-full cursor-pointer hover:bg-slate-800",
      )}
      onClick={isOpen ? undefined : () => setIsOpen(true)}
    >
      <div
        className={cn(
          "items-center h-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 transition-opacity duration-300",
          "overscroll-behavior-x: contain hover:overflow-x-scroll",
          isOpen ? "flex opacity-100 w-[calc(100%-40px)]" : "hidden opacity-0",
        )}
      >
        <div className="flex items-center space-x-2 h-full flex-grow">
          {[...customColors, ...COLOR_PALETTE].map((color, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-8 h-8 rounded-full ${
                selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""
              }`}
              style={{
                backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`,
              }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-1">
        <label
          className={cn(
            "min-w-8 min-h-8 rounded-full bg-white text-black flex items-center justify-center font-bold relative cursor-pointer",
            !isOpen && "hidden",
          )}
        >
          <input
            type="color"
            onChange={handleColorPickerChange}
            className="opacity-0 absolute bottom-[10px] right-0 left-0 w-full h-full z-10"
          />
          {pickedColor ? (
            <button className="w-8 h-8 rounded-full bg-white z-20" onClick={onSelectColor}>
              👍
            </button>
          ) : (
            <span className="z-20">+</span>
          )}
        </label>

        <Palette
          className="min-w-8 min-h-8 flex items-center justify-center relative cursor-pointer transition-transform duration-800 ease-in-out"
          onClick={toggleOpen}
        />
      </div>
    </div>
  );
};
