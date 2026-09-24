// A bancada de reparo: o tampo de grafite e a manta de silicone por cima, com
// grade milimetrada, régua nas bordas e um compartimento numerado pra cada
// peça — no modo "Na bancada" cada uma pousa no seu.
//
// A manta fica no mundo em y = 0..ALTURA_DA_MANTA. O celular deitado de tela
// pra cima leva (x, y) do celular pra (x, −z) do mundo: é por isso que o
// desenho do canvas usa y invertido.
import * as THREE from 'three';
import { BANCADA, ALTURA_DA_MANTA } from './aparelho.js';

const PX_POR_MM = 2;
const MARGEM = 46;

export const COR_TAMPO = 0x1e2225;
export const COR_MANTA = '#4a5d68';

function limites(pecas) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of pecas) {
    const [bx, by] = BANCADA[p.id];
    const w = p.pegada.x1 - p.pegada.x0;
    const h = p.pegada.y1 - p.pegada.y0;
    x0 = Math.min(x0, bx - w / 2);
    x1 = Math.max(x1, bx + w / 2);
    y0 = Math.min(y0, by - h / 2);
    y1 = Math.max(y1, by + h / 2);
  }
  return { x0: x0 - MARGEM, y0: y0 - MARGEM - 18, x1: x1 + MARGEM, y1: y1 + MARGEM };
}

function desenharManta(ctx, L, pecas) {
  const W = (L.x1 - L.x0) * PX_POR_MM;
  const H = (L.y1 - L.y0) * PX_POR_MM;
  const px = (x) => (x - L.x0) * PX_POR_MM;
  const py = (y) => (L.y1 - y) * PX_POR_MM;
  ctx.fillStyle = COR_MANTA;
  ctx.fillRect(0, 0, W, H);
  // Textura fosca do silicone: pontinhos claros e escuros bem de leve.
  let s = 11;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let k = 0; k < 26000; k++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
  // Grade: 5 mm fraquinha, 50 mm mais forte, cruz nos cruzamentos de 50.
  const x0 = Math.ceil(L.x0 / 5) * 5;
  const y0 = Math.ceil(L.y0 / 5) * 5;
  for (let x = x0; x <= L.x1; x += 5) {
    ctx.fillStyle = x % 50 === 0 ? 'rgba(226,238,244,0.17)' : 'rgba(226,238,244,0.07)';
    ctx.fillRect(px(x) - 0.5, 0, 1, H);
  }
  for (let y = y0; y <= L.y1; y += 5) {
    ctx.fillStyle = y % 50 === 0 ? 'rgba(226,238,244,0.17)' : 'rgba(226,238,244,0.07)';
    ctx.fillRect(0, py(y) - 0.5, W, 1);
  }
  ctx.strokeStyle = 'rgba(236,244,248,0.55)';
  ctx.lineWidth = 2;
  for (let x = Math.ceil(L.x0 / 50) * 50; x <= L.x1; x += 50) {
    for (let y = Math.ceil(L.y0 / 50) * 50; y <= L.y1; y += 50) {
      ctx.beginPath();
      ctx.moveTo(px(x) - 7, py(y));
      ctx.lineTo(px(x) + 7, py(y));
      ctx.moveTo(px(x), py(y) - 7);
      ctx.lineTo(px(x), py(y) + 7);
      ctx.stroke();
    }
  }
  // Régua na borda de baixo (mm), como nas mantas de verdade.
  ctx.fillStyle = 'rgba(236,244,248,0.7)';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (let x = Math.ceil(L.x0 / 10) * 10; x <= L.x1; x += 10) {
    const alto = x % 50 === 0 ? 18 : 9;
    ctx.fillRect(px(x) - 1, H - alto, 2, alto);
    if (x % 100 === 0) ctx.fillText(String(x - Math.ceil(L.x0 / 100) * 100), px(x), H - 24);
  }
  // Os compartimentos: contorno tracejado da pegada, número e nome em mono.
  pecas.forEach((p) => {
    const [bx, by] = BANCADA[p.id];
    const w = p.pegada.x1 - p.pegada.x0 + 10;
    const h = p.pegada.y1 - p.pegada.y0 + 10;
    const a = px(bx - w / 2);
    const b = py(by + h / 2);
    ctx.setLineDash([10, 7]);
    ctx.strokeStyle = 'rgba(236,244,248,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(a, b, w * PX_POR_MM, h * PX_POR_MM, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff5b24';
    ctx.beginPath();
    ctx.arc(a + 2, b + h * PX_POR_MM + 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,246,249,0.92)';
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(p.numero, a + 14, b + h * PX_POR_MM + 30);
  });
  // A "marca" impressa na manta.
  ctx.fillStyle = 'rgba(236,244,248,0.55)';
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('DESMONTE · MANTA DE SILICONE · GRADE 5 mm', 36, 44);
  ctx.textAlign = 'right';
  ctx.fillText('iPHONE 18 PRO MAX · 22 PEÇAS', W - 36, 44);
}

// Uma manta genérica (sem compartimentos) pra outras superfícies.
export function texturaDeGrade(tamanho = 512, mmPorLado = 100) {
  const c = document.createElement('canvas');
  c.width = c.height = tamanho;
  const ctx = c.getContext('2d');
  ctx.fillStyle = COR_MANTA;
  ctx.fillRect(0, 0, tamanho, tamanho);
  const p = tamanho / mmPorLado;
  for (let k = 0; k <= mmPorLado; k += 5) {
    ctx.fillStyle = k % 50 === 0 ? 'rgba(226,238,244,0.2)' : 'rgba(226,238,244,0.08)';
    ctx.fillRect(k * p - 0.5, 0, 1, tamanho);
    ctx.fillRect(0, k * p - 0.5, tamanho, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function construirBancada(pecas) {
  const g = new THREE.Group();
  const L = limites(pecas);
  const W = L.x1 - L.x0;
  const H = L.y1 - L.y0;
  const cx = (L.x0 + L.x1) / 2;
  const cy = (L.y0 + L.y1) / 2;

  // O tampo de grafite, grande o bastante pra sumir na névoa.
  const tampo = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: COR_TAMPO, roughness: 0.82, metalness: 0.05 }));
  tampo.rotation.x = -Math.PI / 2;
  tampo.receiveShadow = true;
  g.add(tampo);

  // A manta: corpo de silicone com a borda arredondada e o desenho por cima.
  const c = document.createElement('canvas');
  c.width = Math.round(W * PX_POR_MM);
  c.height = Math.round(H * PX_POR_MM);
  desenharManta(c.getContext('2d'), L, pecas);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const silicone = new THREE.MeshStandardMaterial({ color: 0x3f515b, roughness: 0.9 });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(W, ALTURA_DA_MANTA - 0.2, H), silicone);
  corpo.position.set(cx, (ALTURA_DA_MANTA - 0.2) / 2, -cy);
  corpo.receiveShadow = true;
  g.add(corpo);
  const topo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0 }));
  topo.rotation.x = -Math.PI / 2;
  topo.position.set(cx, ALTURA_DA_MANTA, -cy);
  topo.receiveShadow = true;
  g.add(topo);

  return { grupo: g, centro: new THREE.Vector3(cx, ALTURA_DA_MANTA, -cy), largura: W, profundidade: H };
}
