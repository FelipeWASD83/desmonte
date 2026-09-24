# CLAUDE.md — desmonte

Regras deste projeto. As da pasta continuam valendo
(`C:\Users\felipe\Downloads\Claude Code\CLAUDE.md`); aqui fica só o que é
específico.

Criado em 24/09/2026, com a `abertura` como base (pedido dele: "um site
parecido, porém para o iPhone 18 Pro Max, com foco no celular inteiro,
incluindo a câmera").

## O que é

O iPhone 18 Pro Max em 3D numa bancada de reparo. Quatro modos:

- **Montado:** em pé, com as cotas oficiais (163,4 × 78,0 × 8,75 mm).
- **Explodido:** as camadas em diagonal, na ordem do teardown (a tela sai
  primeiro).
- **Na bancada:** cada uma das 22 peças pousa no compartimento numerado da
  manta de silicone.
- **Câmeras:** os três módulos saem pelas costas e se desmontam. A principal
  mostra as 6 lâminas; a tele, o prisma com o caminho da luz; e o sensor
  anda na estabilização.

O painel da direita é a câmera de verdade: zoom 0,5×, 1×, 2×, 4× e 8×, a
abertura variável (só na principal), o foco, o tremor de mão com e sem OIS, a
prévia ao vivo com o desfoque calculado, o disparo, o rolo com as últimas 8
fotos e o desenho da luz até o sensor, em escala.

Projeto pessoal dele, não é público nem de cliente. Estático, sem build.
Porta **4333** (`launch.json` da raiz e `PORTAS.md`). No `localStorage` desta
origem ficam `desmonte:fotos`, `desmonte:disparos` e `desmonte:acabamento`.

**Desempenho não é limite: roda só no PC dele** (Core Ultra 9 285 + RTX 3060,
decisão dele em 24/09/2026). Geometria densa, sombra em 4096, textura grande:
pode. Otimizar para celular também não é meta; o layout empilhado existe e
funciona, mas o alvo é o desktop.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | palco 3D, HUD, modos, cores, ficha da peça, painel da câmera, lista de peças |
| `css/estilo.css` | a direção visual inteira; o sistema mora no `:root` |
| `js/optica.js` | as três câmeras (focal, sensor, f/), zoom, campo de visão, desfoque, profundidade de campo, exposição, tremor e OIS. **Sem DOM e sem three**: é o que os testes abrem |
| `js/textos.js` | **todo** texto da tela, as fichas das 22 peças (com fonte) e as cores |
| `js/aparelho.js` | as peças de dentro, a posição de cada uma na bancada e no explodido, as cotas e a interface do app de câmera na tela |
| `js/carcaca.js` | o alumínio: contorno de canto contínuo, a carcaça varrida pelo perfil da lateral, a ilha, os anéis torneados das lentes, o vidro traseiro e os botões |
| `js/cameras.js` | os módulos das câmeras: lâminas, sensor no carrinho do OIS, prisma da tele e os raios de luz |
| `js/formas.js` | chapa extrudada, caixa, cilindro e anel em milímetro |
| `js/materiais.js` | materiais e texturas desenhadas em canvas; `pintar()` troca a cor |
| `js/manta.js` | o tampo e a manta de silicone com grade, régua e compartimentos |
| `js/cenario.js` | a oficina que as lentes fotografam (camada 1) |
| `js/sensor.js` | a câmera virtual de cada lente, o shader de desfoque, a foto com rastro de tremor, o toque-pra-focar |
| `js/cena.js` | renderizador, luz, modos, seleção, animação, etiquetas |
| `js/orbita.js` | órbita própria (veio da `abertura`) |
| `js/diagrama.js` | o desenho 2D da luz até o sensor (painel e plano B) |
| `js/principal.js` | estado, controles, rolo, laço de quadros |
| `vendor/` | three.js r185 copiado da `abertura` (+ `RoundedBoxGeometry`) |
| `testes/optica.test.js` | `node --test`, sem instalar nada |

## De onde vêm os dados — e o que é estimativa

O aparelho foi lançado em 09/09/2026 e ainda não existe desenho interno
publicado. As fontes (levantadas em 24/09/2026):

- **Apple** (especificações e press release): medidas, peso, alumínio unibody,
  tela, as três câmeras (focal equivalente, f/, 48 MP, quad-pixel), abertura
  variável em 4 passos com 6 lâminas, tetraprisma de 4 reflexões, câmara de
  vapor 3× maior, cores.
- **iFixit** (lido pela imprensa, porque a página não abriu direto):
  lâminas de compósito de polímero movidas por eletroímã, furo de 4,6 mm em
  f/1,48, 7,3× mais luz que f/4, moldura branca trincando em 3 de 4, abertura
  pela frente, só a bobina embaixo do vidro traseiro, nota provisória 7/10.
- **TechInsights**: chips (A20 Pro em N2, X80 no modelo americano, N1, UWB,
  NFC, PMICs, receptor BCM59367), bateria de 5.567 mAh / 21,751 Wh.
- **REWA / 9to5Mac / MacRumors / AppleInsider**: IR do Face ID embaixo da tela,
  A20 por fora da pilha, NAND dentro dela, a "cota de malha" térmica.
- **GSMArena (não oficial)**: tamanho dos sensores (1/1,28" e 1/2,55").

**Estimativa, dita na ficha de cada peça:** formato da placa e da bateria
(copiado do 17 Pro Max), posição das lentes, do flash e do LiDAR, tamanho da
ilha e dos módulos, foco mínimo da principal e da tele, a forma do prisma, as
cores exatas (os nomes são oficiais, os tons não).

## Decisões fechadas — não desfazer sem motivo novo

- **Os testes conferem que as fontes batem entre si:** o sensor de 1/1,28" dá
  o pixel de 1,22 µm da Apple; a focal real (6,80 mm) dividida por 1,48 dá os
  4,6 mm do iFixit; a ultra dá ~118° contra os 120° da Apple. Mudou um número
  de câmera, os testes dizem se ele ainda fecha.
- **O desfoque é o de verdade, e celular desfoca pouco.** A 1× com foco em
  48 cm, a parede a 1,6 m borra só uns 2 px. Não exagerar pra ficar bonito: o
  borrão bonito aparece na tele a 4×/8× com foco perto, ou na principal com
  foco no mínimo.
- **2× e 8× são recorte do sensor**, não outra lente: mesma focal, sensor
  menor, desfoque em pixels dobra.
- **A saída do sensor (`rtSaida`) fica sem espaço de cor**, e a tela do
  celular usa um `ShaderMaterial` que mostra os bytes como estão. O shader já
  escreve em sRGB; marcada como sRGB, a placa convertia de novo (foto lavada) e
  a leitura de pixels ficava ~3× mais lenta. **A `abertura` tem esse mesmo
  defeito** e não foi corrigida lá (fora do escopo).
- **A foto tremida é feita de 12 pedaços** da exposição, cada um com o tremor
  daquele instante: o rastro é o que a foto de verdade teria. O tempo de
  exposição sai do `exposicao()` (máximo 1/25 s, depois sobe o ISO). A sobra
  com OIS (10%) é estimativa.
- **O sensor anda 25× mais no 3D do que de verdade** (`AMPLIACAO_DO_CARRINHO`),
  senão não daria pra ver. O texto do painel diz isso.
- **O celular fica de costas pra quem olha** no montado (`rotation.y = π`): as
  letras da manta ficam do lado certo. Na bancada ele deita de tela pra cima e
  gira no caminho.
- **O explodido abre em diagonal** (`DIAGONAL` em `aparelho.js`): reto, uma
  camada escondia a outra.
- **A pegada de cada peça conta só malha**: as linhas de luz nascem na origem e
  esticavam a caixa (as câmeras caíam fora do compartimento).
- **Na bancada, o número da peça é o impresso na manta**; a etiqueta flutuante
  só aparece na peça acesa.
- **A carcaça não é caixa extrudada** (`carcaca.js`, refeita em 24/09/2026
  a pedido dele: a primeira versão era uma placa com chanfro e parecia CAD).
  É um perfil de lateral varrido ao longo do contorno: friso que abraça a
  tela, quina da frente de 1 mm, lateral reta, quina das costas de 1,5 mm. Tem
  paredes e fundo por dentro, que aparecem na bancada e no explodido.
- **Todo contorno é canto contínuo** (superelipse, expoente 4, alcance 17 mm):
  carcaça, vidro da tela, moldura e painel saem do mesmo `contornoDoCorpo()`
  deslocado, e por isso encaixam sem fresta. Mudou o canto, muda tudo junto.
- **A ilha também é varrida**, 1,6 mm acima das costas, 1,6 mm pra dentro da
  borda; os anéis das lentes são torneados (`LatheGeometry`) com a lente e os
  anéis dos elementos por baixo da safira.
- **Alumínio jateado:** `metalness` 0,6 com grão fino (`GRAO`, mapa de
  aspereza e de relevo, UV em milímetro). Com metal demais o prata saía
  cinza-chumbo; sem o grão parecia plástico.
- **O vidro traseiro tem cor bem mais escura que o alumínio** nos
  `ACABAMENTOS`: o vidro fosco devolve luz difusa e o alumínio devolve
  reflexo; com a mesma cor o vidro saía um adesivo branco. Assim os dois se
  misturam, como a Apple fez neste ano.
- **A oficina tem a janela no eixo das lentes** e o celular aponta 0,1 rad pra
  cima: é o que dá assunto pra tele (a cidade de 280 m a 1,2 km e a torre com a
  luz vermelha a 220 m). A bandejinha alta de parafusos existe pro macro da
  ultra (6 a 13 cm).
- `?sem3d` no endereço força o plano B.

## Voz

Textos de tela, README e comentários em português informal, voz neutra (a
mommy não estava ligada na sessão em que ele nasceu). Os textos da tela
estão todos em `js/textos.js`.

## Verificar

- `node --test` na pasta (16 testes da óptica).
- Preview na 4333: console limpo, os quatro modos, clicar numa peça (a ficha
  abre com a fonte), trocar a cor, os cinco zooms, fotografar com e sem
  tremor, clicar na prévia pra focar, e `?sem3d`.
- `window.__desmonte` (estado, `definir`, `cena`, `escolher`) existe pra
  testar pelo console.
- O painel do navegador do Claude Code não roda `requestAnimationFrame` quando
  está escondido: as transições parecem congeladas ali. Conferir pelo MCP do
  Chrome DevTools.
- O `python -m http.server` não manda cabeçalho de cache, e o Chrome segura os
  módulos velhos mesmo com recarregar forçado. Pra ver uma mudança de JS,
  abrir uma página nova com `isolatedContext` novo no MCP do DevTools.
- Com jogo aberto (Rocket League), a GPU fica em 99% e tudo cai pra ~10 qps.
  Não é o site: medir com a placa livre antes de otimizar.
- Telas: 1440×900, 3440×1440, 1080×1920 e 390×844.
