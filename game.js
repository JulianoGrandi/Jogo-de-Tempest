// Inicialização, persistência e ciclo de atualização do jogo.

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
