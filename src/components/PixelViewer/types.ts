export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GridDimensions {
  width: number;
  height: number;
}

export interface GridState {
  offsetX: number;
  offsetY: number;
  scale: number;
  lastPinchDist?: number;
}

export interface ProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    position: number;
  };
  uniformLocations: {
    resolution: WebGLUniformLocation | null;
    offset: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    lineWidth: WebGLUniformLocation | null;
  };
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
