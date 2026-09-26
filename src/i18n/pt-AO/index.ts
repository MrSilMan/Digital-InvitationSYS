/**
 * Portuguese (Angola) dictionary — every user-facing string lives here.
 *
 * Sections are separate named exports. In the browser, though, importing any section from this
 * file ships all of it: the bundler keeps every export that some page uses, and the dashboard
 * uses them all. So the few sections that guest pages need in the browser live in their own
 * modules (`import { errors } from '@/i18n/pt-AO/errors'`), and guest-page Client Components
 * otherwise get their texts as props. Dashboard Client Components may import from here.
 */

import { errors } from './errors';
import { validation } from './validation';

export { errors, validation };

export const app = {
  name: 'Convites Digitais',
  description: 'Convites de casamento digitais, interativos e personalizados para cada convidado.',
} as const;

/**
 * The public landing page (/) and the theme demos (/demonstracao/<tema>). Couples do not sign up
 * on their own: every "create" button opens a WhatsApp chat with the team.
 */
export const landing = {
  metadata: {
    title: 'Convites Digitais — convites de casamento digitais',
    description:
      'Convites de casamento elegantes e interativos, com o nome de cada convidado, enviados pelo WhatsApp: envelope com música, contagem regressiva, galeria de fotos e confirmação de presença.',
    imageAlt: 'Convites Digitais: convites de casamento digitais',
    imageTagline: 'Convites de casamento digitais',
  },
  skipToContent: 'Saltar para o conteúdo',
  nav: {
    label: 'Secções da página',
    home: 'Convites Digitais: página inicial',
    themes: 'Temas',
    experience: 'A experiência',
    features: 'O que inclui',
    howItWorks: 'Como funciona',
    faq: 'Perguntas',
    login: 'Entrar',
  },
  cta: {
    create: 'Criar o nosso convite',
    createShort: 'Criar convite',
    /** Read after the button text by screen readers: the button leaves the site. */
    opensWhatsapp: '(abre o WhatsApp)',
    seeThemes: 'Ver os temas',
    hasAccount: 'Já têm conta?',
    login: 'Entrar no painel',
    /** Pre-filled WhatsApp messages to the team. */
    message: 'Olá! Gostaríamos de criar o nosso convite de casamento digital.',
    messageWithTheme:
      'Olá! Gostaríamos de criar o nosso convite de casamento digital com o tema {theme}.',
  },
  hero: {
    eyebrow: 'Convites de casamento digitais',
    titleScript: 'O vosso sim',
    titleCaps: 'merece um convite à altura',
    lead: 'Um convite elegante e interativo, com o nome de cada convidado, enviado pelo WhatsApp. Envelope com música, contagem regressiva, fotos, o programa do dia e a confirmação de presença: tudo num só link.',
    highlights: ['Abre em qualquer telemóvel', 'Nada para instalar', 'Respostas no vosso painel'],
    /** {theme} */
    phonesCaption:
      'Um convite de exemplo no tema {theme}: o envelope selado e o cartão com o nome do convidado.',
    sampleGuest: 'Família Silva',
  },
  tryIt: {
    title: 'Experimentem com os vossos nomes',
    hint: 'Os convites de exemplo mudam enquanto escrevem.',
    groom: 'Noivo',
    bride: 'Noiva',
  },
  /** The couple of every example (as in the demo event). */
  sampleCouple: { groom: 'Braúlio', bride: 'Nanda' },
  ribbon: {
    label: 'O que cada convite traz',
    pause: 'Parar a faixa em movimento',
    items: [
      'Um convite para cada convidado',
      'Enviado pelo WhatsApp',
      'Envelope com música',
      'Contagem regressiva',
      'Galeria de fotos',
      'Programa do dia',
      'Confirmação de presença',
      'Lista de presentes',
      'Adicionar ao calendário',
    ],
  },
  themes: {
    script: 'Os nossos',
    caps: 'temas',
    intro:
      'Cada tema tem o seu papel, as suas flores, as suas cores e os seus tipos de letra. Escolham o que tem a cara do vosso casamento.',
    palette: 'Cores',
    fonts: 'Tipos de letra',
    buttons: 'Botões',
    buttonShapes: { pill: 'Alongados', circle: 'Redondos' },
    demo: 'Ver demonstração',
    /** Read by screen readers after "Ver demonstração". */
    demoSuffix: 'do tema {theme}',
    choose: 'Quero este tema',
    /** Read by screen readers after "Quero este tema". */
    chooseSuffix: '({theme}; abre o WhatsApp)',
    previewCaption: 'Save the Date de exemplo no tema {theme}.',
    count: { one: 'tema', other: 'temas' },
    items: {
      'praia-rosa': {
        tagline: 'Romântico, à beira-mar',
        description:
          'Papel de aguarela azul-claro, títulos manuscritos em cor-de-rosa, detalhes em dourado-oliva e rosas nos cantos, com uma ilustração de casamento na praia. Para quem vai dizer «sim» com o mar como testemunha.',
      },
      champanhe: {
        tagline: 'Clássico e dourado',
        description:
          'Marfim quente, dourado antigo, rosas creme e capim-dos-pampas, com botões redondos dourados. Uma elegância intemporal, para salões e grandes celebrações.',
      },
    },
  },
  journey: {
    script: 'A experiência',
    caps: 'do convidado',
    intro: 'Do WhatsApp ao «sim, vou», sem sair do telemóvel.',
    steps: [
      {
        title: 'Recebe o link',
        text: 'Cada convidado recebe no WhatsApp uma mensagem com o seu link pessoal e a pré-visualização do convite.',
      },
      {
        title: 'Abre o envelope',
        text: 'O convite abre-se como uma carta, com o vosso monograma no selo e a vossa música a tocar.',
      },
      {
        title: 'Confirma a presença',
        text: 'Responde num toque, pelo formulário ou pelo WhatsApp, e a resposta aparece no vosso painel.',
      },
    ],
    chatCaption: 'Mensagem de WhatsApp com o convite e a sua pré-visualização.',
    envelopeCaption: 'O envelope fechado, com o nome do convidado.',
    rsvpCaption: 'A presença confirmada e o aviso no painel dos noivos.',
    chatTime: '10:24',
    chatOnline: 'online',
    chatReply: 'Que lindo! Lá estaremos.',
    /** {guest} {people} */
    dashboardNotice: '{guest} confirmou: {people}',
    dashboardTitle: 'Painel dos noivos',
  },
  features: {
    script: 'Tudo o que',
    caps: 'o vosso convite inclui',
    /** Example guests on the illustrations (as in the demo data). */
    sampleGuests: ['Família Silva', 'Ana e Pedro', 'Família Neto', 'João Manuel'],
    items: {
      envelope: {
        title: 'Envelope com música',
        text: 'O convite abre-se com um toque no envelope, e a vossa música começa a tocar.',
      },
      personal: {
        title: 'Um convite para cada convidado',
        text: 'O nome de cada pessoa ou família no convite, com os lugares que lhe reservaram.',
      },
      rsvp: {
        title: 'Confirmação de presença',
        text: 'Pelo formulário, pelo WhatsApp ou pelos dois, até à data limite que escolherem.',
      },
      dashboard: {
        title: 'O vosso painel',
        text: 'A lista de convidados (também por CSV), os envios pelo WhatsApp, quem já abriu e quem confirmou.',
      },
      countdown: {
        title: 'Contagem regressiva',
        text: 'Dias, horas, minutos e segundos até ao grande dia.',
      },
      gallery: {
        title: 'Galeria de fotos',
        text: 'Até 12 fotos vossas, para ver em ecrã inteiro.',
      },
      schedule: {
        title: 'Programa do dia',
        text: 'Os locais com Google Maps e Waze, e o cronograma da festa, hora a hora.',
      },
      rules: {
        title: 'Manual do bom convidado',
        text: 'As regras da casa, com humor: pontualidade, fotos, pista de dança…',
      },
      dressCode: {
        title: 'Traje sugerido',
        text: 'O dress code, com a paleta de cores da festa.',
      },
      gifts: {
        title: 'Lista de presentes',
        text: 'A vossa lista ou o IBAN, com um botão para o copiar.',
      },
      saveTheDate: {
        title: 'Save the Date',
        text: 'Comecem por reservar a data e mostrem o convite completo mais tarde.',
      },
      light: {
        title: 'Leve e rápido',
        text: 'Pensado para telemóveis simples e dados móveis.',
      },
    },
  },
  howItWorks: {
    script: 'Como',
    caps: 'funciona',
    steps: [
      {
        title: 'Falem connosco',
        text: 'Enviem-nos uma mensagem pelo WhatsApp. Criamos a vossa conta e o vosso convite, no tema que escolherem.',
      },
      {
        title: 'Personalizem tudo',
        text: 'No vosso painel, editam nomes, datas, locais, textos, fotos e música, e veem o convite mudar ao vivo.',
      },
      {
        title: 'Enviem pelo WhatsApp',
        text: 'Adicionem os convidados, um a um ou por CSV, e enviem a cada um o seu link pessoal com a mensagem já escrita.',
      },
      {
        title: 'Acompanhem as respostas',
        text: 'Vejam quem abriu o convite, quem confirmou, quantas pessoas vêm e as mensagens de carinho.',
      },
    ],
  },
  faq: {
    script: 'Perguntas',
    caps: 'frequentes',
    items: [
      {
        question: 'Os convidados precisam de instalar alguma aplicação?',
        answer:
          'Não. O convite abre no navegador do telemóvel, a partir do link recebido no WhatsApp, e funciona bem mesmo em telemóveis simples e com dados móveis.',
      },
      {
        question: 'Cada convidado recebe um convite com o seu nome?',
        answer:
          'Sim. Cada convidado ou família tem o seu próprio link, com o nome no convite e o número de lugares reservados.',
      },
      {
        question: 'Como é que os convidados confirmam a presença?',
        answer:
          'Pelo formulário do convite, pelo WhatsApp dos noivos, ou das duas formas: vocês escolhem, e definem a data limite para responder.',
      },
      {
        question: 'Podemos alterar o convite depois de o enviar?',
        answer:
          'Sim. As alterações que guardarem no painel aparecem logo no convite, e o link de cada convidado continua o mesmo.',
      },
      {
        question: 'Podemos usar as nossas fotos e a nossa música?',
        answer:
          'Sim: uma galeria com até 12 fotos, a vossa ilustração ou logótipo e uma música de fundo em MP3.',
      },
      {
        question: 'Podemos começar por um Save the Date?',
        answer:
          'Sim. O convite pode começar como Save the Date, para reservar a data, e passar a convite completo quando quiserem.',
      },
      {
        question: 'Quanto custa?',
        answer:
          'Depende do número de convidados. Falem connosco pelo WhatsApp e enviamos-vos um orçamento.',
      },
    ],
  },
  final: {
    script: 'Vamos começar?',
    text: 'Falem connosco pelo WhatsApp: criamos a vossa conta e ajudamos a preparar um convite à medida do vosso grande dia.',
  },
  footer: {
    navLabel: 'Ligações do rodapé',
    tagline: 'Convites de casamento digitais, elegantes e pessoais.',
    /** {year} */
    rights: '© {year} Convites Digitais',
    contact: 'Falar connosco pelo WhatsApp',
  },
  demo: {
    /** {theme} */
    title: 'Demonstração do tema {theme}',
    description:
      'Um convite completo no tema {theme}, com dados de exemplo: envelope, música, contagem regressiva, fotos, programa do dia e confirmação de presença.',
    badge: 'Demonstração',
    back: 'Início',
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
  /** Header links. */
  links: {
    label: 'Menu da conta',
    account: 'A minha conta',
    admin: 'Administração',
  },
} as const;

/** "A minha conta": the signed-in user's details and password (couples and admins). */
export const account = {
  title: 'A minha conta',
  details: {
    legend: 'Os seus dados',
    name: 'Nome',
    email: 'E-mail',
    hint: 'Para alterar o nome ou o e-mail, contacte-nos.',
    adminHint: 'Altere o nome ou o e-mail na administração:',
    adminLink: 'a sua conta',
  },
  password: {
    legend: 'Alterar a palavra-passe',
    hint: 'Ao alterar a palavra-passe, as sessões abertas noutros dispositivos terminam.',
    current: 'Palavra-passe atual',
    new: 'Nova palavra-passe',
    /** {min} */
    newHint:
      'Pelo menos {min} caracteres. Uma frase curta é fácil de lembrar e difícil de adivinhar.',
    confirm: 'Repita a nova palavra-passe',
    show: 'Mostrar as palavras-passe',
    submit: 'Alterar a palavra-passe',
    submitting: 'A alterar…',
    changed: 'Palavra-passe alterada.',
  },
  validation: {
    currentRequired: 'Introduza a palavra-passe atual.',
    /** {min} */
    tooShort: 'Use pelo menos {min} caracteres.',
    /** {max} */
    tooLong: 'Use no máximo {max} caracteres.',
    mismatch: 'As palavras-passe não coincidem.',
    sameAsCurrent: 'Escolha uma palavra-passe diferente da atual.',
  },
  errors: {
    invalid: 'Verifique os campos assinalados.',
    'wrong-password': 'A palavra-passe atual está incorreta.',
    'rate-limited': 'Demasiadas tentativas. Aguarde alguns minutos e tente de novo.',
    unauthenticated: 'A sua sessão terminou. Entre de novo para continuar.',
    unavailable: 'Não foi possível alterar agora. Tente de novo dentro de momentos.',
  },
} as const;

/** The platform owner's area (/admin): events, accounts and the audit log. */
export const admin = {
  title: 'Administração',
  nav: {
    label: 'Secções da administração',
    events: 'Eventos',
    accounts: 'Contas',
    audit: 'Registo de atividade',
    dashboard: 'Painel',
  },
  common: {
    search: 'Procurar',
    status: 'Estado',
    all: 'Todos',
    filter: 'Filtrar',
    clear: 'Limpar filtros',
    pagination: 'Páginas',
    previous: 'Anterior',
    next: 'Seguinte',
    /** {page}, {pages} */
    page: 'Página {page} de {pages}',
    /** {count} */
    results: '{count} resultado(s)',
    noResults: 'Nenhum resultado para estes filtros.',
    save: 'Guardar',
    saving: 'A guardar…',
    saved: 'Guardado.',
    cancel: 'Cancelar',
    close: 'Fechar',
    you: 'Você',
  },
  events: {
    title: 'Eventos',
    new: 'Novo evento',
    searchPlaceholder: 'Noivos, endereço ou e-mail da conta',
    statuses: { active: 'Ativos', inactive: 'Desativados' },
    empty: 'Ainda não há eventos. Crie o primeiro.',
    active: 'Ativo',
    inactive: 'Desativado',
    /** {count}, {limit} */
    guests: '{count} de {limit} convidados',
    manage: 'Gerir',
    /** {couple} */
    manageLabel: 'Gerir o evento de {couple}',
  },
  event: {
    back: 'Eventos',
    account: 'Conta dos noivos',
    suspendedAccount: 'Conta suspensa',
    address: 'Endereço dos convites',
    date: 'Data',
    theme: 'Tema',
    phase: 'Fase',
    /** {date} */
    created: 'Criado a {date}',
    guests: 'Convidados',
    people: 'Pessoas confirmadas',
    openDashboard: 'Abrir no painel',
    edit: 'Editar convite',
    status: {
      legend: 'Estado',
      activeHint: 'Ativo: os convidados abrem o convite.',
      inactiveHint:
        'Desativado: os convidados veem «Convite não encontrado». Os noivos continuam a ver e a editar o evento no painel.',
      activate: 'Ativar evento',
      deactivate: 'Desativar evento',
      /** {couple} */
      deactivateConfirm:
        'Desativar o evento de {couple}? Os convidados deixam de conseguir abrir o convite.',
      activated: 'Evento ativado: os convidados já abrem o convite.',
      deactivated: 'Evento desativado.',
    },
    limit: {
      legend: 'Limite de convidados',
      /** {count} */
      hint: 'O plano dos noivos: quantos convidados podem adicionar. O evento tem agora {count}.',
      label: 'Limite',
      save: 'Guardar limite',
      saved: 'Limite guardado.',
    },
  },
  newEvent: {
    title: 'Novo evento',
    intro:
      'Crie o evento e, se for preciso, a conta dos noivos. O evento começa em Save the Date; os noivos completam o resto no painel.',
    owner: {
      legend: 'Conta dos noivos',
      existing: 'Conta existente',
      new: 'Nova conta',
      choose: 'Conta',
      placeholder: 'Escolha a conta',
      none: 'Ainda não há contas de noivos ativas: crie uma nova.',
      newHint: 'A palavra-passe temporária aparece depois de criar o evento.',
    },
    couple: 'Noivos',
    groomName: 'Nome do noivo',
    brideName: 'Nome da noiva',
    date: 'Data do casamento',
    time: 'Hora da cerimónia',
    slug: 'Endereço dos convites',
    /** {example} */
    slugHint:
      'Faz parte do link de cada convidado: {example}. Letras minúsculas, números e hífenes. Não pode ser alterado depois.',
    theme: 'Tema',
    guestLimit: 'Limite de convidados',
    guestLimitHint: 'O plano dos noivos. Pode ser alterado depois.',
    submit: 'Criar evento',
    submitting: 'A criar…',
    created: {
      title: 'Evento criado',
      /** {couple} */
      text: 'O evento de {couple} está pronto, em Save the Date.',
      manage: 'Gerir o evento',
      open: 'Abrir no painel',
      another: 'Criar outro evento',
    },
  },
  accounts: {
    title: 'Contas',
    new: 'Nova conta',
    searchPlaceholder: 'Nome ou e-mail',
    statuses: { active: 'Ativas', suspended: 'Suspensas' },
    roles: { couple: 'Noivos', admin: 'Administrador' },
    suspended: 'Suspensa',
    events: { one: 'evento', other: 'eventos' },
    /** {date} */
    created: 'Criada a {date}',
    empty: 'Ainda não há contas.',
    manage: 'Gerir',
    /** {name} */
    manageLabel: 'Gerir a conta de {name}',
  },
  newAccount: {
    title: 'Nova conta de noivos',
    intro:
      'A conta com que os noivos entram no painel. A palavra-passe temporária aparece a seguir, uma só vez.',
    name: 'Nome',
    nameHint: 'Por exemplo «Braúlio e Nanda».',
    email: 'E-mail',
    submit: 'Criar conta',
    submitting: 'A criar…',
    created: {
      title: 'Conta criada',
      createEvent: 'Criar um evento para esta conta',
      manage: 'Ver a conta',
    },
  },
  accountDetail: {
    back: 'Contas',
    ownAccount: 'É a sua conta. A palavra-passe altera-se em «A minha conta».',
    details: {
      legend: 'Dados da conta',
      name: 'Nome',
      email: 'E-mail',
      emailHint: 'O e-mail com que a conta entra no painel.',
    },
    events: {
      title: 'Eventos',
      empty: 'Esta conta ainda não tem eventos.',
      create: 'Criar evento',
    },
    password: {
      legend: 'Palavra-passe',
      hint: 'Gera uma nova palavra-passe temporária. A atual deixa de funcionar e as sessões abertas terminam.',
      reset: 'Gerar nova palavra-passe',
      /** {name} */
      confirm: 'Gerar uma nova palavra-passe para {name}? A atual deixa de funcionar.',
    },
    access: {
      legend: 'Acesso',
      activeHint: 'A conta pode entrar no painel.',
      suspendedHint:
        'Suspensa: não consegue entrar no painel. Os eventos continuam como estão (desative-os na página de cada evento).',
      suspend: 'Suspender conta',
      unsuspend: 'Reativar conta',
      /** {name} */
      suspendConfirm: 'Suspender a conta de {name}? As sessões abertas terminam de imediato.',
      suspended: 'Conta suspensa.',
      unsuspended: 'Conta reativada.',
    },
  },
  temporaryPassword: {
    title: 'Palavra-passe temporária',
    hint: 'Envie-a aos noivos, por exemplo pelo WhatsApp. Não voltará a ser mostrada.',
    copy: 'Copiar palavra-passe',
    copyMessage: 'Copiar mensagem para os noivos',
    copied: 'Copiado!',
    copyFailed: 'Não foi possível copiar. Selecione o texto e copie-o manualmente.',
    /** {url}, {email}, {password} */
    message:
      'Olá! A vossa conta nos Convites Digitais está pronta.\n\nEntrem em: {url}\nE-mail: {email}\nPalavra-passe temporária: {password}\n\nDepois de entrar, escolham uma palavra-passe vossa em «A minha conta».',
  },
  audit: {
    title: 'Registo de atividade',
    intro:
      'Tudo o que os administradores alteram, aqui e no painel dos noivos. As entradas não podem ser alteradas nem apagadas.',
    recent: 'Atividade recente',
    all: 'Ver todo o registo',
    empty: 'Sem atividade registada.',
    action: 'Ação',
    allActions: 'Todas as ações',
    groups: { adminArea: 'Administração', dashboard: 'No painel dos noivos' },
    /** {target} */
    filteredBy: 'Só a atividade de {target}.',
    showAll: 'Ver toda a atividade',
    commandLine: 'Linha de comandos',
    deletedAccount: 'Conta apagada',
    targets: { event: 'Evento', user: 'Conta' },
    actions: {
      'event.create': 'Criou o evento',
      'event.activate': 'Ativou o evento',
      'event.deactivate': 'Desativou o evento',
      'event.guest-limit': 'Alterou o limite de convidados',
      'user.create': 'Criou a conta',
      'user.update': 'Alterou os dados da conta',
      'user.password-reset': 'Gerou uma nova palavra-passe',
      'user.suspend': 'Suspendeu a conta',
      'user.unsuspend': 'Reativou a conta',
      'user.promote': 'Tornou a conta administradora',
      'event.edit': 'Editou o convite',
      'event.invite-message': 'Alterou a mensagem de envio',
      'media.upload': 'Carregou um ficheiro',
      'media.delete': 'Removeu um ficheiro',
      'media.reorder': 'Reordenou a galeria',
      'media.describe': 'Alterou a descrição de uma foto',
      'media.retry': 'Voltou a preparar um ficheiro',
      'guest.create': 'Adicionou um convidado',
      'guest.update': 'Alterou um convidado',
      'guest.delete': 'Apagou um convidado',
      'guest.renew-link': 'Gerou um novo link de convidado',
      'guest.mark-sent': 'Marcou um convite como enviado ou por enviar',
      'guest.answer': 'Registou a resposta de um convidado',
      'guest.import': 'Importou convidados',
      'guest.export': 'Descarregou dados dos convidados',
    },
    /** Names of the changed fields and details. Unknown keys are shown as they are. */
    fields: {
      isActive: 'Ativo',
      guestLimit: 'Limite de convidados',
      name: 'Nome',
      email: 'E-mail',
      role: 'Função',
      slug: 'Endereço',
      owner: 'Conta',
      newAccount: 'Conta nova',
      via: 'Origem',
      guestId: 'Convidado (ID)',
      mediaId: 'Ficheiro (ID)',
      importId: 'Importação (ID)',
      type: 'Tipo',
      file: 'Ficheiro',
      rows: 'Linhas',
      sent: 'Enviado',
      suspended: 'Suspensa',
      sessionsEnded: 'Sessões terminadas',
    },
    values: { yes: 'sim', no: 'não', empty: '—' },
    /** Stored detail values shown in words. Unknown values are shown as they are. */
    valueLabels: {
      list: 'lista de convidados',
      'import-errors': 'linhas com erros de uma importação',
      HERO: 'ilustração principal',
      GALLERY: 'foto da galeria',
      MUSIC: 'música',
      LOGO: 'logótipo',
      couple: 'noivos',
      admin: 'administrador',
      cli: 'linha de comandos',
    },
  },
  errors: {
    invalid: 'Verifique os campos assinalados.',
    unauthenticated: 'A sua sessão terminou. Entre de novo para continuar.',
    'not-found': 'Já não existe. Atualize a página.',
    'rate-limited': 'Demasiados pedidos seguidos. Aguarde um pouco e tente de novo.',
    unavailable: 'Não foi possível concluir agora. Tente de novo dentro de momentos.',
    'email-taken': 'Já existe uma conta com este e-mail.',
    /** {suggestion} */
    'slug-taken': 'Este endereço já está a ser usado. Sugestão: {suggestion}',
    /** {count} */
    'limit-below-guests': 'O evento já tem {count} convidados: o limite não pode ser menor.',
    'own-account': 'Não pode fazer isto à sua própria conta.',
    'last-admin': 'Tem de ficar pelo menos um administrador ativo.',
    'owner-invalid': 'Escolha uma conta de noivos ativa.',
  },
  validation: {
    slug: 'Use letras minúsculas sem acentos, números e hífenes (ex.: ana-e-joao).',
    /** {max} */
    guestLimit: 'Escolha um número entre 1 e {max}.',
    chooseAccount: 'Escolha a conta dos noivos.',
  },
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
  import: {
    open: 'Importar lista (CSV)',
    title: 'Importar convidados',
    intro:
      'Um ficheiro CSV com um convidado por linha e, na primeira linha, os nomes das colunas: nome, telefone, lugares e grupo. Só o nome é obrigatório; sem lugares, conta 1.',
    excel:
      'No Excel: Ficheiro › Guardar como › «CSV UTF-8». No Google Sheets: Ficheiro › Transferir › CSV.',
    template: 'Descarregar um modelo',
    file: 'Ficheiro CSV',
    /** {max} */
    fileHint:
      'Até {max} convidados por ficheiro. Quem já está na lista (mesmo nome e telemóvel) é ignorado, por isso pode importar o mesmo ficheiro de novo.',
    submit: 'Importar',
    uploading: 'A enviar o ficheiro…',
    processing: 'A importar…',
    another: 'Importar outro ficheiro',
    /** {count} */
    imported: '{count} convidado(s) importado(s).',
    /** {count} */
    duplicates: '{count} já estava(m) na lista.',
    /** {count} */
    invalid: '{count} linha(s) com erros não foram importadas.',
    nothingNew: 'Nenhum convidado novo.',
    problems: {
      title: 'Linhas não importadas',
      row: 'Linha',
      name: 'Nome',
      problem: 'Problema',
      duplicate: 'Já está na lista.',
      /** {count} */
      more: '… e mais {count}.',
    },
    downloadErrors: 'Descarregar as linhas com erros (CSV)',
    downloadErrorsHint: 'Corrija-as no ficheiro descarregado e importe-o de novo.',
    failures: {
      empty: 'O ficheiro não tem convidados.',
      'no-name-column':
        'Não encontrámos a coluna «nome». A primeira linha do ficheiro deve ter os nomes das colunas: nome, telefone, lugares e grupo.',
      /** {max} */
      'too-many-rows': 'O ficheiro tem mais de {max} linhas. Divida-o em ficheiros mais pequenos.',
      /** {count}, {room} */
      limit:
        'O ficheiro tem {count} convidado(s) novo(s), mas o seu plano só tem lugar para mais {room}. Nada foi importado.',
      error: 'Não foi possível importar o ficheiro. Tente de novo.',
    },
    errors: {
      type: 'Escolha um ficheiro CSV.',
      /** {max} */
      size: 'O ficheiro é demasiado grande (máximo {max} KB).',
      empty: 'O ficheiro está vazio.',
    },
    errorColumns: { row: 'linha', error: 'erro' },
    templateFileName: 'modelo-convidados.csv',
    /** {date} */
    errorsFileName: 'convidados-com-erros-{date}.csv',
    templateRows: [
      ['Família Silva', '900 000 101', '4', 'Família da noiva'],
      ['Ana e Pedro', '', '2', 'Amigos'],
    ],
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
    /** Read before the envelope's visible text (the couple's names, the addressee). */
    openButton: 'Abrir o convite de',
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
  account,
  admin,
  eventNav,
  overview,
  guests,
  editor,
  invitationDefaults,
  invitation,
  designPreview,
} as const;

export type Dictionary = typeof ptAO;
