

export interface GridDimensions {
  width: number;
  height: number;
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
