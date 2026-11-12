const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const count = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** 0.9411 → "94,11%" */
export const formatPercent = (fraction: number): string => percent.format(fraction);

/** 8664 → "8.664"; 1798.5 → "1.798,5" */
export const formatCells = (n: number): string => count.format(n);
