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

export const ptAO = { app, landing, errors } as const;

export type Dictionary = typeof ptAO;
