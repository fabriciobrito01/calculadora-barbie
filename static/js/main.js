document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // ... (captura dos inputs igual ao anterior) ...
  const metodo = document.getElementById("metodo").value;
  const funcao = document.getElementById("funcao").value.trim();
  const a = document.getElementById("a").value;
  const b = document.getElementById("b").value;
  const tol = document.getElementById("tol").value.trim();
  const max_iter = document.getElementById("max_iter").value;

  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "⏳ Calculando...";

  try {
    const res = await fetch("/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodo, funcao, a, b, tol, max_iter })
    });

    const data = await res.json();
    
    if (!res.ok || data.erro) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> ${data.erro || data.erro_msg}</div>`;
      return;
    }

    let html = `<h3>Resultados: ${data.metodo_nome}</h3>`;
    
    if (data.msg) {
        html += `<p class="status-msg">${data.msg}</p>`;
    }
    
    if (data.raiz !== null) {
        html += `<p class="raiz-destaque">Raiz aproximada: <strong>${Number(data.raiz).toFixed(8)}</strong></p>`;
    }

    if (data.historico && data.historico.length > 0) {
        html += `
        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>I</th>
                        <th>A (ou $x_{i-1}$)</th>
                        <th>B (ou $x_i$)</th>
                        <th>Xi (ou $x_{i+1}$)</th>
                        <th>f(A)</th>
                        <th>f(B)</th>
                        <th>f(Xi)</th>
                        <th>Erro Rel. (%)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.historico.forEach(iter => {
            const erroPerc = (iter.erro_rel * 100).toFixed(6) + '%';
            html += `
                <tr>
                    <td>${iter.iteracao}</td>
                    <td>${iter.a.toFixed(6)}</td>
                    <td>${iter.b.toFixed(6)}</td>
                    <td style="font-weight:bold; color: var(--barbie-pink);">${iter.xi.toFixed(6)}</td>
                    <td>${iter.fa.toExponential(4)}</td>
                    <td>${iter.fb.toExponential(4)}</td>
                    <td>${iter.fxi.toExponential(4)}</td>
                    <td>${erroPerc}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
    }

    resultadoDiv.innerHTML = html;

  } catch (err) {
    resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro de conexão.</strong></div>`;
    console.error(err);
  }
});