# Planilha de exemplo (fictícia)

`exemplo-24h-exp1.xlsx` tem o mesmo formato de um export do MACSQuant: as colunas Depth, Name, Statistic e #Cells, amostras de compensação, unstained, viobility, panel 1 e panel 2. **Todos os números são inventados.** O arquivo `.grid.json` é a mesma grade em JSON, usada pelos testes que não dependem da SheetJS.

Os valores foram escolhidos para facilitar a conferência à mão:

| Panel | Alive | PerCP-Vio700-A+ | PE-A+ | PE-Vio770-A+ (média) | APC-A+ | APC-Vio770-A+ |
|---|---|---|---|---|---|---|
| 1 | 10.000 | 7.500 (75,00%) | 2.000 (20,00%) | (2.000 + 1.800) / 2 = 1.900 (19,00%) | 5.200 (52,00%) | 500 (5,00%) |
| 2 | 8.000 | 100 (1,25%) | 160 (2,00%) | (7.900 + 7.900) / 2 = 7.900 (98,75%) | 7.700 (96,25%) | 900 (11,25%) |

Nunca coloque planilhas reais do laboratório neste repositório, porque ele é público.
