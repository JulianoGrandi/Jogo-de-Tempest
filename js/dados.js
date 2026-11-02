// Dados de balanceamento e catálogo do reino.

// Os 3 recursos: [nome, emoji]
const RECURSOS = {
  madeira: { nome: "Madeira",   icone: '<img class="ico" src="icon/recurso_madeira.png" alt="">' },
  pedra:   { nome: "Pedra",     icone: '<img class="ico" src="icon/recurso_pedra.png" alt="">' },
  mana:    { nome: "Magicules", icone: '<img class="ico" src="icon/recurso_magicules.png" alt="">' }
};

// Produção base por segundo, por nível da construção
const PRODUCAO_BASE = { madeira: 2, pedra: 1.5, mana: 1 };

// Construções. "recurso" = o que produzem (casas e quartel não produzem)
const CONSTRUCOES = {
  serraria: { nome: "Serraria",           icone: '<img class="ico" src="icon/edificio_serraria.png" alt="">', recurso: "madeira", custoBase: { madeira: 30, pedra: 10 },            descricao: "Produz madeira" },
  pedreira: { nome: "Pedreira",           icone: '<img class="ico" src="icon/edificio_pedreira.png" alt="">', recurso: "pedra",   custoBase: { madeira: 40, pedra: 15 },            descricao: "Produz pedra" },
  torre:    { nome: "Torre de Magicules", icone: '<img class="ico" src="icon/edificio_torre_magica.png" alt="">', recurso: "mana",    custoBase: { madeira: 40, pedra: 40 },            descricao: "Produz magicules" },
  casas:    { nome: "Casas",              icone: '<img class="ico" src="icon/edificio_casas.png" alt="">',                      custoBase: { madeira: 60, pedra: 40 },            descricao: "+10% de produção por nível" },
  quartel:  { nome: "Quartel",            icone: '<img class="ico" src="icon/edificio_quartel.png" alt="">',                      custoBase: { madeira: 80, pedra: 80, mana: 30 },  descricao: "+1 vaga de personagem por nível" }
};

// Personagens
//  recurso     = o recurso que ele impulsiona
//  formas      = nome em cada evolução (3 formas)
//  habilidades = [nível necessário, nome]
//  custo       = preço para recrutar
const PERSONAGENS = {
  slime: {
    nome: "Slime", icone: '<img class="ico" src="icon/slime.png" alt="">', recurso: "mana",
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
  humanos:  { nome: "Reino Humano",    icone: '<img class="ico" src="icon/icone_coroa.png" alt="">', recurso: "mana",    valor: 80, bonusTexto: "+10% de tudo" }
};

// Qual facção dá bônus para qual recurso
const ALIADO_DO_RECURSO = { pedra: "anoes", mana: "elfos", madeira: "orcs" };


