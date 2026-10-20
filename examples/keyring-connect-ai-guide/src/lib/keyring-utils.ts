import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { KeyringCredentialStatus } from "./keyring-types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function deriveKeyringCredentialStatus(
  entityExp: bigint
): KeyringCredentialStatus {
  if (entityExp === 0n) return { state: "keyring:none" };
  const expDate = new Date(Number(entityExp) * 1000);
  if (expDate > new Date())
    return { state: "keyring:valid", expiresAt: expDate };
  return { state: "keyring:expired", expiredAt: expDate };
}
