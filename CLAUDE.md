# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório. Leia este arquivo inteiro antes de mudar qualquer coisa. O plano dos próximos passos está em `docs/IMPLEMENTACAO.md`.

## O que é

Aplicação web em Next.js + TypeScript que lê planilhas exportadas do citômetro MACSQuant (`.xls`, `.xlsx` ou `.csv`). Para cada planilha, ela calcula o percentual de cada marcador positivo em relação às células vivas (Alive), separadamente no panel 1 e no panel 2. **Tudo roda no navegador:** não há servidor nem banco de dados, e os arquivos nunca saem do computador do usuário.

## Comandos

```bash
npm install        # Node >= 22.12; a SheetJS vem de cdn.sheetjs.com (ver package.json)
npm run dev        # http://localhost:3000
npm test           # Vitest (ambiente node)
npm run typecheck  # tsc --noEmit
npm run build      # site estático em out/ (output: 'export')
```

Antes de abrir um PR, rode sempre `npm run typecheck` e `npm test`.

## Regras de negócio (não mude sem pedido explícito)

1. Usar só as colunas **Name** e **#Cells**.
2. Considerar só as linhas com `panel 1_` ou `panel 2_` no nome. `panel 10_` não conta. Cada panel é calculado separadamente.
3. **100%** = #Cells da linha cujo nome termina em `/Alive`.
4. Os quadrantes `.../Alive/Qn: MARCADOR± , MARCADOR±` (Q1–Q12) formam 3 grupos: Q1–Q4, Q5–Q8 e Q9–Q12. Cada grupo soma exatamente o Alive.
5. Marcadores negativos (`-`) são ignorados. Para cada marcador positivo (`+`), somar o #Cells dos quadrantes em que ele aparece, dentro de cada grupo.
6. Se o marcador aparece em mais de um grupo (ex.: `PE-Vio770-A+`), o total é a **média** das somas dos grupos.
7. % = total ÷ Alive, exibido com 2 casas decimais e no formato pt-BR (`94,11%`, `8.664`, `1.798,5`).
8. **Cada planilha é independente.** Nunca há média entre planilhas, e um erro numa planilha nunca afeta as outras.
9. Se faltar um panel, o outro é mostrado normalmente junto com o erro (status `partial`).
10. Até 50 arquivos por envio.

Os erros possíveis estão em `src/core/errors.ts` (union `DomainError`). Cada código tem uma mensagem em português em `toMessage`, e o `switch` é exaustivo: um código novo sem mensagem não compila.

## Arquitetura

```
src/core/       regras puras: naming, rows, compute, analyze, search, format, errors, result, types
src/adapters/   sheetjs.ts — ÚNICO arquivo que importa 'xlsx'
src/services/   processBatch.ts (lote, isolamento de erros) e cache.ts (cache por SHA-256)
src/components/ React (client components)
src/app/        Next.js App Router: layout, page, globals.css
src/config.ts   nome do app e prefixo do armazenamento
```

Regras que valem sempre:

- **`src/core` é puro.** Não importa React, Next, SheetJS, `window` nem `document`. Recebe dados e devolve dados. É aí que ficam as regras e a maior parte dos testes.
- **Erros são dados, não exceções.** Use `Result<T, E>` (`src/core/result.ts`) e `DomainError`. `processFile` nunca rejeita: qualquer falha vira um `FileReport` com `status: 'failed'`.
- **A leitura da planilha é injetável.** `processBatch(files, { read, cache, onProgress })` aceita um leitor falso nos testes. Mantenha assim.
- **Cache:** a chave é `v{CALC_VERSION}:{sha256 do conteúdo}`. **Toda mudança nas regras de cálculo exige aumentar `CALC_VERSION`** em `src/core/types.ts`. O cache guarda só resultados, nunca o conteúdo da planilha.
- O nome do app fica só em `src/config.ts`. Não escreva "Planilhas Anna" em outros lugares do código.

## Interface e Design System

- Telas: https://claude.ai/artifact/3BkQcc3a7oaZy6YNsKTVD5
- Design System: https://claude.ai/artifact/EWPdcWnjpE2kmqme2tG6Wv
- `src/app/globals.css` é gerado do Design System: as variáveis vêm de `tokens.json`, e as classes `pa-*` e as animações vêm de `components/bundle.css`. Use as classes `pa-*` e as variáveis (`var(--accent)`, `var(--space-4)`…). **Nunca use cores em hexadecimal soltas no código.**
- Texto da interface em português do Brasil, frases curtas, tratando o usuário por "você". Status sempre em texto (Sucesso, Parcial, Erro, Do cache), nunca só com cor.
- Acessibilidade: uma região `role="status"` com o resumo do lote, inputs reais com `<label>`, foco visível, alvos de pelo menos 44 px e `prefers-reduced-motion` respeitado.

## Testes

- Vitest em `tests/`, organizado como `src/`. Um teste novo para cada regra ou erro novo.
- A planilha de exemplo (`tests/fixtures/exemplo/`) é **fictícia**. Os números esperados estão no README dela.
- **NUNCA faça commit de planilhas reais do laboratório: o repositório é público.** Para testar com arquivos reais, coloque-os em `fixtures-local/` (já no `.gitignore`). `tests/adapters/local.test.ts` lê essa pasta quando ela existe.

## Git

- Nunca faça commit direto na `main`. Crie uma branch (`feat/…`, `fix/…`, `docs/…`) e abra um PR para revisão.
- Mensagens de commit em português, no imperativo: "Adiciona busca por nome".
