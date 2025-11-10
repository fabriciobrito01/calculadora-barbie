// Gerenciamento da seleção de métodos
const botoesMetodo = document.querySelectorAll('.btn-metodo');
const inputMetodo = document.getElementById('metodo');
const camposRaizes = document.getElementById('campos-raizes');
const camposGauss = document.getElementById('campos-gauss');
const criteriosParada = document.getElementById('criterios-parada');
const labelA = document.getElementById('label-a');
const labelB = document.getElementById('label-b');
const resultadoDiv = document.getElementById('resultado');

function limparCampos() {
    document.getElementById('funcao').value = '';
    document.getElementById('a').value = '';
    document.getElementById('b').value = '';
    document.getElementById('tol').value = '';
    document.getElementById('max_iter').value = '';
    document.getElementById('matriz').value = '';
    resultadoDiv.innerHTML = '';
}

botoesMetodo.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove classe ativa de todos e adiciona no clicado
        botoesMetodo.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const metodo = btn.dataset.metodo;
        inputMetodo.value = metodo;
        
        limparCampos();

        // Lógica de exibição dos campos
        if (metodo === 'falsa_posicao') {
            camposRaizes.style.display = 'block';
            camposGauss.style.display = 'none';
            criteriosParada.style.display = 'flex';
            labelA.textContent = 'a (Lim. Inferior)';
            labelB.textContent = 'b (Lim. Superior)';
        } else if (metodo === 'secante') {
            camposRaizes.style.display = 'block';
            camposGauss.style.display = 'none';
            criteriosParada.style.display = 'flex';
            labelA.textContent = 'x0 (Chute inicial 1)';
            labelB.textContent = 'x1 (Chute inicial 2)';
        } else if (metodo === 'gauss') {
            camposRaizes.style.display = 'none';
            camposGauss.style.display = 'block';
            criteriosParada.style.display = 'none'; // Gauss direto não costuma precisar de tol/iter
        }
    });
});

// Inicializa com Falsa Posição e campos limpos
limparCampos();

// Envio do formulário
document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const metodo = inputMetodo.value;
  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "⏳ Calculando...";

  // Monta o payload baseado no método ativo
  let payload = { metodo };
  
  if (metodo === 'gauss') {
      payload.matriz = document.getElementById('matriz').value.trim();
      if (!payload.matriz) {
          resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Informe a matriz.</div>`;
          return;
      }
  } else {
      // Métodos de Raízes
      payload.funcao = document.getElementById("funcao").value.trim();
      payload.a = document.getElementById("a").value;
      payload.b = document.getElementById("b").value;
      payload.tol = document.getElementById("tol").value.trim();
      payload.max_iter = document.getElementById("max_iter").value;

      if (!payload.funcao || !payload.a || !payload.b || !payload.tol || !payload.max_iter) {
         resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Preencha todos os campos.</div>`;
         return;
      }
  }

  try {
    const res = await fetch("/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    if (!res.ok || data.erro) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> ${data.erro || data.erro_msg}</div>`;
      return;
    }

    // Renderização do resultado (adaptar para Gauss depois)
    let html = `<h3>Resultados: ${data.metodo_nome}</h3>`;
    if (data.msg) html += `<p class="status-msg">${data.msg}</p>`;
    if (data.raiz !== null && data.raiz !== undefined) {
        html += `<p class="raiz-destaque">Resultado: <strong>${Number(data.raiz).toFixed(8)}</strong></p>`;
    }

    // Tabela para métodos iterativos
    if (data.historico && data.historico.length > 0) {
        html += `
        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>I</th>
                        <th>${metodo === 'secante' ? 'x_{i-1}' : 'A'}</th>
                        <th>${metodo === 'secante' ? 'x_i' : 'B'}</th>
                        <th>${metodo === 'secante' ? 'x_{i+1}' : 'Xi'}</th>
                        <th>f(...)</th>
                        <th>Erro Rel. (%)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.historico.forEach(iter => {
            // Simplifiquei a tabela para caber melhor, ajuste conforme necessidade
            html += `
                <tr>
                    <td>${iter.iteracao}</td>
                    <td>${iter.a.toFixed(6)}</td>
                    <td>${iter.b.toFixed(6)}</td>
                    <td style="font-weight:bold; color: var(--barbie-pink);">${iter.xi.toFixed(6)}</td>
                    <td>${iter.fxi.toExponential(2)}</td>
                    <td>${(iter.erro_rel * 100).toFixed(4)}%</td>
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