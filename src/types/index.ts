export type App = {
  system: string;
  name: string;
  manifest: string;
  icon: string;
  action: string;
};

export interface GridState {
  offsetX: number;
  offsetY: number;
  scale: number;
  lastPinchDist?: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export interface GridAction {
  type: "add" | "remove";
  pixel: Pixel;
}

export interface GridHistory {
  past: Pixel[][];
  present: Pixel[];
  future: Pixel[][];
}
