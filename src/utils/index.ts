import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Color } from "@/types";
import { shortString } from "starknet";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const truncateAddress = (address: string) => {
  const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
  const match = address.match(truncateRegex);
  if (!match || match.length < 3) return address;
  const part1 = match[1] || "";
  const part2 = match[2] || "";
  return `0x${part1}…${part2}`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${
    dateObj
      .getDate()
      .toString()
      .padStart(2, "0")
  }:${dateObj.getHours().toString().padStart(2, "0")}:${
    dateObj
      .getMinutes()
      .toString()
      .padStart(2, "0")
  }`;
};

export const rgbaToHex = (color: Color): number => {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 255);
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0; // Convert to unsigned 32-bit integer
};

export const hexToRgba = (hex: number): Color => {
  const r = ((hex >>> 24) & 0xff) / 255;
  const g = ((hex >>> 16) & 0xff) / 255;
  const b = ((hex >>> 8) & 0xff) / 255;
  const a = (hex & 0xff) / 255;
  return { r, g, b, a };
};

export const handleTransactionError = (error: unknown) => {
  let errorMessage = "An unexpected error occurred. Please try again.";

  if (error instanceof Error) {
    const result = error.message.match(/\('([^']+)'\)/)?.[1];
    if (result) {
      errorMessage = result;
    }
  }

  return errorMessage;
};

export const felt252ToString = (felt252: string | number | bigint) => {
  if (typeof felt252 === "bigint" || typeof felt252 === "object") {
    felt252 = `0x${felt252.toString(16)}`;
  }
  if (felt252 === "0x0" || felt252 === "0") return "";
  if (typeof felt252 === "string") {
    try {
      return shortString.decodeShortString(felt252);
    } catch (e) {
      console.error("Error decoding short string:", e);
      return felt252;
    }
  }
  return felt252.toString();
};

export const felt252ToUnicode = (felt252: string | number) => {
  const string = felt252ToString(felt252);

  if (string.includes("U+")) {
    const cleanString = string.replace(/\0/g, "").replace(/\s+/g, "");
    const text = cleanString.replace("U+", "");
    const codePoint = parseInt(text, 16);

    if (!isNaN(codePoint)) {
      return String.fromCodePoint(codePoint);
    }
  }

  return string;
};
