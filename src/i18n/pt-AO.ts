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
  tooManyRequests: {
    title: 'Demasiados pedidos',
    description: 'Recebemos muitos pedidos da sua ligação. Tente novamente daqui a pouco.',
  },
} as const;

export const validation = {
  phone: {
    invalid: 'Introduza um número de telemóvel angolano válido (ex.: 923 456 789).',
  },
  rsvp: {
    attendingRequired: 'Indique se vai estar presente.',
    /** {max} = the guest's seats. */
    peopleRange: 'Escolha entre 1 e {max} pessoas.',
    nameTooLong: 'Use no máximo 80 caracteres.',
    messageTooLong: 'A mensagem pode ter até 500 caracteres.',
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

/**
 * Fixed texts of the guest invitation (section titles, buttons, labels). Placeholders in braces
 * ({guest}, {date}…) are filled in by the code.
 */
export const invitation = {
  people: { one: 'pessoa', other: 'pessoas' },
  /** "Braúlio e Nanda" in the script lines; "Braúlio & Nanda" in titles. */
  couple: '{groom} e {bride}',
  coupleShort: '{groom} & {bride}',
  /** Screen-reader heading of the whole page. */
  pageHeading: 'Convite de casamento de {couple}',
  opening: {
    addressedTo: 'Convite para',
    tapToOpen: 'Toque para abrir',
    openButton: 'Abrir o convite',
  },
  music: { play: 'Ligar a música', pause: 'Desligar a música' },
  saveTheDate: {
    title: 'Save the date',
    subtitle: 'Nosso casamento',
    officialInviteSoon: 'Convite oficial em breve',
  },
  buttons: {
    confirmAttendance: { regular: 'Confirmar', bold: 'presença' },
    googleMaps: { bold: 'Google', regular: 'Maps' },
    waze: 'Abrir no Waze',
    close: 'Fechar',
  },
  sections: {
    invitation: { heading: 'O convite' },
    countdown: {
      script: 'Contagem',
      caps: 'regressiva',
      units: {
        days: { one: 'dia', other: 'dias' },
        hours: { one: 'hora', other: 'horas' },
        minutes: { one: 'minuto', other: 'minutos' },
        seconds: { one: 'segundo', other: 'segundos' },
      },
      untilTheDay: 'para o grande dia',
      after: 'O grande dia chegou! Obrigado por fazer parte da nossa história.',
    },
    message: { script: 'Mensagem', caps: 'dos noivos' },
    gallery: {
      script: 'Galeria de fotos',
      subtitle: 'Confira os nossos pequenos momentos',
      photoAlt: 'Foto {n} de {total}',
      openPhoto: 'Ver a foto {n} em ecrã inteiro',
      previous: 'Foto anterior',
      next: 'Foto seguinte',
      counter: '{n} de {total}',
    },
    schedule: { script: 'Cronograma', caps: 'do dia' },
    dressCode: { script: 'Traje', caps: 'sugerido', palette: 'Paleta de cores' },
    guestManual: { script: 'Manual do', caps: 'bom convidado' },
    gifts: {
      script: 'Lista de',
      caps: 'presentes',
      iban: 'IBAN',
      accountHolder: 'Titular: {name}',
      copy: 'Copiar IBAN',
      copied: 'IBAN copiado!',
      copyFailed: 'Não foi possível copiar. Selecione o IBAN e copie-o manualmente.',
    },
    rsvp: {
      script: 'Confirmação',
      caps: 'de presença',
      deadline: 'Por favor, confirme a sua presença até {date}.',
      closed: 'O prazo para confirmar a presença terminou a {date}.',
      groom: 'Confirmar presença (noivo)',
      bride: 'Confirmar presença (noiva)',
      whatsappMessage:
        'Olá! Sou {guest} e confirmo a minha presença no casamento de {groom} e {bride}.',
      orWhatsapp: 'Prefere confirmar pelo WhatsApp?',
      form: {
        question: 'Vai estar presente?',
        yes: 'Sim, estarei presente',
        no: 'Não poderei ir',
        people: 'Quantas pessoas vão?',
        companions: 'Nomes dos acompanhantes',
        companion: 'Acompanhante {n}',
        companionPlaceholder: 'Nome (opcional)',
        message: 'Mensagem para os noivos (opcional)',
        submit: 'Enviar resposta',
        sending: 'A enviar…',
        confirmed: 'Obrigado, {guest}! A presença está confirmada para {people}.',
        declined: 'Obrigado por nos avisar, {guest}. Vamos sentir a vossa falta!',
        change: 'Alterar a resposta',
        errors: {
          'not-found': 'Não encontrámos o seu convite. Atualize a página e tente novamente.',
          'not-allowed': 'A confirmação por formulário não está disponível neste convite.',
          closed: 'O prazo para confirmar a presença já terminou.',
          'rate-limited':
            'Recebemos muitas respostas seguidas. Tente novamente daqui a alguns minutos.',
          invalid: 'Verifique as respostas e tente novamente.',
          unavailable: 'Não foi possível guardar a resposta agora. Tente novamente daqui a pouco.',
          network: 'Não foi possível enviar. Verifique a ligação à internet e tente novamente.',
        },
      },
    },
    closing: {
      script: 'Obrigado',
      caps: 'de coração',
      message: 'Obrigado por fazer parte deste dia tão especial das nossas vidas.',
      addToCalendar: { regular: 'Adicionar ao', bold: 'calendário' },
      googleCalendar: 'ou adicionar ao Google Calendar',
    },
  },
  calendar: {
    title: 'Casamento de {groom} e {bride}',
    location: '{heading}: {venue}, {time}',
  },
  notFound: {
    title: 'Convite não encontrado',
    description:
      'Este link não é válido ou o convite já não está disponível. Confirme o link que recebeu ou fale com os noivos.',
  },
  metadata: {
    invitationTitle: 'Convite de Casamento – {couple}',
    saveTheDateTitle: 'Save the Date – {couple}',
    description: '{date}. Toque para abrir o seu convite.',
    imageAlt: 'Convite de casamento',
    imageHeading: 'Convite de casamento',
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
