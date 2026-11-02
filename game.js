/* ============================================================
   REINO SLIME - LÓGICA DO JOGO
   Ordem do arquivo:
   1. Dados fixos        (o "livro de regras")
   2. Estado do jogo     (o que muda enquanto você joga)
   3. Fórmulas           (cálculos)
   4. Ações              (o que cada botão faz)
   5. Desenho da tela    (render)
   6. Salvar e carregar
   7. Eventos e ciclo do jogo
   ============================================================ */


/* ============================================================
   1. DADOS FIXOS
   Nada aqui muda durante o jogo. Para balancear, edite aqui.
   ============================================================ */

// Os 3 recursos: [nome, emoji]
const RECURSOS = {
  madeira: { nome: "Madeira",   icone: "🪵" },
  pedra:   { nome: "Pedra",     icone: "🪨" },
  mana:    { nome: "Magicules", icone: "✨" }
};

// Produção base por segundo, por nível da construção
const PRODUCAO_BASE = { madeira: 2, pedra: 1.5, mana: 1 };

// Construções. "recurso" = o que produzem (casas e quartel não produzem)
const CONSTRUCOES = {
  serraria: { nome: "Serraria",           icone: "🪚", recurso: "madeira", custoBase: { madeira: 30, pedra: 10 },            descricao: "Produz madeira" },
  pedreira: { nome: "Pedreira",           icone: "⛏️", recurso: "pedra",   custoBase: { madeira: 40, pedra: 15 },            descricao: "Produz pedra" },
  torre:    { nome: "Torre de Magicules", icone: "🗼", recurso: "mana",    custoBase: { madeira: 40, pedra: 40 },            descricao: "Produz magicules" },
  casas:    { nome: "Casas",              icone: "🏠",                      custoBase: { madeira: 60, pedra: 40 },            descricao: "+10% de produção por nível" },
  quartel:  { nome: "Quartel",            icone: "🏰",                      custoBase: { madeira: 80, pedra: 80, mana: 30 },  descricao: "+1 vaga de personagem por nível" }
};

// Personagens
//  recurso     = o recurso que ele impulsiona
//  formas      = nome em cada evolução (3 formas)
//  habilidades = [nível necessário, nome]
//  custo       = preço para recrutar
const PERSONAGENS = {
  slime: {
    nome: "Slime", icone: "🟦", recurso: "mana",
    formas: ["Slime", "Slime Ancião", "Slime Soberano"],
    habilidades: [[1, "Absorver"], [4, "Imitar"], [9, "Devorar"], [15, "Soberania"]],
    custo: {}
  },
  goblin: {
    nome: "Goblin", icone: "👺", recurso: "madeira",
    formas: ["Goblin", "Hobgoblin", "Rei Goblin"],
    habilidades: [[1, "Corte Rápido"], [4, "Marcha de Guerra"], [9, "Mestre Ferreiro"], [15, "Horda"]],
    custo: { madeira: 50, mana: 20 }
  },
  ogro: {
    nome: "Ogro", icone: "👹", recurso: "pedra",
    formas: ["Ogro", "Oni", "Senhor Oni"],
    habilidades: [[1, "Punho de Pedra"], [4, "Pele de Ferro"], [9, "Fúria Oni"], [15, "Rugido Real"]],
    custo: { pedra: 60, mana: 30 }
  },
  lobo: {
    nome: "Lobo", icone: "🐺", recurso: "mana",
    formas: ["Lobo Negro", "Lobo Tempestade", "Lobo Estelar"],
    habilidades: [[1, "Faro"], [4, "Uivo Sombrio"], [9, "Sombra Veloz"], [15, "Tempestade Negra"]],
    custo: { mana: 60, madeira: 30 }
  }
};

// Facções. "recurso" e "valor" = o presente que elas aceitam
const FACCOES = {
  anoes:    { nome: "Reino Anão",      icone: "⚒️", recurso: "pedra",   valor: 60, bonusTexto: "+25% de pedra" },
  elfos:    { nome: "Floresta Élfica", icone: "🌿", recurso: "mana",    valor: 40, bonusTexto: "+25% de magicules" },
  orcs:     { nome: "Clã Orc",         icone: "🪓", recurso: "madeira", valor: 60, bonusTexto: "+25% de madeira" },
  humanos:  { nome: "Reino Humano",    icone: "👑", recurso: "mana",    valor: 80, bonusTexto: "+10% de tudo" }
};

// Qual facção dá bônus para qual recurso
const ALIADO_DO_RECURSO = { pedra: "anoes", mana: "elfos", madeira: "orcs" };


/* ============================================================
   2. ESTADO DO JOGO
   Tudo que muda fica dentro de UM objeto: "estado".
   Salvar o jogo = salvar esse objeto.
   ============================================================ */

function novoJogo() {
  return {
    recursos:    { madeira: 60, pedra: 40, mana: 20 },
    construcoes: { serraria: 1, pedreira: 1, torre: 1, casas: 0, quartel: 0 },
    personagens: [
      // tipo, nível, xp, evolução (0 a 2), recargaAte = hora em que a expedição libera
      { tipo: "slime", nivel: 1, xp: 0, evolucao: 0, recargaAte: 0 }
    ],
    relacoes: { anoes: 0, elfos: 0, orcs: 0, humanos: 0 },   // 0 a 100
    log: [],
    ultimoSalvamento: Date.now()
  };
}

let estado = novoJogo();
let abaAtual = "cidade";

// Se existir um save no navegador, usa ele no lugar do jogo novo
try {
  const salvo = localStorage.getItem("reinoSlimeV2");
  if (salvo) estado = JSON.parse(salvo);
} catch (erro) { /* sem localStorage: segue com jogo novo */ }


/* ============================================================
   3. FÓRMULAS
   ============================================================ */

// Atalho: pega um elemento do HTML pelo id
const $ = id => document.getElementById(id);

// Formata número no padrão brasileiro (1.234)
const formatar = n => Math.floor(n).toLocaleString("pt-BR");

// A facção já virou aliada? (relação chegou a 100)
const temAlianca = faccao => estado.relacoes[faccao] >= 100;

// Bônus de um personagem: 3% por nível + 10% por evolução + 5% por habilidade
function bonusDoPersonagem(p) {
  const habilidadesLiberadas = PERSONAGENS[p.tipo].habilidades
    .filter(h => p.nivel >= h[0]).length;
  return 0.03 * p.nivel + 0.10 * p.evolucao + 0.05 * habilidadesLiberadas;
}

const xpParaSubir  = p => p.nivel * 25;           // XP necessário para o próximo nível
const nivelMaximo  = p => 5 + p.evolucao * 7;     // 5, 12 ou 19
const vagasTotais  = () => 2 + estado.construcoes.quartel;

// Multiplicador de produção de um recurso (casas + personagens + alianças)
function multiplicador(recurso) {
  let m = 1 + 0.10 * estado.construcoes.casas;

  estado.personagens.forEach(p => {
    if (PERSONAGENS[p.tipo].recurso === recurso) m += bonusDoPersonagem(p);
  });

  if (temAlianca(ALIADO_DO_RECURSO[recurso])) m += 0.25;
  if (temAlianca("humanos")) m += 0.10;
  return m;
}

// Qual construção produz esse recurso? (ex: "madeira" -> "serraria")
const construcaoDoRecurso = recurso =>
  Object.keys(CONSTRUCOES).find(k => CONSTRUCOES[k].recurso === recurso);

// Produção por segundo = nível da construção x base x multiplicador
const producaoPorSegundo = recurso =>
  estado.construcoes[construcaoDoRecurso(recurso)] * PRODUCAO_BASE[recurso] * multiplicador(recurso);

// Custo de melhorar: custo base x 1,7 elevado ao nível atual (cresce rápido!)
function custoDaConstrucao(chave) {
  const custo = {};
  for (const r in CONSTRUCOES[chave].custoBase) {
    custo[r] = Math.floor(CONSTRUCOES[chave].custoBase[r] * Math.pow(1.7, estado.construcoes[chave]));
  }
  return custo;
}

// Funções para lidar com custos (um custo é um objeto: { madeira: 30, pedra: 10 })
const podePagar = custo => Object.keys(custo).every(r => estado.recursos[r] >= custo[r]);
const pagar = custo => { for (const r in custo) estado.recursos[r] -= custo[r]; };
const textoDoCusto = custo =>
  Object.keys(custo).map(r => RECURSOS[r].icone + " " + formatar(custo[r])).join("  ") || "Grátis";

// Guarda uma mensagem no log (só as 5 mais recentes)
function registrar(mensagem) {
  estado.log.unshift(mensagem);          // unshift = coloca no começo
  estado.log = estado.log.slice(0, 5);   // mantém só 5
}

// Dá XP e sobe de nível quantas vezes for preciso
function ganharXp(p, quantidade) {
  if (p.nivel >= nivelMaximo(p)) { p.xp = 0; return; }

  p.xp += quantidade;
  while (p.xp >= xpParaSubir(p) && p.nivel < nivelMaximo(p)) {
    p.xp -= xpParaSubir(p);
    p.nivel++;
    registrar("⬆️ " + PERSONAGENS[p.tipo].formas[p.evolucao] + " chegou ao nível " + p.nivel + "!");

    PERSONAGENS[p.tipo].habilidades.forEach(h => {
      if (h[0] === p.nivel) registrar("🌟 Nova habilidade: " + h[1]);
    });
  }
  if (p.nivel >= nivelMaximo(p)) p.xp = 0;
}


/* ============================================================
   4. AÇÕES
   Cada botão do HTML tem data-acao="nome:chave".
   O "nome" procura uma função aqui; a "chave" é o argumento.
   ============================================================ */

const ACOES = {

  aba(chave) { abaAtual = chave; },

  reiniciar() {
    if (confirm("Apagar o progresso e recomeçar?")) estado = novoJogo();
  },

  melhorar(chave) {
    const custo = custoDaConstrucao(chave);
    if (!podePagar(custo)) return;
    pagar(custo);
    estado.construcoes[chave]++;
    registrar("🏗️ " + CONSTRUCOES[chave].nome + " subiu para o nível " + estado.construcoes[chave]);
  },

  recrutar(chave) {
    const custo = PERSONAGENS[chave].custo;
    if (!podePagar(custo) || estado.personagens.length >= vagasTotais()) return;
    pagar(custo);
    estado.personagens.push({ tipo: chave, nivel: 1, xp: 0, evolucao: 0, recargaAte: 0 });
    registrar("🎉 " + PERSONAGENS[chave].nome + " juntou-se ao reino!");
  },

  treinar(indice) {
    const p = estado.personagens[+indice];       // "+" transforma texto em número
    if (estado.recursos.mana < 15 || p.nivel >= nivelMaximo(p)) return;
    estado.recursos.mana -= 15;
    ganharXp(p, 30);
  },

  evoluir(indice) {
    const p = estado.personagens[+indice];
    const custo = 100 * (p.evolucao + 1);
    if (estado.recursos.mana < custo || p.nivel < nivelMaximo(p) || p.evolucao >= 2) return;
    estado.recursos.mana -= custo;
    p.evolucao++;
    const formas = PERSONAGENS[p.tipo].formas;
    registrar("✨ Evolução! " + formas[p.evolucao - 1] + " → " + formas[p.evolucao]);
  },

  expedicao(indice) {
    const p = estado.personagens[+indice];
    if (Date.now() < p.recargaAte) return;       // ainda em recarga
    p.recargaAte = Date.now() + 30000;           // 30 segundos

    const ganhos = [];
    for (const r in RECURSOS) {
      // (8 + nível x 4) multiplicado por um número aleatório entre 0,6 e 1,6
      const valor = Math.floor((8 + p.nivel * 4) * (0.6 + Math.random()));
      estado.recursos[r] += valor;
      ganhos.push(RECURSOS[r].icone + valor);
    }
    ganharXp(p, 15 + p.nivel * 3);
    registrar("🧭 " + PERSONAGENS[p.tipo].formas[p.evolucao] + " voltou da expedição: " + ganhos.join(" "));
  },

  presentear(chave) {
    const f = FACCOES[chave];
    if (estado.recursos[f.recurso] < f.valor || estado.relacoes[chave] >= 100) return;
    estado.recursos[f.recurso] -= f.valor;
    estado.relacoes[chave] = Math.min(100, estado.relacoes[chave] + 12);

    if (estado.relacoes[chave] >= 100) registrar("🤝 Aliança firmada com " + f.nome + "! " + f.bonusTexto);
    else registrar("🎁 Presente enviado a " + f.nome);
  }
};


/* ============================================================
   5. DESENHO DA TELA
   Monta texto HTML com `template strings` e coloca na página.
   ${...} dentro das crases insere valores do JavaScript.
   ============================================================ */

function desenharRecursos() {
  $("recursos").innerHTML = Object.keys(RECURSOS).map(r => `
    <div class="pilula">
      <span>${RECURSOS[r].icone} ${RECURSOS[r].nome}</span>
      <b>${formatar(estado.recursos[r])}</b>
      <small>+${producaoPorSegundo(r).toFixed(1)}/s</small>
    </div>`).join("");
}

function desenharAbas() {
  document.querySelectorAll(".aba").forEach(botao => {
    botao.classList.toggle("ativa", botao.dataset.acao === "aba:" + abaAtual);
  });
}

function desenharCidade() {
  return Object.keys(CONSTRUCOES).map(chave => {
    const c = CONSTRUCOES[chave];
    const custo = custoDaConstrucao(chave);
    return `
      <div class="cartao">
        <div class="icone">${c.icone}</div>
        <div class="info">
          <b>${c.nome}</b><span class="etiqueta">Nv ${estado.construcoes[chave]}</span>
          <p>${c.descricao}</p>
          <p class="custo">${textoDoCusto(custo)}</p>
        </div>
        <button data-acao="melhorar:${chave}" ${podePagar(custo) ? "" : "disabled"}>Melhorar</button>
      </div>`;
  }).join("");
}

function desenharPersonagens() {
  let html = `<h2>Seu time (${estado.personagens.length}/${vagasTotais()} vagas)</h2>`;

  // Cartão de cada personagem do time
  html += estado.personagens.map((p, i) => {
    const t = PERSONAGENS[p.tipo];
    const noMaximo = p.nivel >= nivelMaximo(p);
    const segundosRestantes = Math.max(0, Math.ceil((p.recargaAte - Date.now()) / 1000));
    const custoEvolucao = 100 * (p.evolucao + 1);
    const porcentoXp = noMaximo ? 100 : Math.min(100, p.xp / xpParaSubir(p) * 100);

    const chips = t.habilidades.map(h => `
      <span class="chip ${p.nivel >= h[0] ? "desbloqueada" : ""}">
        ${p.nivel >= h[0] ? "✔" : "🔒 Nv " + h[0]} ${h[1]}
      </span>`).join("");

    const botaoEvoluir = (noMaximo && p.evolucao < 2)
      ? `<button class="evoluir" data-acao="evoluir:${i}" ${estado.recursos.mana >= custoEvolucao ? "" : "disabled"}>Evoluir (✨${custoEvolucao})</button>`
      : "";

    return `
      <div class="cartao coluna">
        <div class="topo">
          <div>
            <span style="font-size:26px">${t.icone}</span>
            <b>${t.formas[p.evolucao]}</b>
            <span class="etiqueta">Nv ${p.nivel}/${nivelMaximo(p)}</span>
            <span class="etiqueta">Forma ${p.evolucao + 1}/3</span>
          </div>
          <small>${RECURSOS[t.recurso].icone} +${Math.round(bonusDoPersonagem(p) * 100)}%</small>
        </div>
        <div class="barra"><i style="width:${porcentoXp}%"></i></div>
        <div>${chips}</div>
        <div class="linha">
          <button data-acao="treinar:${i}" ${estado.recursos.mana >= 15 && !noMaximo ? "" : "disabled"}>Treinar (✨15)</button>
          <button class="roxo" data-acao="expedicao:${i}" ${segundosRestantes ? "disabled" : ""}>
            ${segundosRestantes ? "Expedição (" + segundosRestantes + "s)" : "Expedição"}
          </button>
          ${botaoEvoluir}
        </div>
      </div>`;
  }).join("");

  // Lista de quem ainda pode ser recrutado
  const disponiveis = Object.keys(PERSONAGENS).filter(k => !estado.personagens.some(p => p.tipo === k));
  if (disponiveis.length) {
    html += "<h2>Recrutar</h2>" + disponiveis.map(k => {
      const t = PERSONAGENS[k];
      const liberado = podePagar(t.custo) && estado.personagens.length < vagasTotais();
      return `
        <div class="cartao">
          <div class="icone">${t.icone}</div>
          <div class="info">
            <b>${t.nome}</b>
            <p>Impulsiona ${RECURSOS[t.recurso].nome.toLowerCase()}</p>
            <p class="custo">${textoDoCusto(t.custo)}</p>
          </div>
          <button data-acao="recrutar:${k}" ${liberado ? "" : "disabled"}>Recrutar</button>
        </div>`;
    }).join("");
  }
  return html;
}

function desenharAliancas() {
  return Object.keys(FACCOES).map(chave => {
    const f = FACCOES[chave];
    const relacao = estado.relacoes[chave];
    const podeDar = estado.recursos[f.recurso] >= f.valor && relacao < 100;
    return `
      <div class="cartao">
        <div class="icone">${f.icone}</div>
        <div class="info">
          <b>${f.nome}</b>${relacao >= 100 ? '<span class="etiqueta">Aliado</span>' : ""}
          <p>Bônus de aliança: ${f.bonusTexto}</p>
          <div class="barra"><i style="width:${relacao}%"></i></div>
          <p>Relação ${relacao}/100</p>
        </div>
        <button data-acao="presentear:${chave}" ${podeDar ? "" : "disabled"}>Presente (${RECURSOS[f.recurso].icone}${f.valor})</button>
      </div>`;
  }).join("");
}

function desenharLog() {
  $("log").innerHTML = estado.log.map(msg => `<div>${msg}</div>`).join("");
}

// Função principal: redesenha tudo
function desenhar() {
  desenharRecursos();
  desenharAbas();

  if (abaAtual === "cidade")          $("conteudo").innerHTML = desenharCidade();
  else if (abaAtual === "personagens") $("conteudo").innerHTML = desenharPersonagens();
  else                                 $("conteudo").innerHTML = desenharAliancas();

  desenharLog();
}


/* ============================================================
   6. SALVAR
   ============================================================ */

function salvar() {
  estado.ultimoSalvamento = Date.now();
  try {
    localStorage.setItem("reinoSlimeV2", JSON.stringify(estado));
  } catch (erro) { /* ignora se não puder salvar */ }
}


/* ============================================================
   7. EVENTOS E CICLO DO JOGO
   ============================================================ */

// Passa "dt" segundos: produz recursos e dá XP passivo (0,5 por segundo)
function passarTempo(dt) {
  for (const r in RECURSOS) estado.recursos[r] += producaoPorSegundo(r) * dt;
  estado.personagens.forEach(p => ganharXp(p, 0.5 * dt));
}

// UM único ouvinte de clique para a página inteira ("delegação de eventos").
// Funciona mesmo com botões recriados o tempo todo.
document.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao]");   // achou um botão de ação?
  if (!botao || botao.disabled) return;

  const [nome, chave] = botao.dataset.acao.split(":");  // "melhorar:serraria" -> ["melhorar","serraria"]
  ACOES[nome](chave);                                   // chama a função certa

  salvar();
  desenhar();
});

// Progresso offline: até 1 hora de produção enquanto você estava fora
const segundosFora = Math.min((Date.now() - (estado.ultimoSalvamento || Date.now())) / 1000, 3600);
if (segundosFora > 60) {
  passarTempo(segundosFora);
  registrar("🌙 Seu reino rendeu durante " + Math.round(segundosFora / 60) + " min de ausência.");
}

// O "coração" do jogo: roda a cada 1 segundo
let contador = 0;
setInterval(() => {
  passarTempo(1);
  contador++;
  if (contador % 5 === 0) salvar();   // salva a cada 5 segundos
  desenhar();
}, 1000);

// Primeira pintura da tela
desenhar();
