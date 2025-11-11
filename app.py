from flask import Flask, render_template, request, jsonify
import sympy as sp
import numpy as np
import math
import re
import copy

app = Flask(__name__)

# =====================================================
# FUNÇÕES MATEMÁTICAS
# =====================================================

def build_function(expr_str):
    x = sp.Symbol('x')
    expr_str = expr_str.replace('^', '**')
    expr_str = re.sub(r'\b(e)\b', 'E', expr_str)
    expr = sp.sympify(expr_str, evaluate=True)
    f = sp.lambdify(x, expr, modules=["numpy", "math"])
    return f

def falsa_posicao(expr_str, a, b, tol, max_iter):
    try:
        f = build_function(expr_str)
        fa = float(f(a))
        fb = float(f(b))
        
        if fa == 0: return {'raiz': a, 'historico': [], 'erro_msg': "a já é a raiz."}
        if fb == 0: return {'raiz': b, 'historico': [], 'erro_msg': "b já é a raiz."}
        if fa * fb > 0:
            return {'raiz': None, 'historico': [], 'erro_msg': "Erro: f(a) e f(b) devem ter sinais opostos."}
            
        historico = []
        xi_prev = None
        NUMERO_MINIMO = 1e-12

        for i in range(1, max_iter + 1):
            fa = float(f(a))
            fb = float(f(b))

            if fb == fa:
                 return {'raiz': None, 'historico': historico, 'erro_msg': f"Divisão por zero na iteração {i}."}

            xi = (a * fb - b * fa) / (fb - fa)
            fxi = float(f(xi))
            
            erro = None
            if xi_prev is not None:
                denom = abs(xi) if abs(xi) > 1e-15 else 1.0
                erro = abs(xi - xi_prev) / denom

            # Salva iteração atual
            historico.append({
                'iteracao': i,
                'a': a,
                'b': b,
                'xi': xi,
                'fa': fa,
                'fb': fb,
                'fxi': fxi,
                'erro_rel': erro if erro is not None else 1.0 # Primeira iteração erro é 100% (ou indefinido, usamos 1.0 para simplificar)
            })

            # Critérios de parada
            if erro is not None and erro < tol:
                return {'raiz': xi, 'historico': historico, 'msg': "Convergência atingida (tolerância)."}
            if fxi == 0:
                return {'raiz': xi, 'historico': historico, 'msg': "Raiz exata encontrada."}
            if xi_prev is not None and abs(xi - xi_prev) < NUMERO_MINIMO and i > 3:
                 return {'raiz': xi, 'historico': historico, 'msg': "Aviso: Estagnação."}

            xi_prev = xi
            
            if fa * fxi < 0:
                b = xi
            else:
                a = xi
                
        return {'raiz': xi, 'historico': historico, 'msg': f"Atingiu nº máx. de iterações ({max_iter})."}
    except Exception as e:
        return {'raiz': None, 'historico': [], 'erro_msg': f"Erro inesperado: {str(e)}"}

def secante(expr_str, x0, x1, tol, max_iter):
    try:
        f = build_function(expr_str)
        x_ant = float(x0)
        x_atual = float(x1)
        f_x_atual = float(f(x_atual))
        
        if abs(f_x_atual) < tol or f_x_atual == 0:
             return {'raiz': x_atual, 'historico': [], 'msg': "x1 já é raiz."}

        historico = []
        NUMERO_MINIMO = 1e-12

        for i in range(1, max_iter + 1):
            f_ant = float(f(x_ant))
            f_atual = float(f(x_atual))

            denom = f_atual - f_ant
            if abs(denom) < 1e-15:
                return {'raiz': x_atual, 'historico': historico, 'erro_msg': f"Divisão por zero na iteração {i}."}

            x_prox = x_atual - (f_atual * (x_atual - x_ant)) / denom
            f_prox = float(f(x_prox))
            
            denom_erro = abs(x_prox) if abs(x_prox) > 1e-15 else 1.0
            erro = abs(x_prox - x_atual) / denom_erro

            # Mapeando para as colunas da tabela:
            # A -> x_ant (i-1)
            # B -> x_atual (i)
            # Xi -> x_prox (i+1)
            historico.append({
                'iteracao': i,
                'a': x_ant,
                'b': x_atual,
                'xi': x_prox,
                'fa': f_ant,
                'fb': f_atual,
                'fxi': f_prox,
                'erro_rel': erro
            })

            if erro < tol:
                return {'raiz': x_prox, 'historico': historico, 'msg': "Convergência atingida."}
            if f_prox == 0:
                 return {'raiz': x_prox, 'historico': historico, 'msg': "Raiz exata encontrada."}
            if i > 3 and abs(x_prox - x_atual) < NUMERO_MINIMO:
                 return {'raiz': x_prox, 'historico': historico, 'msg': "Aviso: Estagnação."}

            x_ant = x_atual
            x_atual = x_prox

        return {'raiz': x_atual, 'historico': historico, 'msg': f"Atingiu nº máx. de iterações ({max_iter})."}
    except Exception as e:
        return {'raiz': None, 'historico': [], 'erro_msg': f"Erro inesperado: {str(e)}"}

def gauss_elimination(matrix):
    n = len(matrix)
    m = len(matrix[0])
    A = copy.deepcopy(matrix)
    det = 1

    for i in range(n):
        pivot = i
        for j in range(i + 1, n):
            if abs(A[j][i]) > abs(A[pivot][i]):
                pivot = j
        if abs(A[pivot][i]) < 1e-12:
            det = 0
            continue

        if pivot != i:
            A[i], A[pivot] = A[pivot], A[i]
            det *= -1

        det *= A[i][i]

        pivot_val = A[i][i]
        if abs(pivot_val) > 1e-12:
            for k in range(i, m):
                A[i][k] /= pivot_val

        for j in range(i + 1, n):
            factor = A[j][i]
            for k in range(i, m):
                A[j][k] -= factor * A[i][k]

    tipo = "Única"
    for i in range(n):
        if all(abs(A[i][j]) < 1e-9 for j in range(m - 1)) and abs(A[i][-1]) > 1e-9:
            tipo = "Inexistente"
            det = 0
            break
        elif all(abs(A[i][j]) < 1e-9 for j in range(m - 1)) and abs(A[i][-1]) < 1e-9:
            tipo = "Infinita"
            det = 0
            break

    return A, tipo, det


# =====================================================
# ROTAS
# =====================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/calcular", methods=["POST"])
def calcular():
    data = request.get_json() or {}
    expr = data.get("funcao", "").strip()
    metodo = data.get("metodo", "falsa_posicao")

    try:
        tol_raw = data.get("tol")
        if not tol_raw:
            return jsonify({"erro": "Tolerância obrigatória."}), 400
        tol = float(eval(str(tol_raw).replace('^', '**'), {"__builtins__": None}, {}))

        max_iter_raw = data.get("max_iter")
        if not max_iter_raw:
            return jsonify({"erro": "Máx. Iterações obrigatório."}), 400
        max_iter = int(max_iter_raw)

        a = float(data.get("a"))
        b = float(data.get("b"))
    except:
        return jsonify({"erro": "Verifique os campos numéricos."}), 400

    if not expr:
        return jsonify({"erro": "Função não informada."}), 400

    if metodo == "falsa_posicao":
        res = falsa_posicao(expr, a, b, tol, max_iter)
        res['metodo_nome'] = "Falsa Posição"
    elif metodo == "secante":
        res = secante(expr, a, b, tol, max_iter)
        res['metodo_nome'] = "Secante"
    else:
        return jsonify({"erro": "Método desconhecido."}), 400

    return jsonify(res)


@app.route('/gauss', methods=['POST'])
def gauss_route():
    data = request.get_json()
    print("DEBUG Recebido do front:", data)
    matrix = data.get('matrix')

    if not matrix:
        return jsonify({"error": "Matriz não fornecida"}), 400

    try:
        A, tipo, det = gauss_elimination(matrix)
        return jsonify({
            "matriz_escalonada": A,
            "tipo_solucao": tipo,
            "determinante": det
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# EXECUÇÃO
# =====================================================

if __name__ == "__main__":
    app.run(debug=True)
