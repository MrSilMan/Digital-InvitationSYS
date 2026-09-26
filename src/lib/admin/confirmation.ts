/**
 * Deleting an event or an account is confirmed by typing what identifies it: the event's address
 * (its slug, exactly) or the account's e-mail (in any case). The dialog enables its button with
 * these, and the server checks them again before anything is deleted.
 */

export const CONFIRMATION_MAX_LENGTH = 320;

export function confirmsEvent(typed: string, slug: string): boolean {
  return typed.trim() === slug;
}

export function confirmsAccount(typed: string, email: string): boolean {
  return typed.trim().toLocaleLowerCase('en') === email.toLocaleLowerCase('en');
}
