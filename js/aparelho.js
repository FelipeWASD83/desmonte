// O iPhone 18 Pro Max em 3D, peça por peça.
//
// Coordenadas do celular (milímetro): olhando a TELA de frente, x pra direita,
// y pra cima, z saindo da tela. As costas ficam em z negativo. Olhando as
// COSTAS, as lentes ficam à esquerda — que é o lado +x.
//
// Medida externa, espessura e peso: Apple. Posição das lentes, tamanho da ilha,
// formato da placa e da bateria: estimados pelo 17 Pro Max (ninguém publicou o
// desenho interno do 18). Onde é estimativa, a ficha da peça diz.
import * as THREE from 'three';
import { M } from './materiais.js';
import { contorno, furo, chapa, caixa, cilindro, anel, disco, discoDeCostas } from './formas.js';
import { construirCameras, LENTES } from './cameras.js';
import { PECAS } from './textos.js';

export const LARGURA = 78.0;
export const ALTURA = 163.4;
export const ESPESSURA = 8.75;
const HX = LARGURA / 2;
const HY = ALTURA / 2;
const ZF = ESPESSURA / 2;
const ZT = -ESPESSURA / 2;
const CANTO = 12.5; // estimativa
export const TOPO_DA_ILHA = ZT - 1.6; // a ilha das câmeras sai 1,6 mm das costas (estimativa)

// Tela ativa: 6,9" na diagonal com 2868 × 1320 pixels.
const DIAG_TELA = 6.9 * 25.4;
const PX_ALTO = 2868;
const PX_LARGO = 1320;
export const TELA_ALTURA = (DIAG_TELA * PX_ALTO) / Math.hypot(PX_ALTO, PX_LARGO);
export const TELA_LARGURA = (DIAG_TELA * PX_LARGO) / Math.hypot(PX_ALTO, PX_LARGO);

// Onde cada peça fica na bancada (o celular deitado de tela pra cima), em mm.
// Duas fileiras de peças grandes em cima e duas de pequenas embaixo: um bloco
// quase quadrado, que cabe entre a lista e o painel.
export const BANCADA = {
  tela: [-200, 235],
  'moldura-da-tela': [-100, 235],
  'camara-de-vapor': [0, 235],
  'placa-logica': [100, 235],
  bateria: [200, 235],
  carcaca: [-200, 45],
  'vidro-traseiro': [-100, 45],
  'bobina-magsafe': [0, 45],
  'usb-c': [92, 45],
  botoes: [178, 45],
  'face-id': [-200, -95],
  truedepth: [-128, -95],
  'alto-falante-de-cima': [-56, -95],
  'cota-de-malha': [10, -95],
  'a20-pro': [78, -95],
  taptic: [160, -95],
  'alto-falante-de-baixo': [-200, -165],
  'camera-principal': [-122, -165],
  'camera-ultra': [-58, -165],
  'camera-tele': [8, -165],
  'flash-lidar': [80, -165],
  'camera-control': [150, -165],
};
export const ALTURA_DA_MANTA = 3; // o tampo da manta de silicone, em y do mundo

// Quanto cada peça anda no explodido (em z pra frente e pra trás, e um pouco
// em x/y quando duas camadas iguais iam se encostar).
const EXPLODIR = {
  tela: [0, 0, 151],
  'moldura-da-tela': [0, 0, 124],
  'face-id': [0, 8, 100],
  truedepth: [0, 8, 100],
  'alto-falante-de-cima': [0, 12, 100],
  'camara-de-vapor': [0, 0, 78],
  'cota-de-malha': [0, 0, 59],
  'a20-pro': [0, 0, 46],
  'placa-logica': [0, 0, 27],
  bateria: [0, -6, 11],
  taptic: [0, -26, 11],
  'alto-falante-de-baixo': [0, -26, 11],
  'usb-c': [0, -40, 11],
  'camera-principal': [0, 0, 24],
  'camera-ultra': [0, 0, 24],
  'camera-tele': [0, 0, 24],
  'flash-lidar': [0, 0, 24],
  carcaca: [0, 0, 0],
  botoes: [0, 0, 0],
  'camera-control': [28, 0, 0],
  'bobina-magsafe': [0, 0, -40],
  'vidro-traseiro': [0, 0, -78],
};
const DIAGONAL = -0.62;
// Os botões saem pros dois lados: cada lado anda sozinho (ver `lados` em construirAparelho).

// No modo câmeras, os módulos saem pelas costas.
const MODO_CAMERAS = {
  'camera-principal': [0, 0, -30],
  'camera-ultra': [0, 0, -30],
  'camera-tele': [0, 0, -30],
  'flash-lidar': [0, 0, -18],
};
export const NO_MODO_CAMERAS = new Set(['camera-principal', 'camera-ultra', 'camera-tele', 'flash-lidar', 'carcaca', 'vidro-traseiro']);

// ---------- as peças ----------
function tela(texturaVisor) {
  const g = new THREE.Group();
  const vidro = chapa(contorno(-HX + 0.6, -HY + 0.6, HX - 0.6, HY - 0.6, CANTO - 0.6), 3.45, ZF, M.vidroPreto(), { chanfro: 0.35 });
  const oled = chapa(contorno(-37, -79.8, 37, 79.8, 11), 3.0, 3.45, M.oled());
  g.add(vidro, oled);

  // A interface do app de câmera, desenhada deitada (o celular está na horizontal).
  const interfaceCanvas = document.createElement('canvas');
  interfaceCanvas.width = 1592;
  interfaceCanvas.height = 733;
  const texInterface = new THREE.CanvasTexture(interfaceCanvas);
  texInterface.colorSpace = THREE.SRGBColorSpace;
  texInterface.anisotropy = 8;
  const planoInterface = new THREE.Mesh(new THREE.PlaneGeometry(TELA_ALTURA, TELA_LARGURA), new THREE.MeshBasicMaterial({ map: texInterface, transparent: true, toneMapped: false }));
  planoInterface.rotation.z = -Math.PI / 2;
  // Por cima do visor: a foto aparece pelo recorte, e os botões de zoom ficam sobre ela.
  planoInterface.position.z = ZF + 0.03;
  g.add(planoInterface);

  // O visor: a foto ao vivo em 4:3, com o lado comprido ao longo do celular.
  const visorAlto = TELA_LARGURA;
  const visorLargo = (visorAlto * 4) / 3;
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(visorLargo, visorAlto), M.tela(texturaVisor));
  visor.rotation.z = -Math.PI / 2;
  visor.position.set(0, VISOR_CENTRO_Y, ZF + 0.02);
  g.add(visor);

  // Dynamic Island, menor que a do 17 (tamanho estimado).
  const ilha = chapa(contorno(-8.5, HY - 9.8, 8.5, HY - 4.4, 2.7), ZF + 0.02, ZF + 0.05, new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.1, clearcoat: 1 }));
  g.add(ilha);

  // O reflexo do vidro por cima de tudo.
  const reflexo = new THREE.Mesh(new THREE.ShapeGeometry(contorno(-HX + 0.7, -HY + 0.7, HX - 0.7, HY - 0.7, CANTO - 0.7), 24), M.reflexo());
  reflexo.position.z = ZF + 0.06;
  reflexo.renderOrder = 2;
  g.add(reflexo);

  return { grupo: g, interfaceCanvas, texInterface, visorLargo, visorAlto };
}
const VISOR_CENTRO_Y = 20;

function moldura() {
  const f = contorno(-38.2, -80.9, 38.2, 80.9, 11.7);
  f.holes.push(furo(-37.2, -79.9, 37.2, 79.9, 11));
  return chapa(f, 2.95, 3.44, M.plasticoBranco());
}

function faceId() {
  const g = new THREE.Group();
  g.add(caixa(5.2, 5.2, 2.4, M.chip(), -24, 74.2, 1.7, 0.4));
  g.add(disco(1.3, 2.91, M.lente(), -24, 74.2));
  // Os três cabos: flex âmbar descendo pra placa.
  const flex = M.flex();
  [-1.6, 0, 1.6].forEach((dx) => g.add(caixa(0.9, 7, 0.12, flex, -24 + dx, 68.5, 0.6, 0.04)));
  return g;
}

function trueDepth() {
  const g = new THREE.Group();
  g.add(caixa(19, 5.4, 3.3, M.chip(), 1, 74.6, 1.25, 0.5));
  g.add(disco(1.6, 2.91, M.lente(), 5.6, 74.6)); // câmera frontal
  g.add(disco(1.1, 2.91, M.lente(), -3.4, 74.6)); // projetor de pontos
  g.add(caixa(4, 6, 0.12, M.flex(), 1, 69.5, 0.1, 0.04));
  return g;
}

function falanteDeCima() {
  return caixa(12, 2.4, 1.3, M.falante(), 0, 79.3, 2.2, 0.4);
}

function camaraDeVapor() {
  const g = new THREE.Group();
  g.add(chapa(contorno(-34, -70, 34, 70, 9), 2.45, 2.9, M.chapaVapor(), { chanfro: 0.12 }));
  return g;
}

function cotaDeMalha() {
  const g = new THREE.Group();
  g.add(chapa(contorno(-6.8, -6.8, 6.8, 6.8, 1.2), 2.1, 2.44, M.malha()));
  g.children[0].position.set(-23, 55, 0);
  return g;
}

function a20() {
  const g = new THREE.Group();
  const corpo = caixa(12, 12, 0.6, M.chip(), -23, 55, 1.8, 0.2);
  const tampa = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 11.4), M.a20());
  tampa.position.set(-23, 55, 2.105);
  g.add(corpo, tampa);
  return g;
}

function placaLogica() {
  const g = new THREE.Group();
  const L = () => {
    const s = new THREE.Shape();
    s.moveTo(-36, 10);
    s.lineTo(36, 10);
    s.lineTo(36, 36);
    s.lineTo(-10, 36);
    s.lineTo(-10, 70);
    s.lineTo(-36, 70);
    s.lineTo(-36, 10);
    return s;
  };
  g.add(chapa(L(), 0.9, 1.5, M.pcb(), { chanfro: 0.1 }));
  g.add(chapa(L(), -1.2, -0.6, M.pcb(), { chanfro: 0.1 }));
  // A borda que liga as duas placas: um L vazado.
  const borda = L();
  const dentro = new THREE.Path();
  dentro.moveTo(-34, 12);
  dentro.lineTo(-34, 68);
  dentro.lineTo(-12, 68);
  dentro.lineTo(-12, 34);
  dentro.lineTo(34, 34);
  dentro.lineTo(34, 12);
  dentro.lineTo(-34, 12);
  borda.holes.push(dentro);
  g.add(chapa(borda, -0.6, 0.9, M.pcb()));
  // Face de fora: memória do lado do A20, blindagens e chips menores.
  const chip = M.chip();
  const lata = M.blindagem();
  g.add(caixa(11, 8.5, 0.7, chip, -23, 42.5, 1.85, 0.15)); // LPDDR5X, do lado do processador
  g.add(caixa(22, 19, 0.9, lata, -23, 22, 1.95, 0.2));
  g.add(caixa(40, 20, 0.9, lata, 14, 23, 1.95, 0.2)); // modem e rádio
  g.add(caixa(6, 6, 0.6, chip, -4, 17, 1.8, 0.1));
  // Dentro do sanduíche: o armazenamento (NAND) e um chip de energia.
  g.add(caixa(11, 13, 1.2, chip, -23, 50, 0.15, 0.1));
  g.add(caixa(6, 6, 1.0, chip, 16, 22, 0.15, 0.1));
  // Face de baixo: mais blindagem.
  g.add(caixa(24, 16, 0.6, lata, -23, 60, -1.5, 0.15));
  g.add(caixa(30, 16, 0.6, lata, 18, 22, -1.5, 0.15));
  // Conectores dourados onde os flex encaixam.
  const ouro = M.ouro();
  g.add(caixa(8, 2.2, 0.5, ouro, -30, 66, 1.75, 0.1));
  g.add(caixa(8, 2.2, 0.5, ouro, 28, 13, 1.75, 0.1));
  return g;
}

function bateria() {
  const g = new THREE.Group();
  const bandeja = M.bandeja();
  const f = contorno(-34.5, -66, 34.5, 8, 6);
  g.add(chapa(f, -3.0, -2.6, bandeja));
  const aro = contorno(-34.5, -66, 34.5, 8, 6);
  aro.holes.push(furo(-34.1, -65.6, 34.1, 7.6, 5.6));
  g.add(chapa(aro, -2.6, 2.3, bandeja));
  g.add(caixa(67.6, 72.8, 4.6, new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.55, metalness: 0.2 }), 0, -29, -0.25, 1.2));
  const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(56, 28), M.bateria());
  etiqueta.rotation.z = Math.PI / 2;
  etiqueta.position.set(0, -29, 2.06);
  g.add(etiqueta);
  // As abas com os 13 parafusos.
  const parafuso = M.aco();
  const pontos = [
    [-25, 10], [0, 10], [25, 10],
    [-25, -68], [0, -68], [25, -68],
    [-36.4, -50], [-36.4, -28], [-36.4, -6],
    [36.4, -55], [36.4, -36], [36.4, -17], [36.4, 2],
  ];
  for (const [x, y] of pontos) {
    g.add(caixa(Math.abs(x) > 30 ? 3.4 : 5, Math.abs(x) > 30 ? 5 : 3.4, 0.4, bandeja, x, y, 0.2, 0.3));
    const p = cilindro(0.9, 0.4, 0.8, parafuso, x, y, 20);
    g.add(p);
    // A fenda do parafuso.
    g.add(caixa(1.3, 0.25, 0.1, M.acoEscuro(), x, y, 0.82, 0.02));
  }
  // O conector (maior neste ano) e a fita do adesivo elétrico.
  g.add(caixa(8, 4, 0.9, M.flex(), -20, 9.8, 1.6, 0.2));
  return g;
}

function taptic() {
  const g = new THREE.Group();
  g.add(caixa(24, 10.5, 4.4, M.acoEscuro(), -22, -74.2, -0.4, 0.8));
  g.add(caixa(6, 3, 0.15, M.flex(), -12, -69, 1.8, 0.05));
  return g;
}

function falanteDeBaixo() {
  return caixa(25, 10.5, 4.4, M.falante(), 21.5, -74.2, -0.4, 0.8);
}

function usbC() {
  const g = new THREE.Group();
  g.add(caixa(9.4, 7, 3.4, M.aco(), 0, -77.4, 0, 1.2));
  g.add(caixa(6.2, 1.2, 0.7, M.plasticoPreto(), 0, -80.8, 0, 0.2));
  // O flex único: da porta até a borda e subindo pela lateral direita.
  const flex = M.flex();
  g.add(caixa(26, 4, 0.15, flex, 12, -71.5, -2.8, 0.05));
  g.add(caixa(4, 84, 0.15, flex, 35.2, -31, -2.8, 0.05));
  g.add(caixa(8, 3, 0.4, M.ouro(), 33, 11.5, -2.6, 0.1));
  return g;
}

function carcaca() {
  const g = new THREE.Group();
  const alu = M.aluminio();
  const lateral = contorno(-HX, -HY, HX, HY, CANTO);
  lateral.holes.push(furo(-HX + 1.1, -HY + 1.1, HX - 1.1, HY - 1.1, CANTO - 1.1));
  g.add(chapa(lateral, ZT, 4.2, alu, { chanfro: 0.5 }));
  // O fundo, com o recorte do vidro.
  const fundo = contorno(-HX + 0.4, -HY + 0.4, HX - 0.4, HY - 0.4, CANTO - 0.4);
  fundo.holes.push(furo(-30.4, -73.9, 30.4, 29.9, 7.9));
  g.add(chapa(fundo, ZT, ZT + 0.9, alu, { chanfro: 0.3 }));
  // A ilha das câmeras: quase a largura toda, da mesma peça de alumínio.
  g.add(chapa(contorno(-HX, 36, HX, HY, [CANTO, CANTO, 6, 6]), TOPO_DA_ILHA, ZT + 0.2, alu, { chanfro: 0.55 }));
  // Os anéis das três lentes e os vidros de safira.
  const anelMat = M.anel();
  for (const l of Object.values(LENTES)) {
    g.add(anel(l.raioVidro, l.raioAnel, TOPO_DA_ILHA - 1.9, TOPO_DA_ILHA + 0.05, anelMat, l.x, l.y, { chanfro: 0.35 }));
    g.add(anel(l.raioVidro - 0.9, l.raioVidro, TOPO_DA_ILHA - 1.6, TOPO_DA_ILHA - 1.0, M.plasticoPreto(), l.x, l.y));
    // O vidro de safira na frente de cada lente: só reflexo, dá pra ver a lente por trás.
    const safira = discoDeCostas(l.raioVidro - 0.9, TOPO_DA_ILHA - 1.5, M.reflexo(), l.x, l.y);
    safira.renderOrder = 2;
    g.add(safira);
  }
  // Janelas do flash, do LiDAR e o furo do microfone.
  g.add(discoDeCostas(3.3, TOPO_DA_ILHA - 0.02, new THREE.MeshPhysicalMaterial({ color: 0xe8e2d0, roughness: 0.35, clearcoat: 1, transmission: 0 }), -25, 70));
  g.add(discoDeCostas(3.3, TOPO_DA_ILHA - 0.02, M.lente(), -25, 48));
  g.add(discoDeCostas(0.55, TOPO_DA_ILHA - 0.02, M.plasticoPreto(), -12, 59));
  // Borda de baixo: a boca da USB-C, os furos do alto-falante e dos microfones.
  const preto = M.plasticoPreto();
  const boca = new THREE.Mesh(new THREE.ShapeGeometry(contorno(-4.6, -1.6, 4.6, 1.6, 1.55), 12), preto);
  boca.rotation.x = Math.PI / 2;
  boca.position.set(0, -HY - 0.02, 0);
  g.add(boca);
  for (let i = 0; i < 6; i++) {
    for (const lado of [-1, 1]) {
      const furinho = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), preto);
      furinho.rotation.x = Math.PI / 2;
      furinho.position.set(lado * (9 + i * 2.2), -HY - 0.02, 0);
      g.add(furinho);
    }
  }
  return g;
}

function vidroTraseiro() {
  return chapa(contorno(-30.3, -73.8, 30.3, 29.8, 7.8), ZT - 0.02, ZT + 0.85, M.vidroTraseiro(), { chanfro: 0.3 });
}

function bobinaMagsafe() {
  const g = new THREE.Group();
  const cy = -12; // centro do anel (estimativa)
  g.add(cilindro(21, -3.2, -3.05, M.ferrite(), 0, cy, 64));
  const espiral = discoDeCostas(20, -3.36, M.cobre(), 0, cy);
  g.add(espiral);
  g.add(cilindro(20, -3.35, -3.2, M.cobre(), 0, cy, 64));
  // O anel de ímãs, em gomos.
  const ima = M.ima();
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    const m = caixa(2.2, 7.4, 0.5, ima, Math.cos(a) * 24.5, cy + Math.sin(a) * 24.5, -3.2, 0.15);
    m.rotation.z = a;
    g.add(m);
  }
  // O ímã de baixo que acerta o giro do carregador.
  g.add(caixa(10, 3.2, 0.5, ima, 0, cy - 32, -3.2, 0.2));
  g.add(caixa(4, 20, 0.15, M.flex(), 0, cy + 30, -3.1, 0.05));
  return g;
}

function botoesDoLado(lado) {
  const g = new THREE.Group();
  const alu = M.aluminio();
  const x = lado * (HX + 0.25);
  if (lado < 0) {
    g.add(caixa(1.3, 6.5, 3.2, alu, x, 46, 0.2, 0.55)); // Ação
    g.add(caixa(1.3, 10, 3.2, alu, x, 33, 0.2, 0.55)); // volume +
    g.add(caixa(1.3, 10, 3.2, alu, x, 20.5, 0.2, 0.55)); // volume −
  } else {
    g.add(caixa(1.3, 17, 3.2, alu, x, 33, 0.2, 0.55)); // lateral
  }
  return g;
}

function cameraControl() {
  const g = new THREE.Group();
  g.add(caixa(1.2, 19, 3.4, M.aluminio(), HX + 0.1, -24, 0.2, 0.55));
  g.add(caixa(0.5, 17.6, 2.6, M.safira(), HX + 0.72, -24, 0.2, 0.25));
  return g;
}

// ---------- cotas oficiais (o HUD do Igloo desenhado sobre o objeto) ----------
function cotas(cor) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.9, depthTest: true });
  const linha = (pts) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), mat));
  const dx = -HX - 14;
  linha([[dx, -HY, 0], [dx, HY, 0]]);
  linha([[dx - 3, HY, 0], [dx + 3, HY, 0]]);
  linha([[dx - 3, -HY, 0], [dx + 3, -HY, 0]]);
  linha([[-HX - 2, HY, 0], [dx - 3, HY, 0]]);
  linha([[-HX - 2, -HY, 0], [dx - 3, -HY, 0]]);
  const dy = -HY - 12;
  linha([[-HX, dy, 0], [HX, dy, 0]]);
  linha([[-HX, dy - 3, 0], [-HX, dy + 3, 0]]);
  linha([[HX, dy - 3, 0], [HX, dy + 3, 0]]);
  const ex = HX + 12;
  linha([[ex, -HY, ZT], [ex, -HY, ZF]]);
  linha([[ex - 2.5, -HY, ZT], [ex + 2.5, -HY, ZT]]);
  linha([[ex - 2.5, -HY, ZF], [ex + 2.5, -HY, ZF]]);
  linha([[HX, -HY, ZT], [ex + 2.5, -HY, ZT]]);
  linha([[HX, -HY, ZF], [ex + 2.5, -HY, ZF]]);
  const rotulos = [
    { texto: '163,4 mm', ponto: new THREE.Vector3(dx, 0, 0) },
    { texto: '78,0 mm', ponto: new THREE.Vector3(0, dy, 0) },
    { texto: '8,75 mm', ponto: new THREE.Vector3(ex, -HY, 0) },
  ];
  return { grupo: g, rotulos, material: mat };
}

// ---------- montagem ----------
function novaPeca(id, objeto) {
  const i = PECAS.findIndex((p) => p.id === id);
  if (i < 0) throw new Error(`peça sem texto: ${id}`);
  // O pivô vai pro centro da peça: é em volta dele que ela gira e voa.
  const grupo = new THREE.Group();
  grupo.add(objeto);
  // Só as malhas contam: as linhas de luz das câmeras nascem todas na origem
  // e esticariam a caixa até o meio do celular.
  const caixaPeca = new THREE.Box3();
  grupo.updateMatrixWorld(true);
  grupo.traverse((o) => {
    if (o.isMesh) caixaPeca.expandByObject(o);
  });
  const centro = caixaPeca.getCenter(new THREE.Vector3());
  objeto.position.sub(centro);
  grupo.position.copy(centro);
  grupo.traverse((o) => {
    o.userData.peca = id;
  });
  const base = centro.clone();
  const explodir = new THREE.Vector3(...(EXPLODIR[id] ?? [0, 0, 0]));
  // Em diagonal: cada camada anda também pro lado, na proporção da distância,
  // pra uma não esconder a outra na vista de três quartos.
  explodir.x += explodir.z * DIAGONAL;
  const camera = new THREE.Vector3(...(MODO_CAMERAS[id] ?? [0, 0, 0]));
  const [bx, by] = BANCADA[id];
  // Na bancada o celular está deitado de tela pra cima: z local vira altura.
  const bancada = new THREE.Vector3(bx - base.x, by - base.y, ALTURA_DA_MANTA + 0.15 - caixaPeca.min.z);
  return {
    id,
    numero: String(i + 1).padStart(2, '0'),
    objeto: grupo,
    base,
    explodir,
    camera,
    bancada,
    pegada: { x0: caixaPeca.min.x, y0: caixaPeca.min.y, x1: caixaPeca.max.x, y1: caixaPeca.max.y },
    raio: caixaPeca.getSize(new THREE.Vector3()).length() / 2,
  };
}

export function construirAparelho(texturaVisor, corDasCotas) {
  const raiz = new THREE.Group();
  raiz.name = 'iphone';
  const t = tela(texturaVisor);
  const cams = construirCameras();

  const objetos = {
    tela: t.grupo,
    'moldura-da-tela': moldura(),
    'face-id': faceId(),
    truedepth: trueDepth(),
    'alto-falante-de-cima': falanteDeCima(),
    'camara-de-vapor': camaraDeVapor(),
    'cota-de-malha': cotaDeMalha(),
    'a20-pro': a20(),
    'placa-logica': placaLogica(),
    bateria: bateria(),
    taptic: taptic(),
    'alto-falante-de-baixo': falanteDeBaixo(),
    'usb-c': usbC(),
    'camera-principal': cams.principal.grupo,
    'camera-ultra': cams.ultra.grupo,
    'camera-tele': cams.tele.grupo,
    'flash-lidar': cams.flashLidar,
    'bobina-magsafe': bobinaMagsafe(),
    'vidro-traseiro': vidroTraseiro(),
    carcaca: carcaca(),
    'camera-control': cameraControl(),
  };
  // Os botões são dois grupos (um de cada lado) que contam como uma peça só.
  const botoes = new THREE.Group();
  const esquerda = botoesDoLado(-1);
  const direita = botoesDoLado(1);
  botoes.add(esquerda, direita);
  objetos.botoes = botoes;

  const pecas = PECAS.map((p) => novaPeca(p.id, objetos[p.id]));
  for (const p of pecas) raiz.add(p.objeto);
  const porId = Object.fromEntries(pecas.map((p) => [p.id, p]));

  // Cada lado dos botões abre pra fora no explodido.
  porId.botoes.lados = [
    { objeto: esquerda, explodir: new THREE.Vector3(-26, 0, 0) },
    { objeto: direita, explodir: new THREE.Vector3(26, 0, 0) },
  ];
  // Na bancada os dois lados deitam juntos, lado a lado.
  porId.botoes.ladosBancada = [new THREE.Vector3(HX - 6, 0, 0), new THREE.Vector3(-HX + 6, 0, 0)];
  // Deitados juntos, os dois lados ocupam uns 14 mm, não a largura do celular:
  // é esse o tamanho do compartimento na manta.
  porId.botoes.pegada = { ...porId.botoes.pegada, x0: -7.5, x1: 7.5 };

  const c = cotas(corDasCotas);
  raiz.add(c.grupo);

  return {
    raiz,
    pecas,
    porId,
    cameras: cams,
    tela: t,
    cotas: c,
  };
}

// Desenha a interface do app de câmera na tela do celular (deitado).
export function desenharInterface(tela, { zoomId, zooms, N, camera }) {
  const c = tela.interfaceCanvas;
  const ctx = c.getContext('2d');
  const w = c.width;
  const h = c.height;
  const pxmm = w / TELA_ALTURA;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  // Canto da tela ativa arredondado.
  const r = 11 * pxmm;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // O visor ocupa este pedaço: fica transparente pra foto (que está embaixo) aparecer.
  const vx = w / 2 - (VISOR_CENTRO_Y + tela.visorLargo / 2) * pxmm;
  const vl = tela.visorLargo * pxmm;
  ctx.clearRect(vx, 0, vl, h);
  // Botões de zoom embaixo do visor.
  const bolinhas = zooms.length;
  const passo = 70;
  const y = h - 60;
  const cx = vx + vl / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(cx - (bolinhas * passo) / 2 - 10, y - 38, bolinhas * passo + 20, 76, 38);
  ctx.fill();
  zooms.forEach((z, i) => {
    const x = cx - ((bolinhas - 1) * passo) / 2 + i * passo;
    const ativo = z.id === zoomId;
    ctx.fillStyle = ativo ? 'rgba(20,20,20,0.9)' : 'rgba(40,40,40,0.75)';
    ctx.beginPath();
    ctx.arc(x, y, ativo ? 31 : 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ativo ? '#ffd426' : '#f2f2f2';
    ctx.font = `600 ${ativo ? 24 : 20}px "Archivo", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ativo ? z.rotulo : z.rotulo.replace('×', ''), x, y + 1);
  });
  // Faixa de controles à direita: modo, disparador, rolo.
  const faixa = vx + vl;
  const meio = (faixa + w) / 2;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(meio, h / 2, 62, 0, Math.PI * 2);
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(meio, h / 2, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd426';
  ctx.font = '600 22px "Archivo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOTO', meio, h / 2 - 120);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillText(`f/${String(N).replace('.', ',')}`, meio, 60);
  ctx.fillText(camera, meio, 92);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(meio - 34, h - 150, 68, 68, 12);
  ctx.stroke();
  ctx.restore();
  tela.texInterface.needsUpdate = true;
}

