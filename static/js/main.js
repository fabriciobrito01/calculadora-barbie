// static/js/main.js
document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const funcao = document.getElementById("funcao").value.trim();
  const a = document.getElementById("a").value;
  const b = document.getElementById("b").value;

  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.innerHTML = "Calculando...";

  try {
    const res = await fetch("/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcao, a, b })
    });

    const data = await res.json();
    if (!res.ok) {
      resultadoDiv.innerHTML = `<div style="color:#c62874;"><strong>Erro:</strong> ${data.erro}</div>`;
      return;
    }

    // monta o HTML do resultado
    let html = "";
    if (data.falsa_posicao !== null) {
      html += `<div><strong>Falsa Posição:</strong> ${Number(data.falsa_posicao).toFixed(8)}</div>`;
    } else {
      html += `<div><strong>Falsa Posição:</strong> — (${data.falsa_posicao_erro || 'sem raiz encontrada no intervalo'})</div>`;
    }

    if (data.secante !== null) {
      html += `<div><strong>Secante:</strong> ${Number(data.secante).toFixed(8)}</div>`;
    } else {
      html += `<div><strong>Secante:</strong> — (${data.secante_erro || 'erro'})</div>`;
    }

    resultadoDiv.innerHTML = html;
  } catch (err) {
    resultadoDiv.innerHTML = `<div style="color:#c62874;"><strong>Erro:</strong> Falha na comunicação com o servidor.</div>`;
    console.error(err);
  }
});
