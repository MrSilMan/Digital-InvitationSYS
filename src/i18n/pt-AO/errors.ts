/** Error pages. Its own module: every page's error boundary imports it in the browser. */
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
