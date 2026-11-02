# Reino Slime

Abra `index.html` no navegador. Não é necessário instalar dependências.

## Organização

- `index.html`: estrutura e regiões da página.
- `style.css`: tema, layout e adaptação para celular, em seções numeradas.
- `js/dados.js`: recursos, construções, personagens e facções; ajuste o balanceamento aqui.
- `js/reino.js`: estado, fórmulas e ações do jogador.
- `js/interface.js`: renderização dos recursos e das três abas.
- `game.js`: carregamento da página, salvamento e ciclo de produção.
- `icon/`: imagens usadas na interface.
- `assets/tempest.png`: cenário de fundo.

Os scripts usam `defer` e devem permanecer na ordem declarada no HTML.
O salvamento continua na chave `reinoSlimeV2` do navegador.
