# app.py
from flask import Flask, render_template, request, jsonify
import sympy as sp
import numpy as np

app = Flask(__name__)

# ----- Funções matemáticas -----
def build_function(expr_str):
    """
    Converte uma string para uma função numérica usando sympy + lambdify.
    Retorna uma função f(x) que aceita floats/numpy arrays.
    """
    x = sp.Symbol('x')
    # tenta criar expressão sympy; captura erros de sintaxe
    expr = sp.sympify(expr_str, evaluate=True)
    # cria função numérica (usa numpy para avaliação rápida)
    f = sp.lambdify(x, expr, modules=["numpy"])
    return f

def falsa_posicao(expr_str, a, b, tol=1e-8, max_iter=100):
    f = build_function(expr_str)
    fa = float(f(a))
    fb = float(f(b))
    if fa * fb > 0:
        # sinal igual -> não garante raiz no intervalo
        return None, "f(a) e f(b) têm o mesmo sinal"
    c = a
    for i in range(max_iter):
        # fórmula do ponto de interseção da reta secante entre (a, f(a)) e (b, f(b))
        c = (a * fb - b * fa) / (fb - fa)
        fc = float(f(c))
        if abs(fc) < tol or abs(b - a) < tol:
            return c, None
        # atualiza o intervalo
        if fa * fc < 0:
            b = c
            fb = fc
        else:
            a = c
            fa = fc
    return c, "não convergiu dentro do número máximo de iterações"

def secante(expr_str, x0, x1, tol=1e-8, max_iter=100):
    f = build_function(expr_str)
    x_prev = float(x0)
    x_curr = float(x1)
    for i in range(max_iter):
        f_prev = float(f(x_prev))
        f_curr = float(f(x_curr))
        denom = (f_curr - f_prev)
        if abs(denom) < 1e-14:
            return None, "divisão por zero na secante"
        x_next = x_curr - f_curr * (x_curr - x_prev) / denom
        if abs(x_next - x_curr) < tol:
            return x_next, None
        x_prev, x_curr = x_curr, x_next
    return x_curr, "não convergiu dentro do número máximo de iterações"

# ----- Rotas -----
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/calcular", methods=["POST"])
def calcular():
    data = request.get_json() or {}
    expr = data.get("funcao", "").strip()
    try:
        a = float(data.get("a", None))
        b = float(data.get("b", None))
    except (TypeError, ValueError):
        return jsonify({"erro": "Valores de a ou b inválidos."}), 400

    if not expr:
        return jsonify({"erro": "Função não informada."}), 400

    try:
        # tentativa de calcular
        raiz_fp, err_fp = falsa_posicao(expr, a, b)
        raiz_sec, err_sec = secante(expr, a, b)
        response = {
            "falsa_posicao": raiz_fp if raiz_fp is None or np.isfinite(raiz_fp) else None,
            "falsa_posicao_erro": err_fp,
            "secante": raiz_sec if raiz_sec is None or np.isfinite(raiz_sec) else None,
            "secante_erro": err_sec
        }
        return jsonify(response)
    except (sp.SympifyError, Exception) as e:
        return jsonify({"erro": f"Erro ao processar a função: {str(e)}"}), 400

if __name__ == "__main__":
    app.run(debug=True)
