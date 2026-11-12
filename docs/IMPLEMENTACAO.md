# Plano de implementação

Este documento é o roteiro para continuar o projeto no Claude Code. Siga as etapas em ordem, uma branch e um PR por etapa. As regras do projeto estão em `CLAUDE.md`.

Para começar uma etapa no Claude Code, peça, por exemplo:

> Leia o CLAUDE.md e o docs/IMPLEMENTACAO.md e faça a Etapa 1.

## Onde estamos

O primeiro PR traz:

- ✅ As regras de cálculo completas, com a média do PE-Vio770-A+ e todos os erros combinados.
- ✅ O processamento em lote com cada arquivo isolado, os status `ok`, `partial` e `failed`, e o limite de 50 arquivos.
- ✅ O cache por conteúdo (SHA-256 + `CALC_VERSION`), guardado no navegador, com o botão "Limpar cache".
- ✅ A busca por nome: sem acento, com vários termos e com destaque.
- ✅ As telas seguindo o Design System, com animações.
- ✅ 81 testes das regras, do lote, do cache e da busca, que passam.
- ⚠️ **Ainda não rodou de verdade:** `npm install`, o build do Next, os testes da SheetJS (`tests/adapters/`) e as telas no navegador. O código foi escrito sem acesso à rede, então essas partes nunca foram executadas.

## Etapa 1: rodar o projeto e corrigir o que quebrar

Branch: `fix/primeira-execucao`

1. `npm install`. Se a URL da SheetJS falhar, veja se saiu versão nova em https://cdn.sheetjs.com e atualize o `package.json`.
2. `npm run typecheck`. Corrija os erros que aparecerem com os tipos reais do React, do Next e do Vitest.
3. `npm test`. Os testes de `tests/adapters/sheetjs.test.ts` rodam pela primeira vez aqui. Confira principalmente:
   - se a leitura do `.xlsx` de exemplo dá Alive 10.000 e 8.000;
   - se `.xls` (BIFF8) e `.csv` gerados pela SheetJS dão o mesmo resultado;
   - se bytes corrompidos nunca lançam exceção.
4. `npm run dev`. Envie a planilha de exemplo e confira na tela os números do `tests/fixtures/exemplo/README.md`.
5. `npm run build`. Precisa gerar `out/` sem erros, por causa do `output: 'export'`.

Pronto quando: os quatro comandos passam e a tela mostra os números esperados.

## Etapa 2: validar com planilhas reais (sem fazer commit delas)

Branch: `test/planilhas-reais`

1. Coloque exports reais do MACSQuant em `fixtures-local/`. Essa pasta está no `.gitignore` e **nunca vai para o repositório**.
2. `npm test`. O `tests/adapters/local.test.ts` processa cada arquivo da pasta e falha se algum der erro inesperado.
3. Para cada formato diferente encontrado (nome de linha, codificação, separador do CSV), crie um teste em `tests/core/` com dados fictícios que reproduzam o caso.
4. Se encontrar um `.xls` antigo (BIFF5) com acentos errados, ative as codepages da SheetJS (`set_cptable`) em `src/adapters/sheetjs.ts`.

Pronto quando: todos os arquivos reais disponíveis são processados como esperado.

## Etapa 3: qualidade automática (lint e CI)

Branch: `chore/ci`

1. Adicione o Biome (lint + formatação) com uma regra que proíbe importar `react`, `next`, `xlsx` ou `../adapters` dentro de `src/core/`.
2. Crie `.github/workflows/ci.yml` rodando, em cada PR, `npm ci`, `npm run typecheck`, `npx biome ci .`, `npm test -- --coverage` e `npm run build`.
3. Ative a proteção da branch `main` no GitHub: exigir PR e CI verde.

## Etapa 4: testes de tela

Branch: `test/e2e`

1. Testes de componente com Testing Library para `SearchField` (filtrar, Esc limpa, contagem) e `FileResultCard` (status, Do cache, panel ausente).
2. Playwright (`@playwright/test`), cobrindo três cenários:
   - enviar a planilha de exemplo e ver os percentuais;
   - enviar um lote com um arquivo corrompido no meio e ver as outras planilhas calculadas;
   - enviar o mesmo arquivo duas vezes e ver o selo "Do cache".
3. Adicione os testes do Playwright ao CI.

## Etapa 5: publicar

Branch: `chore/deploy`

1. GitHub Pages: ajuste o `basePath: '/cytometry-analyzer'` em `next.config.ts` e crie o workflow `.github/workflows/deploy.yml` (build → `out/` → Pages).
2. Opcional: uma versão de um único arquivo HTML, que abre sem internet nos computadores do laboratório.

## Pendências e decisões em aberto

- **Nome do produto:** ainda não definido. Quando for escolhido, troque em `src/config.ts`, no Design System e nas telas. **Não** troque o `storagePrefix` depois que o app for publicado, ou o cache dos usuários se perde.
- **Exportar resultados** (CSV, Excel ou PDF): fora do escopo por enquanto. Se entrar, crie `src/core/export.ts` puro, com testes.
- **Web Worker:** só vale a pena se as planilhas ficarem grandes. A leitura já é isolada em `src/adapters/sheetjs.ts`, então é fácil mover.
- **Revisão de acessibilidade** antes da primeira publicação: leitor de tela, navegação só pelo teclado e contraste.
