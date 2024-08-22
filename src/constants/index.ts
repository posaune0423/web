export const ZERO_ADDRESS = "0x0";
export const NAMESPACE = "pixelaw";
export const queryKeys = {
  getPixels: (upperLeftX: number, upperLeftY: number, lowerRightX: number, lowerRightY: number) => [
    "getPixels",
    upperLeftX,
    upperLeftY,
    lowerRightX,
    lowerRightY,
  ],
};

export const sounds = {
  placeColor: "/assets/sounds/effects/place_color.mp3",
  success: "/assets/sounds/effects/success.mp3",
  error: "/assets/sounds/effects/error.mp3",
};
