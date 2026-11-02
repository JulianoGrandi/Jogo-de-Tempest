// Estado, cálculos e ações. O progresso usa a chave reinoSlimeV2.

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


