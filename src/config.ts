/**
 * Nome e textos de marca do app, num lugar só.
 * Quando o nome definitivo for escolhido, basta trocar aqui (e no Design System).
 */
export const APP = {
  name: 'Planilhas Anna',
  tagline: 'Análise de citometria · panel 1 e panel 2',
  description: 'Calcula percentuais dos marcadores positivos por panel, direto no navegador.',
  /** Prefixo das chaves guardadas no navegador. Não mude depois de publicar, ou o cache existente será perdido. */
  storagePrefix: 'planilhas-anna',
} as const;
