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
