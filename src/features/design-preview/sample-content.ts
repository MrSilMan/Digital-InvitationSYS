import { formatTime } from '@/i18n/format';
import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';

/** Sample invitation content for /design (mirrors the demo seed). */

const at = (localTime: string) => new Date(`2027-01-15T${localTime}:00+01:00`);

export const SAMPLE = {
  monogram: 'BN',
  groomName: 'Braúlio',
  brideName: 'Nanda',
  groomParents: ['Augusto Santos', 'Celeste Santos'],
  brideParents: ['Domingos Cassoma', 'Fernanda Cassoma'],
  guestName: 'Família Silva',
  longGuestName: 'Família Domingos e Sobrinhos Queridos',
  seats: 4,
  startsAt: at('16:00'),
  message:
    'O amor é um presente de Deus,\ne Ele nos uniu para sempre.\n\n' +
    'Venha testemunhar esta promessa eterna e celebrar connosco o dia em que nos tornamos um só diante do Senhor.',
  location: {
    heading: 'As cerimónias',
    venue: 'Praia do Bispo',
    time: formatTime(at('16:00')),
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8290,13.2250',
    wazeUrl: 'https://waze.com/ul?ll=-8.8290,13.2250&navigate=yes',
  },
  timeline: [
    { label: 'Chegada dos convidados', time: formatTime(at('15:30')), icon: 'guests' },
    { label: 'Chegada dos noivos', time: formatTime(at('16:00')), icon: 'bride-groom' },
    { label: 'Sessão de fotos', time: formatTime(at('17:00')), icon: 'camera-heart' },
    { label: 'Abertura do buffet', time: formatTime(at('20:00')), icon: 'buffet' },
    { label: 'Corte do bolo', time: formatTime(at('21:30')), icon: 'cake' },
    { label: 'Abertura da pista', time: formatTime(at('22:00')), icon: 'dance' },
    { label: 'Entrega do bouquet', time: formatTime(at('23:30')), icon: 'bouquet' },
  ],
  rules: DEFAULT_GUEST_RULES,
} as const;
