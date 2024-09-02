// const black = "\u001b[30m";
const red = "\u001b[31m";
const green = "\u001b[32m";
const yellow = "\u001b[33m";
const blue = "\u001b[34m";
const magenta = "\u001b[35m";
const cyan = "\u001b[36m";
const white = "\u001b[37m";

const reset = "\u001b[0m";

export const consoleRed = (text: string) => {
  console.log(red + text + reset);
};

export const consoleGreen = (text: string) => {
  console.log(green + text + reset);
};

export const consoleYellow = (text: string) => {
  console.log(yellow + text + reset);
};

export const consoleBlue = (text: string) => {
  console.log(blue + text + reset);
};

export const consoleMagenta = (text: string) => {
  console.log(magenta + text + reset);
};

export const consoleCyan = (text: string) => {
  console.log(cyan + text + reset);
};

export const consoleWhite = (text: string) => {
  console.log(white + text + reset);
};
