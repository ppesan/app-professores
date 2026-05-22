const ITENS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRySizVgSy5bni7oMRC0iuCzZG0oFuy0F9po0E2SbJPu734PWpD_V_LsXl-pPs4bR_2ySGKxuc6wKR/pub?output=csv";

const AVISOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRySizVgSy5bni7oMRC0iuCzZG0oFuy0F9po0E2SbJPu734PWpD_V_LsXl-pPs4bR_2ySGKxuc6wKR/pub?gid=1684382034&single=true&output=csv";

const cards = document.getElementById("cards");
const areaAvisos = document.getElementById("areaAvisos");

async function carregarItens() {

  try {

    const resposta = await fetch(
      ITENS_URL + "&t=" + new Date().getTime()
    );

    const texto = await resposta.text();

    const linhas = texto
      .trim()
      .split("\n")
      .map(l => l.split(","));

    const cabecalho = linhas.shift().map(c =>
      c.trim().toLowerCase()
    );

    const itens = linhas.map(linha => {

      const item = {};

      cabecalho.forEach((coluna, i) => {
        item[coluna] = (linha[i] || "").trim();
      });

      return item;
    });

    const itensProf = itens
      .filter(item => {

        return (
          item.ativo?.toUpperCase() === "TRUE" &&
          (
            item.acesso === "prof" ||
            item.acesso === "publico"
          )
        );

      })
      .sort(
        (a, b) =>
          Number(a.ordem || 999) -
          Number(b.ordem || 999)
      );

    mostrarCards(itensProf);

  } catch (erro) {

    console.error(erro);

    cards.innerHTML = `
      <div class="loading">
        Erro ao carregar módulos.
      </div>weeeem,fr p0--k,n
    `;
  }
}

function mostrarCards(itens) {

  if (!itens.length) {

    cards.innerHTML = `
      <div class="loading">
        Nenhum módulo ativo encontrado.
      </div>
    `;

    return;
  }

  cards.innerHTML = itens.map(item => {

  const externo =
    item.url.includes("aluno-san") ||
    item.url.includes("script.google.com");

  return `

    <a class="card"
       href="${item.url}"
       ${externo
         ? 'target="_blank" rel="noopener noreferrer"'
         : ''}>

      <h2>${item.titulo}</h2>

      <p>
        ${item.tags || "Módulo do sistema"}
      </p>

    </a>

  `;

}).join("");
}

async function carregarAvisos() {

  try {

    const resposta = await fetch(
      AVISOS_URL + "&t=" + new Date().getTime()
    );

    const texto = await resposta.text();

    const linhas = texto
      .trim()
      .split("\n")
      .map(l => l.split(","));

    const cabecalho = linhas.shift().map(c =>
      c.trim().toLowerCase()
    );

    const avisos = linhas.map(linha => {

      const aviso = {};

      cabecalho.forEach((coluna, i) => {
        aviso[coluna] = (linha[i] || "").trim();
      });

      return aviso;
    });

    const ativos = avisos.filter(aviso =>
      aviso.ativo?.toUpperCase() === "TRUE"
    );

    mostrarAvisos(ativos);

  } catch (erro) {

    console.error(erro);

  }
}

function mostrarAvisos(avisos) {

  if (!avisos.length) return;

  areaAvisos.innerHTML = avisos.map(aviso => `

    <div class="aviso aviso-${aviso.tipo || "info"}">

      <h3>${aviso.titulo}</h3>

      <p>${aviso.mensagem}</p>

    </div>

  `).join("");
}

document
  .getElementById("btnAtualizar")
  .addEventListener("click", () => {

    location.reload(true);

  });

let deferredPrompt;

window.addEventListener("beforeinstallprompt", e => {

  e.preventDefault();

  deferredPrompt = e;

  const btn = document.getElementById("btnInstalar");

  btn.hidden = false;

  btn.addEventListener("click", async () => {

    btn.hidden = true;

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;

  });

});

carregarItens();
carregarAvisos();
