import type { RsvpSource, WhatsAppTarget } from '@/generated/prisma/enums';

/**
 * Demo content mirroring the reference invitation (docs/reference/): Braúlio & Nanda, beach
 * ceremony at 16h00 and copo-d'água at a salão de festas at 20h00.
 *
 * - The date is in the future (Friday 15 January 2027) so the countdown has something to count.
 * - Every other name is fictional (not copied from the reference screenshots).
 * - Phone numbers use the unassigned +244 900 000 xxx range: no demo link reaches a real person.
 * - Guest tokens are fixed and readable so demo links stay stable across re-seeds; real tokens
 *   are random (src/lib/guest-token.ts). The seed refuses to run in production.
 */

/** A wall-clock time in Luanda (UTC+1, no daylight saving) as a UTC Date. */
export function luanda(localDateTime: string): Date {
  return new Date(`${localDateTime}:00+01:00`);
}

export const DEMO_USERS = {
  couple: { name: 'Braúlio & Nanda', email: 'noivos@convites.test', role: 'couple' },
  admin: { name: 'Administrador', email: 'admin@convites.test', role: 'admin' },
} as const;

export const DEMO_PASSWORDS = {
  couple: 'noivos-demo-2027',
  admin: 'admin-demo-2027',
} as const;

export const DEMO_EVENT = {
  slug: 'braulio-e-nanda',
  phase: 'INVITATION',
  themeId: 'praia-rosa',
  monogram: 'BN',
  groomName: 'Braúlio',
  brideName: 'Nanda',
  groomParents: ['Augusto Santos', 'Celeste Santos'],
  brideParents: ['Domingos Cassoma', 'Fernanda Cassoma'],
  startsAt: luanda('2027-01-15T16:00'),
  endsAt: luanda('2027-01-16T01:00'),
  coupleMessage:
    'O amor é um presente de Deus,\ne Ele nos uniu para sempre.\n\n' +
    'Venha testemunhar esta promessa eterna e celebrar connosco o dia em que nos tornamos um só diante do Senhor.',
  dressCodeText: 'Traje social. Pedimos que evitem o branco, a cor reservada à noiva.',
  dressCodeColors: ['#A8C5D6', '#E7B7C3', '#857D45', '#F3E9DC'],
  giftText:
    'A vossa presença é o nosso maior presente. Se desejarem contribuir para a nossa nova etapa, deixamos o IBAN abaixo.',
  giftIban: 'AO33 0000 0000 0000 0000 0000 0',
  giftAccountHolder: 'Braúlio Santos',
  rsvpMode: 'BOTH',
  rsvpDeadline: luanda('2026-12-31T23:59'),
  groomWhatsapp: '+244900000001',
  brideWhatsapp: '+244900000002',
  guestLimit: 150,
} as const;

export const DEMO_LOCATIONS = [
  {
    // Written in normal case: the small-caps font draws "As cerimónias" like the reference.
    heading: 'As cerimónias',
    venueName: 'Praia do Bispo',
    startsAt: luanda('2027-01-15T16:00'),
    address: 'Praia do Bispo, Luanda',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8290,13.2250',
    latitude: -8.829,
    longitude: 13.225,
  },
  {
    heading: "Copo-d'água",
    venueName: 'Salão de Festas Jardim das Rosas',
    // Like the reference; the default sentence ("Terão lugar na…") suits the first venue.
    description: 'Será realizado às {time}, no {venue}, Morro Bento.',
    startsAt: luanda('2027-01-15T20:00'),
    address: 'Morro Bento, Luanda',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8960,13.1900',
    latitude: -8.896,
    longitude: 13.19,
  },
] as const;

/**
 * Placeholder media shipped in public/demo (npm run demo:media): six gallery "photos" and a short
 * synthesized music loop. `demo/…` keys resolve to /public (src/server/media/urls.ts).
 */
export const DEMO_GALLERY = Array.from({ length: 6 }, (_, index) => ({
  key: `demo/gallery/foto-${index + 1}.webp`,
  mimeType: 'image/webp',
  width: 1200,
  height: 1500,
}));

export const DEMO_MUSIC = { key: 'demo/musica.wav', mimeType: 'audio/wav' } as const;

/** The same wedding in the Save the Date phase, to see that page (only a few guests). */
export const DEMO_SAVE_THE_DATE = {
  slug: 'braulio-e-nanda-save-the-date',
  guests: [
    { token: 'demo-std-familia-silva1', displayName: 'Família Silva', seatsAllowed: 4 },
    { token: 'demo-std-joao-manuel-02', displayName: 'João Manuel', seatsAllowed: 1 },
  ],
} as const;

/** The same wedding in the "Champanhe" theme, with every section (only a few guests). */
export const DEMO_CHAMPANHE = {
  slug: 'braulio-e-nanda-champanhe',
  themeId: 'champanhe',
  // Warm tones that suit the theme (ivory is left out: it is too close to the bride's white).
  dressCodeColors: ['#D8C3A5', '#B08D57', '#8A9A80', '#5E5247'],
  guests: [
    { token: 'demo-champanhe-silva-01', displayName: 'Família Silva', seatsAllowed: 4 },
    { token: 'demo-champanhe-joao-002', displayName: 'João Manuel', seatsAllowed: 1 },
  ],
} as const;

export const DEMO_TIMELINE = [
  { label: 'Chegada dos convidados', startsAt: luanda('2027-01-15T15:30'), icon: 'guests' },
  { label: 'Chegada dos noivos', startsAt: luanda('2027-01-15T16:00'), icon: 'bride-groom' },
  { label: 'Sessão de fotos', startsAt: luanda('2027-01-15T17:00'), icon: 'camera-heart' },
  { label: 'Abertura do buffet', startsAt: luanda('2027-01-15T20:00'), icon: 'buffet' },
  { label: 'Corte do bolo', startsAt: luanda('2027-01-15T21:30'), icon: 'cake' },
  { label: 'Abertura da pista', startsAt: luanda('2027-01-15T22:00'), icon: 'dance' },
  { label: 'Entrega do bouquet', startsAt: luanda('2027-01-15T23:30'), icon: 'bouquet' },
] as const;

export interface DemoRsvp {
  source: RsvpSource;
  attending: boolean | null;
  peopleCount?: number;
  companionNames?: string[];
  message?: string;
  whatsappIntent?: { at: Date; target: WhatsAppTarget };
}

export interface DemoGuest {
  token: string;
  displayName: string;
  phone: string | null;
  seatsAllowed: number;
  groupTag: string;
  views: Date[];
  rsvp: DemoRsvp | null;
}

/** Every dashboard state: confirmed, declined, WhatsApp tap only, opened only, not opened. */
export const DEMO_GUESTS: readonly DemoGuest[] = [
  {
    token: 'demo-familia-silva-001',
    displayName: 'Família Silva',
    phone: '+244900000101',
    seatsAllowed: 4,
    groupTag: 'Família da noiva',
    views: [new Date('2026-09-18T09:12:00Z'), new Date('2026-09-20T18:40:00Z')],
    rsvp: {
      source: 'FORM',
      attending: true,
      peopleCount: 4,
      companionNames: ['Maria Silva', 'João Silva', 'Ana Silva'],
      message: 'Estaremos lá, com muito carinho!',
    },
  },
  {
    token: 'demo-ana-e-pedro-00002',
    displayName: 'Ana e Pedro',
    phone: '+244900000102',
    seatsAllowed: 2,
    groupTag: 'Amigos',
    views: [new Date('2026-09-19T21:05:00Z')],
    rsvp: { source: 'FORM', attending: true, peopleCount: 2, companionNames: ['Pedro Gomes'] },
  },
  {
    token: 'demo-familia-neto-0003',
    displayName: 'Família Neto',
    phone: '+244900000103',
    seatsAllowed: 5,
    groupTag: 'Família do noivo',
    views: [new Date('2026-09-20T12:30:00Z')],
    rsvp: {
      source: 'WHATSAPP_CLICK',
      attending: null,
      whatsappIntent: { at: new Date('2026-09-20T12:33:00Z'), target: 'GROOM' },
    },
  },
  {
    token: 'demo-luisa-ferreira-04',
    displayName: 'Dra. Luísa Ferreira',
    phone: '+244900000104',
    seatsAllowed: 1,
    groupTag: 'Colegas',
    views: [new Date('2026-09-21T08:00:00Z')],
    rsvp: {
      source: 'FORM',
      attending: false,
      peopleCount: 0,
      message: 'Infelizmente não poderei estar presente. Desejo-vos muitas felicidades!',
    },
  },
  {
    token: 'demo-joao-manuel-00005',
    displayName: 'João Manuel',
    phone: '+244900000105',
    seatsAllowed: 1,
    groupTag: 'Amigos',
    views: [
      new Date('2026-09-18T19:20:00Z'),
      new Date('2026-09-21T13:45:00Z'),
      new Date('2026-09-22T22:10:00Z'),
    ],
    rsvp: null,
  },
  {
    token: 'demo-familia-cassule06',
    displayName: 'Família Cassule',
    phone: '+244900000106',
    seatsAllowed: 3,
    groupTag: 'Família da noiva',
    views: [],
    rsvp: null,
  },
  {
    token: 'demo-tios-alberto-rosa',
    displayName: 'Tio Alberto e Tia Rosa',
    phone: '+244900000107',
    seatsAllowed: 2,
    groupTag: 'Família do noivo',
    views: [new Date('2026-09-22T10:00:00Z')],
    rsvp: {
      source: 'FORM',
      attending: true,
      peopleCount: 1,
      message: 'O tio Alberto vai; a tia Rosa fica com os netos. Parabéns aos noivos!',
    },
  },
  {
    token: 'demo-carlos-mendes-008',
    displayName: 'Carlos Mendes',
    phone: '+244900000108',
    seatsAllowed: 1,
    groupTag: 'Colegas',
    views: [new Date('2026-09-22T14:15:00Z')],
    rsvp: {
      source: 'WHATSAPP_CLICK',
      attending: null,
      whatsappIntent: { at: new Date('2026-09-22T14:16:00Z'), target: 'BRIDE' },
    },
  },
  {
    token: 'demo-familia-domingos9',
    displayName: 'Família Domingos',
    phone: null,
    seatsAllowed: 4,
    groupTag: 'Amigos',
    views: [],
    rsvp: null,
  },
  {
    token: 'demo-madalena-costa-10',
    displayName: 'Madalena Costa',
    phone: '+244900000110',
    seatsAllowed: 1,
    groupTag: 'Amigos',
    views: [new Date('2026-09-21T17:30:00Z'), new Date('2026-09-23T07:50:00Z')],
    rsvp: {
      source: 'FORM',
      attending: true,
      peopleCount: 1,
      // Answered the form, then also tapped WhatsApp: the form answer is kept.
      whatsappIntent: { at: new Date('2026-09-23T07:52:00Z'), target: 'BRIDE' },
    },
  },
];
