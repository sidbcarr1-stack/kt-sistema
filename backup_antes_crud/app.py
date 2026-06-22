from flask import Flask, render_template, request, jsonify
import gspread
from google.oauth2.service_account import Credentials
from services.sheets_service import SheetsService
from datetime import datetime

app = Flask(__name__)

# --- Autenticação e instância global do serviço ---
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_ID = '1sflCfve7RztRbzD1GB57_BTbf0CJrBx7uxlDZ-8nr9U'

creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
client = gspread.authorize(creds)
ss = client.open_by_key(SPREADSHEET_ID)
sheets_backend = SheetsService(ss)

# Colunas com fórmulas — nunca serão gravadas pelo Python
COLUNAS_FORMULA_PROTEGIDAS = ['A', 'Q', 'V', 'Y', 'AB', 'AE', 'AH', 'AK', 'AN', 'AQ', 'AS', 'BL', 'BN']

@app.route('/')
def index():
    return render_template('index.html')

# ==================== ROTAS CRUD PRINCIPAIS ====================

@app.route('/api/registros', methods=['GET'])
def listar_registros():
    """Lista registros com paginação e filtros múltiplos."""
    try:
        pagina = int(request.args.get('pagina', 1))
        por_pagina = int(request.args.get('por_pagina', 50))
        
        # Filtros múltiplos
        filtro_campo1 = request.args.get('filtro_campo1', '')
        filtro_valor1 = request.args.get('filtro_valor1', '')
        filtro_campo2 = request.args.get('filtro_campo2', '')
        filtro_valor2 = request.args.get('filtro_valor2', '')
        
        # Intervalo de datas
        filtro_data1_inicio = request.args.get('filtro_data1_inicio', '')
        filtro_data1_fim = request.args.get('filtro_data1_fim', '')
        filtro_data2_inicio = request.args.get('filtro_data2_inicio', '')
        filtro_data2_fim = request.args.get('filtro_data2_fim', '')
        
        print(f"Filtros: campo1={filtro_campo1}, valor1={filtro_valor1}, data1={filtro_data1_inicio} a {filtro_data1_fim}")
        print(f"Filtros: campo2={filtro_campo2}, valor2={filtro_valor2}, data2={filtro_data2_inicio} a {filtro_data2_fim}")
        
        resultado = sheets_backend.listar_registros_filtrados(
            pagina, por_pagina,
            filtro_campo1, filtro_valor1, filtro_data1_inicio, filtro_data1_fim,
            filtro_campo2, filtro_valor2, filtro_data2_inicio, filtro_data2_fim
        )
        return jsonify({"success": True, **resultado})
    except Exception as e:
        print(f"Erro ao listar: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/registros/<id_registro>', methods=['GET'])
def obter_registro(id_registro):
    """Obtém um registro específico pelo ID."""
    try:
        registro = sheets_backend.buscar_registro_por_id(id_registro)
        if registro:
            return jsonify({"success": True, "data": registro})
        return jsonify({"success": False, "error": "Registro não encontrado"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/salvar', methods=['POST'])
def salvar():
    """CREATE: Salva um novo registro."""
    try:
        dados = request.json
        if not dados.get('AU'):
            dados.pop('AU', None)
        payload = {k: v for k, v in dados.items() if k not in COLUNAS_FORMULA_PROTEGIDAS}
        sheets_backend.salvar_registro(payload)
        return jsonify({"success": True, "message": "Registro criado com sucesso"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/registros/<id_registro>', methods=['PUT'])
def atualizar(id_registro):
    """UPDATE: Atualiza um registro existente."""
    try:
        dados = request.json
        if not dados.get('AU'):
            dados.pop('AU', None)
        payload = {k: v for k, v in dados.items() if k not in COLUNAS_FORMULA_PROTEGIDAS}
        sheets_backend.atualizar_registro(id_registro, payload)
        return jsonify({"success": True, "message": "Registro atualizado com sucesso"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/registros/<id_registro>', methods=['DELETE'])
def excluir(id_registro):
    """DELETE: Remove um registro pelo ID."""
    try:
        sheets_backend.excluir_registro(id_registro)
        return jsonify({"success": True, "message": "Registro excluído com sucesso"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== ROTAS DE PARÂMETROS ====================

@app.route('/api/parametros/<nome_aba>', methods=['GET'])
def get_params(nome_aba):
    try:
        return jsonify({"success": True, "data": sheets_backend.get_dados_aba(nome_aba)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)