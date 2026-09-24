import { invitation, invitationDefaults } from './pt-AO';

/** Portuguese plural: "1 pessoa", "2 pessoas" (0 takes the plural too). */
export function formatCount(count: number, forms: { one: string; other: string }): string {
  return `${count} ${count === 1 ? forms.one : forms.other}`;
}

/** The info box text, e.g. "Convite válido para 2 pessoas". */
export function formatSeatsNote(
  seats: number,
  template: string = invitationDefaults.infoBoxText,
): string {
  return template.replaceAll('{seats}', formatCount(seats, invitation.people));
}
