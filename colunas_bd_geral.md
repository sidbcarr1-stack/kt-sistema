# Estrutura de Colunas - BD_Geral

Este documento mapeia todas as colunas da planilha **BD_Geral**, definindo seus nomes, rótulos (labels), tipos de dados e regras de salvamento ou cálculo. 

> [!NOTE]
> Colunas marcadas com **NÃO GRAVAR NA PLANILHA** (como fórmulas da planilha ou campos virtuais de cálculo) não devem ser salvas/enviadas pelo aplicativo para o Google Sheets.

---

| Coluna | Nome | Rótulo (Label) | Tipo de Dados | Grava na Planilha? | Regras / Observações / Fórmulas |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **A** | ID | ID | Inteiro | **Não** | Não gravar na planilha |
| **B** | Instituição | Nome da Instituição | Texto | Sim | |
| **C** | Assistência | Nome da Assistência | Texto | Sim | |
| **D** | Planilha | Fechamento via Planilha | Texto | Sim | |
| **E** | Checklist | Tem Checklist? | Texto | Sim | |
| **F** | Situação | Situação | Texto | Sim | |
| **G** | Observação | Descrição | Texto | Sim | |
| **H** | Pendência | Pendência | Texto | Sim | |
| **I** | Pedágio | Pedágio | Texto | Sim | |
| **J** | Protocolo | Protocolo | Texto | Sim | |
| **K** | Data | Data do Serviço | Data (dd/mm/aaaa) | Sim | |
| **L** | HR_Aciona | Hora do Serviço | Hora (HH:mm) | Sim | |
| **M** | Serviço | Nome do Serviço | Texto | Sim | |
| **N** | Motorista | Nome do Motorista | Texto | Sim | |
| **O** | Foto Enviada | Foto Enviada Por: | Texto | Sim | |
| **P** | Placa | Placa do Veículo | Texto | Sim | |
| **Q** | Guincho | Nome do Carro Guincho | Texto | **Não** | Não gravar na planilha |
| **R** | PlacaGuincho | Placa do Carro Guincho | Texto | Sim | |
| **S** | VlrSaída | Valor de Saída | Moeda | Sim | |
| **T** | VlrHP | Valor da Hora Parada | Moeda | Sim | |
| **U** | QdeHP | Quantidade de Hora Parada | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **V** | TotalHP | Valor Total de Hora Parada | Moeda | **Não** | Calcular `T * U` somente se `T` e `U` tiverem valores. Não gravar. |
| **W** | VlrHT | Valor da Hora Trabalhada | Moeda | Sim | |
| **X** | QdeHT | Quantidade de Hora Trabalhada | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **Y** | TotalHT | Valor Total de Hora Trabalhada | Moeda | **Não** | Calcular `W * X` somente se `W` e `X` tiverem valores. Não gravar. |
| **Z** | VlrKM | Valor do KM Excedente | Moeda | Sim | |
| **AA** | QdeKM | Quantidade de KM Excedente | Número (2 dec.) | Sim | |
| **AB** | TotalKM | Valor Total de KM Excedente | Moeda | **Não** | Calcular `Z * AA` somente se `Z` e `AA` tiverem valores. Não gravar. |
| **AC** | VlrPA | Valor do Patins | Moeda | Sim | |
| **AD** | QdePA | Quantidade de Patins | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **AE** | TotalPA | Valor Total de Patins | Moeda | **Não** | Calcular `AC * AD` somente se `AC` e `AD` tiverem valores. Não gravar. |
| **AF** | VlrMA | Valor do Macaco | Moeda | Sim | |
| **AG** | QdeMA | Quantidade de Macaco | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **AH** | TotalMA | Valor Total de Macaco | Moeda | **Não** | Calcular `AF * AG` somente se `AF` e `AG` tiverem valores. Não gravar. |
| **AI** | VlrDI | Valor da Diária | Moeda | Sim | |
| **AJ** | QdeDI | Quantidade de Diária | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **AK** | TotalDI | Valor Total da Diária | Moeda | **Não** | Calcular `AI * AJ` somente se `AI` e `AJ` tiverem valores. Não gravar. |
| **AL** | VlrPE | Valor do Pedágio | Moeda | Sim | |
| **AM** | QdePE | Quantidade de Pedágio | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **AN** | TotalPE | Valor Total de Pedágio | Moeda | **Não** | Calcular `AL * AM` somente se `AL` e `AM` tiverem valores. Não gravar. |
| **AO** | Carga | Carga | Número (2 dec.) | Sim | Só mostrar decimais se digitadas, senão apenas o número inteiro. |
| **AP** | ExcedPG_Assoc | Excedente Pago Pelo Associado ou Ajuste | Moeda | Sim | |
| **AQ** | Total | Valor Total do Serviço | Moeda | **Não** | Calcular `(S+V+Y+AB+AE+AH+AK+AN+AP)` somente se qualquer uma dessas não estiver vazia. Não gravar. |
| **AR** | VlrCheck | Valor Total Anotado no Checklist | Moeda | Sim | |
| **AS** | Diferença | Diferença Entre Valor Total e Anotado no Checklist | Moeda | **Não** | Não gravar na planilha |
| **AT** | Observação1 | Observação 1 | Texto | Sim | |
| **AU** | VlrBaseComissão | Valor Base Para Comissão | Moeda | Sim | Calcular `=AQ` (Se tiver valor em `AU` permanece ele, senão recebe automaticamente `AQ` se `AQ` não vazio). |
| **AV** | ObsComissão | Observação Comissão | Texto | Sim | |
| **AW** | DT-PG-Prog | Data Programada Para Pagamento | Data (dd/mm/aaaa) | Sim | |
| **AX** | Nº FatVeniti | Nº Faturamento VENITI | Texto | Sim | |
| **AY** | Nº NF/REC KT | Nº NF ou Recibo KT | Texto | Sim | |
| **AZ** | Nº Boleto KT | Nº do Boleto KT | Texto | Sim | |
| **BA** | VlrPG-Assist | Valor Pago Pela Assistência | Moeda | Sim | |
| **BB** | DiferPG | Diferença no Pagamento | Moeda | Sim | |
| **BC** | Serviço Efetivado? | Serviço Efetivado? | Texto | Sim | |
| **BD** | informação Adicional | informação Adicional | Texto | Sim | |
| **BE** | FechaV-Ision | Fechamento Velox Ision | Texto | Sim | |
| **BF** | Observação Pedágio | Observação Pedágio | Texto | Sim | |
| **BG** | Em Negociação? | Em Negociação? | Texto | Sim | `"SIM"` ou `"NÃO"` |
| **BH** | ResultadoNegociação | Resultado da Negociação | Texto | Sim | `"Favorável"` ou `"Desfavorável"` |
| **BI** | VlrIniOperadora | Valor Inicial Pago Pela Operadora | Moeda | Sim | |
| **BJ** | VlrNegociado | Valor Negociado | Moeda | Sim | |
| **BK** | EmissaoNF_REC | Data de Emissão da NF ou Recibo KT | Data (dd/mm/aaaa) | Sim | |
| **BL** | DiasDT_PG | Qde de Dias Para o Pagamento | Inteiro | **Não** | Inserido automaticamente se `BM` vazio via fórmula: `=ARRAYFORMULA(SE(B5:B=""; ""; SEERRO(PROCV(B5:B; Parametros!F2:G; 2; 0); "")))`. Não gravar. |
| **BM** | DiasDT_PG_Manual | Qde de Dias Para o Pagamento(Manual) | Inteiro | Sim | |
| **BN** | DT_Pagto | Data de Pagamento | Data (dd/mm/aaaa) | **Não** | Calculado via fórmula: `=ARRAYFORMULA(SE(BK5:BK=\"\"; \"\"; BK5:BK + SEERRO(N(BM5:BM) + (BM5:BM=\"\")*N(BL5:BL))))`. Não gravar. |
| **BO** | EnderecoOrigem | Endereço de Origem | Texto | Sim | |
| **BP** | EnderecoDestino | Endereço de Destino | Texto | Sim | |
| **BQ** | NumOS/Pedido | Número da OS ou Pedido do Cliente | Texto | Sim | |
| **BR** | DtCompNF | Data de Competência da NF KT | Texto | Sim | |
| **BS** | DT_Pagto-1 | Segunda Data de Pagamento | Data (dd/mm/aaaa) | Sim | |
