# cytometry-analyzer

> Nome provisório do produto: **Planilhas Anna** (definido em `src/config.ts`). Para continuar o desenvolvimento, veja `CLAUDE.md` e `docs/IMPLEMENTACAO.md`.

Aplicação web que lê planilhas de citometria exportadas do MACSQuant (.xls, .xlsx ou .csv), calcula o percentual de cada marcador positivo em relação às células vivas (Alive) e mostra o resultado de cada planilha na tela.

Tudo roda **no navegador**: os arquivos não são enviados para nenhum servidor.

## Como rodar

Requisito: Node.js 22.12 ou mais recente.

```bash
npm install        # instala Next.js, React, Vitest e a SheetJS (baixada de cdn.sheetjs.com)
npm run dev        # abre em http://localhost:3000
npm test           # roda os testes
npm run typecheck  # confere os tipos
npm run build      # gera o site estático na pasta out/
```

A pasta `out/` pode ser publicada em qualquer hospedagem de arquivos estáticos (GitHub Pages, Cloudflare, Netlify, Vercel). Para o GitHub Pages, ajuste o `basePath` em `next.config.ts`.

> A SheetJS **não** é instalada pelo pacote `xlsx` do npm. Ele parou na versão 0.18.5, de 2022, que tem falhas de segurança conhecidas. O `package.json` aponta para o arquivo oficial em cdn.sheetjs.com. O `npm audit` não acompanha esse endereço, então confira de tempos em tempos se saiu uma versão nova em https://cdn.sheetjs.com.

## Regras de cálculo

Cada planilha é calculada sozinha. Não há média entre planilhas, e os resultados de arquivos diferentes nunca são combinados.

1. Usamos só as colunas **Name** e **#Cells**.
2. Analisamos só as linhas com `panel 1_` ou `panel 2_` no nome (`panel 10_` não conta). Cada panel é calculado separadamente.
3. **100%** = #Cells da linha cujo nome termina em `/Alive`.
4. As linhas de quadrante (`.../Alive/Q1: PE-A- , PerCP-Vio700-A+` até Q12) formam 3 grupos: Q1–Q4, Q5–Q8 e Q9–Q12.
5. Marcadores negativos (terminados em `-`) são ignorados. Para cada marcador positivo (terminado em `+`), somamos o #Cells dos quadrantes em que ele aparece.
6. Se o marcador aparece em **mais de um grupo** (ex.: `PE-Vio770-A+` em Q5–Q8 e em Q9–Q12), o total é a **média** das somas dos grupos.
7. % = total ÷ Alive, exibido com 2 casas decimais.

Exemplo com a planilha fictícia de `tests/fixtures/exemplo/`, panel 1 (Alive = 10.000):

| Marcador | Quadrantes | Células | % do Alive |
|---|---|---|---|
| PerCP-Vio700-A+ | Q1 + Q2 | 7.500 | 75,00% |
| PE-A+ | Q2 + Q3 | 2.000 | 20,00% |
| PE-Vio770-A+ | média de Q5 + Q6 (2.000) e Q9 + Q10 (1.800) | 1.900 | 19,00% |
| APC-A+ | Q6 + Q7 | 5.200 | 52,00% |
| APC-Vio770-A+ | Q10 + Q11 | 500 | 5,00% |

## Erros e mensagens

Cada planilha recebe um destes status:

- **Sucesso**: os dois panels foram calculados.
- **Parcial**: um panel foi calculado e o outro teve erro. O panel calculado aparece normalmente, junto com o erro do outro.
- **Erro**: nenhum panel pôde ser calculado, ou o arquivo não pôde ser lido.

Um erro numa planilha nunca afeta as outras do mesmo envio. Os erros verificados são:

| Código | Quando acontece |
|---|---|
| `UnsupportedFormat` | Extensão diferente de .xls, .xlsx ou .csv |
| `EmptyFile` / `UnreadableFile` | Arquivo vazio ou corrompido |
| `MissingColumns` | Não há colunas `Name` e `#Cells` |
| `MissingPanel` | Não há linhas do panel 1 ou do panel 2 |
| `MissingAliveRow` / `DuplicateAliveRow` | Nenhuma ou mais de uma linha `/Alive` no panel |
| `NonNumericCells` | #Cells vazio ou não numérico |
| `AliveZero` | Alive = 0 |
| `NoQuadrantRows` | Não há linhas Q1–Q12 |
| `QuadrantSumMismatch` | A soma de um grupo de 4 quadrantes é diferente do Alive |

As mensagens em português estão em `src/core/errors.ts`. Cada envio aceita até 50 arquivos.

## Busca por nome

Quando há 2 ou mais planilhas no resultado, aparece o campo **Buscar planilha pelo nome**.

- A busca filtra enquanto você digita e não diferencia maiúsculas de minúsculas, nem letras com e sem acento.
- Termos separados por espaço precisam aparecer todos no nome, em qualquer ordem: `48h exp1` encontra `BV2-48h-exp1.xlsx`.
- O trecho encontrado fica destacado no nome. Ao lado do campo aparece "Mostrando X de Y planilhas".
- Esc ou o botão × limpam a busca. Se nada for encontrado, aparece uma mensagem com o botão "Limpar busca".
- A lógica fica em `src/core/search.ts`, com testes em `tests/core/search.test.ts`.

## Nome do app

O nome e o subtítulo ficam em `src/config.ts`. Para trocar o nome, basta mudar ali, e também no Design System.

## Cache

Uma planilha já calculada não é calculada de novo.

- A chave do cache é a **impressão digital SHA-256 do conteúdo** do arquivo, junto com a versão das regras (`CALC_VERSION` em `src/core/types.ts`). O mesmo arquivo com outro nome vem do cache. Um arquivo com qualquer byte diferente é recalculado.
- O cache guarda **só o resultado** (números e mensagens), nunca o conteúdo da planilha. Ele fica no navegador (`localStorage`), vale para as próximas visitas e guarda até 500 planilhas. Acima disso, os resultados mais antigos são descartados.
- No cartão, o selo **Do cache** aparece ao lado do status. O resumo mostra quantos resultados vieram do cache, e o botão **Limpar cache** apaga tudo.
- **Ao mudar uma regra de cálculo, aumente `CALC_VERSION`.** Isso invalida os resultados antigos automaticamente.
- Se o armazenamento estiver cheio ou bloqueado, o app só recalcula e nunca quebra por causa do cache. Erros inesperados do leitor não vão para o cache.

## Design

- Telas: https://claude.ai/artifact/3BkQcc3a7oaZy6YNsKTVD5
- Design System (tokens, componentes, estados, movimento): https://claude.ai/artifact/EWPdcWnjpE2kmqme2tG6Wv

O `src/app/globals.css` é gerado a partir do Design System: as variáveis vêm de `tokens.json`, e as classes `pa-*` e as animações vêm de `components/bundle.css`. As animações param sozinhas quando o sistema operacional pede menos movimento (`prefers-reduced-motion`).

## Organização do código

```
src/
├─ core/            regras de negócio puras (sem React, sem SheetJS): fáceis de testar
│  ├─ naming.ts     reconhece panel, linha Alive e quadrantes pelo nome
│  ├─ rows.ts       acha o cabeçalho e converte #Cells
│  ├─ compute.ts    cálculo de um panel (somas, média entre grupos, validações)
│  ├─ analyze.ts    junta os dois panels num relatório por arquivo
│  ├─ errors.ts     códigos de erro + mensagens
│  ├─ format.ts     números e percentuais no formato brasileiro
│  └─ search.ts     busca por nome (sem acento, vários termos, destaque)
├─ adapters/
│  └─ sheetjs.ts    único arquivo que usa a SheetJS (lê .xls/.xlsx/.csv)
├─ services/
│  ├─ processBatch.ts  processa os arquivos um a um, isolando os erros
│  └─ cache.ts         cache de resultados por SHA-256 do conteúdo
├─ components/      AppHeader, UploadArea, SearchField, BatchSummary, FileResultCard, PanelTable, icons
└─ app/             página do Next.js (layout, page, CSS)
tests/
├─ core/            regras de cálculo, com números conferidos na planilha de exemplo
├─ services/        isolamento de erros no lote e cache
├─ adapters/        leitura de .xlsx/.xls/.csv com a SheetJS
└─ fixtures/exemplo/ planilha FICTÍCIA de exemplo (.xlsx e a mesma grade em JSON)
```

Para mudar uma regra de cálculo, edite `src/core/compute.ts` e o teste correspondente em `tests/core/compute.test.ts`.
