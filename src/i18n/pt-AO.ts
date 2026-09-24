/**
 * Portuguese (Angola) dictionary — every user-facing string lives here.
 *
 * Sections are separate named exports so Client Components can import only what they render
 * (`import { errors } from '@/i18n/pt-AO'`) instead of shipping the whole dictionary to the browser.
 */

export const app = {
  name: 'Convites Digitais',
  description: 'Convites de casamento digitais, interativos e personalizados para cada convidado.',
} as const;

export const landing = {
  eyebrow: 'Convites de casamento',
  title: 'Convites Digitais',
  subtitle:
    'Convites elegantes e personalizados, enviados pelo WhatsApp, com confirmação de presença.',
  comingSoon: 'Em breve',
} as const;

export const errors = {
  generic: {
    title: 'Algo correu mal',
    description: 'Ocorreu um erro inesperado. Por favor, tente novamente dentro de instantes.',
    retry: 'Tentar novamente',
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'A página que procura não existe ou já não está disponível.',
    backHome: 'Voltar ao início',
  },
  reference: 'Referência do erro',
} as const;

export const validation = {
  phone: {
    invalid: 'Introduza um número de telemóvel angolano válido (ex.: 923 456 789).',
  },
} as const;

/** Default invitation texts; the couple can edit each one (null in the database = default). */
export const invitationDefaults = {
  introLine: 'Com a benção de Deus',
  invitationLine: 'Têm a honra de convidar',
  celebrationLine: 'para celebrar a cerimónia de casamento dos seus filhos.',
  /** {seats} is replaced by the guest's seats, e.g. "1 pessoa" / "2 pessoas". */
  infoBoxText: 'Convite válido para {seats}',
  /** Sentence under each location heading; {venue} is shown in bold. */
  locationDescription: 'Terão lugar na {venue}, às {time}.',
  guestRules: {
    presence: 'Contamos com a sua presença!',
    punctuality: 'Seja pontual!',
    noPlusOnes: 'Convidado não convida!',
    celebrate: 'Comemore a nossa união!',
    whiteIsForTheBride: 'Branco é a cor da noiva!',
    photos: 'Faça muitas fotos e Stories!',
    dance: 'É obrigatório dançar muito!',
    smile: 'Sorria e seja muito feliz!',
  },
} as const;

/** Fixed texts of the guest invitation (section titles, buttons, labels). */
export const invitation = {
  people: { one: 'pessoa', other: 'pessoas' },
  saveTheDate: {
    title: 'Save the date',
    subtitle: 'Nosso casamento',
    officialInviteSoon: 'Convite oficial em breve',
  },
  buttons: {
    confirmAttendance: { regular: 'Confirmar', bold: 'presença' },
    googleMaps: { bold: 'Google', regular: 'Maps' },
    waze: 'Abrir no Waze',
  },
  sections: {
    message: { script: 'Mensagem', caps: 'dos noivos' },
    gallery: { script: 'Galeria de fotos', subtitle: 'Confira os nossos pequenos momentos' },
    schedule: { script: 'Cronograma', caps: 'do dia' },
    guestManual: { script: 'Manual do', caps: 'bom convidado' },
    countdown: { script: 'Contagem', caps: 'regressiva' },
  },
} as const;

/** Internal design preview (/design): never shown to guests. */
export const designPreview = {
  title: 'Sistema de design',
  intro:
    'Página interna com os tipos de letra candidatos, as cores do tema e todos os componentes partilhados. Não existe em produção.',
  fonts: {
    title: 'Tipos de letra',
    script: 'Manuscrita — títulos e nomes dos noivos',
    caps: 'Maiúsculas pequenas — subtítulos, rótulos e monograma',
    body: 'Texto corrido',
    inBrief: 'no briefing',
    chosen: 'escolhida',
  },
  palette: { title: 'Cores do tema', contrast: 'contraste' },
  components: { title: 'Componentes' },
  timelineNarrow: 'Cronograma num ecrã estreito (menos de 340 px): filas de 2',
  icons: { title: 'Ícones' },
  dates: { title: 'Datas (hora de Luanda)' },
  hero: { title: 'Ilustração do topo (marcador de posição)' },
} as const;

export const ptAO = {
  app,
  landing,
  errors,
  validation,
  invitationDefaults,
  invitation,
  designPreview,
} as const;

export type Dictionary = typeof ptAO;
