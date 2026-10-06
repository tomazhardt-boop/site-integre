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
  - `.deco-linhas` (padrão de linhas da Integre; `--tr`, `--br`, `--bl`) e `.deco-pontos`. As linhas
    alternam em cada página: uma seção com, a seguinte sem (decidido em 06/10/2026). O rodapé fica sem.
  - `.vitrine` (página Soluções): os itens rolam e o nome gira letra a letra num painel fixo
    (`[data-giro]`, versão em JS puro do TextRotate do 21st.dev). O nome vem do `h2.vitrine__nome` de cada
    item; para mudar uma solução, edite só o item.
  - `data-embaralhar` em qualquer título: as letras se embaralham ao abrir a página e se acertam da esquerda
    para a direita (versão em JS puro do TextScramble do 21st.dev). Mantém os `<span>` de dentro, como o
    `.contorno`. Hoje só no `<h1>` de Soluções.
- Seções: `.secao` + `.secao--escura`, `--clara` ou `--branca`. A variável `--tinta` define a cor do
  título e do contorno em cada fundo.

## Imagens (`imagens/`)

- Logos sem fundo: `logo-horizontal.png`, `logo-vertical.png` e as versões `-branca`, mais
  `icone-hexagono.png`, `favicon-48.png` e `apple-touch-icon.png`. A versão branca vai em fundo
  escuro; a colorida (texto roxo) só em fundo claro.
- `simbolo.svg` e `favicon.svg`: símbolo redesenhado em vetor a partir das medidas da logo (6 triângulos
  e o degradê roxo→azul medido no arquivo original). `simbolo-apagado.svg` é o mesmo desenho com as cores
  já misturadas com o marinho: imita transparência sem deixar as linhas aparecerem através dele. Entra na
  abertura das páginas internas até 960 px, por `<picture>`.
- Mascotes sem fundo: `mascote-apontando.png` e `mascote-bracos-cruzados.png` (cartoon),
  `mascote-aquarela.png` e `mascote-3d.png`.
- `linhas-escuras.png` (fundo claro) e `linhas-claras.png` (fundo escuro): o padrão de linhas da
  Integre, recortado de `Design sem nome (1).png` (arquivo enviado pela Integre, fica em `imagens/`).
- Os PNGs saem de `_ferramentas/recorte/recorte.ps1` (C# via `Add-Type`, sem Python), a partir dos
  originais. Para regenerar, rode `-Task mascotes`, `-Task logos` ou `-Task linhas`; as instruções
  estão no topo do script. Não edite os PNGs à mão.

## Só no protótipo (resolver antes de publicar)

- Seletor de estilo do mascote na home (`.troca-mascote`). Ele troca `img.mascote[data-pose]` e lembra
  a escolha em `localStorage` (chave `integre:mascote`). Sai quando o estilo for escolhido.
- Formulário `form[data-mock]`: valida e mostra a mensagem de sucesso, mas **não envia nada**. Falta
  escolher como enviar para integre@integrejr.com.br.
- O telefone `(47) 90000-0000` é genérico. As páginas internas têm o aviso "Página em construção" e
  blocos "em breve".

## Tipo de projeto
- Tipo: Landing page / institucional — registrado em 30/09/2026
- Arquivos de código: 6 (medido em 30/09/2026)
- Usar: agent-browser (conferir visual e celular)
- Não usar: ponytail, Spec Kit, code-review-graph, Scrapling (só se for estudar o site atual)
- Projetos de referência: Site Imobiliária Urupema, Sublime
