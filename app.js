const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRySizVgSy5bni7oMRC0iuCzZG0oFuy0F9po0E2SbJPu734PWpD_V_LsXl-pPs4bR_2ySGKxuc6wKR/pub?output=csv";

const cards = document.getElementById("cards");

async function carregarItens() {
  try {
    const resposta = await fetch(CSV_URL + "&t=" + new Date().getTime());
    const texto = await resposta.text();

    const linhas = texto.trim().split("\n").map(l => l.split(","));
    const cabecalho = linhas.shift().map(c => c.trim().toLowerCase());

    const itens = linhas.map(linha => {
      const item = {};
      cabecalho.forEach((coluna, i) => {
        item[coluna] = (linha[i] || "").trim();
      });
      return item;
    });

    const itensProf = itens
      .filter(item => {
        return item.ativo.toUpperCase() === "TRUE" &&
               (item.acesso === "prof" || item.acesso === "publico");
      })
      .sort((a, b) => Number(a.ordem || 999) - Number(b.ordem || 999));

    mostrarCards(itensProf);

  } catch (erro) {
    cards.innerHTML = `
      <div class="loading">
        Erro ao carregar os módulos. Verifique o link da planilha.
      </div>
    `;
    console.error(erro);
  }
}

function mostrarCards(itens) {
  if (!itens.length) {
    cards.innerHTML = `
      <div class="loading">
        Nenhum módulo ativo encontrado para professores.
      </div>
    `;
    return;
  }

  cards.innerHTML = itens.map(item => `
    <a class="card" href="${item.url}" target="_blank">
      <h2>${item.titulo}</h2>
      <p>${item.tags || "Módulo do App Professores"}</p>
    </a>
  `).join("");
}

carregarItens();
