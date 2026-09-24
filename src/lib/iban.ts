/**
 * IBANs as couples type them (spaces, lower case) and as guests read them (groups of four).
 * Validation is the ISO 13616 check (mod 97) for any country; Angolan IBANs have 25 characters.
 */

const IBAN_SHAPE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

/** Upper case, without spaces or dashes: "AO06004400000123456789101". */
export function compactIban(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/** Groups of four for display: "AO06 0044 0000 0123 4567 8910 1". */
export function formatIban(value: string): string {
  return compactIban(value).replace(/(.{4})(?=.)/g, '$1 ');
}

export function isValidIban(value: string): boolean {
  const iban = compactIban(value);
  if (!IBAN_SHAPE.test(iban)) return false;
  if (iban.startsWith('AO') && iban.length !== 25) return false;
  // Move the first four characters to the end, turn letters into numbers (A = 10 … Z = 35) and
  // compute the remainder piece by piece (the number is far too big for a double).
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const character of rearranged) {
    const digits = /\d/.test(character) ? character : String(character.charCodeAt(0) - 55);
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
