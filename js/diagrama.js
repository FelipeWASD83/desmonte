// O desenho da luz até o sensor, em 2D e em escala: fica no painel e é o
// plano B quando o navegador não libera WebGL.
//
// Principal e ultra: a lente vista de lado. Os raios laranja vêm do ponto em
// foco e fecham em cima do sensor; os cinza vêm do infinito e, se o foco está
// perto, fecham antes e chegam abertos — esse borrão é o desfoque do fundo.
// Tele: o caminho dobrado dentro da espessura do celular, ao lado do tamanho
// que ele teria reto.
import * as O from './optica.js';

const num = (v, casas = 2) => v.toFixed(casas).replace('.', ',');

function preparar(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 180;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function cores(canvas) {
  const s = getComputedStyle(canvas);
  return {
    tinta: s.getPropertyValue('--tinta').trim() || '#15191b',
    fraca: s.getPropertyValue('--tinta-3').trim() || 'rgba(21,25,27,.6)',
    linha: s.getPropertyValue('--linha-forte').trim() || 'rgba(21,25,27,.3)',
    acao: s.getPropertyValue('--acao').trim() || '#ff5b24',
    mono: s.getPropertyValue('--fonte-mono').trim() || 'monospace',
  };
}

function lenteDeLado(ctx, w, h, c, { zoom, N, foco }) {
  const z = O.zoomPorId(zoom);
  const cam = O.CAMERAS[z.camera];
  const f = O.focalReal(cam);
  const a = O.diametroDaAbertura(cam, N) / 2;
  const alturaSensor = cam.sensor.largura / z.recorte;
  const v = O.distanciaImagem(f, foco);
  const s = Math.min((w - 150) / (v * 1.25), (h - 64) / (Math.max(alturaSensor, a * 2.6) * 1.05));
  const cy = h / 2 - 6;
  const xL = 118;
  const xS = xL + v * s;
  ctx.lineWidth = 1;

  // Eixo.
  ctx.strokeStyle = c.linha;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(10, cy);
  ctx.lineTo(w - 10, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Raios do infinito (cinza): fecham na focal e seguem até o sensor.
  const xF = xL + f * s;
  ctx.strokeStyle = c.fraca;
  for (const y of [-a, a]) {
    ctx.beginPath();
    ctx.moveTo(14, cy - y * s);
    ctx.lineTo(xL, cy - y * s);
    const incl = (0 - y) / (xF - xL);
    ctx.lineTo(xS, cy - (y + incl * (xS - xL)) * s);
    ctx.stroke();
  }
  // Raios do ponto em foco (laranja): chegam juntos no sensor.
  ctx.strokeStyle = c.acao;
  ctx.lineWidth = 1.6;
  for (const y of [-a, 0, a]) {
    const inclFora = foco === Infinity ? 0 : y / foco;
    ctx.beginPath();
    ctx.moveTo(14, cy - (y - inclFora * (xL - 14) / s) * s);
    ctx.lineTo(xL, cy - y * s);
    ctx.lineTo(xS, cy);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Lente e lâminas: o furo é o que sobra entre elas.
  ctx.strokeStyle = c.tinta;
  ctx.beginPath();
  ctx.ellipse(xL, cy, 5, Math.max(a * 1.35, 2.4) * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (z.camera === 'principal') {
    ctx.fillStyle = c.tinta;
    const aMax = O.diametroDaAbertura(cam, 1.48) / 2;
    ctx.fillRect(xL - 11, cy - (aMax * 1.3) * s, 4, (aMax * 1.3 - a) * s);
    ctx.fillRect(xL - 11, cy + a * s, 4, (aMax * 1.3 - a) * s);
  }
  // Sensor.
  ctx.fillStyle = c.tinta;
  ctx.fillRect(xS, cy - (alturaSensor / 2) * s, 4, alturaSensor * s);

  // Legendas.
  ctx.fillStyle = c.fraca;
  ctx.font = `11px ${c.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`furo ${num(a * 2)} mm`, 14, cy - a * s - 10 > 14 ? cy - a * s - 10 : 14);
  ctx.fillText(`focal ${num(f)} mm`, 14, h - 10);
  ctx.textAlign = 'right';
  ctx.fillText(`sensor ${num(alturaSensor, 1)} mm`, w - 10, cy - (alturaSensor / 2) * s - 8 > 12 ? cy - (alturaSensor / 2) * s - 8 : 12);
  const borrao = O.circuloDeConfusao({ f, N, foco, objeto: Infinity });
  ctx.fillText(foco === Infinity ? 'fundo nítido' : `fundo borra ${num(borrao, 3)} mm`, w - 10, h - 10);
}

function teleDobrada(ctx, w, h, c) {
  const f = O.caminhoDaTele();
  const esp = O.ESPESSURA_DO_CELULAR;
  const s = (h - 46) / (f + 1);
  const topo = 18;
  ctx.lineWidth = 1;
  // O celular: uma faixa com a espessura dele.
  const faixa = esp * s;
  ctx.fillStyle = 'rgba(128,128,128,0.12)';
  ctx.fillRect(10, topo, w - 20, faixa);
  ctx.strokeStyle = c.linha;
  ctx.strokeRect(10, topo, w - 20, faixa);
  // À esquerda: o caminho reto, que furaria o celular.
  const xr = 44;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = c.fraca;
  ctx.beginPath();
  ctx.moveTo(xr, topo);
  ctx.lineTo(xr, topo + f * s);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = c.tinta;
  ctx.fillRect(xr - 10, topo + f * s, 20, 3);
  ctx.fillStyle = c.fraca;
  ctx.font = `11px ${c.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`reta: ${num(f, 1)} mm`, xr + 12, topo + f * s - 2);
  // À direita: o caminho dobrado, 4 reflexões dentro do prisma (esquemático).
  const x0 = w * 0.42;
  const esc = Math.min((w - x0 - 30) / 16, faixa / 6.5);
  const pz = (z) => topo + (z + 4.4) * esc;
  const px = (x) => x0 + x * esc;
  ctx.strokeStyle = c.linha;
  ctx.strokeRect(px(0), pz(-3), 15.5 * esc, 4.9 * esc);
  const caminho = [[1.2, -4.4], [1.2, 1.6], [4.2, -2.7], [7.2, 1.6], [10.2, -2.7], [10.2, 2.4]];
  ctx.strokeStyle = c.acao;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  caminho.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
  ctx.stroke();
  ctx.fillStyle = c.acao;
  ctx.font = `600 10px ${c.mono}`;
  ctx.textAlign = 'center';
  caminho.slice(1, 5).forEach(([x, z], i) => {
    ctx.beginPath();
    ctx.arc(px(x), pz(z), 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(String(i + 1), px(x), pz(z) + (z > 0 ? 14 : -7));
  });
  ctx.fillStyle = c.tinta;
  ctx.fillRect(px(8.4), pz(2.4), 3.6 * esc, 3);
  ctx.fillStyle = c.fraca;
  ctx.font = `11px ${c.mono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`celular: ${num(esp, 2)} mm`, x0, topo + faixa + 16);
  ctx.fillText('dobrada: cabe', x0, topo + faixa + 32);
}

export function desenharDiagrama(canvas, estado) {
  const { ctx, w, h } = preparar(canvas);
  const c = cores(canvas);
  const z = O.zoomPorId(estado.zoom);
  const cam = O.CAMERAS[z.camera];
  const N = cam.id === 'principal' ? estado.N : cam.passos[0];
  if (z.camera === 'tele') teleDobrada(ctx, w, h, c);
  else lenteDeLado(ctx, w, h, c, { zoom: estado.zoom, N, foco: estado.foco });
}
