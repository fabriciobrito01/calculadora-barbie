const botoesMetodo = document.querySelectorAll('.btn-metodo');
const inputMetodo = document.getElementById('metodo');
const camposRaizes = document.getElementById('campos-raizes');
const camposGauss = document.getElementById('campos-gauss');
const criteriosParada = document.getElementById('criterios-parada');
const labelA = document.getElementById('label-a');
const labelB = document.getElementById('label-b');
const resultadoDiv = document.getElementById('resultado');
const matrizGridDiv = document.getElementById('matriz-grid');
const gerarBtn = document.getElementById('gerar_matriz');
const nRowsInput = document.getElementById('n_rows');
const form = document.getElementById("calcForm");

function limparCampos() {
  document.getElementById('funcao').value = '';
  document.getElementById('a').value = '';
  document.getElementById('b').value = '';
  document.getElementById('tol').value = '';
  document.getElementById('max_iter').value = '';
  document.getElementById('n_rows').value = '3';
  
  if (matrizGridDiv) matrizGridDiv.innerHTML = '';
  resultadoDiv.innerHTML = '';
}

botoesMetodo.forEach(btn => {
  btn.addEventListener('click', () => {
    botoesMetodo.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const metodo = btn.dataset.metodo;
    inputMetodo.value = metodo;
    limparCampos();

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
      criteriosParada.style.display = 'none';
      generateMatrixGrid(3, 4);
    }
  });
});

function generateMatrixGrid(n, m) {
  if (!matrizGridDiv) return;
  matrizGridDiv.innerHTML = '';
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  for (let i = 0; i < n; i++) {
    const tr = document.createElement('tr');
    for (let j = 0; j < m; j++) {
      const td = document.createElement('td');
      td.style.border = '1px solid #ffd6e0';
      td.style.padding = '4px';
      td.style.width = '1%';
      const input = document.createElement('input');
      input.type = 'text';
      input.style.width = '60px';
      input.style.height = '26px';
      input.style.padding = '4px';
      input.style.fontSize = '0.9em';
      input.style.boxSizing = 'border-box';
      input.placeholder = '0';
      input.dataset.row = i;
      input.dataset.col = j;
      td.appendChild(input);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  matrizGridDiv.appendChild(table);
}

function getMatrixFromGrid() {
  const rows = [];
  if (!matrizGridDiv) return rows;
  const inputs = matrizGridDiv.querySelectorAll('input');
  if (!inputs || inputs.length === 0) return rows;

  let maxRow = 0, maxCol = 0;
  inputs.forEach(inp => {
    const r = parseInt(inp.dataset.row, 10);
    const c = parseInt(inp.dataset.col, 10);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  });

  for (let i = 0; i <= maxRow; i++) {
    const row = [];
    for (let j = 0; j <= maxCol; j++) {
      const inp = matrizGridDiv.querySelector(`input[data-row="${i}"][data-col="${j}"]`);
      let val = 0;
      if (inp) {
        const txt = inp.value.trim().replace(',', '.');
        val = (txt === '') ? 0 : parseFloat(txt);
        if (isNaN(val)) return null; 
      }
      row.push(val);
    }
    rows.push(row);
  }
  return rows;
}

if (gerarBtn) {
  gerarBtn.addEventListener('click', () => {
    const n = parseInt(nRowsInput.value, 10) || 1;
    const m = Math.max(2, n + 1);
    generateMatrixGrid(Math.max(1, n), m);
  });
}

document.addEventListener('DOMContentLoaded', () => {
    limparCampos();
    const fpButton = document.querySelector('.btn-metodo[data-metodo="falsa_posicao"]');
    if (fpButton) fpButton.classList.add('active');
    
    camposRaizes.style.display = 'block';
    camposGauss.style.display = 'none';
    criteriosParada.style.display = 'flex';
    labelA.textContent = 'a (Lim. Inferior)';
    labelB.textContent = 'b (Lim. Superior)';
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const metodo = inputMetodo.value;
  resultadoDiv.innerHTML = "⏳ Calculando...";

  let payload = { metodo };

  if (metodo === 'gauss') {
    const nVal = nRowsInput.value;
    if (!nVal || parseInt(nVal, 10) <= 0) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Informe um número de linhas (n) válido.</div>`;
      return;
    }
    const gridRows = getMatrixFromGrid();
    if (gridRows === null) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Valor inválido na matriz. Use apenas números.</div>`;
      return;
    }
    if (gridRows.length === 0) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Clique em "Gerar matriz" e preencha os valores.</div>`;
      return;
    }
    payload.matrix = gridRows;
  
  } else {
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

    if (!res.ok) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> ${data.erro || 'Erro desconhecido do servidor.'}</div>`;
      return;
    }

    let html = `<h3>Resultados: ${data.metodo_nome}</h3>`;
    if (data.msg) html += `<p class="status-msg">${data.msg}</p>`;

    if (metodo === 'gauss') {
        html += `
          <div class="gauss-info">
            <p><strong>Tipo de solução:</strong> <span class="tag-solucao">${data.tipo_solucao}</span></p>
            <p><strong>Determinante:</strong> <span class="valor">${Number(data.determinante).toFixed(6)}</span></p>
          </div>
        `;
        
        if (data.vetor_solucao && data.vetor_solucao.length > 0) {
             html += `<h4>A solução do sistema é (X*):</h4>
                      <div class="tabela-gauss tabela-vetor">
                        <table><tbody>`;
             data.vetor_solucao.forEach((x, i) => {
                html += `<tr><td><strong>x<sub>${i + 1}</sub></strong></td><td>${x.toFixed(6)}</td></tr>`;
             });
             html += `</tbody></table></div>`;
        }
        
        html += `<h4>Matriz Escalonada (Gauss-Jordan):</h4>`;
        if (Array.isArray(data.matriz_escalonada)) {
            html += `<div class="tabela-gauss"><table><tbody>`;
            data.matriz_escalonada.forEach(linha => {
              html += `<tr>`;
              linha.forEach(valor => html += `<td>${Number(valor).toFixed(4)}</td>`);
              html += `</tr>`;
            });
            html += `</tbody></table></div>`;
        }
    
    } else {
        if (data.raiz !== null && data.raiz !== undefined) {
          html += `<p class="raiz-destaque">Resultado: <strong>${Number(data.raiz).toFixed(8)}</strong></p>`;
        }
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
    }
    resultadoDiv.innerHTML = html;

  } catch (err) {
    console.error("Fetch Error:", err);
    resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro de conexão.</strong> Verifique se o servidor Python (app.py) está rodando.</div>`;
  }
});
