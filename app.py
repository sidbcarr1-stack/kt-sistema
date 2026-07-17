import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import gspread
from datetime import datetime
import json
from google.oauth2.service_account import Credentials
from services.sheets_service import SheetsService
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)

# Chave secreta (variável de ambiente em produção, fixa em desenvolvimento)
app.secret_key = os.environ.get('SECRET_KEY', 'kt-sistema-secret-key-2026-sidnei-carraco')

# --- Autenticação e instância global do serviço ---
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Carregar credenciais (arquivo local OU variável de ambiente)
GOOGLE_CREDENTIALS = os.environ.get('GOOGLE_CREDENTIALS')
if GOOGLE_CREDENTIALS:
    # Produção: credenciais via variável de ambiente
    creds_dict = json.loads(GOOGLE_CREDENTIALS)
    creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
else:
    # Desenvolvimento: credenciais via arquivo local
    creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)

client = gspread.authorize(creds)

# ID da planilha (variável de ambiente em produção, fixa em desenvolvimento)
# SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '1sflCfve7RztRbzD1GB57_BTbf0CJrBx7uxlDZ-8nr9U')
# SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '1UdvKMXwKNDNK-14W53V8VRbZzbPi9l08tY0GSyee-Dk')
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '10fk1QX_RxfRQ6AYo-sZz0lD6hdQ-VxCS1w_fJ4CDFmQ')

ss = client.open_by_key(SPREADSHEET_ID)
sheets_backend = SheetsService(ss)


# Colunas com fórmulas — nunca serão gravadas pelo Python
COLUNAS_FORMULA_PROTEGIDAS = ['A', 'Q', 'V', 'Y', 'AB', 'AE', 'AH', 'AK', 'AN', 'AQ', 'AS', 'BL', 'BN']


from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' not in session:
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

def requer_auth(f):
    """Decorator para APIs: retorna JSON 401 se não autenticado."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Verificar sessão de forma explícita
            usuario = session.get('usuario')
            email = session.get('email')
            
            # Debug: mostrar o que está na sessão
            print(f"[AUTH] Verificando sessão - usuario: {bool(usuario)}, email: {bool(email)}")
            
            if not usuario and not email:
                print("[AUTH] ❌ Sessão vazia! Retornando 401")
                return jsonify({
                    "success": False,
                    "error": "Sessão expirada. Faça login novamente."
                }), 401
            
            print("[AUTH] ✅ Sessão válida")
            return f(*args, **kwargs)
        except Exception as e:
            print(f"[AUTH] ❌ Erro no decorator: {e}")
            return jsonify({
                "success": False,
                "error": f"Erro de autenticação: {str(e)}"
            }), 500
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' not in session:
            return redirect('/login')
        if session.get('tipo') != 'admin':
            return jsonify({"success": False, "error": "Acesso negado"}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@login_required
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

# ==================== ROTAS DE COMENTÁRIOS POR CAMPO ====================

def _obter_ou_criar_aba_comentarios():
    """Retorna a aba 'Comentarios', criando-a automaticamente se não existir."""
    try:
        return ss.worksheet('Comentarios')
    except gspread.exceptions.WorksheetNotFound:
        print("[Comentarios] Aba 'Comentarios' não encontrada. Criando automaticamente...")
        aba = ss.add_worksheet(title='Comentarios', rows=5000, cols=6)
        # Criar cabeçalho
        aba.update('A1:E1', [['id_registro', 'coluna', 'comentario', 'usuario', 'data_hora']])
        print("[Comentarios] Aba 'Comentarios' criada com sucesso!")
        return aba

@app.route('/api/comentarios/<id_registro>', methods=['GET'])
@requer_auth
def listar_comentarios(id_registro):
    """GET: Retorna todos os comentários de um registro específico."""
    try:
        aba = _obter_ou_criar_aba_comentarios()
        dados = aba.get('A2:E10000')

        comentarios = {}
        for linha in dados:
            if not linha or len(linha) < 2:
                continue
            if str(linha[0]).strip() == str(id_registro):
                coluna = str(linha[1]).strip()
                comentarios[coluna] = {
                    'comentario': linha[2] if len(linha) > 2 else '',
                    'usuario':    linha[3] if len(linha) > 3 else '',
                    'data_hora':  linha[4] if len(linha) > 4 else ''
                }

        return jsonify({"success": True, "comentarios": comentarios})
    except Exception as e:
        print(f"[Comentarios] Erro ao listar: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/comentarios/<id_registro>/<coluna>', methods=['POST'])
@requer_auth
def salvar_comentario(id_registro, coluna):
    """POST: Cria ou atualiza o comentário de um campo específico."""
    try:
        dados = request.json
        texto = dados.get('comentario', '').strip()
        usuario = session.get('nome') or session.get('username') or session.get('email') or 'Usuário'
        data_hora = datetime.now().strftime('%d/%m/%Y %H:%M')

        aba = _obter_ou_criar_aba_comentarios()
        todas_as_linhas = aba.get('A2:E10000')

        linha_encontrada = None
        for idx, linha in enumerate(todas_as_linhas, start=2):
            if linha and len(linha) >= 2:
                if str(linha[0]).strip() == str(id_registro) and str(linha[1]).strip() == str(coluna):
                    linha_encontrada = idx
                    break

        nova_linha_dados = [str(id_registro), str(coluna), texto, usuario, data_hora]

        if linha_encontrada:
            # Atualizar linha existente
            aba.update(f'A{linha_encontrada}:E{linha_encontrada}', [nova_linha_dados])
        else:
            # Inserir nova linha
            aba.append_row(nova_linha_dados, value_input_option='USER_ENTERED')

        return jsonify({
            "success": True,
            "message": "Comentário salvo com sucesso",
            "usuario": usuario,
            "data_hora": data_hora
        })
    except Exception as e:
        print(f"[Comentarios] Erro ao salvar: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/comentarios/<id_registro>/<coluna>', methods=['DELETE'])
@requer_auth
def excluir_comentario(id_registro, coluna):
    """DELETE: Remove o comentário de um campo específico."""
    try:
        aba = _obter_ou_criar_aba_comentarios()
        todas_as_linhas = aba.get('A2:E10000')

        linha_encontrada = None
        for idx, linha in enumerate(todas_as_linhas, start=2):
            if linha and len(linha) >= 2:
                if str(linha[0]).strip() == str(id_registro) and str(linha[1]).strip() == str(coluna):
                    linha_encontrada = idx
                    break

        if linha_encontrada:
            aba.delete_rows(linha_encontrada)
            return jsonify({"success": True, "message": "Comentário excluído com sucesso"})
        else:
            return jsonify({"success": False, "error": "Comentário não encontrado"}), 404
    except Exception as e:
        print(f"[Comentarios] Erro ao excluir: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== ROTAS DE PARÂMETROS ====================

@app.route('/api/parametros/<nome_aba>', methods=['GET'])
def get_params(nome_aba):
    try:
        return jsonify({"success": True, "data": sheets_backend.get_dados_aba(nome_aba)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/formulario/<tipo>')
def formulario(tipo):
    """Retorna o HTML do formulário solicitado."""
    if tipo == 'cadastro':
        return render_template('cadastro/form_cadastro.html')
    elif tipo == 'edicao':
        return render_template('edicao/form_edicao.html')
    elif tipo == 'relatorio':
        return render_template('relatorio/form_relatorio.html')
    else:
        return "Formulário não encontrado", 404

@app.route('/api/valores-unicos/<coluna>')
def valores_unicos(coluna):
    """Retorna lista de valores únicos de uma coluna da planilha (como UNIQUE do Excel)."""
    try:
        aba = sheets_backend._obter_aba()
        dados = aba.get(f'{coluna}{sheets_backend.linha_cabecalho}:{coluna}20000')
        
        # Extrair valores únicos - cada "celula" é uma lista [valor]
        valores_unicos = set()
        for linha in dados:
            if linha and len(linha) > 0:
                valor = str(linha[0]).strip()
                if valor:  # Ignorar vazios
                    valores_unicos.add(valor)
        
        # Converter para lista e ordenar
        valores_ordenados = sorted(list(valores_unicos))
        
        return jsonify({
            "success": True,
            "valores": valores_ordenados,
            "total": len(valores_ordenados)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ==================== AUTENTICAÇÃO ====================

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Tela de login."""
    if request.method == 'POST':
        try:
            login_input = request.form.get('login', '').strip().lower()  # email ou username
            senha = request.form.get('senha', '').strip()
            
            if not login_input or not senha:
                return jsonify({
                    "success": False, 
                    "error": "Usuário e senha são obrigatórios"
                }), 400
            
            # Verificar se usuário existe e está ativo
            aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
            dados = aba_usuarios.get('A2:G1000')
            
            usuario_encontrado = None
            for linha in dados:
                if linha and len(linha) >= 6:
                    email_cadastrado = str(linha[0]).strip().lower()
                    username_cadastrado = str(linha[2]).strip().lower()
                    senha_hash = str(linha[3]).strip()
                    status = str(linha[5]).strip().lower()
                    
                    # Verificar se é email ou username
                    if email_cadastrado == login_input or username_cadastrado == login_input:
                        if status == 'ativo':
                            # Verificar senha
                            if check_password_hash(senha_hash, senha):
                                usuario_encontrado = {
                                    'email': email_cadastrado,
                                    'nome': str(linha[1]).strip(),
                                    'username': username_cadastrado,
                                    'tipo': str(linha[4]).strip().lower()
                                }
                                break
                            else:
                                return jsonify({
                                    "success": False, 
                                    "error": "Senha incorreta."
                                }), 401
                        else:
                            return jsonify({
                                "success": False, 
                                "error": "Usuário pendente de aprovação. Aguarde o administrador liberar seu acesso."
                            }), 403
            
            if usuario_encontrado:
                # Salvar na sessão
                session['usuario'] = usuario_encontrado
                session['email'] = usuario_encontrado['email']
                session['nome'] = usuario_encontrado['nome']
                session['username'] = usuario_encontrado['username']
                session['tipo'] = usuario_encontrado['tipo']
    
                # Verificar se há uma URL de destino (parâmetro ?next=)
                next_page = request.args.get('next', '/')

                return jsonify({
                    "success": True,
                    "usuario": usuario_encontrado,
                "redirect": next_page
            })


            else:
                return jsonify({
                    "success": False,
                    "error": "Usuário não encontrado. Cadastre-se primeiro."
                }), 404
                
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return render_template('login.html')

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    """Cadastro de novos usuários."""
    if request.method == 'POST':
        try:
            data = request.get_json()
            nome = data.get('nome', '').strip()
            email = data.get('email', '').strip().lower()
            username = data.get('username', '').strip().lower()
            senha = data.get('senha', '').strip()
            tipo = data.get('tipo', 'user').strip().lower()
            
            if not nome or not email or not username or not senha:
                return jsonify({
                    "success": False, 
                    "error": "Todos os campos são obrigatórios"
                }), 400
            
            if len(senha) < 6:
                return jsonify({
                    "success": False, 
                    "error": "A senha deve ter pelo menos 6 caracteres"
                }), 400
            
            # Verificar se email ou username já existem
            aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
            dados = aba_usuarios.get('A2:G1000')
            
            for linha in dados:
                if linha and len(linha) >= 4:
                    email_cadastrado = str(linha[0]).strip().lower()
                    username_cadastrado = str(linha[2]).strip().lower()
                    
                    if email_cadastrado == email:
                        return jsonify({
                            "success": False,
                            "error": "Este email já está cadastrado."
                        }), 400
                    
                    if username_cadastrado == username:
                        return jsonify({
                            "success": False,
                            "error": "Este nome de usuário já está em uso."
                        }), 400
            
            # Gerar hash da senha
            senha_hash = generate_password_hash(senha)
            
            # Adicionar novo usuário com status pendente
            nova_linha = [
                email,
                nome,
                username,
                senha_hash,
                tipo,
                'pendente',
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ]
            
            aba_usuarios.append_row(nova_linha)
            
            # Enviar email de notificação para o administrador
            try:
                enviar_email_aprovacao(nome, email, username, tipo)
            except Exception as e:
                print(f"Erro ao enviar email: {e}")
            
            return jsonify({
                "success": True,
                "message": "Cadastro realizado com sucesso! Aguarde a aprovação do administrador."
            })
            
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return render_template('cadastro.html')

@app.route('/logout')
def logout():
    """Logout do usuário."""
    session.clear()
    return redirect('/login')

@app.route('/api/usuario-atual')
def usuario_atual():
    """Retorna dados do usuário logado."""
    if 'usuario' in session:
        return jsonify({
            "success": True,
            "usuario": session['usuario']
        })
    return jsonify({"success": False}), 401

@app.route('/api/usuarios-pendentes')
def usuarios_pendentes():
    """Lista usuários pendentes de aprovação (apenas para admins)."""
    if session.get('tipo') != 'admin':
        return jsonify({"success": False, "error": "Acesso negado"}), 403
    
    try:
        aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
        dados = aba_usuarios.get('A2:E1000')
        
        pendentes = []
        for idx, linha in enumerate(dados, start=2):
            if linha and len(linha) >= 4:
                status = str(linha[3]).strip().lower()
                if status == 'pendente':
                    pendentes.append({
                        'linha': idx,
                        'email': str(linha[0]).strip(),
                        'nome': str(linha[1]).strip(),
                        'tipo': str(linha[2]).strip(),
                        'data': str(linha[4]).strip() if len(linha) > 4 else ''
                    })
        
        return jsonify({
            "success": True,
            "pendentes": pendentes
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/aprovar-usuario', methods=['POST'])
def aprovar_usuario():
    """Aprova um usuário pendente (apenas para admins)."""
    if session.get('tipo') != 'admin':
        return jsonify({"success": False, "error": "Acesso negado"}), 403
    
    try:
        data = request.get_json()
        linha = data.get('linha')
        
        if not linha:
            return jsonify({"success": False, "error": "Linha não informada"}), 400
        
        aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
        aba_usuarios.update(f'D{linha}', 'ativo')
        
        return jsonify({
            "success": True,
            "message": "Usuário aprovado com sucesso!"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/recusar-usuario', methods=['POST'])
def recusar_usuario():
    """Recusa um usuário pendente (apenas para admins)."""
    if session.get('tipo') != 'admin':
        return jsonify({"success": False, "error": "Acesso negado"}), 403
    
    try:
        data = request.get_json()
        linha = data.get('linha')
        
        if not linha:
            return jsonify({"success": False, "error": "Linha não informada"}), 400
        
        aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
        aba_usuarios.update(f'D{linha}', 'recusado')
        
        return jsonify({
            "success": True,
            "message": "Usuário recusado."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def enviar_email_aprovacao(nome, email, username, tipo):
    """Envia email para o administrador solicitando aprovação."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    # Configurações do email
    remetente = "sidneikt@gmail.com"
    senha = "ujudzvtnyjfypbcd"
    destinatario = "sidneikt@gmail.com"
    
    assunto = f"Nova solicitação de cadastro - {nome}"
    corpo = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #1e3a8a;">Nova Solicitação de Cadastro</h2>
        <p>Um novo usuário solicitou acesso ao sistema:</p>
        <table style="border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nome:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{nome}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{email}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Username:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{username}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Tipo:</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{tipo}</td>
            </tr>
        </table>
        <p><strong>Ações necessárias:</strong></p>
        <ol>
            <li>Acesse a planilha e compartilhe com o email: <strong>{email}</strong> (apenas para visualização)</li>
            <li>Acesse o painel administrativo do sistema e aprove o usuário (mudar status para 'ativo')</li>
            <li><strong>IMPORTANTE:</strong> Não conceda permissão de edição na planilha via link do email</li>
        </ol>
        <p style="color: #666; font-size: 12px;">KTSistema - Gestão de Ordens de Serviço</p>
    </body>
    </html>
    """
    
    msg = MIMEMultipart()
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = assunto
    msg.attach(MIMEText(corpo, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Erro ao enviar email: {e}")

@app.route('/alterar-senha', methods=['GET', 'POST'])
@login_required
def alterar_senha():
    """Permite ao usuário alterar sua própria senha."""
    if request.method == 'POST':
        try:
            data = request.get_json()
            senha_atual = data.get('senha_atual', '').strip()
            nova_senha = data.get('nova_senha', '').strip()
            confirmar_senha = data.get('confirmar_senha', '').strip()
            
            if not senha_atual or not nova_senha or not confirmar_senha:
                return jsonify({
                    "success": False,
                    "error": "Todos os campos são obrigatórios"
                }), 400
            
            if len(nova_senha) < 6:
                return jsonify({
                    "success": False,
                    "error": "A nova senha deve ter pelo menos 6 caracteres"
                }), 400
            
            if nova_senha != confirmar_senha:
                return jsonify({
                    "success": False,
                    "error": "As senhas não coincidem"
                }), 400
            
            # Buscar usuário na planilha
            aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
            dados = aba_usuarios.get('A2:G1000')
            
            usuario_linha = None
            for idx, linha in enumerate(dados, start=2):
                if linha and len(linha) >= 6:
                    email = str(linha[0]).strip().lower()
                    username = str(linha[2]).strip().lower()
                    senha_hash = str(linha[3]).strip()
                    
                    if email == session['email'] or username == session['username']:
                        # Verificar senha atual
                        if check_password_hash(senha_hash, senha_atual):
                            usuario_linha = idx
                            break
                        else:
                            return jsonify({
                                "success": False,
                                "error": "Senha atual incorreta"
                            }), 401
            
            if usuario_linha:
                # Gerar novo hash
                novo_hash = generate_password_hash(nova_senha)
                
                # Atualizar na planilha
                aba_usuarios.update([[novo_hash]], f'D{usuario_linha}')
                
                return jsonify({
                    "success": True,
                    "message": "Senha alterada com sucesso!"
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Usuário não encontrado"
                }), 404
                
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return render_template('alterar_senha.html')







import secrets
from datetime import datetime, timedelta

@app.route('/recuperar-senha', methods=['GET', 'POST'])
def recuperar_senha():
    """Página para solicitar recuperação de senha."""
    if request.method == 'POST':
        try:
            data = request.get_json()
            email = data.get('email', '').strip().lower()
            
            if not email:
                return jsonify({
                    "success": False,
                    "error": "Email é obrigatório"
                }), 400
            
            # Buscar usuário na planilha
            aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
            dados = aba_usuarios.get('A2:H1000')
            
            usuario_encontrado = None
            for idx, linha in enumerate(dados, start=2):
                if linha and len(linha) >= 6:
                    email_cadastrado = str(linha[0]).strip().lower()
                    status = str(linha[5]).strip().lower()
                    
                    if email_cadastrado == email and status == 'ativo':
                        usuario_encontrado = {
                            'linha': idx,
                            'nome': str(linha[1]).strip(),
                            'email': email_cadastrado
                        }
                        break
            
            if usuario_encontrado:
                # Gerar token único (válido por 1 hora)
                token = secrets.token_urlsafe(32)
                token_expiracao = (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
                
                # Salvar token na planilha (coluna H)
                aba_usuarios.update([[f"{token}|{token_expiracao}"]], f'H{usuario_encontrado["linha"]}')
                
                # Enviar email com link de recuperação
                try:
                    enviar_email_recuperacao(
                        usuario_encontrado['nome'],
                        usuario_encontrado['email'],
                        token
                    )
                except Exception as e:
                    print(f"Erro ao enviar email: {e}")
                
                return jsonify({
                    "success": True,
                    "message": "Email de recuperação enviado! Verifique sua caixa de entrada."
                })
            else:
                # Não revelar se email existe ou não (segurança)
                return jsonify({
                    "success": True,
                    "message": "Se o email estiver cadastrado e ativo, você receberá instruções de recuperação."
                })
                
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return render_template('recuperar_senha.html')


@app.route('/redefinir-senha/<token>', methods=['GET', 'POST'])
def redefinir_senha(token):
    """Página para redefinir senha com token."""
    if request.method == 'POST':
        try:
            data = request.get_json()
            nova_senha = data.get('nova_senha', '').strip()
            confirmar_senha = data.get('confirmar_senha', '').strip()
            
            if not nova_senha or not confirmar_senha:
                return jsonify({
                    "success": False,
                    "error": "Todos os campos são obrigatórios"
                }), 400
            
            if len(nova_senha) < 6:
                return jsonify({
                    "success": False,
                    "error": "A senha deve ter pelo menos 6 caracteres"
                }), 400
            
            if nova_senha != confirmar_senha:
                return jsonify({
                    "success": False,
                    "error": "As senhas não coincidem"
                }), 400
            
            # Buscar token na planilha
            aba_usuarios = sheets_backend._obter_aba_por_nome('Usuarios')
            dados = aba_usuarios.get('A2:H1000')
            
            usuario_encontrado = None
            for idx, linha in enumerate(dados, start=2):
                if linha and len(linha) >= 8: # ← MUDANÇA: >= 8 (precisa ter 8 colunas)
                    token_armazenado = str(linha[7]).strip() if len(linha) > 7 else ''  # ← MUDANÇA: linha[7] (coluna H)
                    
                    if '|' in token_armazenado:
                        token_parte, expiracao_str = token_armazenado.split('|', 1)
                        expiracao = datetime.strptime(expiracao_str, '%Y-%m-%d %H:%M:%S')
                        
                        if token_parte == token:
                            # Verificar se token não expirou
                            if datetime.now() <= expiracao:
                                usuario_encontrado = {'linha': idx}
                            else:
                                return jsonify({
                                    "success": False,
                                    "error": "Token expirado. Solicite uma nova recuperação."
                                }), 400
            
            if usuario_encontrado:
                # Gerar novo hash e atualizar senha
                novo_hash = generate_password_hash(nova_senha)
                aba_usuarios.update([[novo_hash]], f'D{usuario_encontrado["linha"]}')
                
                # Limpar token
                aba_usuarios.update([['']], f'H{usuario_encontrado["linha"]}')
                
                return jsonify({
                    "success": True,
                    "message": "Senha alterada com sucesso! Faça login com a nova senha."
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Token inválido ou expirado."
                }), 400
                
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
    
    return render_template('redefinir_senha.html', token=token)


def enviar_email_recuperacao(nome, email, token):
    """Envia email com link de recuperação de senha."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    remetente = "sidneikt@gmail.com"
    senha = "ujudzvtnyjfypbcd"  # ← Verifique se esta é a senha correta!
    destinatario = email  # ✅ CORRETO: usa o email passado como parâmetro
    
    print(f"\n[EMAIL] Enviando para: {destinatario}")
    print(f"[EMAIL] Nome: {nome}")
    print(f"[EMAIL] Token: {token}")
    
    # Link de recuperação
    link_recuperacao = f"http://127.0.0.1:5000/redefinir-senha/{token}"
    
    assunto = "Recuperação de Senha - KTSistema"
    corpo = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #1e3a8a;">Recuperação de Senha</h2>
        <p>Olá <strong>{nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir sua senha no KTSistema.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{link_recuperacao}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
            </a>
        </div>
        <p>Ou copie e cole este link no navegador:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            {link_recuperacao}
        </p>
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
            <li>Este link é válido por <strong>1 hora</strong></li>
            <li>Se você não solicitou esta recuperação, ignore este email</li>
        </ul>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
            KTSistema - Gestão de Ordens de Serviço
        </p>
    </body>
    </html>
    """
    
    try:
        msg = MIMEMultipart()
        msg['From'] = remetente
        msg['To'] = destinatario
        msg['Subject'] = assunto
        msg.attach(MIMEText(corpo, 'html'))
        
        print("[EMAIL] Conectando ao SMTP...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        print("[EMAIL] ✅ TLS ativado")
        
        print("[EMAIL] Fazendo login...")
        server.login(remetente, senha)
        print("[EMAIL] ✅ Login realizado")
        
        print("[EMAIL] Enviando mensagem...")
        server.send_message(msg)
        print("[EMAIL] ✅ Email enviado com sucesso!")
        
        server.quit()
        return True
        
    except Exception as e:
        print(f"[EMAIL] ❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False



@app.route('/comissao')
@login_required
def comissao():
    """Retorna a página de relatório de comissão."""
    return render_template('comissao/form_comissao.html')


@app.route('/api/comissao')
@login_required
def api_comissao():
    """Retorna dados filtrados para o relatório de comissão."""
    try:
        motorista = request.args.get('motorista', '').strip()
        data_inicio = request.args.get('data_inicio', '').strip()
        data_final = request.args.get('data_final', '').strip()
        
        if not motorista or not data_inicio or not data_final:
            return jsonify({
                "success": False,
                "error": "Motorista, data inicial e data final são obrigatórios"
            }), 400
        
        # ✅ CORREÇÃO: Range expandido para incluir coluna AV (e além se necessário)
        aba = sheets_backend._obter_aba_por_nome('BD_Geral')
        dados = aba.get('B5:BS20000')  # De B até BS (inclui AV e todas as colunas até BS)
        
        # Converter datas para comparação
        def parse_data_br(data_str):
            if not data_str:
                return None
            try:
                partes = data_str.split('/')
                if len(partes) == 3:
                    return datetime(int(partes[2]), int(partes[1]), int(partes[0]))
            except:
                pass
            return None
        
        data_ini = parse_data_br(data_inicio)
        data_fim = parse_data_br(data_final)
        
        if not data_ini or not data_fim:
            return jsonify({
                "success": False,
                "error": "Formato de data inválido. Use DD/MM/YYYY"
            }), 400
        
        # Filtrar dados
        registros_filtrados = []
        for linha in dados:
            if not linha or len(linha) < 45:
                continue
            
            # Colunas (índice 0-based a partir de B):
            # B=0 (Empresa), K=9 (Data), J=8 (Protocolo), P=14 (Placa)
            # N=12 (Motorista), AV=46 (Observação), AL=36 (Pedágio), AU=45 (Valor Total)
            
            motorista_linha = str(linha[12]).strip() if len(linha) > 12 else ''
            data_linha_str = str(linha[9]).strip() if len(linha) > 9 else ''
            
            # Verificar motorista
            if motorista_linha.upper() != motorista.upper():
                continue
            
            # Verificar data
            data_linha = parse_data_br(data_linha_str)
            if not data_linha:
                continue
            
            if data_linha < data_ini or data_linha > data_fim:
                continue
            
            # Extrair valores
            empresa = str(linha[0]).strip() if len(linha) > 0 else ''
            protocolo = str(linha[8]).strip() if len(linha) > 8 else ''
            placa = str(linha[14]).strip() if len(linha) > 14 else ''
            
            # ✅ CORREÇÃO: Buscar observação da coluna AV (índice 46)
            observacao = str(linha[46]).strip() if len(linha) > 46 else ''
            
            # Valores monetários
            pedagio_str = str(linha[36]).strip() if len(linha) > 36 else '0'
            valor_total_str = str(linha[45]).strip() if len(linha) > 45 else '0'
            
            # Converter para número
            def parse_currency_br(val):
                if not val or val == '0':
                    return 0.0
                val = str(val).replace('R$', '').replace('.', '').replace(',', '.').strip()
                try:
                    return float(val)
                except:
                    return 0.0
            
            pedagio = parse_currency_br(pedagio_str)
            valor_total = parse_currency_br(valor_total_str)
            valor_sem_pedagio = valor_total - pedagio
            
            registros_filtrados.append({
                'empresa': empresa,
                'data': data_linha_str,
                'protocolo': protocolo,
                'placa': placa,
                'observacao': observacao,  # ✅ Agora vem da coluna AV
                'pedagio': pedagio,
                'valor_total': valor_total,
                'valor_sem_pedagio': valor_sem_pedagio
            })
        
        return jsonify({
            "success": True,
            "dados": registros_filtrados,
            "total": len(registros_filtrados)
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/motoristas')
@login_required
def api_motoristas():
    """Retorna lista de motoristas da aba Parametros."""
    try:
        aba = sheets_backend._obter_aba_por_nome('Parametros')
        dados = aba.get('A2:A100')
        
        # DEBUG: Verificar o que está vindo da planilha
        print(f"🔍 DEBUG - Dados brutos da aba Parametros: {dados}")
        
        motoristas = []
        for linha in dados:
            if linha and len(linha) > 0:
                valor = str(linha[0]).strip()
                # Ignora células vazias e o possível cabeçalho "Motorista"
                if valor and valor.lower() != 'motorista':
                    motoristas.append(valor)
        
        # Ordenação alfabética segura (case-insensitive)
        motoristas.sort(key=lambda x: x.lower())
        
        print(f"✅ DEBUG - Motoristas processados e ordenados: {motoristas}")
        
        return jsonify({
            "success": True,
            "motoristas": motoristas
        })
    except Exception as e:
        print(f"❌ ERRO em api_motoristas: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/nf-recibo')
@login_required
def nf_recibo():
    """Retorna a página de relatório de NF/Recibo."""
    return render_template('nf_recibo/form_nf_recibo.html')

@app.route('/api/nf-recibo')
@login_required
def api_nf_recibo():
    """Retorna dados filtrados para o relatório de Totais por Instituição."""
    try:
        instituicao = request.args.get('instituicao', '').strip()
        data_inicio = request.args.get('data_inicio', '').strip()
        data_final = request.args.get('data_final', '').strip()
        
        print(f"\n{'='*60}")
        print("📊 INICIANDO RELATÓRIO DE TOTAIS")
        print(f"{'='*60}")
        print(f"Filtros: Instituição={instituicao or 'Todas'}")
        print(f"Filtros: Data {data_inicio or 'Todas'} a {data_final or 'Todas'}")
        
        # Buscar dados da planilha
        aba = sheets_backend._obter_aba_por_nome('BD_Geral')
        dados = aba.get('B5:AU20000')  # Range maior
        
        print(f"📄 Linhas lidas da planilha: {len(dados)}")
        
        # Converter datas para comparação
        def parse_data_br(data_str):
            """Converte string de data para datetime (aceita YYYY-MM-DD ou DD/MM/YYYY)."""
            if not data_str:
                return None
            
            try:
                # Tentar formato ISO (YYYY-MM-DD) - padrão do input HTML
                if '-' in data_str:
                    partes = str(data_str).split('-')
                    if len(partes) == 3:
                        return datetime(int(partes[0]), int(partes[1]), int(partes[2]))
                
                # Tentar formato BR (DD/MM/YYYY)
                if '/' in data_str:
                    partes = str(data_str).split('/')
                    if len(partes) == 3:
                        return datetime(int(partes[2]), int(partes[1]), int(partes[0]))
            except:
                pass
            
            return None

        data_ini = parse_data_br(data_inicio) if data_inicio else None
        data_fim = parse_data_br(data_final) if data_final else None
        
        # Dicionário para agrupar por instituição
        instituicoes_dict = {}
        total_registros = 0
        total_registros_filtrados = 0
        total_valor_bruto = 0.0
        
        for idx, linha in enumerate(dados):
            if not linha:
                continue
            
            total_registros += 1
            
            # Colunas (índice 0-based a partir de B):
            # B=0 (Instituição), K=9 (Data), AQ=42 (Valor Total)
            
            inst_nome = str(linha[0]).strip() if len(linha) > 0 else ''
            data_str = str(linha[9]).strip() if len(linha) > 9 else ''
            
            valor_raw = ''
            if len(linha) > 41:
                valor_raw = str(linha[41]).strip()
            
            # Ignorar linhas vazias de instituição ou cabeçalho
            if not inst_nome or inst_nome.upper() in ('', 'INSTITUIÇÃO'):
                continue
            
            # Filtrar por instituição (se especificada)
            if instituicao and inst_nome.upper() != instituicao.upper():
                continue
            
            # Filtrar por data (se especificada)
            if data_ini or data_fim:
                data_linha = parse_data_br(data_str)
                if not data_linha:
                    continue
                if data_ini and data_linha < data_ini:
                    continue
                if data_fim and data_linha > data_fim:
                    continue
            
            # Converter valor para número
            def parse_currency_br(val):
                if not val or val == '' or val == '0':
                    return 0.0
                # Remover R$, pontos e converter vírgula para ponto
                val_limpo = str(val).replace('R$', '').replace('.', '').replace(',', '.').strip()
                try:
                    return float(val_limpo)
                except:
                    print(f"⚠️  Erro ao converter valor: '{val}' -> '{val_limpo}'")
                    return 0.0
            
            valor = parse_currency_br(valor_raw)
            
            total_registros_filtrados += 1
            total_valor_bruto += valor
            
            # Agrupar por instituição
            if inst_nome not in instituicoes_dict:
                instituicoes_dict[inst_nome] = {
                    'qtde': 0,
                    'total': 0.0
                }
            
            instituicoes_dict[inst_nome]['qtde'] += 1
            instituicoes_dict[inst_nome]['total'] += valor
        
        # Converter para lista ordenada alfabeticamente
        resultados = []
        for inst_nome in sorted(instituicoes_dict.keys(), key=lambda x: x.upper()):
            dados_inst = instituicoes_dict[inst_nome]
            resultados.append({
                'instituicao': inst_nome,
                'qtde': dados_inst['qtde'],
                'total': dados_inst['total']
            })
        
        # LOGS DETALHADOS
        print(f"\n📊 RESUMO:")
        print(f"  Total de linhas lidas: {total_registros}")
        print(f"  Total de registros filtrados: {total_registros_filtrados}")
        print(f"  Total de instituições únicas: {len(resultados)}")
        print(f"  Soma total bruta: R$ {total_valor_bruto:,.2f}")
        print(f"  Soma total calculada: R$ {sum(r['total'] for r in resultados):,.2f}")
        
        # Mostrar primeiras 5 instituições
        print(f"\n📋 Primeiras 5 instituições:")
        for i, inst in enumerate(resultados[:5]):
            print(f"  {i+1}. {inst['instituicao']}: {inst['qtde']} serviços, R$ {inst['total']:,.2f}")
        
        print(f"\n{'='*60}\n")
        
        return jsonify({
            "success": True,
            "dados": resultados,
            "total_qtde": total_registros_filtrados,
            "total_valor": total_valor_bruto
        })
        
    except Exception as e:
        print(f"✗ Erro em api_nf_recibo: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/instituicoes')
@login_required
def api_instituicoes():
    """Retorna lista de instituições da coluna B do BD_Geral, sem repetições, ordenada."""
    try:
        aba = sheets_backend._obter_aba_por_nome('BD_Geral')
        # Buscar apenas coluna B a partir da linha 5 (dados)
        dados = aba.get('B5:B2000')
        
        instituicoes_set = set()
        for linha in dados:
            if linha and len(linha) > 0:
                valor = str(linha[0]).strip()
                if valor and valor.upper() not in ('', 'INSTITUIÇÃO'):
                    instituicoes_set.add(valor)
        
        # Ordenar alfabeticamente
        instituicoes_ordenadas = sorted(list(instituicoes_set), key=lambda x: x.upper())
        
        return jsonify({
            "success": True,
            "instituicoes": instituicoes_ordenadas
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/relatorio')
@login_required
def relatorio():
    """Página de Relatórios Gerais"""
    return render_template('relatorio/form_relatorio.html')


# ==================== CADASTRO DE CLIENTES ====================

@app.route('/cadastro-clientes')
def cadastro_clientes():
    """Página de Cadastro de Clientes (Instituições)"""
    if 'usuario' not in session:
        return redirect(url_for('login', next=request.path))
    return render_template('cad_clientes.html')

@app.route('/api/clientes/proximo-id', methods=['GET'])
def proximo_id_cliente():
    # Verificação manual de autenticação
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    """Retorna o próximo ID disponível para novo cliente."""
    try:
        aba = sheets_backend._obter_aba('cadClientes')
        
        dados_coluna_a = aba.get('A2:A10000')
        
        if not dados_coluna_a:
            return jsonify({"success": True, "proximo_id": 1})
        
        maior_id = 0
        for linha in dados_coluna_a:
            if linha and len(linha) > 0 and linha[0]:
                try:
                    id_atual = int(linha[0])
                    if id_atual > maior_id:
                        maior_id = id_atual
                except (ValueError, TypeError):
                    continue
        
        proximo_id = maior_id + 1
        
        return jsonify({"success": True, "proximo_id": proximo_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/clientes', methods=['GET'])
def listar_clientes():
    # Verificação manual de autenticação
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    """API: Listar todos os clientes"""
    try:
        aba = sheets_backend._obter_aba('cadClientes')
        dados = aba.get('A2:S1000')
        
        if not dados:
            return jsonify({"success": True, "dados": []})
        
        clientes = []
        for linha in dados:
            if linha and any(linha):
                cliente = {
                    'id': linha[0] if len(linha) > 0 else '',
                    'instituicao': linha[1] if len(linha) > 1 else '',
                    'assistencia': linha[2] if len(linha) > 2 else '',
                    'nome_fantasia': linha[3] if len(linha) > 3 else '',
                    'razao_social': linha[4] if len(linha) > 4 else '',
                    'cnpj_cpf': linha[5] if len(linha) > 5 else '',
                    'insc_municipal': linha[6] if len(linha) > 6 else '',
                    'insc_estadual': linha[7] if len(linha) > 7 else '',
                    'email': linha[8] if len(linha) > 8 else '',
                    'email_nfe': linha[9] if len(linha) > 9 else '',
                    'copia_para': linha[10] if len(linha) > 10 else '',
                    'site': linha[11] if len(linha) > 11 else '',
                    'endereco': linha[12] if len(linha) > 12 else '',
                    'bairro': linha[13] if len(linha) > 13 else '',
                    'cidade': linha[14] if len(linha) > 14 else '',
                    'estado': linha[15] if len(linha) > 15 else '',
                    'cep': linha[16] if len(linha) > 16 else '',
                    'telefone': linha[17] if len(linha) > 17 else '',
                    'observacoes': linha[18] if len(linha) > 18 else ''
                }
                clientes.append(cliente)
        
        return jsonify({"success": True, "dados": clientes})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/clientes', methods=['POST'])
def salvar_cliente():
    # Verificação manual de autenticação
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    """API: Salvar novo cliente"""
    try:
        dados = request.json
        aba = sheets_backend._obter_aba('cadClientes')
        
        # Gerar próximo ID (baseado no maior ID existente + 1)
        dados_coluna_a = aba.get('A2:A10000')
        maior_id = 0
        if dados_coluna_a:
            for linha in dados_coluna_a:
                if linha and len(linha) > 0 and linha[0]:
                    try:
                        id_atual = int(linha[0])
                        if id_atual > maior_id:
                            maior_id = id_atual
                    except (ValueError, TypeError):
                        continue
        proximo_id = maior_id + 1
        
        # Converter para maiúsculas
        instituicao = str(dados.get('instituicao', '')).upper()
        assistencia = str(dados.get('assistencia', '')).upper()
        
        linha = [
            proximo_id,
            instituicao,
            assistencia,
            dados.get('nome_fantasia', ''),
            dados.get('razao_social', ''),
            dados.get('cnpj_cpf', ''),
            dados.get('insc_municipal', ''),
            dados.get('insc_estadual', ''),
            dados.get('email', ''),
            dados.get('email_nfe', ''),
            dados.get('copia_para', ''),
            dados.get('site', ''),
            dados.get('endereco', ''),
            dados.get('bairro', ''),
            dados.get('cidade', ''),
            dados.get('estado', ''),
            dados.get('cep', ''),
            dados.get('telefone', ''),
            dados.get('observacoes', '')
        ]
        
        aba.append_row(linha)
        
        return jsonify({"success": True, "message": "Cliente cadastrado com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/clientes/<int:id_cliente>', methods=['PUT'])
def atualizar_cliente(id_cliente):
    # Verificação manual de autenticação
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    """API: Atualizar cliente existente"""
    try:
        dados = request.json
        aba = sheets_backend._obter_aba('cadClientes')
        
        dados_planilha = aba.get('A2:S1000')
        linha_encontrada = None
        
        for idx, linha in enumerate(dados_planilha, start=2):
            if linha and str(linha[0]) == str(id_cliente):
                linha_encontrada = idx
                break
        
        if not linha_encontrada:
            return jsonify({"success": False, "error": "Cliente não encontrado"}), 404
        
        instituicao = str(dados.get('instituicao', '')).upper()
        assistencia = str(dados.get('assistencia', '')).upper()
        
        atualizacoes = [
            {'range': f'B{linha_encontrada}', 'values': [[instituicao]]},
            {'range': f'C{linha_encontrada}', 'values': [[assistencia]]},
            {'range': f'D{linha_encontrada}', 'values': [[dados.get('nome_fantasia', '')]]},
            {'range': f'E{linha_encontrada}', 'values': [[dados.get('razao_social', '')]]},
            {'range': f'F{linha_encontrada}', 'values': [[dados.get('cnpj_cpf', '')]]},
            {'range': f'G{linha_encontrada}', 'values': [[dados.get('insc_municipal', '')]]},
            {'range': f'H{linha_encontrada}', 'values': [[dados.get('insc_estadual', '')]]},
            {'range': f'I{linha_encontrada}', 'values': [[dados.get('email', '')]]},
            {'range': f'J{linha_encontrada}', 'values': [[dados.get('email_nfe', '')]]},
            {'range': f'K{linha_encontrada}', 'values': [[dados.get('copia_para', '')]]},
            {'range': f'L{linha_encontrada}', 'values': [[dados.get('site', '')]]},
            {'range': f'M{linha_encontrada}', 'values': [[dados.get('endereco', '')]]},
            {'range': f'N{linha_encontrada}', 'values': [[dados.get('bairro', '')]]},
            {'range': f'O{linha_encontrada}', 'values': [[dados.get('cidade', '')]]},
            {'range': f'P{linha_encontrada}', 'values': [[dados.get('estado', '')]]},
            {'range': f'Q{linha_encontrada}', 'values': [[dados.get('cep', '')]]},
            {'range': f'R{linha_encontrada}', 'values': [[dados.get('telefone', '')]]},
            {'range': f'S{linha_encontrada}', 'values': [[dados.get('observacoes', '')]]},
        ]
        
        aba.batch_update(atualizacoes, value_input_option="USER_ENTERED")
        
        return jsonify({"success": True, "message": "Cliente atualizado com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

""" @app.route('/api/clientes/<int:id_cliente>', methods=['DELETE'])
@requer_auth """

"""" def excluir_cliente(id_cliente): """

"""API: Excluir cliente
    try:
        aba = sheets_backend._obter_aba('cadClientes')
        
        dados_planilha = aba.get('A2:S1000')
        linha_encontrada = None
        
        for idx, linha in enumerate(dados_planilha, start=2):
            if linha and str(linha[0]) == str(id_cliente):
                linha_encontrada = idx
                break
        
        if not linha_encontrada:
            return jsonify({"success": False, "error": "Cliente não encontrado"}), 404
        
        aba.delete_rows(linha_encontrada)
        
        return jsonify({"success": True, "message": "Cliente excluído com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500 """


@app.route('/api/clientes/<int:id_cliente>', methods=['DELETE'])
def excluir_cliente(id_cliente):
    """API: Excluir cliente"""
    print(f"\n{'='*50}")
    print(f"[EXCLUIR] >>> ID recebido: {id_cliente} (tipo: {type(id_cliente).__name__})")
    print(f"[EXCLUIR] >>> Sessão keys: {list(session.keys())}")
    
    # Verificação manual de autenticação
    if 'usuario' not in session:
        print("[EXCLUIR] >>>  Usuário não autenticado")
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        aba = sheets_backend._obter_aba('cadClientes')
        print(f"[EXCLUIR] >>> ✅ Aba 'cadClientes' obtida")
        
        dados_planilha = aba.get('A2:S1000')
        print(f"[EXCLUIR] >>> Linhas lidas: {len(dados_planilha) if dados_planilha else 0}")
        
        linha_encontrada = None
        
        for idx, linha in enumerate(dados_planilha, start=2):
            if linha and str(linha[0]) == str(id_cliente):
                linha_encontrada = idx
                print(f"[EXCLUIR] >>> ✅ Cliente {id_cliente} encontrado na linha {linha_encontrada}")
                break
        
        if not linha_encontrada:
            print(f"[EXCLUIR] >>> ❌ Cliente {id_cliente} NÃO encontrado na planilha")
            return jsonify({"success": False, "error": "Cliente não encontrado"}), 404
        
        print(f"[EXCLUIR] >>> Excluindo linha {linha_encontrada}...")
        aba.delete_rows(linha_encontrada)
        print(f"[EXCLUIR] >>> ✅ Exclusão concluída com sucesso!")
        print(f"{'='*50}\n")
        
        return jsonify({"success": True, "message": "Cliente excluído com sucesso!"})
    except Exception as e:
        print(f"[EXCLUIR] >>> ❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*50}\n")
        return jsonify({"success": False, "error": str(e)}), 500



@app.route('/debug-sessao')
def debug_sessao():
    """Endpoint de debug para verificar sessão."""
    return jsonify({
        "success": True,
        "session_keys": list(session.keys()),
        "tem_usuario": bool(session.get('usuario')),
        "tem_email": bool(session.get('email')),
        "usuario": session.get('usuario'),
        "email": session.get('email'),
        "nome": session.get('nome'),
        "tipo": session.get('tipo')
    })


# ==================== CADASTRO DE SERVIÇOS ====================

@app.route('/cadastro-servicos')
def cadastro_servicos():
    """Página de Cadastro de Tipos de Serviços"""
    if 'usuario' not in session:
        return redirect(url_for('login', next=request.path))
    return render_template('cad_servicos.html')

@app.route('/api/servicos/proximo-id', methods=['GET'])
def proximo_id_servico():
    """Retorna o próximo ID disponível para novo tipo de serviço."""
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        aba = sheets_backend._obter_aba('cadServicos')
        dados_coluna_a = aba.get('A2:A10000')
        
        if not dados_coluna_a:
            return jsonify({"success": True, "proximo_id": 1})
        
        maior_id = 0
        for linha in dados_coluna_a:
            if linha and len(linha) > 0 and linha[0]:
                try:
                    id_atual = int(linha[0])
                    if id_atual > maior_id:
                        maior_id = id_atual
                except (ValueError, TypeError):
                    continue
        
        return jsonify({"success": True, "proximo_id": maior_id + 1})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/servicos', methods=['GET'])
def listar_servicos():
    """API: Listar todos os serviços"""
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        aba = sheets_backend._obter_aba('cadServicos')
        dados = aba.get('A2:B1000')
        
        if not dados:
            return jsonify({"success": True, "dados": []})
        
        servicos = []
        for linha in dados:
            if linha and any(linha):
                servicos.append({
                    'id': linha[0] if len(linha) > 0 else '',
                    'servico': linha[1] if len(linha) > 1 else ''
                })
        
        return jsonify({"success": True, "dados": servicos})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/servicos', methods=['POST'])
def salvar_servico():
    """API: Salvar novo tipo de serviço"""
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        dados = request.json
        aba = sheets_backend._obter_aba('cadServicos')
        
        # Gerar próximo ID
        dados_coluna_a = aba.get('A2:A10000')
        maior_id = 0
        if dados_coluna_a:
            for linha in dados_coluna_a:
                if linha and len(linha) > 0 and linha[0]:
                    try:
                        id_atual = int(linha[0])
                        if id_atual > maior_id:
                            maior_id = id_atual
                    except (ValueError, TypeError):
                        continue
        proximo_id = maior_id + 1
        
        # Converter para maiúsculas
        servico = str(dados.get('servico', '')).upper()
        
        linha = [proximo_id, servico]
        aba.append_row(linha)
        
        return jsonify({"success": True, "message": "Tipo de serviço cadastrado com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/servicos/<servico_id>', methods=['PUT'])
def atualizar_servico(servico_id):
    """API: Atualizar tipo de serviço existente"""
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        dados = request.json
        aba = sheets_backend._obter_aba('cadServicos')
        
        dados_planilha = aba.get('A2:B1000')
        linha_encontrada = None
        
        for idx, linha in enumerate(dados_planilha, start=2):
            if linha and str(linha[0]) == str(servico_id):
                linha_encontrada = idx
                break
        
        if not linha_encontrada:
            return jsonify({"success": False, "error": "Serviço não encontrado"}), 404
        
        servico = str(dados.get('servico', '')).upper()
        
        atualizacoes = [
            {'range': f'B{linha_encontrada}', 'values': [[servico]]}
        ]
        
        aba.batch_update(atualizacoes, value_input_option="USER_ENTERED")
        
        return jsonify({"success": True, "message": "Tipo de serviço atualizado com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/servicos/<servico_id>', methods=['DELETE'])
def excluir_servico(servico_id):
    """API: Excluir tipo de serviço"""
    if 'usuario' not in session:
        return jsonify({"success": False, "error": "Não autorizado"}), 401
    
    try:
        aba = sheets_backend._obter_aba('cadServicos')
        
        dados_planilha = aba.get('A2:B1000')
        linha_encontrada = None
        
        for idx, linha in enumerate(dados_planilha, start=2):
            if linha and str(linha[0]) == str(servico_id):
                linha_encontrada = idx
                break
        
        if not linha_encontrada:
            return jsonify({"success": False, "error": "Serviço não encontrado"}), 404
        
        aba.delete_rows(linha_encontrada)
        
        return jsonify({"success": True, "message": "Tipo de serviço excluído com sucesso!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ======================================================
# === CADASTRO DE SITUAÇÕES POR INSTITUIÇÃO ===
# ======================================================

@app.route('/cadastro-instituicao-situacao')
def cadastro_instituicao_situacao():
    """Página de Cadastro de Situações por Instituição"""
    return render_template('cadastro_instituicao_situacao.html')

@app.route('/api/instituicoes-lista', methods=['GET'])
def api_instituicoes_lista():
    """Retorna lista de instituições ordenadas para dropdown"""
    try:
        # Buscar da aba cadClientes
        aba_clientes = sheets_backend._obter_aba('cadClientes')
        dados = aba_clientes.get('A2:C1000')  # ID, Instituição, Assistência
        
        instituicoes = []
        for linha in dados:
            if linha and len(linha) >= 2 and linha[0] and linha[1]:
                instituicoes.append({
                    'id': linha[0],
                    'nome': linha[1].strip()
                })
        
        # Ordenar alfabeticamente por nome
        instituicoes.sort(key=lambda x: x['nome'].upper())
        
        return jsonify({
            'success': True,
            'instituicoes': instituicoes
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/situacoes-lista', methods=['GET'])
def api_situacoes_lista():
    """Retorna lista de situações ordenadas para dropdown"""
    try:
        # Buscar da aba cadSituacoes
        aba_situacoes = sheets_backend._obter_aba('cadSituacoes')
        dados = aba_situacoes.get('A2:B1000')  # ID, Situação
        
        situacoes = []
        for linha in dados:
            if linha and len(linha) >= 2 and linha[0] and linha[1]:
                situacoes.append({
                    'id': linha[0],
                    'nome': linha[1].strip()
                })
        
        # Ordenar alfabeticamente por nome
        situacoes.sort(key=lambda x: x['nome'].upper())
        
        return jsonify({
            'success': True,
            'situacoes': situacoes
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instituicao-situacao-lista', methods=['GET'])
def api_instituicao_situacao_lista():
    """Retorna lista de relacionamentos Instituição-Situação"""
    try:
        aba = sheets_backend._obter_aba('Instituicao_Situacao')
        dados = aba.get('A2:D1000')
        
        relacionamentos = []
        for linha in dados:
            if linha and len(linha) >= 4:
                relacionamentos.append({
                    'inst_id': linha[0],
                    'sit_id': linha[1],
                    'instituicao': linha[2],
                    'situacao': linha[3]
                })
        
        return jsonify({
            'success': True,
            'dados': relacionamentos
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instituicao-situacao', methods=['POST'])
def api_salvar_instituicao_situacao():
    """Salvar novo relacionamento Instituição-Situação"""
    try:
        dados = request.json
        inst_id = dados.get('inst_id')
        sit_id = dados.get('sit_id')
        instituicao = dados.get('instituicao')
        situacao = dados.get('situacao')
        
        if not inst_id or not sit_id:
            return jsonify({'success': False, 'error': 'ID da Instituição e Situação são obrigatórios'}), 400
        
        # Verificar se já existe este relacionamento
        aba = sheets_backend._obter_aba('Instituicao_Situacao')
        dados_existentes = aba.get('A2:D1000')
        
        for linha in dados_existentes:
            if linha and len(linha) >= 2:
                if str(linha[0]) == str(inst_id) and str(linha[1]) == str(sit_id):
                    return jsonify({
                        'success': False, 
                        'error': f'Esta situação já está cadastrada para a instituição {instituicao}'
                    }), 400
        
        # Inserir nova linha
        ultima_linha = aba.row_count
        nova_linha = [inst_id, sit_id, instituicao, situacao]
        aba.append_row(nova_linha)
        
        return jsonify({
            'success': True,
            'message': 'Relacionamento cadastrado com sucesso!'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instituicao-situacao/<int:linha>', methods=['DELETE'])
def api_excluir_instituicao_situacao(linha):
    """Excluir relacionamento Instituição-Situação"""
    try:
        aba = sheets_backend._obter_aba('Instituicao_Situacao')
        
        # Excluir linha (linha + 1 porque cabeçalho está na linha 1)
        aba.delete_rows(linha + 1)
        
        return jsonify({
            'success': True,
            'message': 'Relacionamento excluído com sucesso!'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/instituicao-situacao/<int:linha>', methods=['PUT'])
def api_atualizar_instituicao_situacao(linha):
    """Atualizar relacionamento Instituição-Situação"""
    try:
        dados = request.json
        inst_id = dados.get('inst_id')
        sit_id = dados.get('sit_id')
        instituicao = dados.get('instituicao')
        situacao = dados.get('situacao')
        
        if not inst_id or not sit_id:
            return jsonify({'success': False, 'error': 'ID da Instituição e Situação são obrigatórios'}), 400
        
        aba = sheets_backend._obter_aba('Instituicao_Situacao')
        dados_existentes = aba.get('A2:D1000')
        
        # Verificar se já existe este relacionamento (exceto o próprio registro sendo editado)
        for i, row in enumerate(dados_existentes):
            if row and len(row) >= 2:
                # Pular o próprio registro sendo editado (linha - 2 porque começa em A2)
                if i == (linha - 2):
                    continue
                
                if str(row[0]) == str(inst_id) and str(row[1]) == str(sit_id):
                    return jsonify({
                        'success': False, 
                        'error': f'Esta situação já está cadastrada para a instituição {instituicao}'
                    }), 400
        
        # Atualizar linha (linha + 1 porque cabeçalho está na linha 1)
        nova_linha = [inst_id, sit_id, instituicao, situacao]
        aba.update(f'A{linha + 1}:D{linha + 1}', [nova_linha])
        
        return jsonify({
            'success': True,
            'message': 'Relacionamento atualizado com sucesso!'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ======================================================
# === PÁGINAS DE CADASTROS E RELATÓRIOS ===
# ======================================================

@app.route('/cadastros')
def cadastros():
    """Página de Cadastros (submenu)"""
    return render_template('cadastros.html')

@app.route('/relatorios')
def relatorios_menu():
    """Página de Relatórios (submenu)"""
    return render_template('relatorios.html')



@app.route('/api/atualizar_comentario_celula', methods=['POST'])
@login_required
def atualizar_comentario_celula():
    """Adiciona comentário (nota) em uma célula do Google Sheets"""
    try:
        data = request.json
        row = int(data.get('row'))
        col = str(data.get('col')).upper()
        comentario = str(data.get('comentario', '')).strip()
        
        print(f"📝 Recebido: row={row}, col={col}, comentario='{comentario}'")
        
        # Obtém a aba BD_Geral
        ws = sheets_backend._obter_aba_por_nome('BD_Geral')
        cell = f"{col}{row}"
        
        print(f"📍 Célula alvo: {cell}")
        
        if comentario:
            # Adiciona o comentário usando update_note
            ws.update_note(cell, comentario)
            print(f"✅ Comentário adicionado em {cell}")
            
            # Aplica formatação: fundo amarelo suave + texto cinza escuro
            try:
                ws.format(cell, {
                    "backgroundColor": {"red": 1.0, "green": 0.95, "blue": 0.7},
                    "textFormat": {"foregroundColor": {"red": 0.2, "green": 0.2, "blue": 0.2}}
                })
                print(f"🎨 Formatação aplicada em {cell}")
            except Exception as e:
                print(f"⚠️ Erro ao formatar {cell}: {e}")
        else:
            # Remove o comentário
            ws.update_note(cell, "")
            print(f"🗑️ Comentário removido de {cell}")
            
            # Reseta formatação
            try:
                ws.format(cell, {
                    "backgroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0},
                    "textFormat": {"foregroundColor": {"red": 0.0, "green": 0.0, "blue": 0.0}}
                })
                print(f" Formatação resetada em {cell}")
            except Exception as e:
                print(f"️ Erro ao resetar formatação: {e}")
        
        return jsonify({"success": True, "message": f"Comentário atualizado em {cell}"})
        
    except Exception as e:
        print(f"❌ ERRO em atualizar_comentario_celula: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/obter_comentario_celula', methods=['GET'])
@login_required
def obter_comentario_celula():
    """Recupera comentário existente de uma célula"""
    try:
        row = int(request.args.get('row'))
        col = str(request.args.get('col')).upper()
        
        ws = sheets_backend._obter_aba_por_nome('BD_Geral')
        cell = f"{col}{row}"
        
        # Obtém a nota da célula
        comentario = ws.get_note(cell) or ""
        
        print(f"📖 Comentário em {cell}: '{comentario}'")
        
        return jsonify({"success": True, "comentario": comentario})
        
    except Exception as e:
        print(f"❌ ERRO em obter_comentario_celula: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

    # ==================== INICIAR SERVIDOR ====================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)