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

/** Login and logout (couples and admins). */
export const auth = {
  login: {
    title: 'Entrar',
    heading: 'Entrar no painel',
    intro: 'Aceda ao seu convite para o editar e acompanhar as respostas dos convidados.',
    email: 'E-mail',
    password: 'Palavra-passe',
    showPassword: 'Mostrar a palavra-passe',
    hidePassword: 'Esconder a palavra-passe',
    submit: 'Entrar',
    submitting: 'A entrar…',
    noAccount: 'Os convites são criados pela nossa equipa. Ainda não tem conta? Contacte-nos.',
    errors: {
      emailInvalid: 'Introduza um e-mail válido.',
      passwordRequired: 'Introduza a palavra-passe.',
      invalidCredentials: 'E-mail ou palavra-passe incorretos.',
      rateLimited: 'Demasiadas tentativas. Aguarde alguns minutos e tente de novo.',
      suspended: 'Esta conta está suspensa. Contacte-nos para mais informações.',
      unavailable: 'Não foi possível entrar agora. Tente de novo dentro de momentos.',
    },
  },
  logout: 'Sair',
} as const;

/** The couple's dashboard: shell and event list. */
export const dashboard = {
  title: 'Painel',
  events: {
    title: 'Os meus convites',
    titleAdmin: 'Todos os convites',
    open: 'Abrir',
    empty: 'Ainda não tem convites. A nossa equipa cria o seu convite: contacte-nos.',
    phase: { SAVE_THE_DATE: 'Save the Date', INVITATION: 'Convite' },
    inactive: 'Desativado',
    /** {theme} */
    theme: 'Tema {theme}',
    guestCount: { one: 'convidado', other: 'convidados' },
  },
  skipToContent: 'Saltar para o conteúdo',
} as const;

/** The menu shared by an event's dashboard pages. */
export const eventNav = {
  label: 'Páginas do convite',
  back: 'Os meus convites',
  overview: 'Resumo',
  guests: 'Convidados',
  editor: 'Editar convite',
  inactive: 'Desativado: os convidados veem «Convite não encontrado».',
} as const;

/** The event's overview ("Resumo"): answers at a glance and the guests' messages. */
export const overview = {
  title: 'Resumo',
  group: 'Grupo',
  allGroups: 'Todos os grupos',
  cards: {
    invited: 'Convidados',
    /** {limit} */
    invitedOf: 'de {limit} do plano',
    sent: 'Convites enviados',
    opened: 'Abriram o convite',
    confirmed: 'Confirmados',
    declined: 'Não vão',
    whatsapp: 'WhatsApp, por confirmar',
    whatsappHint: 'Tocaram em «Confirmar presença». Confirme na conversa e registe a resposta.',
    pending: 'Sem resposta',
    people: 'Pessoas confirmadas',
    /** {seats} */
    peopleOf: 'de {seats} lugares',
  },
  empty: 'Ainda não há convidados.',
  addGuests: 'Adicionar convidados',
  messages: {
    title: 'Mensagens dos convidados',
    empty: 'Ainda não há mensagens.',
    /** {date} */
    at: 'a {date}',
  },
} as const;

/** The guest list: adding, editing, sending by WhatsApp. Templates: {convidado}, {noivos}… */
export const guests = {
  title: 'Convidados',
  /** {count}, {limit} */
  count: '{count} de {limit} convidados',
  /** {limit} */
  limitReached:
    'Chegou ao limite de {limit} convidados do seu plano. Para convidar mais pessoas, contacte-nos.',
  add: 'Adicionar convidado',
  exportCsv: 'Exportar lista (CSV)',
  empty: 'Ainda não há convidados. Adicione o primeiro.',
  seats: { one: 'lugar', other: 'lugares' },
  people: { one: 'pessoa', other: 'pessoas' },
  noPhone: 'Sem telemóvel',
  filters: {
    label: 'Filtrar convidados',
    search: 'Procurar',
    searchPlaceholder: 'Nome ou telemóvel',
    answer: 'Resposta',
    invite: 'Convite',
    group: 'Grupo',
    all: 'Todos',
    answers: {
      confirmed: 'Confirmados',
      declined: 'Não vão',
      whatsapp: 'WhatsApp, por confirmar',
      pending: 'Sem resposta',
    },
    invites: {
      'not-sent': 'Por enviar',
      sent: 'Enviados',
      opened: 'Abriram',
      'not-opened': 'Não abriram',
    },
    /** {count}, {total} */
    showing: 'A mostrar {count} de {total}',
    clear: 'Limpar filtros',
    noMatches: 'Nenhum convidado corresponde aos filtros.',
  },
  status: {
    confirmed: 'Confirmado',
    declined: 'Não vai',
    whatsapp: 'WhatsApp, por confirmar',
    opened: 'Abriu, sem resposta',
    'not-opened': 'Ainda não abriu',
  },
  row: {
    /** {date} */
    sent: 'Enviado a {date}',
    notSent: 'Por enviar',
    send: 'Enviar',
    sendLabel: 'Enviar pelo WhatsApp a {name}',
    copyLink: 'Copiar link',
    copyLinkLabel: 'Copiar o link de {name}',
    details: 'Detalhes',
    detailsLabel: 'Detalhes de {name}',
    copied: 'Link copiado!',
    copyFailed: 'Não foi possível copiar.',
  },
  form: {
    addTitle: 'Novo convidado',
    displayName: 'Nome no convite',
    displayNameHint: 'Como aparece no convite, por exemplo «Família Silva» ou «Ana e Pedro».',
    phone: 'Telemóvel (opcional)',
    phoneHint:
      'Para enviar pelo WhatsApp. Números de fora de Angola com o indicativo, por exemplo +351 912 345 678.',
    seats: 'Lugares',
    seatsHint: 'Quantas pessoas o convite inclui.',
    group: 'Grupo (opcional)',
    groupHint: 'Por exemplo «Família da noiva» ou «Amigos», para filtrar a lista.',
    add: 'Adicionar',
    save: 'Guardar',
    saving: 'A guardar…',
    saved: 'Guardado.',
    cancel: 'Cancelar',
    /** {name} */
    added: '«{name}» está na lista.',
  },
  details: {
    close: 'Fechar',
    link: {
      legend: 'Link do convite',
      hint: 'Pessoal: mostra o nome deste convidado e guarda a resposta dele.',
      /** {count}, {date} */
      opened: 'Abriu o convite {count} vez(es), a última a {date}.',
      notOpened: 'Ainda não abriu o convite.',
      copy: 'Copiar link',
      copied: 'Link copiado!',
      open: 'Abrir o convite',
      sent: 'Enviado a {date}.',
      notSent: 'Ainda não foi enviado.',
      markSent: 'Marcar como enviado',
      markNotSent: 'Marcar como por enviar',
      renew: 'Gerar novo link',
      renewHint: 'Se o link foi reencaminhado a quem não devia: o link atual deixa de funcionar.',
      /** {name} */
      renewConfirm: 'O link atual de {name} deixa de funcionar. Gerar um novo link?',
      renewed: 'Novo link gerado. Envie-o de novo ao convidado.',
    },
    remove: {
      legend: 'Apagar convidado',
      hint: 'A resposta e o histórico deste convidado também são apagados.',
      button: 'Apagar convidado',
      /** {name} */
      confirm: 'Apagar {name} da lista? Não é possível desfazer.',
    },
  },
  answer: {
    legend: 'Resposta',
    hint: 'Registe uma resposta que recebeu pelo WhatsApp ou por telefone. Se o convidado responder no convite, essa resposta substitui a sua.',
    attending: 'Vai estar presente?',
    none: 'Sem resposta',
    yes: 'Vai',
    no: 'Não vai',
    people: 'Quantas pessoas vão?',
    save: 'Guardar resposta',
    saved: 'Resposta guardada.',
    source: {
      FORM: 'Respondeu no convite',
      WHATSAPP_CLICK: 'Tocou no WhatsApp',
      COUPLE: 'Registada no painel',
    },
    /** {source}, {date} */
    updated: '{source} a {date}.',
    /** {target}, {date} */
    whatsappIntent:
      'Tocou em «Confirmar presença ({target})» pelo WhatsApp a {date}. Confirme na conversa e registe aqui a resposta.',
    targets: { GROOM: 'noivo', BRIDE: 'noiva' },
    companions: 'Acompanhantes',
    message: 'Mensagem para os noivos',
  },
  send: {
    /** {name} */
    title: 'Enviar a {name}',
    message: 'Mensagem',
    hint: 'Pode alterar a mensagem só para este convidado. O texto para todos está em «Mensagem de envio».',
    noPhone: 'Este convidado não tem telemóvel: no WhatsApp, escolha o contacto a quem enviar.',
    linkMissing: 'A mensagem tem de incluir o link do convite.',
    open: 'Abrir o WhatsApp',
    copy: 'Copiar mensagem',
    copied: 'Mensagem copiada!',
    copyFailed: 'Não foi possível copiar. Selecione o texto e copie-o manualmente.',
    close: 'Fechar',
  },
  template: {
    legend: 'Mensagem de envio',
    hint: 'O texto que acompanha o link de cada convidado. {convidado}, {noivos}, {data} e {link} são substituídos; sem {link}, o link vai no fim.',
    label: 'Texto da mensagem',
    /** {count}, {max} */
    counter: '{count} de {max} caracteres',
    save: 'Guardar mensagem',
    saved: 'Mensagem guardada.',
    reset: 'Repor o texto sugerido',
    defaults: {
      INVITATION:
        'Olá, {convidado}!\n\nÉ com muita alegria que vos convidamos para o nosso casamento, no dia {data}.\n\nAbra o seu convite e confirme a presença aqui:\n{link}\n\nCom carinho,\n{noivos}',
      SAVE_THE_DATE:
        'Olá, {convidado}!\n\nReserve a data: vamos casar no dia {data}! O convite oficial segue em breve.\n\nVeja aqui:\n{link}\n\nCom carinho,\n{noivos}',
    },
  },
  errors: {
    invalid: 'Verifique os campos assinalados.',
    unauthenticated: 'A sua sessão terminou. Entre de novo para continuar.',
    'not-found': 'Este convidado já não existe. Atualize a página.',
    'rate-limited': 'Demasiados pedidos seguidos. Aguarde um pouco e tente de novo.',
    unavailable: 'Não foi possível concluir agora. Tente de novo dentro de momentos.',
    limit: 'Chegou ao limite de convidados do seu plano.',
    /** {people} */
    seats: 'Este convidado já confirmou {people}: altere primeiro a resposta.',
  },
  export: {
    /** {slug}, {date} (file name, ASCII only) */
    fileName: 'convidados-{slug}-{date}.csv',
    columns: {
      name: 'Nome',
      phone: 'Telefone',
      seats: 'Lugares',
      group: 'Grupo',
      link: 'Link',
      status: 'Estado',
      people: 'Pessoas confirmadas',
      companions: 'Acompanhantes',
      message: 'Mensagem',
      answeredVia: 'Resposta',
      answeredAt: 'Respondido em',
      sentAt: 'Enviado em',
      views: 'Aberturas',
      lastOpenedAt: 'Última abertura',
    },
  },
  validation: {
    /** {max} */
    seatsRange: 'Escolha entre 1 e {max} lugares.',
    /** {max} */
    peopleRange: 'Escolha entre 1 e {max} pessoas.',
  },
} as const;

/** The event editor. Templates use Portuguese placeholders: {pessoas}, {local}, {hora}. */
export const editor = {
  title: 'Editar convite',
  tabs: {
    general: 'Geral',
    couple: 'Noivos e família',
    dateVenues: 'Data e locais',
    timeline: 'Cronograma',
    message: 'Mensagem',
    dressCode: 'Traje',
    rules: 'Manual do convidado',
    gifts: 'Presentes',
    rsvp: 'Confirmação',
    media: 'Multimédia',
  },
  tabsLabel: 'Partes do convite',
  /** {count} */
  tabErrors: '{count} campo(s) a corrigir',
  save: {
    save: 'Guardar alterações',
    saving: 'A guardar…',
    discard: 'Descartar alterações',
    discardConfirm: 'Descartar todas as alterações por guardar?',
    dirty: 'Alterações por guardar',
    clean: 'Tudo guardado',
    /** {time} */
    savedAt: 'Guardado às {time}',
    leaveWarning: 'Tem alterações por guardar. Sair mesmo assim?',
    errors: {
      invalid: 'Corrija os campos assinalados antes de guardar.',
      unauthenticated: 'A sua sessão terminou. Entre de novo para guardar as alterações.',
      notFound: 'Este convite já não está disponível.',
      rateLimited: 'Demasiadas gravações seguidas. Aguarde um pouco e tente de novo.',
      unavailable: 'Não foi possível guardar. Tente de novo dentro de momentos.',
    },
  },
  list: {
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    remove: 'Remover',
    /** {max} */
    limit: 'Máximo de {max}.',
  },
  general: {
    phase: {
      legend: 'Fase do convite',
      SAVE_THE_DATE: 'Save the Date',
      SAVE_THE_DATEHint: 'Os convidados veem apenas a página Save the Date.',
      INVITATION: 'Convite completo',
      INVITATIONHint: 'Os convidados veem todas as secções do convite.',
    },
    theme: { legend: 'Tema' },
    colors: {
      legend: 'Cores',
      hint: 'Ajuste as cores do tema. «Repor» volta à cor original.',
      background: 'Fundo',
      ink: 'Texto',
      script: 'Títulos manuscritos',
      accent: 'Botões e ícones',
      reset: 'Repor',
      themeColor: 'Cor do tema',
      /** {ratio}, {min} */
      lowContrast: {
        ink: 'O texto pode ficar difícil de ler sobre este fundo (contraste {ratio}:1; o mínimo é {min}:1).',
        script:
          'Os títulos manuscritos podem ficar difíceis de ler (contraste {ratio}:1; o mínimo é {min}:1).',
        accent:
          'Os botões e ícones podem ficar pouco visíveis (contraste {ratio}:1; o mínimo é {min}:1).',
        accentText:
          'O texto dos botões pode ficar difícil de ler (contraste {ratio}:1; o mínimo é {min}:1).',
      },
    },
    sections: {
      legend: 'Secções do convite',
      hint: 'Escolha o que os convidados veem e por que ordem.',
      show: 'Mostrar',
      alwaysVisible: 'Sempre visível: tem o nome do convidado.',
      names: {
        invitation: 'Cartão do convite',
        countdown: 'Contagem regressiva',
        message: 'Mensagem dos noivos',
        gallery: 'Galeria de fotos',
        schedule: 'Cronograma do dia',
        dressCode: 'Traje',
        guestManual: 'Manual do bom convidado',
        gifts: 'Lista de presentes',
        rsvp: 'Confirmação de presença',
        closing: 'Encerramento',
      },
    },
  },
  couple: {
    groomName: 'Nome do noivo',
    brideName: 'Nome da noiva',
    groomParents: 'Pais do noivo',
    brideParents: 'Pais da noiva',
    parentsHint: 'Até dois nomes; pode deixar em branco.',
    /** {n} */
    parent: 'Nome {n}',
    monogram: 'Monograma',
    monogramHint: 'Duas letras, por exemplo BN. Em branco: as iniciais dos noivos.',
    cardTexts: 'Textos do cartão',
    cardTextsHint: 'Em branco, fica o texto sugerido.',
    introLine: 'Frase de abertura',
    invitationLine: 'Frase do convite',
    celebrationLine: 'Frase da celebração',
    infoBoxText: 'Caixa de informação',
    infoBoxHint:
      '{pessoas} é substituído pelos lugares de cada convidado, por exemplo «2 pessoas».',
  },
  dateVenues: {
    date: 'Data do casamento',
    startTime: 'Hora de início',
    endTime: 'Hora de fim (opcional)',
    endTimeHint:
      'Usada no calendário dos convidados. Depois da meia-noite conta como o dia seguinte.',
    venues: 'Locais',
    venuesHint: 'Por exemplo, a cerimónia e o copo-d’água.',
    /** {n} */
    venue: 'Local {n}',
    heading: 'Título',
    headingPlaceholder: 'As cerimónias',
    venueName: 'Nome do local',
    time: 'Hora',
    description: 'Frase (opcional)',
    descriptionHint:
      '{local} e {hora} são substituídos. Em branco: «Terão lugar na {local}, às {hora}.»',
    address: 'Morada (opcional)',
    mapsUrl: 'Link do Google Maps',
    mapsUrlHint: 'No Google Maps, toque em «Partilhar» e cole aqui o link.',
    readCoordinates: 'Ler coordenadas',
    readingCoordinates: 'A ler…',
    /** {lat}, {lng} */
    coordinatesFound: 'Coordenadas: {lat}, {lng}',
    coordinatesMissing:
      'Não foi possível ler as coordenadas deste link. O botão do Google Maps funciona na mesma; o do Waze só aparece com coordenadas.',
    latitude: 'Latitude',
    longitude: 'Longitude',
    coordinatesHint: 'Preenchidas a partir do link; usadas no botão do Waze.',
    add: 'Adicionar local',
  },
  timeline: {
    hint: 'Os momentos do dia, pela ordem em que acontecem. Depois da meia-noite conta como o dia seguinte.',
    /** {n} */
    item: 'Momento {n}',
    label: 'Descrição',
    time: 'Hora (opcional)',
    icon: 'Ícone',
    chooseIcon: 'Escolher o ícone',
    add: 'Adicionar momento',
  },
  message: {
    label: 'Mensagem dos noivos',
    hint: 'Aparece numa moldura no convite. As linhas em branco separam parágrafos.',
    /** {count}, {max} */
    counter: '{count} de {max} caracteres',
  },
  dressCode: {
    text: 'Texto sobre o traje',
    colors: 'Paleta de cores',
    colorsHint: 'Até 6 cores sugeridas aos convidados.',
    /** {n} */
    color: 'Cor {n}',
    addColor: 'Adicionar cor',
  },
  rules: {
    hint: 'Regras curtas e bem-dispostas, em duas linhas no máximo.',
    /** {n} */
    rule: 'Regra {n}',
    text: 'Regra',
    add: 'Adicionar regra',
    reset: 'Repor as regras sugeridas',
    resetConfirm: 'Substituir as regras atuais pelas 8 regras sugeridas?',
  },
  gifts: {
    text: 'Texto',
    iban: 'IBAN',
    ibanHint: 'Os convidados podem copiá-lo com um toque.',
    accountHolder: 'Titular da conta',
  },
  rsvp: {
    mode: {
      legend: 'Como confirmam os convidados',
      WHATSAPP: 'Pelo WhatsApp',
      FORM: 'Pelo formulário do convite',
      BOTH: 'Formulário e WhatsApp',
    },
    groomWhatsapp: 'WhatsApp do noivo',
    brideWhatsapp: 'WhatsApp da noiva',
    whatsappHint: 'Números angolanos, por exemplo 923 456 789.',
    deadline: 'Prazo para confirmar (opcional)',
    deadlineHint: 'Até ao fim deste dia.',
  },
  media: {
    intro:
      'As imagens e a música aparecem no convite logo que ficam prontas, sem «Guardar alterações».',
    hero: {
      legend: 'Ilustração principal',
      hint: 'Aparece no fundo do cartão e do Save the Date, em vez da ilustração do tema. De preferência um PNG com fundo transparente e pelo menos 1080 píxeis de largura.',
      empty: 'A usar a ilustração do tema.',
      current: 'Ilustração principal atual',
      upload: 'Carregar ilustração',
    },
    logo: {
      legend: 'Logótipo',
      hint: 'Substitui o monograma no convite. De preferência um PNG com fundo transparente.',
      empty: 'A usar o monograma.',
      current: 'Logótipo atual',
      upload: 'Carregar logótipo',
    },
    gallery: {
      legend: 'Galeria de fotos',
      /** {max} */
      hint: 'Até {max} fotos, pela ordem em que aparecem no convite. JPG, PNG ou WebP até 15 MB cada.',
      /** {count}, {max} */
      count: '{count} de {max} fotos',
      empty: 'Ainda não há fotos.',
      add: 'Adicionar fotos',
      /** {count} */
      tooMany: 'Só há lugar para mais {count} foto(s): as outras não foram carregadas.',
      /** {n} */
      photo: 'Foto {n}',
      moveEarlier: 'Mover para antes',
      moveLater: 'Mover para depois',
      altLabel: 'Descrição (opcional)',
      altHint: 'Lida em voz alta a quem não consegue ver a foto.',
      altPlaceholder: 'Ex.: os noivos na praia',
    },
    music: {
      legend: 'Música',
      hint: 'Começa a tocar quando o convidado abre o envelope. MP3 até 5 MB.',
      empty: 'Sem música.',
      current: 'Música atual',
      upload: 'Carregar música',
    },
    replace: 'Substituir',
    remove: 'Remover',
    removeConfirm: 'Remover este ficheiro do convite?',
    retry: 'Tentar de novo',
    /** {percent} */
    uploading: 'A enviar… {percent}%',
    processing: 'A preparar…',
    /** Shown while a replacement is being prepared. */
    replacing: 'A preparar o novo ficheiro. O atual continua no convite até lá.',
    errors: {
      type: {
        image: 'Use uma imagem JPG, PNG ou WebP.',
        audio: 'Use um ficheiro MP3.',
      },
      /** {max} */
      size: 'O ficheiro é demasiado grande (máximo {max} MB).',
      empty: 'O ficheiro está vazio.',
      limit: 'A galeria já tem o máximo de fotos. Remova uma para adicionar outra.',
      rateLimited: 'Demasiados pedidos seguidos. Aguarde um pouco e tente de novo.',
      unauthenticated: 'A sua sessão terminou. Entre de novo para continuar.',
      notFound: 'Este ficheiro já não existe. Atualize a página.',
      invalid: 'Pedido inválido. Atualize a página e tente de novo.',
      unavailable: 'Não foi possível concluir agora. Tente de novo dentro de momentos.',
      upload: 'O envio falhou. Verifique a ligação à Internet e tente de novo.',
    },
    failures: {
      missing: 'O ficheiro não chegou ao servidor. Carregue-o de novo.',
      'too-large': 'O ficheiro é demasiado grande.',
      unreadable: 'Não foi possível abrir esta imagem. Experimente outra (JPG, PNG ou WebP).',
      'too-many-pixels':
        'A imagem tem demasiados píxeis (mais de 70 megapíxeis). Reduza-a e carregue de novo.',
      'not-mp3': 'Este ficheiro não é um MP3 válido.',
      error: 'Não foi possível preparar o ficheiro.',
    },
  },
  sectionToggle: {
    visible: 'Esta secção aparece no convite.',
    hidden: 'Esta secção está oculta no convite.',
    show: 'Mostrar no convite',
    hide: 'Ocultar do convite',
  },
  validation: {
    required: 'Preencha este campo.',
    /** {max} */
    tooLong: 'Use no máximo {max} caracteres.',
    date: 'Indique uma data válida.',
    time: 'Indique uma hora válida (hh:mm).',
    color: 'Use uma cor no formato #RRGGBB.',
    url: 'Cole um link completo, começado por https://.',
    iban: 'Este IBAN não é válido. Confira os caracteres.',
    latitude: 'Latitude entre -90 e 90.',
    longitude: 'Longitude entre -180 e 180.',
    coordinatesPair: 'Indique a latitude e a longitude, ou nenhuma.',
    monogram: 'Use uma ou duas letras.',
    whatsappNeeded: 'Indique pelo menos um número para confirmar pelo WhatsApp.',
    deadlineAfterEvent: 'O prazo tem de ser antes do casamento.',
    endBeforeStart: 'A hora de fim tem de ser depois do início.',
    duplicateSection: 'Cada secção só pode aparecer uma vez.',
    /** {max} */
    tooMany: 'Máximo de {max}.',
  },
  preview: {
    title: 'Pré-visualização',
    hint: 'Como os convidados veem o convite. As alterações aparecem aqui antes de as guardar.',
    frameTitle: 'Pré-visualização do convite',
    showEnvelope: 'Ver o envelope',
    hideEnvelope: 'Esconder o envelope',
    openNewWindow: 'Abrir numa nova janela',
    open: 'Pré-visualizar',
    close: 'Fechar',
    updating: 'A atualizar…',
    stale: 'A pré-visualização mostra a última versão guardada.',
    sampleGuest: 'Família Exemplo',
    inertNotice: 'Pré-visualização: as respostas dos convidados estão desativadas.',
  },
  mapsLink: {
    errors: {
      invalid: 'Este link não parece ser do Google Maps.',
      unavailable: 'Não foi possível abrir o link agora. Tente de novo.',
      rateLimited: 'Demasiados pedidos seguidos. Aguarde um pouco.',
    },
  },
  icons: {
    guests: 'Convidados',
    'bride-groom': 'Noivos',
    rings: 'Alianças',
    clock: 'Relógio',
    'camera-heart': 'Sessão de fotos',
    camera: 'Máquina fotográfica',
    buffet: 'Copo-d’água',
    cake: 'Bolo',
    dance: 'Dança',
    music: 'Música',
    bouquet: 'Bouquet',
    'wedding-dress': 'Vestido de noiva',
    confetti: 'Festa',
    gift: 'Presente',
    hanger: 'Traje',
    heart: 'Coração',
    smile: 'Sorriso',
    'user-plus': 'Acompanhante',
    'map-pin': 'Local',
    'check-circle': 'Confirmação',
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
  themes: 'Tema',
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
  auth,
  dashboard,
  eventNav,
  overview,
  guests,
  editor,
  invitationDefaults,
  invitation,
  designPreview,
} as const;

export type Dictionary = typeof ptAO;
