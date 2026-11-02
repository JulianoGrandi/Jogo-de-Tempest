// Renderização das abas, recursos e acontecimentos.

function desenharRecursos() {
  $("recursos").innerHTML = Object.keys(RECURSOS).map(r => `
    <div class="pilula">
      <div class="recurso-imagem">${RECURSOS[r].icone}</div><div class="recurso-valores"><span>${RECURSOS[r].nome}</span>
      <b>${formatar(estado.recursos[r])}</b>
      <small>+${producaoPorSegundo(r).toFixed(1)}/s</small></div>
    </div>`).join("");
}

function desenharAbas() {
  const titulos = { cidade: "Sua cidade", personagens: "Seus personagens", aliancas: "Suas alianças" };
  $("titulo-secao").textContent = titulos[abaAtual];
  $("resumo-secao").textContent = abaAtual === "cidade" ? "5 construções" : abaAtual === "personagens" ? `${estado.personagens.length}/${vagasTotais()} vagas ocupadas` : "4 povos para conhecer";
  document.querySelectorAll(".aba").forEach(botao => {
    botao.classList.toggle("ativa", botao.dataset.acao === "aba:" + abaAtual);
    botao.setAttribute("aria-current", botao.classList.contains("ativa") ? "page" : "false");
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
        <button data-acao="melhorar:${chave}" ${podePagar(custo) ? "" : "disabled"}><img class="ico" src="icon/icone_melhorar.png" alt=""> Melhorar</button>
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
  $("log").innerHTML = estado.log.map(msg => `<div>${msg}</div>`).join("") || "<p>Tudo pronto para começar. Melhore uma construção e faça seu reino crescer!</p>";
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


