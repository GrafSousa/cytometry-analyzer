# Example spreadsheet (fictional)

`example-24h-exp1.xlsx` has the same layout as a MACSQuant export: the Depth, Name, Statistic and #Cells columns, plus compensation, unstained, viobility, panel 1 and panel 2 samples. **Every number is made up.** The `.grid.json` file is the same grid as JSON, used by the tests that do not depend on SheetJS.

The values were chosen to be easy to check by hand:

| Panel | Alive  | PerCP-Vio700-A+ | PE-A+          | PE-Vio770-A+ (mean)                  | APC-A+         | APC-Vio770-A+ |
| ----- | ------ | --------------- | -------------- | ------------------------------------ | -------------- | ------------- |
| 1     | 10.000 | 7.500 (75,00%)  | 2.000 (20,00%) | (2.000 + 1.800) / 2 = 1.900 (19,00%) | 5.200 (52,00%) | 500 (5,00%)   |
| 2     | 8.000  | 100 (1,25%)     | 160 (2,00%)    | (7.900 + 7.900) / 2 = 7.900 (98,75%) | 7.700 (96,25%) | 900 (11,25%)  |

The numbers use the pt-BR format the app shows. Never put real lab spreadsheets in this repository: it is public.
