// A óptica das três câmeras de trás do iPhone 18 Pro Max, sem DOM e sem three
// — é o que os testes abrem. Tudo em milímetro.
//
// De onde vem cada número:
// - Focal equivalente, f/, megapixels e tamanho do pixel: Apple (página de
//   especificações e press release de 09/09/2026).
// - Tamanho dos sensores: GSMArena (a Apple não publica). Os testes conferem que
//   eles batem com o que a Apple publica: pixel de 1,22 µm na principal, 0,7 µm
//   na ultra, 120° de campo na ultra e o furo de 4,6 mm que o iFixit mediu em
//   f/1,48.
// - Foco mínimo: estimativa (a Apple só fala do macro de 2 cm da ultra).

// Diagonal do full frame (36 × 24): é a régua do "equivalente".
export const DIAGONAL_FULL_FRAME = Math.hypot(36, 24);

// Os quatro passos da abertura variável da principal (Apple). A ultra e a tele
// têm abertura fixa.
export const PASSOS_PRINCIPAL = [1.48, 1.8, 2.8, 4.0];
export const LAMINAS = 6;

export const CAMERAS = {
  ultra: {
    id: 'ultra',
    nome: 'Ultra-angular',
    megapixels: 48,
    equivalente: 13,
    passos: [2.2],
    sensor: { largura: 5.64, altura: 4.23, tipo: '1/2,55"' },
    pixelQuad: 1.4, // µm, Apple
    focoMinimo: 20, // o macro de 2 cm
  },
  principal: {
    id: 'principal',
    nome: 'Principal (Fusion)',
    megapixels: 48,
    equivalente: 24,
    passos: PASSOS_PRINCIPAL,
    sensor: { largura: 9.8, altura: 7.35, tipo: '1/1,28"' },
    pixelQuad: 2.44,
    focoMinimo: 150, // estimativa
  },
  tele: {
    id: 'tele',
    nome: 'Teleobjetiva tetraprisma',
    megapixels: 48,
    equivalente: 100,
    passos: [2.8],
    sensor: { largura: 5.64, altura: 4.23, tipo: '1/2,55"' },
    pixelQuad: null,
    focoMinimo: 450, // estimativa
  },
};

// Os botões de zoom do app de câmera. 2× e 8× são recorte do meio do sensor de
// 48 MP (a Apple chama de "qualidade óptica"): mesma lente, sensor menor.
export const ZOOMS = [
  { id: '0.5', rotulo: '0,5×', camera: 'ultra', recorte: 1 },
  { id: '1', rotulo: '1×', camera: 'principal', recorte: 1 },
  { id: '2', rotulo: '2×', camera: 'principal', recorte: 2 },
  { id: '4', rotulo: '4×', camera: 'tele', recorte: 1 },
  { id: '8', rotulo: '8×', camera: 'tele', recorte: 2 },
];

export const zoomPorId = (id) => ZOOMS.find((z) => z.id === id);

export function diagonalDoSensor(cam) {
  return Math.hypot(cam.sensor.largura, cam.sensor.altura);
}

export function fatorDeCorte(cam, recorte = 1) {
  return (DIAGONAL_FULL_FRAME / diagonalDoSensor(cam)) * recorte;
}

// A focal de verdade do vidro (a "equivalente" é o que ela seria no full frame).
export function focalReal(cam) {
  return cam.equivalente / fatorDeCorte(cam);
}

export function focalEquivalente(cam, recorte = 1) {
  return cam.equivalente * recorte;
}

// Tamanho do pixel, em µm, no modo 48 MP (4:3: 8064 × 6048).
export function pixelEmMicra(cam) {
  const colunas = Math.round(Math.sqrt((cam.megapixels * 1e6 * 4) / 3));
  return (cam.sensor.largura / colunas) * 1000;
}

// Lente fina: onde a imagem de um objeto a `d` mm se forma atrás da lente.
export function distanciaImagem(f, d) {
  if (d === Infinity) return f;
  return (f * d) / (d - f);
}

// Campo de visão em graus. Com o foco perto a lente se afasta do sensor e o
// campo fecha um pouquinho (respiro de foco).
export function campoDeVisao(cam, recorte = 1, foco = Infinity) {
  const v = distanciaImagem(focalReal(cam), foco);
  const w = cam.sensor.largura / recorte;
  const h = cam.sensor.altura / recorte;
  const ang = (x) => (2 * Math.atan(x / 2 / v) * 180) / Math.PI;
  return { horizontal: ang(w), vertical: ang(h), diagonal: ang(Math.hypot(w, h)) };
}

// Diâmetro do furo por onde a luz entra (pupila de entrada) = focal / N.
export function diametroDaAbertura(cam, N) {
  return focalReal(cam) / N;
}

// Quantas vezes mais luz entra em Na do que em Nb.
export function luzRelativa(Na, Nb) {
  return (Nb / Na) ** 2;
}

// Diâmetro do borrão no sensor (mm) de um ponto a `objeto` mm com a lente
// focada a `foco` mm. Lente fina: c = A·|v − vf|/v, com A = f/N.
export function circuloDeConfusao({ f, N, foco, objeto }) {
  const v = distanciaImagem(f, objeto);
  const vf = distanciaImagem(f, foco);
  return ((f / N) * Math.abs(v - vf)) / v;
}

// Borrão aceitável: 1/1500 da diagonal do que vira foto (o recorte encolhe o
// sensor, então encolhe junto).
export function cocAceitavel(cam, recorte = 1) {
  return diagonalDoSensor(cam) / recorte / 1500;
}

export function hiperfocal(f, N, c) {
  return (f * f) / (N * c) + f;
}

// Faixa nítida em volta do foco.
export function profundidadeDeCampo({ f, N, foco, c }) {
  const H = hiperfocal(f, N, c);
  if (foco === Infinity) return { perto: H, longe: Infinity };
  const perto = (foco * (H - f)) / (H + foco - 2 * f);
  const longe = foco >= H ? Infinity : (foco * (H - f)) / (H - foco);
  return { perto, longe };
}

// Exposição automática da nossa cena (a oficina no fim da tarde). O celular
// segura o tempo em 1/25 s no máximo; passou disso, sobe o ISO.
const TEMPO_BASE = 1 / 100; // em f/1,48, ISO 125
const ISO_BASE = 125;
const TEMPO_MAXIMO = 1 / 25;
export function exposicao(N) {
  const precisa = TEMPO_BASE * (N / 1.48) ** 2;
  const segundos = Math.min(precisa, TEMPO_MAXIMO);
  const iso = Math.round((ISO_BASE * precisa) / segundos);
  return { segundos, iso, texto: `1/${Math.round(1 / segundos)} s` };
}

// Forma do furo com as 6 lâminas: hexágono regular com o raio inscrito pedido.
// Em f/1,48 as lâminas se escondem atrás do anel e o furo fica redondo.
export function formaDaAbertura(N, cam = CAMERAS.principal, rotacao = -Math.PI / 2) {
  const semi = diametroDaAbertura(cam, N) / 2;
  const redonda = N <= cam.passos[0] + 1e-9;
  const R = semi / Math.cos(Math.PI / LAMINAS);
  const pontos = [];
  for (let k = 0; k < LAMINAS; k++) {
    const a = rotacao + Math.PI / LAMINAS + (2 * Math.PI * k) / LAMINAS;
    pontos.push([R * Math.cos(a), R * Math.sin(a)]);
  }
  return { redonda, pontos, raioInscrito: semi, raioCircunscrito: R };
}

// Quanto a tele precisaria de profundidade sem o prisma: a distância do vidro
// ao sensor quando foca no infinito é a focal real. Ela não cabe num celular de
// 8,75 mm — por isso a luz é dobrada.
export const ESPESSURA_DO_CELULAR = 8.75;
export function caminhoDaTele() {
  return focalReal(CAMERAS.tele);
}

// Tremor de mão: soma de senoides fora de fase (graus). Sem nada aleatório,
// dá pra repetir a mesma tremida numa foto de várias subexposições.
export function tremor(t) {
  const x = 0.11 * Math.sin(t * 2 * Math.PI * 9.3) + 0.05 * Math.sin(t * 2 * Math.PI * 4.1 + 1.3) + 0.08 * Math.sin(t * 2 * Math.PI * 0.7 + 0.4);
  const y = 0.09 * Math.sin(t * 2 * Math.PI * 10.7 + 2.1) + 0.06 * Math.sin(t * 2 * Math.PI * 3.3 + 0.2) + 0.07 * Math.sin(t * 2 * Math.PI * 0.53 + 2.9);
  return { x, y };
}

// O que sobra do tremor com a estabilização por deslocamento do sensor. A
// Apple não publica o número; 90% de correção é a ordem de grandeza dos
// sistemas de OIS de celular (estimativa).
export const SOBRA_COM_OIS = 0.1;

// Rastro do tremor no sensor durante a exposição, em pixels de uma foto com
// `larguraPx` de largura: é o borrão de mão.
export function rastroDoTremor(cam, recorte, segundos, { ois = true, larguraPx = 960, t0 = 0, passos = 40 } = {}) {
  const hfov = campoDeVisao(cam, recorte).horizontal;
  const escala = larguraPx / hfov;
  const k = ois ? SOBRA_COM_OIS : 1;
  let maior = 0;
  const a = tremor(t0);
  for (let i = 1; i <= passos; i++) {
    const b = tremor(t0 + (segundos * i) / passos);
    maior = Math.max(maior, Math.hypot(b.x - a.x, b.y - a.y) * k * escala);
  }
  return maior;
}
