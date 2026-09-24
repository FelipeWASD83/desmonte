// O alumínio do celular: a carcaça unibody, a ilha das câmeras, o vidro
// traseiro, os botões e o contorno que a tela, a moldura e o vidro dividem.
//
// Nada aqui é caixa extrudada. O corpo é um PERFIL de lateral (o friso da
// frente, a lateral reta com as quinas arredondadas e a curva pras costas)
// varrido ao longo do contorno do celular, e o contorno tem canto contínuo
// (superelipse, o "squircle" da Apple) em vez de arco de compasso.
//
// Coordenadas do celular (ver aparelho.js): x pra direita olhando a tela, y
// pra cima, z saindo da tela, milímetro. Espessura, largura e altura são as
// da Apple; os raios do perfil são estimados pelas fotos do 17 Pro.
import * as THREE from 'three';
import { M } from './materiais.js';
import { LENTES } from './cameras.js';

export const LARGURA = 78.0;
export const ALTURA = 163.4;
export const ESPESSURA = 8.75;
const HX = LARGURA / 2;
const HY = ALTURA / 2;
const ZF = ESPESSURA / 2;
const ZT = -ESPESSURA / 2;

// Canto: alcance da curva a partir do vértice do retângulo e o expoente da
// superelipse (2 seria um arco comum; mais alto, mais "quadrado de canto macio").
export const CANTO = 17;
const EXPOENTE = 4;
const AMOSTRAS_CANTO = 56;

// O perfil da lateral (estimativa pelas fotos do 17 Pro).
const RAIO_FRENTE = 1.0; // a quina do friso da frente
const RAIO_COSTAS = 1.5; // a quina que vira pras costas
const FRISO = 1.3; // largura do aro que abraça o vidro da tela
const FRISO_ABAIXO = 0.1; // o aro fica um tico abaixo do vidro
const PAREDE = 0.9; // espessura do fundo por dentro

// A ilha das câmeras.
export const ALTURA_DA_ILHA = 1.6;
export const TOPO_DA_ILHA = ZT - ALTURA_DA_ILHA;
const ILHA_BAIXO = 36; // onde a ilha começa, em y
const ILHA_RECUO = 1.6; // quanto ela fica pra dentro da borda do corpo
const ILHA_RAIO = 0.8; // a quina de cima dela

// O recorte do vidro traseiro.
export const VIDRO_TRASEIRO = { x0: -30.3, y0: -73.8, x1: 30.3, y1: 29.8, canto: 10 };

// ---------- contorno ----------

// Pontos do contorno (sentido anti-horário visto de +z) de um retângulo com
// canto contínuo. `cantos`: alcance de cada canto, na ordem
// [cima-esquerda, cima-direita, baixo-direita, baixo-esquerda].
export function contornoContinuo(x0, y0, x1, y1, cantos = CANTO, { expoente = EXPOENTE, amostras = AMOSTRAS_CANTO, porLado = 6 } = {}) {
  const [ce, cd, bd, be] = typeof cantos === 'number' ? [cantos, cantos, cantos, cantos] : cantos;
  const e = 2 / expoente;
  const pts = [];
  const quadrante = (cx, cy, sx, sy, c, t0, t1) => {
    for (let k = 0; k <= amostras; k++) {
      const t = t0 + ((t1 - t0) * k) / amostras;
      const co = Math.max(0, Math.cos(t));
      const si = Math.max(0, Math.sin(t));
      pts.push(new THREE.Vector2(cx + sx * c * co ** e, cy + sy * c * si ** e));
    }
  };
  const reta = (ax, ay, bx, by) => {
    for (let k = 1; k < porLado; k++) pts.push(new THREE.Vector2(ax + ((bx - ax) * k) / porLado, ay + ((by - ay) * k) / porLado));
  };
  const Q = Math.PI / 2;
  quadrante(x1 - bd, y0 + bd, 1, -1, bd, Q, 0); // baixo-direita
  reta(x1, y0 + bd, x1, y1 - cd);
  quadrante(x1 - cd, y1 - cd, 1, 1, cd, 0, Q); // cima-direita
  reta(x1 - cd, y1, x0 + ce, y1);
  quadrante(x0 + ce, y1 - ce, -1, 1, ce, Q, 0); // cima-esquerda
  reta(x0, y1 - ce, x0, y0 + be);
  quadrante(x0 + be, y0 + be, -1, -1, be, 0, Q); // baixo-esquerda
  reta(x0 + be, y0, x1 - bd, y0);
  // Tira os pontos repetidos na emenda dos cantos com as retas.
  return pts.filter((p, i) => p.distanceTo(pts[(i + 1) % pts.length]) > 1e-6);
}

// Normal pra fora em cada ponto (contorno anti-horário).
function normais(pts) {
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    return new THREE.Vector2(b.y - a.y, -(b.x - a.x)).normalize();
  });
}

// O contorno andado `d` mm pra fora (negativo: pra dentro).
export function deslocar(pts, d) {
  const n = normais(pts);
  return pts.map((p, i) => p.clone().addScaledVector(n[i], d));
}

// O contorno do corpo, deslocado. É dele que saem o vidro da tela, a moldura
// e o painel: todos encaixam no mesmo canto contínuo, sem fresta.
export function contornoDoCorpo(d = 0) {
  const pts = contornoContinuo(-HX, -HY, HX, HY, CANTO);
  return d ? deslocar(pts, d) : pts;
}

export function formaDoCorpo(d = 0) {
  return new THREE.Shape(contornoDoCorpo(d));
}

// Um anel com o formato do corpo: de `dFora` até `dDentro`.
export function anelDoCorpo(dFora, dDentro) {
  const s = formaDoCorpo(dFora);
  s.holes.push(new THREE.Path(contornoDoCorpo(dDentro).slice().reverse()));
  return s;
}

// ---------- varredura ----------

// Varre um perfil ao longo de um contorno fechado. O perfil é uma lista de
// FAIXAS; cada faixa é uma lista de [d, z] (d: deslocamento pra fora do
// contorno, z: altura). Dentro da faixa a sombra é lisa; entre faixas fica
// quina viva. Com o contorno anti-horário, a face aponta pra fora quando a
// faixa anda no sentido de +z (ou de +d em cima de uma face voltada pra −z).
// UV em milímetro (u ao longo do contorno, v ao longo do perfil), pra textura
// de acabamento ter o mesmo tamanho em toda peça.
export function varrer(pts, faixas, material) {
  const n = normais(pts);
  const N = pts.length;
  const comprimento = [0];
  for (let i = 1; i <= N; i++) comprimento.push(comprimento[i - 1] + pts[i % N].distanceTo(pts[i - 1]));
  const geos = faixas.map((faixa) => {
    const pos = [];
    const uv = [];
    const idx = [];
    const vAcum = [0];
    for (let j = 1; j < faixa.length; j++) vAcum.push(vAcum[j - 1] + Math.hypot(faixa[j][0] - faixa[j - 1][0], faixa[j][1] - faixa[j - 1][1]));
    const M_ = faixa.length;
    // Uma coluna a mais no fim, repetindo a primeira, pra UV não dar volta pra
    // trás na emenda; a normal da emenda é corrigida depois.
    for (let i = 0; i <= N; i++) {
      const p = pts[i % N];
      const q = n[i % N];
      for (let j = 0; j < M_; j++) {
        const [d, z] = faixa[j];
        pos.push(p.x + q.x * d, p.y + q.y * d, z);
        uv.push(comprimento[i], vAcum[j]);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M_ - 1; j++) {
        const a = i * M_ + j;
        const b = (i + 1) * M_ + j;
        idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // Emenda: a primeira e a última coluna são o mesmo lugar; junta as normais.
    const nor = g.attributes.normal;
    for (let j = 0; j < M_; j++) {
      const a = j;
      const b = N * M_ + j;
      const x = nor.getX(a) + nor.getX(b);
      const y = nor.getY(a) + nor.getY(b);
      const z = nor.getZ(a) + nor.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      nor.setXYZ(a, x / l, y / l, z / l);
      nor.setXYZ(b, x / l, y / l, z / l);
    }
    return g;
  });
  const grupo = new THREE.Group();
  for (const g of geos) grupo.add(new THREE.Mesh(g, material));
  return grupo;
}

// Tampa plana: a forma em z, virada pra +z (ou pra −z com `costas`). UV em mm.
export function tampa(forma, z, material, { costas = false } = {}) {
  let s = forma;
  if (costas) {
    // Espelha em x e gira meia volta em y: a face passa a olhar pra −z e a
    // forma volta pro lugar.
    s = new THREE.Shape(forma.getPoints(64).map((p) => new THREE.Vector2(-p.x, p.y)).reverse());
    s.holes = forma.holes.map((h) => new THREE.Path(h.getPoints(64).map((p) => new THREE.Vector2(-p.x, p.y)).reverse()));
  }
  const g = new THREE.ShapeGeometry(s, 64);
  if (costas) g.rotateY(Math.PI);
  g.translate(0, 0, z);
  return new THREE.Mesh(g, material);
}

// Arco de `a0` a `a1` (graus) em volta de (cd, cz), como pontos [d, z].
function arco(cd, cz, r, a0, a1, passos = 14) {
  const out = [];
  for (let k = 0; k <= passos; k++) {
    const a = ((a0 + ((a1 - a0) * k) / passos) * Math.PI) / 180;
    out.push([cd + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return out;
}

// ---------- as peças ----------

function recorteDoVidro(d = 0) {
  const v = VIDRO_TRASEIRO;
  return contornoContinuo(v.x0 - d, v.y0 - d, v.x1 + d, v.y1 + d, v.canto + d, { amostras: 32 });
}

export function construirCarcaca() {
  const g = new THREE.Group();
  const alu = M.aluminio();
  const corpo = contornoDoCorpo();
  const recuoCostas = RAIO_COSTAS + 1.1;
  const recuoChao = FRISO + 2.2;

  // O perfil inteiro, das costas pro friso e de volta pro chão por dentro.
  const topoFriso = ZF - FRISO_ABAIXO;
  const lateral = [
    [-recuoCostas, ZT],
    ...arco(-RAIO_COSTAS, ZT + RAIO_COSTAS, RAIO_COSTAS, -90, 0, 16),
    ...arco(-RAIO_FRENTE, topoFriso - RAIO_FRENTE, RAIO_FRENTE, 0, 90, 14),
    [-FRISO, topoFriso],
  ];
  const paredeDeDentro = [
    [-FRISO, topoFriso],
    [-FRISO, ZT + PAREDE],
  ];
  const chao = [
    [-FRISO, ZT + PAREDE],
    [-recuoChao, ZT + PAREDE],
  ];
  g.add(varrer(corpo, [lateral, paredeDeDentro, chao], alu));

  // As costas (por fora) e o chão (por dentro), com o recorte do vidro.
  const buraco = () => new THREE.Path(recorteDoVidro().slice().reverse());
  const costas = new THREE.Shape(deslocar(corpo, -recuoCostas));
  costas.holes.push(buraco());
  g.add(tampa(costas, ZT, alu, { costas: true }));
  const dentro = new THREE.Shape(deslocar(corpo, -recuoChao));
  dentro.holes.push(buraco());
  g.add(tampa(dentro, ZT + PAREDE, alu));
  // A parede do recorte do vidro (olhando pra dentro do buraco).
  g.add(varrer(recorteDoVidro(), [[[0, ZT + PAREDE], [0, ZT]]], alu));

  // A ilha: sobe das costas com uma curvinha na base e quina macia em cima.
  const topo = TOPO_DA_ILHA;
  const cIlhaTopo = CANTO - ILHA_RECUO;
  const ilha = contornoContinuo(-HX + ILHA_RECUO, ILHA_BAIXO, HX - ILHA_RECUO, HY - ILHA_RECUO, [cIlhaTopo, cIlhaTopo, 7, 7], { amostras: 48 });
  const perfilIlha = [
    [-ILHA_RAIO - 1.2, topo],
    ...arco(-ILHA_RAIO, topo + ILHA_RAIO, ILHA_RAIO, -90, 0, 12),
    ...arco(0.45, ZT - 0.45, 0.45, 180, 90, 8).map(([d, z]) => [d, Math.min(z, ZT - 0.02)]),
  ];
  g.add(varrer(ilha, [perfilIlha], alu));
  g.add(tampa(new THREE.Shape(deslocar(ilha, -ILHA_RAIO - 1.2)), topo, alu, { costas: true }));

  // Os anéis das três lentes, torneados, com a safira e a lente por baixo.
  const anelMat = M.anel();
  for (const l of Object.values(LENTES)) g.add(anelDeLente(l, anelMat));

  // Flash, LiDAR e o furo do microfone, cada um num aro rebaixado.
  g.add(janela(-25, 70, 3.5, new THREE.MeshPhysicalMaterial({ color: 0xece5d2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }), anelMat));
  g.add(janela(-25, 48, 3.5, M.lente(), anelMat));
  const mic = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), M.plasticoPreto());
  mic.rotation.y = Math.PI;
  mic.position.set(-12, 59, topo - 0.01);
  g.add(mic);

  // Borda de baixo: a boca da USB-C e os
  // furos do alto-falante e dos microfones, na faixa reta da lateral.
  const preto = M.plasticoPreto();
  const boca = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(contornoContinuo(-4.4, -1.5, 4.4, 1.5, 1.5, { expoente: 2, amostras: 12 })), 24), preto);
  boca.rotation.x = Math.PI / 2;
  boca.position.set(0, -HY - 0.01, 0);
  g.add(boca);
  for (let i = 0; i < 6; i++) {
    for (const lado of [-1, 1]) {
      const furinho = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), preto);
      furinho.rotation.x = Math.PI / 2;
      furinho.position.set(lado * (9 + i * 2.2), -HY - 0.01, 0);
      g.add(furinho);
    }
  }
  // Os rebaixos dos botões nas laterais: a fresta escura em volta de cada um.
  for (const r of REBAIXOS) g.add(rebaixo(r, preto));
  return g;
}

// Aro torneado de uma lente: sobe da ilha, tem o topo arredondado e desce em
// chanfro até a safira. Por baixo da safira, a lente com os anéis dos elementos.
function anelDeLente(l, material) {
  const g = new THREE.Group();
  const R = l.raioAnel;
  const r = l.raioVidro;
  const perfil = [
    [R + 0.25, 0],
    [R, 0.25],
    [R, 1.45],
    ...arco(R - 0.45, 1.45, 0.45, 0, 90, 10).map(([a, b]) => [a, b]),
    [r + 0.9, 1.9],
    [r + 0.2, 1.35],
    [r, 1.2],
    [r, 0.6],
  ].map(([rr, h]) => new THREE.Vector2(rr, h));
  const torno = new THREE.LatheGeometry(perfil, 96);
  torno.rotateX(-Math.PI / 2); // a altura do torno vira −z (pra fora das costas)
  const aro = new THREE.Mesh(torno, material);
  aro.material.side = THREE.DoubleSide;
  aro.position.set(l.x, l.y, TOPO_DA_ILHA);
  g.add(aro);
  // A lente: disco escuro com os anéis dos elementos, embaixo da safira.
  const lente = new THREE.Mesh(new THREE.CircleGeometry(r, 64), M.olhoDeLente());
  lente.rotation.y = Math.PI;
  lente.position.set(l.x, l.y, TOPO_DA_ILHA - 0.55);
  g.add(lente);
  const safira = new THREE.Mesh(new THREE.CircleGeometry(r, 64), M.reflexo());
  safira.rotation.y = Math.PI;
  safira.position.set(l.x, l.y, TOPO_DA_ILHA - 1.2);
  safira.renderOrder = 2;
  g.add(safira);
  return g;
}

function janela(x, y, r, vidro, aroMat) {
  const g = new THREE.Group();
  const perfil = [
    [r + 0.6, 0],
    [r + 0.45, 0.22],
    [r + 0.1, 0.25],
    [r, 0.12],
  ].map(([a, b]) => new THREE.Vector2(a, b));
  const torno = new THREE.LatheGeometry(perfil, 64);
  torno.rotateX(-Math.PI / 2);
  const aro = new THREE.Mesh(torno, aroMat);
  aro.position.set(x, y, TOPO_DA_ILHA);
  g.add(aro);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(r, 48), vidro);
  disco.rotation.y = Math.PI;
  disco.position.set(x, y, TOPO_DA_ILHA - 0.1);
  g.add(disco);
  return g;
}

// ---------- botões ----------
// Posição estimada pelo 17 Pro Max. Lado −1 é a esquerda olhando a tela.
const BOTOES = [
  { lado: -1, y: 46, comprimento: 6.5 }, // Ação
  { lado: -1, y: 33, comprimento: 10 }, // volume +
  { lado: -1, y: 20.5, comprimento: 10 }, // volume −
  { lado: 1, y: 33, comprimento: 17 }, // lateral
];
const CONTROLE = { lado: 1, y: -24, comprimento: 19 };
const REBAIXOS = [...BOTOES, CONTROLE];

// Cápsula deitada na lateral: `saliencia` pra fora da face da lateral.
function capsula(comprimento, altura, espessura, material) {
  const forma = new THREE.Shape(contornoContinuo(-altura / 2, -comprimento / 2, altura / 2, comprimento / 2, altura / 2, { expoente: 2, amostras: 16 }));
  const g = new THREE.ExtrudeGeometry(forma, { depth: espessura, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelOffset: -0.3, bevelSegments: 5, curveSegments: 24 });
  // Forma em (z, y) do celular; a extrusão anda em x.
  g.rotateY(Math.PI / 2);
  return new THREE.Mesh(g, material);
}

// A cápsula ocupa em x de (posição − 0,35) até (posição + espessura + 0,35).
function rebaixo({ lado, y, comprimento }, material) {
  const fresta = capsula(comprimento + 0.7, 3.6, 0.6, material);
  // Só um fio pra fora da lateral: aparece como a fresta escura em volta do botão.
  fresta.position.set(lado > 0 ? HX - 0.93 : -HX + 0.33, y, 0.2);
  return fresta;
}

export function botoesDoLado(lado) {
  const g = new THREE.Group();
  for (const b of BOTOES.filter((b) => b.lado === lado)) {
    const c = capsula(b.comprimento, 3.1, 0.6, M.aluminio());
    c.position.set(lado > 0 ? HX - 0.35 : -HX - 0.25, b.y, 0.2);
    g.add(c);
  }
  return g;
}

export function cameraControl() {
  const g = new THREE.Group();
  const aro = capsula(CONTROLE.comprimento, 3.4, 0.5, M.aluminio());
  aro.position.set(HX - 0.35, CONTROLE.y, 0.2);
  g.add(aro);
  const safira = capsula(CONTROLE.comprimento - 1.4, 2.6, 0.62, M.safira());
  safira.position.set(HX - 0.3, CONTROLE.y, 0.2);
  g.add(safira);
  return g;
}

// ---------- o vidro traseiro ----------
export function vidroTraseiro() {
  const forma = new THREE.Shape(recorteDoVidro(-0.05));
  const g = new THREE.ExtrudeGeometry(forma, { depth: PAREDE - 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelOffset: -0.15, bevelSegments: 4, curveSegments: 32 });
  g.translate(0, 0, ZT + 0.15);
  return new THREE.Mesh(g, M.vidroTraseiro());
}
