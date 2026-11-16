import { APP } from "@/config";
import type { DomainError } from "@/core/errors";
import type { QuadGroup } from "@/core/types";

type ErrorMessages = {
  [Code in DomainError["code"]]: (error: Extract<DomainError, { code: Code }>) => string;
};

const GROUP_LABEL: Record<QuadGroup, string> = { 1: "Q1–Q4", 2: "Q5–Q8", 3: "Q9–Q12" };

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const errors: ErrorMessages = {
  UnsupportedFormat: (e) =>
    `Formato não suportado (${e.ext ? "." + e.ext : "sem extensão"}). Use .xls, .xlsx ou .csv.`,
  EmptyFile: () => "O arquivo está vazio.",
  UnreadableFile: (e) => `Não foi possível ler o arquivo. Ele pode estar corrompido. (${e.cause})`,
  MissingColumns: (e) => `Colunas obrigatórias não encontradas: ${e.expected.join(", ")}.`,
  MissingPanel: (e) => `Panel ${e.panel} não encontrado nesta planilha.`,
  MissingAliveRow: (e) => `Panel ${e.panel}: linha terminada em "/Alive" não encontrada.`,
  DuplicateAliveRow: (e) =>
    `Panel ${e.panel}: mais de uma linha "/Alive" (linhas ${e.lines.join(", ")}).`,
  NonNumericCells: (e) =>
    `Panel ${e.panel}: valor de #Cells não numérico na linha ${e.line} ("${String(e.raw ?? "")}").`,
  AliveZero: (e) =>
    `Panel ${e.panel}: #Cells da linha Alive é zero; não é possível calcular percentuais.`,
  NoQuadrantRows: (e) =>
    `Panel ${e.panel}: nenhuma linha de quadrante (Q1 a Q12) encontrada abaixo de Alive.`,
  QuadrantSumMismatch: (e) =>
    `Panel ${e.panel}: a soma dos quadrantes ${GROUP_LABEL[e.group]} (${e.actual}) é diferente do total de Alive (${e.expected}).`,
};

const status = {
  ok: (n: number) => count(n, "com sucesso", "com sucesso"),
  partial: (n: number) => count(n, "parcial", "parciais"),
  failed: (n: number) => count(n, "com erro", "com erro"),
  cached: (n: number) => (n === 1 ? "1 veio do cache" : `${n} vieram do cache`),
};

export const ptBR = {
  metadata: { title: `${APP.name} — análise de citometria`, description: APP.description },
  header: { privacy: "Os arquivos ficam no seu computador" },
  intro: {
    title: "Envie as planilhas exportadas do MACSQuant",
    text: "Para cada planilha, calculamos o percentual de cada marcador positivo em relação às células vivas (Alive) do panel 1 e do panel 2. Cada planilha é calculada separadamente.",
  },
  steps: {
    title: "Como o cálculo é feito",
    items: [
      {
        title: "Alive é o 100%",
        text: "O total de células vem da linha do panel que termina em “/Alive”.",
      },
      {
        title: "Só marcadores positivos",
        text: "Para cada marcador “+”, somamos as células dos quadrantes Q1 a Q12 em que ele aparece. Os “−” são ignorados.",
      },
      {
        title: "Média entre grupos",
        text: "Se o marcador aparece em dois grupos de quadrantes (como PE-Vio770-A+), usamos a média dos dois.",
      },
    ],
  },
  batch: {
    errorTitle: "Nenhuma planilha foi processada",
    empty: "Nenhum arquivo selecionado.",
    tooMany: (selected: number, max: number) =>
      `Você selecionou ${selected} arquivos. O máximo é ${max} por vez. Selecione menos arquivos e tente de novo.`,
  },
  actions: {
    clearResults: "Limpar resultados",
    clearCache: "Limpar cache",
    cacheSize: (n: number) => `${n} resultados guardados neste navegador`,
  },
  summary: {
    processing: (done: number, total: number) => `Processando ${done} de ${total} planilhas…`,
    processed: (n: number) => count(n, "planilha processada", "planilhas processadas"),
    status,
  },
  results: { label: "Resultados por planilha" },
  card: {
    status: { ok: "Sucesso", partial: "Parcial", failed: "Erro" },
    cached: "Do cache",
    cachedHint: "Este conteúdo já tinha sido calculado; o resultado foi reaproveitado.",
    otherPanelOk: "O outro panel foi calculado normalmente.",
  },
  panel: {
    title: (panel: number) => `Panel ${panel}`,
    alive: "Alive (100%):",
    cellsUnit: "células",
    columns: {
      marker: "Marcador",
      quadrants: "Quadrantes",
      cells: "Células",
      percent: "% do Alive",
    },
    average: (parts: string[]) => `média de ${parts.join(" e ")}`,
  },
  search: {
    label: "Buscar planilha pelo nome",
    clear: "Limpar busca",
    showing: "Mostrando",
    of: "de",
    files: "planilhas",
    emptyTitle: (query: string) => `Nenhuma planilha com “${query}”`,
    emptyHint: "Confira o nome ou busque só uma parte dele, como “48h” ou “exp1”.",
  },
  upload: {
    title: "Arraste as planilhas para cá",
    drop: "Solte para calcular",
    or: "ou",
    choose: "Escolher arquivos",
    hint: (max: number) => `.xls, .xlsx ou .csv · até ${max} arquivos por vez`,
    compact: "Arraste mais planilhas ou clique para escolher",
    busy: "Aguarde o fim do processamento para enviar novas planilhas",
    sendNew: "Enviar novas planilhas",
  },
  errors,
};
