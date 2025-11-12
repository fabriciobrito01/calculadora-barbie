from flask import Flask, render_template, request, jsonify
import sympy as sp
import numpy as np
import math
import re
import copy
from whitenoise import WhiteNoise

app = Flask(__name__)

app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/', prefix='static/')
# =====================================================
# FUNÇÕES MATEMÁTICAS (Falsa Posição, Secante, Gauss)
# =====================================================

def build_function(expr_str):
    x = sp.Symbol('x')
    expr_str = expr_str.replace('^', '**')
    expr_str = re.sub(r'\b(e)\b', 'E', expr_str)
    expr = sp.sympify(expr_str, evaluate=True)
    f = sp.lambdify(x, expr, modules=["numpy", "math"])
    return f

def falsa_posicao(data):
    """ Processa dados para Falsa Posição """
    try:
        expr_str = data.get("funcao")
        a = float(data.get("a"))
        b = float(data.get("b"))
        tol = float(eval(str(data.get("tol")).replace('^', '**'), {"__builtins__": None}, {}))
        max_iter = int(data.get("max_iter"))

        f = build_function(expr_str)
        fa = float(f(a))
        fb = float(f(b))
        
        if fa == 0: return {'raiz': a, 'historico': [], 'msg': "a já é a raiz."}
        if fb == 0: return {'raiz': b, 'historico': [], 'msg': "b já é a raiz."}
        if fa * fb > 0:
            return {'erro': "f(a) e f(b) devem ter sinais opostos."}
            
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
            erro = 1.0 if xi_prev is None else abs(xi - xi_prev) / (abs(xi) if abs(xi) > 1e-15 else 1.0)

            historico.append({'iteracao': i, 'a': a, 'b': b, 'xi': xi, 'fa': fa, 'fb': fb, 'fxi': fxi, 'erro_rel': erro})

            if erro < tol and xi_prev is not None:
                return {'raiz': xi, 'historico': historico, 'msg': "Convergência atingida."}
            if fxi == 0:
                return {'raiz': xi, 'historico': historico, 'msg': "Raiz exata encontrada."}
            if xi_prev is not None and abs(xi - xi_prev) < NUMERO_MINIMO and i > 3:
                 return {'raiz': xi, 'historico': historico, 'msg': "Estagnação."}

            xi_prev = xi
            if fa * fxi < 0: b = xi
            else: a = xi
                
        return {'raiz': xi, 'historico': historico, 'msg': f"Atingiu nº máx. de iterações ({max_iter})."}
    except Exception as e:
        return {'erro': f"Erro na Falsa Posição: {str(e)}"}

def secante(data):
    """ Processa dados para Secante """
    try:
        expr_str = data.get("funcao")
        x0 = float(data.get("a")) # JS envia 'a' como x0
        x1 = float(data.get("b")) # JS envia 'b' como x1
        tol = float(eval(str(data.get("tol")).replace('^', '**'), {"__builtins__": None}, {}))
        max_iter = int(data.get("max_iter"))
        
        f = build_function(expr_str)
        x_ant = x0
        x_atual = x1
        f_x_atual = float(f(x_atual))
        
        if abs(f_x_atual) < tol:
             return {'raiz': x_atual, 'historico': [], 'msg': "x1 já é raiz."}

        historico = []
        NUMERO_MINIMO = 1e-12

        for i in range(1, max_iter + 1):
            f_ant = float(f(x_ant))
            f_atual = float(f(x_atual))
            if abs(f_atual - f_ant) < 1e-15:
                return {'raiz': x_atual, 'historico': historico, 'erro_msg': f"Divisão por zero na iteração {i}."}

            x_prox = x_atual - (f_atual * (x_atual - x_ant)) / (f_atual - f_ant)
            f_prox = float(f(x_prox))
            erro = abs(x_prox - x_atual) / (abs(x_prox) if abs(x_prox) > 1e-15 else 1.0)

            historico.append({'iteracao': i, 'a': x_ant, 'b': x_atual, 'xi': x_prox, 'fa': f_ant, 'fb': f_atual, 'fxi': f_prox, 'erro_rel': erro})

            if erro < tol:
                return {'raiz': x_prox, 'historico': historico, 'msg': "Convergência atingida."}
            if f_prox == 0:
                 return {'raiz': x_prox, 'historico': historico, 'msg': "Raiz exata encontrada."}
            if i > 3 and abs(x_prox - x_atual) < NUMERO_MINIMO:
                 return {'raiz': x_prox, 'historico': historico, 'msg': "Estagnação."}

            x_ant, x_atual = x_atual, x_prox

        return {'raiz': x_atual, 'historico': historico, 'msg': f"Atingiu nº máx. de iterações ({max_iter})."}
    except Exception as e:
        return {'erro': f"Erro na Secante: {str(e)}"}

def gauss_elimination(data):
    """ Processa dados para Eliminação de Gauss """
    try:
        matrix = data.get('matrix')
        if not matrix:
            return {'erro': "Matriz não fornecida."}

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
            # Normaliza a linha do pivô
            if abs(pivot_val) > 1e-12:
                for k in range(i, m): A[i][k] /= pivot_val
            # Eliminação
            for j in range(n):
                if i != j: # Modificado para Gauss-Jordan (mais simples)
                    factor = A[j][i]
                    for k in range(i, m):
                        A[j][k] -= factor * A[i][k]

        tipo = "Única"
        vetor_solucao = []
        for i in range(n):
            if all(abs(A[i][j]) < 1e-9 for j in range(m - 1)) and abs(A[i][-1]) > 1e-9:
                tipo = "Inexistente"
                det = 0
                vetor_solucao = []
                break
            elif all(abs(A[i][j]) < 1e-9 for j in range(m - 1)) and abs(A[i][-1]) < 1e-9:
                tipo = "Infinita"
                det = 0
                vetor_solucao = []
                break
        
        if tipo == "Única":
             # Com Gauss-Jordan, a solução já está na última coluna
             vetor_solucao = [row[-1] for row in A]

        return {
            "matriz_escalonada": A,
            "tipo_solucao": tipo,
            "determinante": det,
            "vetor_solucao": vetor_solucao # Envia o vetor X* pronto
        }
    except Exception as e:
        return {'erro': f"Erro em Gauss: {str(e)}"}

# =====================================================
# ROTA ÚNICA
# =====================================================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/calcular", methods=["POST"])
def calcular():
    data = request.get_json() or {}
    metodo = data.get("metodo")

    if metodo == "falsa_posicao":
        res = falsa_posicao(data)
        print(res)
        res['metodo_nome'] = "Falsa Posição"
    elif metodo == "secante":
        res = secante(data)
        print(res)
        res['metodo_nome'] = "Secante"
    elif metodo == "gauss":
        res = gauss_elimination(data)
        print(res)
        res['metodo_nome'] = "Eliminação de Gauss"
    else:
        return jsonify({"erro": "Método desconhecido."}), 400

    if 'erro' in res:
        return jsonify(res), 400
        
    return jsonify(res)

if __name__ == "__main__":
    app.run(debug=True)
