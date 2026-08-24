import { NextResponse } from "next/server";
import { KeyringError } from "./keyring";

/** Pass a Keyring failure through with its status and code intact. */
export const asResponse = (error: unknown) => {
  if (error instanceof KeyringError) {
    return NextResponse.json(
      { detail: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json({ detail: "Something went wrong" }, { status: 500 });
};
