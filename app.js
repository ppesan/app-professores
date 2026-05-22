const ITENS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRySizVgSy5bni7oMRC0iuCzZG0oFuy0F9po0E2SbJPu734PWpD_V_LsXl-pPs4bR_2ySGKxuc6wKR/pub?output=csv";

const AVISOS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRySizVgSy5bni7oMRC0iuCzZG0oFuy0F9po0E2SbJPu734PWpD_V_LsXl-pPs4bR_2ySGKxuc6wKR/pub?gid=1684382034&single=true&output=csv";

const cards = document.getElementById("cards");
const areaAvisos = document.getElementById("areaAvisos");
const btnAtualizar = document.getElementById("btnAtualizar");
const btnInstalar = document.getElementById("btnInstalar");

let deferredPrompt = null;

function quebrarCSV(texto) {
  const linhas = [];
  let linha = [];
  let valor = "";
  let dentroAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const proximo = texto[i + 1];

    if (char === '"' && dentroAspas && proximo === '"') {
      valor += '"';
      i++;
    } else if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === "," && !dentroAspas) {
      linha.push(valor.trim());
      valor = "";
    } else if ((char === "\n" || char === "\r") && !dentroAspas) {
      if (valor || linha.length) {
        linha.push(valor.trim());
        linhas.push(linha);
        linha = [];
        valor = "";
      }
    } else {
      valor += char;
    }
  }

  if (valor || linha.length) {
    linha.push(valor.trim());
    linhas.push(linha);
  }

  return linhas;
}

function csvParaObjetos(texto) {
  const linhas = quebrarCSV(texto.trim());

  if (!linhas.length) return [];

  const cabecalho = linhas.shift().map(c =>
    c.trim().toLowerCase()
  );

  return linhas.map(linha => {
    const item = {};

    cabecalho.forEach((coluna, i) => {
      item[coluna] = (linha[i] || "").trim();
    });

    return item;
  });
}

function appJaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function configurarBotaoInstalar() {
  if (!btnInstalar) return;

  if (appJaInstalado()) {
    btnInstalar.hidden = true;
    return;
  }

  window.addEventListener("beforeinstallprompt", evento => {
    evento.preventDefault();

    if (appJaInstalado()) {
      btnInstalar.hidden = true;
      return;
    }

    deferredPrompt = evento;
    btnInstalar.hidden = false;
  });

  btnInstalar.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    btnInstalar.hidden = true;

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    btnInstalar.hidden = true;
    deferredPrompt = null;
  });
}

function configurarBotaoAtualizar() {
  if (!btnAtualizar) return;

  btnAtualizar.addEventListener("click", async () => {
    if ("serviceWorker" in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      for (const registro of registros) {
        await registro.unregister();
      }
    }

    const nomesCache = await caches.keys();
    await Promise.all(nomesCache.map(nome => caches.delete(nome)));

    window.location.reload();
  });
}

async function carregarItens() {
  try {
    const resposta = await fetch(
      ITENS_URL + "&t=" + new Date().getTime()
    );

    const texto = await resposta.text();
    const itens = csvParaObjetos(texto);

    const itensProf = itens
      .filter(item => {
        const ativo = item.ativo?.toUpperCase() === "TRUE";
        const acesso = (item.acesso || "").toLowerCase();

        return ativo && (acesso === "prof" || acesso === "publico");
      })
      .sort((a, b) =>
        Number(a.ordem || 999) - Number(b.ordem || 999)
      );

    mostrarCards(itensProf);

  } catch (erro) {
    console.error("Erro ao carregar itens:", erro);

    cards.innerHTML = `
      <div class="loading">
        Erro ao carregar os módulos. Verifique a planilha.
      </div>
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
    const url = item.url || "#";

    return `
      <a class="card"
         href="${url}">

        <h2>${item.titulo || "Módulo sem título"}</h2>

        <p>${item.tags || "Módulo do sistema"}</p>

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
    const avisos = csvParaObjetos(texto);

    const ativos = avisos.filter(aviso =>
      aviso.ativo?.toUpperCase() === "TRUE"
    );

    mostrarAvisos(ativos);

  } catch (erro) {
    console.error("Erro ao carregar avisos:", erro);
  }
}

function mostrarAvisos(avisos) {
  if (!avisos.length) {
    areaAvisos.innerHTML = "";
    return;
  }

  areaAvisos.innerHTML = avisos.map(aviso => {
    const tipo = (aviso.tipo || "info").toLowerCase();

    return `
      <div class="aviso aviso-${tipo}">
        <h3>${aviso.titulo || "Aviso"}</h3>
        <p>${aviso.mensagem || ""}</p>
      </div>
    `;
  }).join("");
}

configurarBotaoInstalar();
configurarBotaoAtualizar();
carregarItens();
carregarAvisos();
const avisoInstalacao = document.getElementById("avisoInstalacao");

if (avisoInstalacao && appJaInstalado()) {
  avisoInstalacao.style.display = "none";
}
