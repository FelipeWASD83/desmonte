// Formas básicas em milímetro: retângulo de cantos redondos, chapa extrudada,
// caixa, cilindro e anel no eixo z. O celular inteiro sai disto.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/addons/RoundedBoxGeometry.js';

// Contorno de (x0, y0) a (x1, y1) com um raio por canto:
// [cima-esquerda, cima-direita, baixo-direita, baixo-esquerda].
export function contorno(x0, y0, x1, y1, raios, caminho = new THREE.Shape()) {
  const [a, b, c, d] = typeof raios === 'number' ? [raios, raios, raios, raios] : raios;
  caminho.moveTo(x0 + d, y0);
  caminho.lineTo(x1 - c, y0);
  if (c) caminho.absarc(x1 - c, y0 + c, c, -Math.PI / 2, 0, false);
  caminho.lineTo(x1, y1 - b);
  if (b) caminho.absarc(x1 - b, y1 - b, b, 0, Math.PI / 2, false);
  caminho.lineTo(x0 + a, y1);
  if (a) caminho.absarc(x0 + a, y1 - a, a, Math.PI / 2, Math.PI, false);
  caminho.lineTo(x0, y0 + d);
  if (d) caminho.absarc(x0 + d, y0 + d, d, Math.PI, Math.PI * 1.5, false);
  return caminho;
}

// Buraco no formato de contorno (sentido contrário, como o three quer).
export function furo(x0, y0, x1, y1, raios) {
  const p = contorno(x0, y0, x1, y1, raios, new THREE.Path());
  const pts = p.getPoints(24).reverse();
  return new THREE.Path(pts);
}

export function furoRedondo(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

// Chapa: a forma extrudada de zDe até zAte, com a quina chanfrada sem sair do contorno.
export function chapa(forma, zDe, zAte, material, { chanfro = 0, curvas = 24 } = {}) {
  const espessura = zAte - zDe;
  const b = Math.min(chanfro, espessura / 2 - 0.01);
  const g = new THREE.ExtrudeGeometry(forma, {
    depth: Math.max(espessura - 2 * Math.max(b, 0), 0.01),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 3,
    curveSegments: curvas,
  });
  g.translate(0, 0, zDe + Math.max(b, 0));
  return new THREE.Mesh(g, material);
}

export function caixa(w, h, d, material, x = 0, y = 0, z = 0, raio = 0.25) {
  const r = Math.min(raio, Math.min(w, h, d) / 2 - 0.001);
  const g = r > 0.01 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  return m;
}

export function cilindro(r, zDe, zAte, material, x = 0, y = 0, segmentos = 48) {
  const g = new THREE.CylinderGeometry(r, r, zAte - zDe, segmentos);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, (zDe + zAte) / 2);
  return m;
}

export function anel(rDentro, rFora, zDe, zAte, material, x = 0, y = 0, { chanfro = 0 } = {}) {
  const f = new THREE.Shape();
  f.absarc(0, 0, rFora, 0, Math.PI * 2, false);
  f.holes.push(furoRedondo(0, 0, rDentro));
  const m = chapa(f, zDe, zAte, material, { chanfro, curvas: 48 });
  m.position.x = x;
  m.position.y = y;
  return m;
}

export function disco(r, z, material, x = 0, y = 0, segmentos = 48) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, segmentos), material);
  m.position.set(x, y, z);
  return m;
}

// Plano virado pra −z (pra fora das costas do celular).
export function discoDeCostas(r, z, material, x = 0, y = 0) {
  const m = disco(r, z, material, x, y);
  m.rotation.y = Math.PI;
  return m;
}
