import gspread
from google.oauth2.service_account import Credentials
import sys

# Configurações
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_ID = '1sflCfve7RztRbzD1GB57_BTbf0CJrBx7uxlDZ-8nr9U'
TAB_NAME = 'BD_Geral'

def main():
    try:
        # 1. Autenticação
        print("Autenticando com credentials.json...")
        credentials = Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=SCOPES)
        client = gspread.authorize(credentials)

        # 2. Conectar à Planilha
        print(f"Conectando à planilha ID: {SPREADSHEET_ID}")
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        
        # 3. Selecionar a Aba
        print(f"Selecionando a aba: {TAB_NAME}")
        worksheet = spreadsheet.worksheet(TAB_NAME)

        # 4. Ler a Linha 4 (Cabeçalhos)
        # Importante: A biblioteca gspread usa índice 1-based para as linhas na API de baixo nível,
        # mas worksheet.row_values(4) pega a linha 4.
        print("Lendo a Linha 4...")
        valores_linha_4 = worksheet.row_values(4)

        # 5. Imprimir os resultados
        total_colunas = len(valores_linha_4)
        print("\n--- Resultados do Teste ---")
        print(f"Total de colunas encontradas na Linha 4: {total_colunas}")
        
        if total_colunas > 0:
            print("As 3 primeiras colunas são:")
            for i, col in enumerate(valores_linha_4[:3], 1):
                print(f"  {i}. {col}")
        else:
            print("A Linha 4 está vazia ou não foi encontrada.")
        print("---------------------------")

    except Exception as e:
        print(f"\n[ERRO] Ocorreu uma falha durante o teste: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
