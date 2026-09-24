/**
 * The server's current time for a request (countdowns, deadlines). One place to read the clock
 * keeps rendering code free of direct `new Date()` calls and gives tests a single seam.
 */
export function serverNow(): Date {
  return new Date();
}
