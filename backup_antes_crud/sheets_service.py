import gspread
from datetime import datetime

class SheetsService:
    def __init__(self, ss):
        self.ss = ss
        self.aba_principal = "BD_Geral"
        self.linha_cabecalho = 4
        
        self.colunas_gravaveis = [
            'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
            'R', 'S', 'T', 'U', 'W', 'X', 'Z', 'AA', 'AC', 'AD', 'AF', 'AG', 'AI', 'AJ',
            'AL', 'AM', 'AO', 'AP', 'AR', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ', 'BA', 
            'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BK', 'BM', 'BO', 'BP', 
            'BQ', 'BR', 'BS'
        ]

    def _obter_aba(self, nome_aba=None):
        nome = nome_aba or self.aba_principal
        return self.ss.worksheet(nome)

    def _converter_data_para_sheet(self, valor):
        if valor and isinstance(valor, str) and '-' in valor and len(valor) == 10:
            try:
                parts = valor.split('-')
                return f"{parts[2]}/{parts[1]}/{parts[0]}"
            except:
                pass
        return valor

    def _proxima_linha_vazia(self, aba):
        col_a = aba.col_values(1)
        ultima_linha_com_dados = self.linha_cabecalho - 1
        for i in range(self.linha_cabecalho - 1, len(col_a)):
            if col_a[i]:
                ultima_linha_com_dados = i + 1
        return ultima_linha_com_dados + 1

    def salvar_registro(self, dados_form):
        try:
            aba = self._obter_aba()
            proxima_linha = self._proxima_linha_vazia(aba)
            
            updates = []
            for col in self.colunas_gravaveis:
                valor = dados_form.get(col, "")
                valor = self._converter_data_para_sheet(valor)
                updates.append({
                    'range': f"{col}{proxima_linha}",
                    'values': [[valor]]
                })
            
            if updates:
                aba.batch_update(updates, value_input_option="USER_ENTERED")
            
            return True
        except Exception as e:
            raise Exception(f"Erro ao salvar: {str(e)}")

    def listar_registros(self, pagina=1, por_pagina=50, filtro=None):
        try:
            aba = self._obter_aba()
            dados = aba.get(f'A{self.linha_cabecalho}:ZZ2000')
            
            if not dados or len(dados) < 2:
                return {"total": 0, "pagina": pagina, "dados": []}
            
            linhas_raw = dados[1:]
            
            if filtro:
                filtro_lower = filtro.lower()
                linhas_raw = [
                    linha for linha in linhas_raw 
                    if any(filtro_lower in str(celula).lower() for celula in linha if celula)
                ]
            
            total = len(linhas_raw)
            inicio = (pagina - 1) * por_pagina
            fim = inicio + por_pagina
            linhas_paginadas = linhas_raw[inicio:fim]
            
            return {
                "total": total,
                "pagina": pagina,
                "por_pagina": por_pagina,
                "total_paginas": (total + por_pagina - 1) // por_pagina,
                "dados": linhas_paginadas
            }
        except Exception as e:
            raise Exception(f"Erro ao listar: {str(e)}")

    def listar_registros_filtrados(self, pagina=1, por_pagina=50, 
                                    campo1='', valor1='', data1_inicio='', data1_fim='',
                                    campo2='', valor2='', data2_inicio='', data2_fim=''):
        try:
            aba = self._obter_aba()
            dados = aba.get(f'A{self.linha_cabecalho}:ZZ2000')
            
            if not dados or len(dados) < 2:
                return {"total": 0, "pagina": pagina, "dados": []}
            
            cabecalhos = dados[0]
            linhas_raw = dados[1:]
            
            # col_indices = {col: idx for idx, col in enumerate(cabecalhos)}

            # Mapeamento fixo: letra da coluna → índice (0-based)
            col_indices = {}
            for idx, col in enumerate(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                                        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                                        'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK',
                                        'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV',
                                        'AW', 'AX', 'AY', 'AZ', 'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG',
                                        'BH', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BS']):
                col_indices[col] = idx
            
            linhas_filtradas = []
            for linha in linhas_raw:
                incluir = True
                
                # Filtro 1
                if campo1:
                    idx1 = col_indices.get(campo1, -1)
                    if idx1 >= 0 and idx1 < len(linha):
                        valor_celula = str(linha[idx1]).strip().lower()
                        
                        if campo1 in ['K', 'BK', 'BN', 'BR']:
                            if data1_inicio or data1_fim:
                                try:
                                    if linha[idx1]:
                                        data_celula = datetime.strptime(linha[idx1], '%d/%m/%Y').date()
                                        if data1_inicio:
                                            data_inicio = datetime.strptime(data1_inicio, '%Y-%m-%d').date()
                                            if data_celula < data_inicio:
                                                incluir = False
                                        if data1_fim and incluir:
                                            data_fim = datetime.strptime(data1_fim, '%Y-%m-%d').date()
                                            if data_celula > data_fim:
                                                incluir = False
                                except Exception as e:
                                    print(f"Erro data1: {e}")
                                    incluir = False
                        elif valor1:
                            valor_busca = str(valor1).strip().lower()
                            if valor_busca and valor_busca != valor_celula:
                                incluir = False
                
                # Filtro 2
                if incluir and campo2:
                    idx2 = col_indices.get(campo2, -1)
                    if idx2 >= 0 and idx2 < len(linha):
                        valor_celula = str(linha[idx2]).strip().lower()
                        
                        if campo2 in ['K', 'BK', 'BN', 'BR']:
                            if data2_inicio or data2_fim:
                                try:
                                    if linha[idx2]:
                                        data_celula = datetime.strptime(linha[idx2], '%d/%m/%Y').date()
                                        if data2_inicio:
                                            data_inicio = datetime.strptime(data2_inicio, '%Y-%m-%d').date()
                                            if data_celula < data_inicio:
                                                incluir = False
                                        if data2_fim and incluir:
                                            data_fim = datetime.strptime(data2_fim, '%Y-%m-%d').date()
                                            if data_celula > data_fim:
                                                incluir = False
                                except Exception as e:
                                    print(f"Erro data2: {e}")
                                    incluir = False
                        elif valor2:
                            valor_busca = str(valor2).strip().lower()
                            if valor_busca and valor_busca != valor_celula:
                                incluir = False
                
                if incluir:
                    linhas_filtradas.append(linha)
            
            total = len(linhas_filtradas)
            inicio = (pagina - 1) * por_pagina
            fim = inicio + por_pagina
            linhas_paginadas = linhas_filtradas[inicio:fim]
            
            return {
                "total": total,
                "pagina": pagina,
                "por_pagina": por_pagina,
                "total_paginas": (total + por_pagina - 1) // por_pagina,
                "dados": linhas_paginadas
            }
        except Exception as e:
            raise Exception(f"Erro ao filtrar: {str(e)}")

    def buscar_registro_por_id(self, id_valor):
        try:
            aba = self._obter_aba()
            dados = aba.get(f'A{self.linha_cabecalho}:ZZ2000')
            
            if not dados or len(dados) < 2:
                return None
            
            for linha in dados[1:]:
                if linha and linha[0] == str(id_valor):
                    return linha
            
            return None
        except Exception as e:
            raise Exception(f"Erro ao buscar: {str(e)}")

    def _encontrar_linha_por_id(self, aba, id_valor):
        col_a = aba.get(f'A{self.linha_cabecalho}:A2000')
        for idx, celula in enumerate(col_a):
            if celula and celula[0] == str(id_valor):
                return self.linha_cabecalho + idx
        return None

    def atualizar_registro(self, id_valor, dados_form):
        try:
            aba = self._obter_aba()
            linha_planilha = self._encontrar_linha_por_id(aba, id_valor)
            
            if not linha_planilha:
                raise Exception(f"Registro {id_valor} não encontrado")
            
            updates = []
            for col in self.colunas_gravaveis:
                valor = dados_form.get(col, "")
                valor = self._converter_data_para_sheet(valor)
                updates.append({
                    'range': f"{col}{linha_planilha}",
                    'values': [[valor]]
                })
            
            if updates:
                aba.batch_update(updates, value_input_option="USER_ENTERED")
            
            return True
        except Exception as e:
            raise Exception(f"Erro ao atualizar: {str(e)}")

    def excluir_registro(self, id_valor):
        try:
            aba = self._obter_aba()
            linha_planilha = self._encontrar_linha_por_id(aba, id_valor)
            
            if not linha_planilha:
                raise Exception(f"Registro {id_valor} não encontrado")
            
            updates = []
            for col in self.colunas_gravaveis:
                updates.append({
                    'range': f"{col}{linha_planilha}",
                    'values': [[""]]
                })
            
            if updates:
                aba.batch_update(updates, value_input_option="USER_ENTERED")
            
            return True
        except Exception as e:
            raise Exception(f"Erro ao excluir: {str(e)}")

    def get_dados_aba(self, nome_aba):
        return self._obter_aba(nome_aba).get_all_values()