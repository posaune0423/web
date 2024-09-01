import fsSource from "@/libs/webgl/shaders/main.fs";
import vsSource from "@/libs/webgl/shaders/main.vs";
import { ProgramInfo } from "@/types";

const loadShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Unable to create shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

export const initShaderProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    return null;
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
};

export const createProgramInfo = (gl: WebGLRenderingContext): ProgramInfo => {
  const shaderProgram = initShaderProgram(gl);
  if (!shaderProgram) {
    throw new Error("Unable to initialize the shader program");
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      position: gl.getAttribLocation(shaderProgram, "aPosition"),
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(shaderProgram, "uResolution"),
      offset: gl.getUniformLocation(shaderProgram, "uOffset"),
      scale: gl.getUniformLocation(shaderProgram, "uScale"),
      color: gl.getUniformLocation(shaderProgram, "uColor"),
      lineWidth: gl.getUniformLocation(shaderProgram, "uLineWidth"), //
    },
  };

  return programInfo;
};
