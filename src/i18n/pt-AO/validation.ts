/** Validation messages. Its own module: the guest's RSVP form schema ships to the browser. */
export const validation = {
  phone: {
    invalid: 'Introduza um número de telemóvel angolano válido (ex.: 923 456 789).',
    invalidGuest:
      'Introduza um telemóvel angolano (ex.: 923 456 789) ou um número estrangeiro com o indicativo (ex.: +351 912 345 678).',
  },
  rsvp: {
    attendingRequired: 'Indique se vai estar presente.',
    /** {max} = the guest's seats. */
    peopleRange: 'Escolha entre 1 e {max} pessoas.',
    nameTooLong: 'Use no máximo 80 caracteres.',
    messageTooLong: 'A mensagem pode ter até 500 caracteres.',
  },
} as const;
