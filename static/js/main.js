// ============================================================
// 💖 main.js — Calculadora Barbie de Raízes e Sistemas
// ============================================================

// === Seleção de elementos da interface ===
const botoesMetodo = document.querySelectorAll('.btn-metodo');
const inputMetodo = document.getElementById('metodo');
const camposRaizes = document.getElementById('campos-raizes');
const camposGauss = document.getElementById('campos-gauss');
const criteriosParada = document.getElementById('criterios-parada');
const labelA = document.getElementById('label-a');
const labelB = document.getElementById('label-b');
const resultadoDiv = document.getElementById('resultado');
// elementos da grade de Gauss
const matrizGridDiv = document.getElementById('matriz-grid');
const gerarBtn = document.getElementById('gerar_matriz');
const nRowsInput = document.getElementById('n_rows');

// === Função utilitária para limpar campos ===
function limparCampos() {
  document.getElementById('funcao').value = '';
  document.getElementById('a').value = '';
  document.getElementById('b').value = '';
  document.getElementById('tol').value = '';
  document.getElementById('max_iter').value = '';
  // limpa grade de matriz (se existir)
  if (matrizGridDiv) matrizGridDiv.innerHTML = '';
  resultadoDiv.innerHTML = '';
}

// === Controle de seleção dos métodos ===
botoesMetodo.forEach(btn => {
  btn.addEventListener('click', () => {
    botoesMetodo.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const metodo = btn.dataset.metodo;
    inputMetodo.value = metodo;
    limparCampos();

    // Exibe/oculta campos conforme o método
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
      criteriosParada.style.display = 'none'; // Gauss não usa tol/iter
      // gera grade automaticamente se n informado
      const nVal = nRowsInput && nRowsInput.value ? parseInt(nRowsInput.value, 10) : null;
      if (nVal) {
        generateMatrixGrid(Math.max(1, nVal), Math.max(2, nVal + 1));
      } else if (matrizGridDiv) {
        matrizGridDiv.innerHTML = '<div class="erro-msg">Informe Linhas (n) e clique em Gerar matriz.</div>';
      }
    }
  });
});

// === Inicializa interface limpa ===
limparCampos();

// === Funções de geração e leitura da grade de matriz ===
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
      input.placeholder = '';
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
        const txt = inp.value.trim();
        if (txt === '') {
          val = 0;
        } else {
          const parsed = parseFloat(txt.replace(',', '.'));
          val = isNaN(parsed) ? NaN : parsed;
        }
      }
      row.push(val);
    }
    rows.push(row);
  }
  return rows;
}

// Gerar ao clicar (m = n + 1)
if (gerarBtn) {
  gerarBtn.addEventListener('click', () => {
    const n = parseInt(nRowsInput.value, 10) || 1;
    const m = Math.max(2, n + 1);
    generateMatrixGrid(Math.max(1, n), m);
  });
}

// ============================================================
// 🚀 Envio do formulário principal
// ============================================================
document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const metodo = inputMetodo.value;
  resultadoDiv.innerHTML = "⏳ Calculando...";

  // Payload básico
  let payload = { metodo };

  // =======================================================
  // 🧮 Caso 1: Eliminação de Gauss
  // =======================================================
  if (metodo === 'gauss') {
    // exige n_rows e grade gerada (colunas = n + 1)
    const nVal = nRowsInput && nRowsInput.value ? nRowsInput.value.trim() : '';
    if (nVal === '') {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Informe Linhas (n) e clique em Gerar matriz.</div>`;
      return;
    }

    const gridRows = getMatrixFromGrid();
    if (!gridRows || gridRows.length === 0) {
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Gere a grade da matriz antes de enviar.</div>`;
      return;
    }

    // valida valores
    for (let i = 0; i < gridRows.length; i++) {
      for (let j = 0; j < gridRows[i].length; j++) {
        if (isNaN(gridRows[i][j])) {
          resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Valor inválido na posição (${i + 1}, ${j + 1}).</div>`;
          return;
        }
      }
    }

    payload.matrix = gridRows;

    try {
      const res = await fetch("/gauss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> ${data.error}</div>`;
        return;
      }

      // === Renderização estilizada ===
      let html = `
        <h3>Resultado: Eliminação de Gauss</h3>
        <div class="gauss-info">
          <p><strong>Tipo de solução:</strong> <span class="tag-solucao">${data.tipo_solucao}</span></p>
          <p><strong>Determinante:</strong> <span class="valor">${Number(data.determinante).toFixed(6)}</span></p>
        </div>
        <h4>Matriz Escalonada:</h4>
      `;

      // Tabela da matriz
      if (Array.isArray(data.matriz_escalonada)) {
        html += `<div class="tabela-gauss"><table><tbody>`;
        data.matriz_escalonada.forEach(linha => {
          html += `<tr>`;
          linha.forEach(valor => {
            html += `<td>${Number(valor).toFixed(6)}</td>`;
          });
          html += `</tr>`;
        });
        html += `</tbody></table></div>`;

        // -------------------------------------------------------
        // 🔢 Cálculo do vetor solução (retrosubstituição simples)
        // -------------------------------------------------------
        if (data.tipo_solucao === "Única") {
          try {
            const A = data.matriz_escalonada;
            const n = A.length;
            const m = A[0].length;
            const sol = new Array(n).fill(0);

            for (let i = n - 1; i >= 0; i--) {
              let soma = 0;
              for (let j = i + 1; j < n; j++) {
                soma += A[i][j] * sol[j];
              }
              sol[i] = A[i][m - 1] - soma;
            }

            html += `<h4>Vetor Solução:</h4><div class="tabela-gauss"><table><tbody>`;
            sol.forEach((x, i) => {
              html += `<tr><td><strong>x<sub>${i + 1}</sub></strong></td><td>${x.toFixed(6)}</td></tr>`;
            });
            html += `</tbody></table></div>`;
          } catch (e) {
            console.warn("Falha ao calcular vetor solução:", e);
          }
        }
      }

      resultadoDiv.innerHTML = html;
      return;
    } catch (err) {
      console.error(err);
      resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro de conexão.</strong></div>`;
      return;
    }
  }

  // =======================================================
  // 🔁 Caso 2: Métodos Iterativos (Falsa Posição, Secante)
  // =======================================================
  payload.funcao = document.getElementById("funcao").value.trim();
  payload.a = document.getElementById("a").value;
  payload.b = document.getElementById("b").value;
  payload.tol = document.getElementById("tol").value.trim();
  payload.max_iter = document.getElementById("max_iter").value;

  if (!payload.funcao || !payload.a || !payload.b || !payload.tol || !payload.max_iter) {
    resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro:</strong> Preencha todos os campos.</div>`;
    return;
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

    // ===================================================
    // 🧾 Renderização dos métodos iterativos
    // ===================================================
    let html = `<h3>Resultados: ${data.metodo_nome}</h3>`;
    if (data.msg) html += `<p class="status-msg">${data.msg}</p>`;
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

    resultadoDiv.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultadoDiv.innerHTML = `<div class="erro-msg"><strong>Erro de conexão.</strong></div>`;
  }
});
