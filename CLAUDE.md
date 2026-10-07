# Site Integre Jr

Novo site institucional da Integre Júnior (Empresa Júnior de engenharia da UFSC Blumenau), que substitui
o integrejr.ufsc.br. Por enquanto é um **protótipo**: estrutura e identidade visual, com conteúdo provisório.

- Estrutura de páginas: [ESTRUTURA.md](ESTRUTURA.md). É uma base de partida e ainda pode mudar.
- Site atual, identidade do Instagram e decisões já tomadas: [PESQUISA.md](PESQUISA.md). A referência
  visual é o Instagram recente, não o site antigo.

## Stack e como ver

HTML + CSS + JS puro, sem build, framework nem dependências (mesmo esquema do Urupema). Basta abrir
qualquer `.html` direto no navegador (`file://`). As fontes vêm do Google Fonts, então é preciso internet.
Conferir sempre no computador e no celular (390 px).

## Arquitetura

```
index.html  sobre.html  solucoes.html  eventos.html   ← as 4 páginas
css/styles.css                  ← todo o estilo (tokens no :root, seções numeradas)
js/main.js                      ← todo o comportamento, um IIFE só
imagens/                        ← logos, mascotes e SVGs usados no site
Logos e imagens para se basear/ ← originais enviados pela Integre (não editar)
_ferramentas/recorte/           ← recorte de fundo das imagens (não publicar)
```

**Blocos duplicados nas 4 páginas.** Não há includes, para o site funcionar em `file://`. O sprite de
ícones, o `<header>`, o menu mobile `.mobile-nav` e o `<footer>` são copiados iguais nas 4 páginas.
Se mudar um deles, replique nas 4. A única diferença intencional: o link da própria página leva
`class="is-active" aria-current="page"` no `.nav` e no `.mobile-nav__links`.

## Identidade (resumo; detalhes em PESQUISA.md)

- Cores só por variável do `:root`. Integre: `--navy-900 #061033` (principal), `--azul #2645A0` (azul
  escuro dos destaques), `--offwhite #F3F4F7`, branco e `--ink #03103A` (títulos no claro). O roxo
  `--purple #6637A1` é só detalhe.
- **Cada evento tem identidade própria.** Os prints oficiais estão em
  `Logos e imagens para se basear/IDV eventos/` (agasalho, hackathon e talks); consulte-os antes de mexer
  numa capa de evento. Resumo:
  - Hackathon: azul elétrico `--hack-azul #2179FF`, pílulas arredondadas, contorno + cheio (`.capa-hackathon`, `.pilula-hack`).
  - Campanha do Agasalho: azul claro. Off-white com cantos azul-claros e flocos (`imagens/floco.svg`),
    "campanha do" em pincel (Caveat Brush) e AGASALHO em condensada pesada (Anton), em marinho.
  - Integre Talks: marinho com textura, grade de pontos nos cantos, título largo com sombra deslocada.
- No corpo do site, só a identidade da Integre: botões e etiquetas com canto levemente arredondado
  (`--r-btn`), sem pílula, sem brilho e **sem setinha nos botões**.
- Fontes: **Michroma** (selos e rótulos largos, parecida com o logotipo) e **Poppins** (títulos 900 e
  corpo); **Anton** e **Caveat Brush** só na capa da Campanha do Agasalho. Não troque Poppins por Montserrat: a Montserrat do Google Fonts é variável, e o contorno
  (`-webkit-text-stroke`) mostra as sobreposições por dentro das letras.
- Padrões, em classes:
  - `.titulo` com `<span class="contorno">` (letra só de contorno) seguido de texto cheio;
  - `.selo`: rótulo em Michroma com traço (no lugar das pílulas); centralizado, ganha traço dos dois lados;
  - `.btn--primario`: off-white no fundo escuro, marinho no fundo claro e no formulário;
  - Sem decorações de linhas nem grade de pontinhos em lugar nenhum do site (o Tomaz tirou tudo em
    06/10/2026: `.deco-linhas`, `.deco-pontos` e as linhas dentro das imagens `.bloco__midia`).
  - Começo das páginas internas só com selo, título e texto: sem os atalhos para as seções e sem o aviso
    de "página em construção". Rodapé com marca, contato e redes (sem a lista de páginas).
  - Menu do cabeçalho, sem caixa nenhuma: no hover só o texto clareia; a página atual fica com o texto
    branco e um pouco maior.
  - Faixa do Integre Talks em Eventos (`.secao--talks`): seção própria com o marinho da capa e luzes, e
    partículas brancas que seguem o mouse (`canvas.particulas[data-particulas]`, versão em JS puro do
    Particles do Magic UI; ajustes no objeto `PARTICULAS` do main.js). Além dos pontos soltos, há focos
    circulares em grade completa (a grade de pontos da identidade do Talks), em que só o brilho cai do
    centro para a borda, posicionados longe do texto e das fotos: três no computador (`focos`) e dois entre
    a capa e o carrossel até 960 px (`focosCelular`). A capa ali fica sem fundo, sem sombra e sem os pontos
    dos cantos, para se misturar com a faixa.
  - Carrossel de fotos `[data-carrossel]` (faixa do Talks): uma foto por vez, com um pedaço desfocado da
    anterior e da próxima; sem fim; navega clicando na vizinha, nos traços, arrastando ou pelo teclado.
    Hoje com 6 espaços reservados `.carrossel__vazio`; para pôr foto, troque o div por `<img>` (instrução
    num comentário no HTML).
  - `.vitrine` (página Soluções): os itens rolam e o nome gira letra a letra num painel fixo
    (`[data-giro]`, versão em JS puro do TextRotate do 21st.dev). O nome vem do `h2.vitrine__nome` de cada
    item; para mudar uma solução, edite só o item.
  - `data-embaralhar` em qualquer título: as letras se embaralham ao abrir a página e se acertam da esquerda
    para a direita (versão em JS puro do TextScramble do 21st.dev). Mantém os `<span>` de dentro, como o
    `.contorno`. Hoje só no `<h1>` de Soluções.
  - `canvas.grade-cursor[data-grade-cursor]` (caixa de imagem do Desenvolvimento Web em Soluções; saiu da
    abertura da Home em 06/10/2026): colmeia de hexágonos (ponta para cima, como o `icone-hexagono.png`)
    que acende em volta do cursor, com anel no clique/toque (versão em JS puro do CursorGrid do React Bits,
    que usa quadrados). O padrão fica no objeto `GRADE` do main.js e cada canvas pode trocar valores num
    JSON no atributo (na caixa: `cellSize` 46 e `radius` 110); a cor é o `color` do `.grade-cursor` no CSS.
  - Cards de Nossas Soluções na Home (`.card-solucao`): cantos retos, sem arredondamento.
  - Borda que brilha nos cards `.evento` da Home (`.evento::after`, só CSS; versão do ShineBorder do Magic UI):
    degradê azul → roxo que passeia pela borda em 14 s. Largura em `--borda`.
- Seções: `.secao` + `.secao--escura`, `--clara` ou `--branca`. A variável `--tinta` define a cor do
  título e do contorno em cada fundo.

## Imagens (`imagens/`)

- Logos sem fundo: `logo-horizontal.png`, `logo-vertical.png` e as versões `-branca`, mais
  `icone-hexagono.png`, `favicon-48.png` e `apple-touch-icon.png`. A versão branca vai em fundo
  escuro; a colorida (texto roxo) só em fundo claro.
- `simbolo.svg` e `favicon.svg`: símbolo redesenhado em vetor a partir das medidas da logo (6 triângulos
  e o degradê roxo→azul medido no arquivo original). `simbolo-apagado.svg` é o mesmo desenho com as cores
  já misturadas com o marinho: imita transparência sem deixar o que está atrás aparecer através dele.
  Entra na abertura da Home (atrás do tigre) e na abertura das páginas
  internas até 960 px, por `<picture>`.
- Mascotes sem fundo: `mascote-apontando.png` (abertura da Home) e `mascote-bracos-cruzados.png` (Quem
  somos), no estilo cartoon, o escolhido. `mascote-aquarela.png` e `mascote-3d.png` sobraram do teste de
  estilos e não são usados.
- `linhas-escuras.png` e `linhas-claras.png`: o padrão de linhas da Integre, recortado de
  `Design sem nome (1).png`. Não são mais usados (as linhas saíram do site em 06/10/2026).
- Os PNGs saem de `_ferramentas/recorte/recorte.ps1` (C# via `Add-Type`, sem Python), a partir dos
  originais. Para regenerar, rode `-Task mascotes`, `-Task logos` ou `-Task linhas`; as instruções
  estão no topo do script. Não edite os PNGs à mão.

## Só no protótipo (resolver antes de publicar)

- Formulário `form[data-mock]`: valida e mostra a mensagem de sucesso, mas **não envia nada**. Falta
  escolher como enviar para integre@integrejr.com.br.
- O telefone `(47) 90000-0000` é genérico. As páginas internas ainda têm blocos e imagens "em breve",
  e o carrossel do Talks está com espaços reservados no lugar das 6 fotos.

## Tipo de projeto
- Tipo: Landing page / institucional — registrado em 30/09/2026
- Arquivos de código: 6 (medido em 30/09/2026)
- Usar: agent-browser (conferir visual e celular)
- Não usar: ponytail, Spec Kit, code-review-graph, Scrapling (só se for estudar o site atual)
- Projetos de referência: Site Imobiliária Urupema, Sublime
