export type DisplayNameValidationResult =
  | {
      ok: true;
      value: string;
      normalized: string;
    }
  | {
      ok: false;
      reason: "length" | "characters";
    };

const controlCharacterPattern = /[\u0000-\u001f\u007f]/;

export function validateDisplayName(input: string): DisplayNameValidationResult {
  const value = input.trim();

  if (value.length < 3 || value.length > 40) {
    return {
      ok: false,
      reason: "length",
    };
  }

  if (controlCharacterPattern.test(value)) {
    return {
      ok: false,
      reason: "characters",
    };
  }

  return {
    ok: true,
    value,
    normalized: value.toLowerCase(),
  };
}
