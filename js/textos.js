// Todo texto da tela e das fichas das peças mora aqui.
//
// Cada peça tem: nome, grupo (a lista da esquerda), fato (a linha curta em
// mono), texto (a explicação) e fonte (de onde saiu o que está escrito).
// A ordem da lista é a ordem do desmonte: o iPhone 18 Pro Max abre pela frente.

export const PECAS = [
  {
    id: 'tela',
    grupo: 'frente',
    nome: 'Tela',
    fato: '6,9" · 2868 × 1320 · 460 ppi · até 3000 nits',
    texto:
      'É por ela que o desmonte começa: a tela é colada na carcaça e sai primeiro, porque quase tudo mora embaixo dela. Por cima vai o vidro Ceramic Shield 2; embaixo, o painel OLED com ProMotion de até 120 Hz. Aqui ela mostra o que a câmera está vendo agora.',
    fonte: 'Apple (especificações) · iFixit (ordem do desmonte)',
  },
  {
    id: 'moldura-da-tela',
    grupo: 'frente',
    nome: 'Moldura branca da tela',
    fato: 'trincou em 3 dos 4 aparelhos abertos pelo iFixit',
    texto:
      'Um aro fino de plástico branco em volta do painel. Faz parte do conjunto da tela e não dá pra colar de novo: se ele trinca na hora de abrir, o alinhamento e a vedação contra água ficam na dúvida depois do conserto. As telas continuaram funcionando. O iFixit diz que quatro aparelhos ainda é pouco pra chamar de defeito de série.',
    fonte: 'iFixit (via 9to5Mac e MacRumors)',
  },
  {
    id: 'face-id',
    grupo: 'frente',
    nome: 'Câmera infravermelha do Face ID',
    fato: 'agora embaixo da tela, no canto de cima à esquerda',
    texto:
      'Só esta parte do Face ID desceu pra baixo da tela, e é por isso que a Dynamic Island encolheu. Pra luz infravermelha passar, a tela fica com metade das linhas de pixel naquele pedacinho e tem um filtro que só deixa passar infravermelho embaixo do OLED. Ela liga por três cabos separados.',
    fonte: 'REWA (via MacRumors) · 9to5Mac · iClarified',
  },
  {
    id: 'truedepth',
    grupo: 'frente',
    nome: 'TrueDepth e câmera frontal',
    fato: '18 MP · f/1,9 · Center Stage',
    texto:
      'O resto do TrueDepth continua na Dynamic Island: o projetor de pontos que desenha o rosto e a câmera de selfie. O módulo da câmera frontal sai sem parafuso e sem cola.',
    fonte: 'Apple (câmera) · FoneArena (desmonte)',
  },
  {
    id: 'alto-falante-de-cima',
    grupo: 'frente',
    nome: 'Alto-falante do ouvido',
    fato: 'também é o segundo alto-falante do estéreo',
    texto:
      'O que você encosta na orelha numa ligação. Com o celular deitado vendo vídeo, ele toca junto com o de baixo e faz o par estéreo.',
    fonte: 'GSMArena (não é dado da Apple)',
  },
  {
    id: 'camara-de-vapor',
    grupo: 'miolo',
    nome: 'Câmara de vapor',
    fato: '3× a área da do 17 Pro · água deionizada dentro',
    texto:
      'Uma chapa oca e selada que cobre quase o celular inteiro. Lá dentro tem um pouco de água: ela ferve em cima do chip, o vapor corre pra parte fria, vira água de novo e volta. É assim que o calor sai do A20 Pro e se espalha pelo corpo todo. A Apple diz que ela segura até 40% mais desempenho por mais tempo.',
    fonte: 'Apple (press release) · iFixit',
  },
  {
    id: 'cota-de-malha',
    grupo: 'miolo',
    nome: 'Malha térmica do A20 Pro',
    fato: 'a "cota de malha" entre o chip e a câmara de vapor',
    texto:
      'Uma almofada em cima do processador com uma trama metálica que lembra cota de malha. Ela cede o suficiente pra encostar sempre na câmara de vapor, mesmo com o celular torcendo um pouco na mão.',
    fonte: 'AppleInsider (desmonte do iFixit)',
  },
  {
    id: 'a20-pro',
    grupo: 'miolo',
    nome: 'A20 Pro',
    fato: '2 nm da TSMC (N2) · agora por fora da pilha',
    texto:
      'O processador. Nesta geração ele saiu do meio do sanduíche da placa e foi pra face de fora, com a memória do lado em vez de empilhada em cima. Fica mais perto da câmara de vapor, e é isso que a malha térmica aproveita.',
    fonte: 'Apple (2 nm) · TechInsights (N2) · iFixit e REWA (posição)',
  },
  {
    id: 'placa-logica',
    grupo: 'miolo',
    nome: 'Placa lógica empilhada',
    fato: '12 GB LPDDR5X · armazenamento dentro do sanduíche',
    texto:
      'Duas placas uma em cima da outra, ligadas por uma borda. Na unidade americana que a TechInsights abriu: modem Qualcomm X80 (no resto do mundo é o C2 da própria Apple), chip de rede N1, UWB de 2ª geração, NFC da NXP, antena mmWave, receptor de carga sem fio Broadcom e uma porção de chips de energia. O armazenamento foi pra dentro da pilha, o que complica recuperar dados. O formato desta placa é estimado a partir do 17 Pro Max: ninguém publicou o contorno.',
    fonte: 'TechInsights · iFixit · formato: estimativa',
  },
  {
    id: 'bateria',
    grupo: 'miolo',
    nome: 'Bateria',
    fato: '5.567 mAh · 21,751 Wh · bandeja de metal com 13 parafusos',
    texto:
      '9,4% maior que a do 17 Pro Max (no modelo só com eSIM; com gaveta de chip ela cai pra 5.391 mAh). A célula vem numa bandeja de metal presa por 13 parafusos e colada com adesivo que solta com eletricidade: 12 V por uns 90 segundos e ela sai sem precisar alavancar. O formato é estimado; o fornecedor mudou e o conector ficou maior.',
    fonte: 'TechInsights · iFixit · REWA · formato: estimativa',
  },
  {
    id: 'taptic',
    grupo: 'miolo',
    nome: 'Taptic Engine',
    fato: 'o motor linear da vibração',
    texto:
      'Uma massa presa em molas que um ímã empurra pra lá e pra cá. É o que faz o "clique" que você sente no Controle da Câmera e nas vibrações do sistema. Segundo a imprensa é o mesmo do 17 Pro Max.',
    fonte: 'imprensa, sem fonte primária',
  },
  {
    id: 'alto-falante-de-baixo',
    grupo: 'miolo',
    nome: 'Alto-falante de baixo',
    fato: 'a outra metade do estéreo',
    texto: 'Sai pelos furinhos da borda de baixo, ao lado da porta USB-C.',
    fonte: 'Apple (áudio estéreo)',
  },
  {
    id: 'usb-c',
    grupo: 'miolo',
    nome: 'Porta USB-C',
    fato: 'USB 3 · 10 Gb/s · agora com um flex só',
    texto:
      'O cabo flexível da porta passou de dois pra um. Ela ainda não é modular: tem parafuso, cola e um flex comprido correndo pela lateral. Carrega 50% em uns 15 minutos com carregador de 60 W, segundo a Apple.',
    fonte: 'Apple (velocidade e carga) · iFixit (flex)',
  },
  {
    id: 'camera-principal',
    grupo: 'cameras',
    nome: 'Câmera principal Fusion',
    fato: '48 MP · 24 mm · f/1,48 a f/4 · 6 lâminas',
    texto:
      'A novidade do ano: abertura variável de verdade. Seis lâminas cortadas a laser, de compósito de polímero e quase da espessura de um fio de cabelo, fecham o furo em quatro passos (f/1,48, f/1,8, f/2,8 e f/4). Quem move é um rotor com eletroímã, separado da estabilização. Totalmente aberta, o furo tem 4,6 mm. O módulo inteiro troca fácil, mas a lâmina não tem conserto: travou, troca a câmera.',
    fonte: 'Apple · iFixit (medidas e lâminas) · tamanho do sensor: GSMArena',
  },
  {
    id: 'camera-ultra',
    grupo: 'cameras',
    nome: 'Ultra-angular',
    fato: '48 MP · 13 mm · f/2,2 · 120°',
    texto:
      'A de 0,5×. A focal de verdade é de uns 2 mm, e isso faz ela focar a 2 cm do vidro: é ela que o celular usa no modo macro.',
    fonte: 'Apple · tamanho do sensor: GSMArena',
  },
  {
    id: 'camera-tele',
    grupo: 'cameras',
    nome: 'Teleobjetiva tetraprisma',
    fato: '48 MP · 100 mm (4×) · f/2,8 · a luz quica 4 vezes',
    texto:
      'Pra dar 100 mm equivalentes nesse sensor, a lente precisa de uns 16 mm entre o vidro e o sensor — quase o dobro da espessura do celular. A solução é deitar o caminho: a luz entra, bate quatro vezes dentro de um prisma e só então chega no sensor. O desenho do prisma aqui é esquemático; as quatro reflexões e os 100 mm são da Apple.',
    fonte: 'Apple · desenho do prisma: esquemático',
  },
  {
    id: 'flash-lidar',
    grupo: 'cameras',
    nome: 'Flash e LiDAR',
    fato: 'LiDAR mede distância com laser infravermelho',
    texto:
      'O LiDAR solta pulsos de laser invisível e cronometra a volta: é o que ajuda o foco no escuro e o modo retrato a saber o que está na frente. O flash fica do lado, e um microfone também mora nessa ilha.',
    fonte: 'Apple · posição exata na ilha: estimativa',
  },
  {
    id: 'bobina-magsafe',
    grupo: 'traseira',
    nome: 'Bobina MagSafe',
    fato: 'MagSafe e Qi2 até 25 W',
    texto:
      'É a única coisa embaixo do vidro traseiro. A espiral de cobre recebe a energia do carregador, o anel de ímãs segura ele no lugar e o ímã de baixo acerta o giro.',
    fonte: 'Apple (potência) · iFixit (posição) · TechInsights (receptor BCM59367)',
  },
  {
    id: 'vidro-traseiro',
    grupo: 'traseira',
    nome: 'Vidro traseiro',
    fato: 'Ceramic Shield · sai fácil',
    texto:
      'Um recorte de vidro encaixado no alumínio, em volta da área do MagSafe (por onde a energia sem fio passa, porque metal bloquearia). Neste ano a cor do vidro e a do alumínio se misturam, sem o duas-cores do 17 Pro.',
    fonte: 'Apple · 9to5Mac',
  },
  {
    id: 'botoes',
    grupo: 'traseira',
    nome: 'Botões',
    fato: 'Ação, volume + e −, lateral',
    texto: 'Do lado esquerdo, o botão de Ação e o volume; do direito, o botão lateral. Posições estimadas pelo 17 Pro Max.',
    fonte: 'Apple (quais são) · posição: estimativa',
  },
  {
    id: 'camera-control',
    grupo: 'traseira',
    nome: 'Controle da Câmera',
    fato: 'aperta pra fotografar, desliza pra zoom',
    texto: 'Um botão de cristal com sensor de força e de toque embaixo: apertar tira a foto, meio apertar abre os ajustes, deslizar troca o zoom.',
    fonte: 'Apple',
  },
  {
    id: 'carcaca',
    grupo: 'traseira',
    nome: 'Carcaça unibody de alumínio',
    fato: '163,4 × 78,0 × 8,75 mm · 249 g · 85% alumínio reciclado',
    texto:
      'Laterais, costas e a ilha das câmeras são uma peça só de alumínio (não é mais titânio). A ilha ocupa quase a largura toda: as três lentes à esquerda, flash e LiDAR à direita. O alumínio anodizado risca fácil — no teste do JerryRigEverything até a chave marcou.',
    fonte: 'Apple (medidas e material) · JerryRigEverything (riscos)',
  },
];

export const GRUPOS = [
  { id: 'frente', nome: 'frente' },
  { id: 'miolo', nome: 'miolo' },
  { id: 'cameras', nome: 'câmeras' },
  { id: 'traseira', nome: 'traseira' },
];

export const MODOS = [
  { id: 'montado', nome: 'Montado' },
  { id: 'explodido', nome: 'Explodido' },
  { id: 'bancada', nome: 'Na bancada' },
  { id: 'cameras', nome: 'Câmeras' },
];

// Cores oficiais; os tons são aproximados das fotos da Apple. O vidro vai mais
// escuro que o alumínio de propósito: o vidro fosco devolve a luz difusa e o
// alumínio devolve reflexo, e com esses números os dois se misturam na tela
// (neste ano a Apple juntou as duas cores).
export const ACABAMENTOS = [
  { id: 'preto', nome: 'Preto', aluminio: 0x34353a, vidro: 0x232427 },
  { id: 'prata', nome: 'Prata', aluminio: 0xd8d9dc, vidro: 0x8f9195 },
  { id: 'glacier', nome: 'Glacier', aluminio: 0xb9ccd9, vidro: 0x7f93a2 },
  { id: 'burgundy', nome: 'Burgundy', aluminio: 0x5c2230, vidro: 0x3e141e },
];

const num = (v, casas = 1) => v.toFixed(casas).replace('.', ',');

export const INTERFACE = {
  marca: 'desmonte · iPhone 18 Pro Max · setembro de 2026',
  titulo: 'Desmonte',
  subtitulo: 'O iPhone 18 Pro Max aberto peça por peça, na ordem do teardown, e as três câmeras fotografando de verdade.',
  dica: 'arrasta pra girar · roda pra aproximar · clica numa peça',
  dicaToque: 'arrasta pra girar · pinça pra aproximar · toca numa peça',
  dicaModo: {
    montado: 'as cotas são as medidas oficiais da Apple',
    explodido: 'na ordem do desmonte: a tela sai primeiro',
    bancada: 'cada peça no compartimento com o número dela',
    cameras: 'as três câmeras fora da ilha, desmontadas',
  },
  planoB: 'Plano B pedido no endereço (?sem3d): o celular em 3D ficou de fora. As contas das câmeras e o desenho da luz continuam aqui.',
  semWebgl: 'Este navegador não liberou WebGL, então o celular em 3D ficou de fora. As contas das câmeras e o desenho da luz continuam aqui.',
  erro3d: 'O 3D tropeçou pra carregar. As contas das câmeras e o desenho da luz continuam aqui.',
  abertura(N, cam) {
    if (cam !== 'principal') return cam === 'ultra' ? 'A ultra tem abertura fixa em f/2,2.' : 'A tele tem abertura fixa em f/2,8.';
    if (N <= 1.48) return 'Toda aberta: as lâminas somem atrás do anel e o furo fica redondo.';
    if (N >= 4) return 'Fechada ao máximo: o fundo fica mais nítido, mas entra 7,3× menos luz.';
    return 'As seis lâminas fecham e o furo vira hexágono — repara no formato das bolinhas de luz desfocadas.';
  },
  foco(mm) {
    if (mm === Infinity) return 'Foco no infinito: os prédios lá fora ficam nítidos.';
    if (mm < 60) return 'Macro: o vidro quase encostado nos parafusos.';
    if (mm < 600) return 'Foco perto: a bancada nítida, a janela derrete.';
    return 'Foco no meio da oficina.';
  },
  tremor(ligado, ois, rastro) {
    if (!ligado) return 'Celular num tripé: nada treme.';
    const px = num(rastro, rastro < 10 ? 1 : 0);
    if (ois) return `A mão treme e o sensor anda pro lado contrário (no 3D o movimento dele aparece 25× maior). Rastro na foto: até ${px} px.`;
    return `Sem estabilização, o tremor vira rastro na foto: até ${px} px. Compara a 8× com e sem estabilização.`;
  },
  disparos: (n) => (n === 1 ? '1 foto tirada' : `${n} fotos tiradas`),
  rotuloCamera: { ultra: 'ultra-angular', principal: 'principal', tele: 'tele' },
};
