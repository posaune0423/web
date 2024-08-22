import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Color } from "@/components/PixelViewer/types";
import { getComponentValue } from "@dojoengine/recs";
import { App } from "@/types";
import { shortString } from "starknet";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const truncateAddress = (address: string, withPrefix?: boolean) => {
  const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
  const match = address.match(truncateRegex);
  if (!match || match.length < 3) return address;
  const part1 = match[1] || "";
  const part2 = match[2] || "";
  return `${withPrefix ? "0x" : ""}${part1}…${part2}`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj
    .getDate()
    .toString()
    .padStart(2, "0")}:${dateObj.getHours().toString().padStart(2, "0")}:${dateObj
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export const rgbaToHex = (color: Color): number => {
  const r = Math.round(color.r * 0x1000000);
  const g = Math.round(color.g * 0x10000);
  const b = Math.round(color.b * 0x100);
  const a = Math.round(color.a);
  return r + g + b + a;
};

export const hexToRgba = (hex: number): Color => {
  const r = (hex >> 24) & 0xff;
  const g = (hex >> 16) & 0xff;
  const b = (hex >> 8) & 0xff;
  const a = hex & 0xff;

  return { r, g, b, a };
};

export const handleTransactionError = (error: unknown) => {
  console.error("Transaction error:", error);

  let errorMessage = "An unexpected error occurred. Please try again.";

  if (error instanceof Error) {
    if (error.message.includes("Cooldown not over")) {
      errorMessage = "Cooldown period is not over. Please wait and try again later.";
    } else if (error.message.includes("transaction reverted")) {
      errorMessage = "Transaction was reverted.";
    } else if (error.message.includes("Error in the called contract")) {
      errorMessage = "An error occurred while calling the contract.";
    } else if (error.message.includes("execution_error")) {
      errorMessage = "An error occurred during the transaction execution.";
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
    const text = string.replace("U+", "");
    const codePoint = Number.parseInt(text, 16);
    return String.fromCodePoint(codePoint);
  }
  return string;
};

export const fromComponent = (appComponent: ReturnType<typeof getComponentValue>): App | undefined => {
  if (!appComponent) return undefined;
  console.log(appComponent);
  return {
    name: shortString.decodeShortString(appComponent.name),
    icon: felt252ToUnicode(appComponent.icon),
    action: shortString.decodeShortString(appComponent.action),
    system: appComponent.system,
    manifest: appComponent.manifest,
  };
};
