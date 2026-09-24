// Onde tudo se junta: o estado, os controles, a prévia do sensor, as
// etiquetas em cima do 3D, as fotos e o plano B sem WebGL. Quem mexe no
// estado chama definir(); o resto se ajusta sozinho.
import * as O from './optica.js';
import { PECAS, GRUPOS, MODOS, ACABAMENTOS, INTERFACE } from './textos.js';
import { desenharDiagrama } from './diagrama.js';

const $ = (id) => document.getElementById(id);
const num = (v, casas = 1) => v.toFixed(casas).replace('.', ',');
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAMERAS_PECAS = new Set(['camera-principal', 'camera-ultra', 'camera-tele', 'flash-lidar', 'carcaca', 'vidro-traseiro']);

const estado = {
  modo: 'montado',
  explodir: 1,
  zoom: '1',
  N: 1.8,
  foco: 480,
  tremor: false,
  ois: true,
  acabamento: 'prata',
  selecionada: null,
  disparos: ler('desmonte:disparos', 0),
};

// O que fica guardado neste navegador (e só nele). Sem permissão pra guardar
// (aba anônima, por exemplo), tudo funciona e só não lembra depois.
function ler(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}
function guardar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
estado.acabamento = ler('desmonte:acabamento', 'prata');
if (!ACABAMENTOS.some((a) => a.id === estado.acabamento)) estado.acabamento = 'prata';

// ---------- conversões dos controles ----------
const camDoZoom = (zoom) => O.CAMERAS[O.zoomPorId(zoom).camera];
const NEfetivo = (e) => (camDoZoom(e.zoom).id === 'principal' ? e.N : camDoZoom(e.zoom).passos[0]);
// O foco anda em dioptria (1/distância): espaçado perto, apertado no infinito.
const focoDoControle = (v, cam) => {
  const x = 1 - v / 1000;
  return x <= 0.0005 ? Infinity : cam.focoMinimo / x;
};
const controleDoFoco = (mm, cam) => (mm === Infinity ? 1000 : Math.round(1000 * (1 - cam.focoMinimo / mm)));
const textoDistancia = (mm) => (mm === Infinity ? '∞' : mm < 100 ? `${Math.round(mm)} mm` : mm < 1000 ? `${Math.round(mm / 10)} cm` : `${num(mm / 1000, mm < 10000 ? 2 : 0)} m`);

// ---------- a cena 3D (ou o plano B) ----------
let cena = null;
try {
  if (new URLSearchParams(location.search).has('sem3d')) throw new Error('plano B pedido no endereço');
  // As texturas com letra (bateria, A20, manta) são desenhadas em canvas: espero as fontes.
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  await Promise.all(['500 16px "JetBrains Mono"', '600 16px "Archivo"'].map((f) => document.fonts.load(f).catch(() => null)));
  const { Cena } = await import('./cena.js');
  cena = new Cena($('cena'), $('previa'));
} catch (erro) {
  console.warn('Sem 3D: segue o desenho em 2D.', erro);
  $('cena').hidden = true;
  $('diagrama2d').hidden = false;
  $('aviso').hidden = false;
  const msg = String(erro?.message);
  $('aviso').textContent = /plano B/.test(msg) ? INTERFACE.planoB : /webgl/i.test(msg) ? INTERFACE.semWebgl : INTERFACE.erro3d;
  document.querySelector('.modos').hidden = true;
  document.querySelector('.previa').hidden = true;
  $('disparar').hidden = true;
  $('disparos').hidden = true;
  document.querySelector('.rolo').hidden = true;
}

$('carregando').hidden = true;

// ---------- montagem da interface ----------
$('marca').textContent = INTERFACE.marca;
$('titulo').textContent = INTERFACE.titulo;
$('sub').textContent = INTERFACE.subtitulo;
const dicaBase = window.matchMedia('(pointer: coarse)').matches ? INTERFACE.dicaToque : INTERFACE.dica;

for (const m of MODOS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.modo = m.id;
  b.textContent = m.nome;
  b.addEventListener('click', () => {
    const fica = estado.selecionada && (m.id !== 'cameras' || CAMERAS_PECAS.has(estado.selecionada));
    definir({ modo: m.id, selecionada: fica ? estado.selecionada : null });
  });
  $('modos').append(b);
}

for (const a of ACABAMENTOS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'amostra';
  b.dataset.acabamento = a.id;
  b.style.setProperty('--cor', `#${a.aluminio.toString(16).padStart(6, '0')}`);
  b.setAttribute('aria-label', a.nome);
  b.title = a.nome;
  b.addEventListener('click', () => {
    guardar('desmonte:acabamento', a.id);
    definir({ acabamento: a.id });
  });
  $('acabamentos').append(b);
}
const nomeAcabamento = document.createElement('span');
nomeAcabamento.className = 'acabamento-nome';
$('acabamentos').append(nomeAcabamento);

for (const z of O.ZOOMS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.zoom = z.id;
  b.textContent = z.rotulo;
  b.addEventListener('click', () => {
    const cam = camDoZoom(z.id);
    // Trocando de lente, o foco não pode ficar mais perto que o mínimo dela.
    definir({ zoom: z.id, foco: estado.foco === Infinity ? Infinity : Math.max(estado.foco, cam.focoMinimo) });
  });
  $('zooms').append(b);
}

const chips = new Map();
const etiquetas = new Map();
for (const grupo of GRUPOS) {
  const h = document.createElement('h2');
  h.className = 'pecas-grupo';
  h.textContent = grupo.nome;
  const ul = document.createElement('ul');
  $('listaPecas').append(h, ul);
  PECAS.forEach((p, i) => {
    if (p.grupo !== grupo.id) return;
    const numero = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="chip-numero">${numero}</span><span></span>`;
    b.lastChild.textContent = p.nome;
    b.setAttribute('aria-label', `${numero}, ${p.nome}`);
    b.addEventListener('click', () => escolher(estado.selecionada === p.id ? null : p.id));
    li.append(b);
    ul.append(li);
    chips.set(p.id, b);

    const et = document.createElement('div');
    et.className = 'etiqueta';
    et.innerHTML = `<b>${numero}</b><span></span>`;
    et.lastChild.textContent = p.nome;
    $('etiquetas').append(et);
    etiquetas.set(p.id, et);
  });
}
const cotas = ['163,4 mm', '78,0 mm', '8,75 mm'].map((t) => {
  const el = document.createElement('div');
  el.className = 'cota';
  el.textContent = t;
  $('etiquetas').append(el);
  return el;
});

function escolher(id) {
  if (id && estado.modo === 'cameras' && cena && !CAMERAS_PECAS.has(id)) {
    // Peça que não aparece no modo câmeras: volta pro explodido pra mostrar ela.
    definir({ modo: 'explodido', selecionada: id });
    cena.focarPeca(id); // mira onde a peça vai parar, não onde ela está agora
    return;
  }
  const tinha = Boolean(estado.selecionada);
  definir({ selecionada: id });
  if (id && cena) cena.focarPeca(id);
  if (!id && cena && tinha) cena.enquadrar(estado.modo);
}

// ---------- controles ----------
const preencher = (input) => {
  const p = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--p', `${p}%`);
};
$('explodir').addEventListener('input', (e) => definir({ explodir: e.target.value / 100 }));
$('abertura').addEventListener('input', (e) => definir({ N: O.PASSOS_PRINCIPAL[Number(e.target.value)] }));
$('foco').addEventListener('input', (e) => definir({ foco: focoDoControle(Number(e.target.value), camDoZoom(estado.zoom)) }));
$('tremor').addEventListener('change', (e) => definir({ tremor: e.target.checked }));
$('ois').addEventListener('change', (e) => definir({ ois: e.target.checked }));
$('fecharFicha').addEventListener('click', () => escolher(null));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && estado.selecionada && !$('fotoGrande').open) escolher(null);
});

$('previa').addEventListener('click', (e) => {
  if (!cena) return;
  const r = e.currentTarget.getBoundingClientRect();
  const d = cena.sensor.distanciaEm((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  const cam = camDoZoom(estado.zoom);
  definir({ foco: d === Infinity || d > 5e4 ? Infinity : Math.max(cam.focoMinimo, Math.round(d)) });
});

$('disparar').addEventListener('click', () => {
  if (!cena) return;
  const n = estado.disparos + 1;
  guardar('desmonte:disparos', n);
  const exp = O.exposicao(NEfetivo(estado));
  const src = cena.sensor.foto({ t0: cena.tempo, segundos: exp.segundos, tremendo: estado.tremor, ois: estado.ois });
  guardarFoto(src);
  cena.disparar();
  definir({ disparos: n });
});
if (cena) cena.aoEscolher = (id) => escolher(id === estado.selecionada ? null : id);

// ---------- o rolo ----------
const MAX_FOTOS = 8;
let fotos = ler('desmonte:fotos', []);
if (!Array.isArray(fotos)) fotos = [];
function legendaDaFoto(f) {
  const tremida = f.tremor ? (f.ois ? ' · tremida, com OIS' : ' · tremida, sem OIS') : '';
  return `${f.zoom} · f/${num(f.N, f.N === 1.48 ? 2 : 1)} · ${f.tempo} · ISO ${f.iso} · foco ${f.foco ? textoDistancia(f.foco) : '∞'}${tremida}`;
}
function guardarFoto(src) {
  const N = NEfetivo(estado);
  const exp = O.exposicao(N);
  const z = O.zoomPorId(estado.zoom);
  fotos = [{ src, zoom: z.rotulo, N, tempo: exp.texto, iso: exp.iso, foco: estado.foco === Infinity ? null : estado.foco, tremor: estado.tremor, ois: estado.ois, quando: Date.now() }, ...fotos].slice(0, MAX_FOTOS);
  // Se não couber mais no navegador, vai largando as mais velhas.
  for (let n = fotos.length; n >= 1; n--) if (guardar('desmonte:fotos', fotos.slice(0, n))) break;
  mostrarFotos();
}
function mostrarFotos() {
  const lista = $('fotos');
  lista.replaceChildren();
  $('fotosVazio').hidden = fotos.length > 0;
  fotos.forEach((f, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Abrir a foto ${i + 1}: ${legendaDaFoto(f)}`);
    const img = document.createElement('img');
    img.src = f.src;
    img.alt = '';
    b.append(img);
    b.addEventListener('click', () => abrirFoto(f));
    li.append(b);
    lista.append(li);
  });
}
function abrirFoto(f) {
  $('fotoGrandeImagem').src = f.src;
  $('fotoGrandeLegenda').textContent = legendaDaFoto(f);
  const salvar = $('fotoSalvar');
  salvar.href = f.src;
  salvar.download = `desmonte-${new Date(f.quando).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.jpg`;
  $('fotoGrande').showModal();
}
$('fotoFechar').addEventListener('click', () => $('fotoGrande').close());
$('fotoGrande').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.close();
});
mostrarFotos();

// ---------- aplicar o estado ----------
function definir(parcial) {
  Object.assign(estado, parcial);
  const e = estado;
  const z = O.zoomPorId(e.zoom);
  const cam = O.CAMERAS[z.camera];
  const N = NEfetivo(e);
  const f = O.focalReal(cam);

  document.querySelectorAll('#modos button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === e.modo)));
  document.querySelectorAll('#zooms button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zoom === e.zoom)));
  document.querySelectorAll('.amostra').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.acabamento === e.acabamento)));
  nomeAcabamento.textContent = ACABAMENTOS.find((a) => a.id === e.acabamento).nome;
  $('afastar').hidden = e.modo !== 'explodido';
  $('dica').textContent = cena ? `${dicaBase} · ${INTERFACE.dicaModo[e.modo]}` : '';

  $('lenteValor').textContent = `${INTERFACE.rotuloCamera[cam.id]} · ${O.focalEquivalente(cam, z.recorte)} mm`;
  const ab = $('abertura');
  ab.disabled = cam.id !== 'principal';
  $('controleAbertura').classList.toggle('desligado', ab.disabled);
  if ('N' in parcial && document.activeElement !== ab) ab.value = String(O.PASSOS_PRINCIPAL.indexOf(e.N));
  $('aberturaValor').textContent = `f/${num(N, N === 1.48 ? 2 : 1)}`;
  $('aberturaFala').textContent = INTERFACE.abertura(e.N, cam.id);

  const foco = $('foco');
  if (('foco' in parcial || 'zoom' in parcial) && document.activeElement !== foco) foco.value = controleDoFoco(e.foco, cam);
  $('focoValor').textContent = textoDistancia(e.foco);
  $('focoFala').textContent = INTERFACE.foco(e.foco);
  [ab, foco, $('explodir')].forEach(preencher);

  $('tremor').checked = e.tremor;
  $('ois').checked = e.ois;
  const exp = O.exposicao(N);
  // A foto pode cair em qualquer instante do tremor: o painel mostra o pior caso de 2 s.
  let rastro = 0;
  for (let t0 = 0; t0 < 2; t0 += 0.05) rastro = Math.max(rastro, O.rastroDoTremor(cam, z.recorte, exp.segundos, { ois: e.ois, larguraPx: 960, t0, passos: 12 }));
  $('tremorFala').textContent = INTERFACE.tremor(e.tremor, e.ois, rastro);

  for (const [id, b] of chips) b.setAttribute('aria-pressed', String(id === e.selecionada));

  const ficha = $('ficha');
  if (e.selecionada) {
    const i = PECAS.findIndex((p) => p.id === e.selecionada);
    const p = PECAS[i];
    ficha.hidden = false;
    $('fichaNumero').textContent = String(i + 1).padStart(2, '0');
    $('fichaNome').textContent = p.nome;
    $('fichaFato').textContent = p.fato;
    $('fichaTexto').textContent = p.texto;
    $('fichaFonte').textContent = `fonte: ${p.fonte}`;
  } else {
    ficha.hidden = true;
  }
  $('dica').hidden = Boolean(e.selecionada);

  // Leituras: tudo sai da óptica, nada escrito à mão.
  const c = O.cocAceitavel(cam, z.recorte);
  const pdc = O.profundidadeDeCampo({ f, N, foco: e.foco, c });
  const campo = O.campoDeVisao(cam, z.recorte, e.foco);
  $('lFocal').textContent = `${num(f, 2)} mm`;
  $('lEquivalente').textContent = `${O.focalEquivalente(cam, z.recorte)} mm${z.recorte > 1 ? ' (recorte)' : ''}`;
  $('lSensor').textContent = `${cam.sensor.tipo} · ${num(cam.sensor.largura / z.recorte, 1)} mm`;
  $('lFuro').textContent = `${num(O.diametroDaAbertura(cam, N), 2)} mm`;
  $('lTempo').textContent = `${exp.texto} · ${exp.iso}`;
  $('lPdc').textContent = `${textoDistancia(pdc.perto)} – ${textoDistancia(pdc.longe)}`;
  $('lCampo').textContent = `${Math.round(campo.diagonal)}° diag.`;
  $('lLuz').textContent = `${num(O.luzRelativa(N, 4), 1)}×`;
  $('disparos').textContent = e.disparos ? INTERFACE.disparos(e.disparos) : '';

  $('diagramaLegenda').textContent = cam.id === 'tele' ? 'o caminho da luz na tele, em escala (o prisma é esquemático)' : 'a luz até o sensor, em escala: laranja vem do foco, cinza vem do infinito';
  desenharDiagrama($('diagrama'), e);
  if (!cena) desenharDiagrama($('diagrama2d'), e);
  if (cena) cena.aplicar(e);
}

// ---------- tamanho e laço ----------
const palco = document.querySelector('.palco');
const empilhado = window.matchMedia('(max-width: 1100px), (max-aspect-ratio: 1/1)');
// No layout largo, a lista de peças e o painel cobrem as bordas do palco: o
// centro do celular vai pro meio do espaço livre entre os dois.
const desvioDoCentro = () => {
  if (empilhado.matches) return 0;
  const esquerda = $('listaPecas').getBoundingClientRect().right;
  const direita = document.querySelector('.painel').getBoundingClientRect().left;
  return Math.round(palco.clientWidth / 2 - (esquerda + direita) / 2);
};
let aspectoAnterior = null;
new ResizeObserver(() => {
  const w = palco.clientWidth;
  const h = palco.clientHeight;
  if (cena) {
    cena.redimensionar(w, h, desvioDoCentro());
    const aspecto = w / h;
    if (aspectoAnterior !== null && Math.abs(aspecto - aspectoAnterior) > 0.15) cena.enquadrar(estado.modo);
    aspectoAnterior = aspecto;
  } else {
    desenharDiagrama($('diagrama2d'), estado);
  }
  desenharDiagrama($('diagrama'), estado);
}).observe(palco);

// Primeira pintura com o estado inteiro, pra todo controle nascer no valor certo.
definir({ ...estado });
if (cena) {
  cena.redimensionar(palco.clientWidth, palco.clientHeight, desvioDoCentro());
  cena.enquadrar(estado.modo, true);
}

// Pra depurar e testar pelo console: estado, definir() e a cena.
window.__desmonte = { estado, definir, cena, escolher };

let ultimo = performance.now();
function laco(agora) {
  // O carimbo do requestAnimationFrame pode vir antes do performance.now() do
  // começo: sem o limite de baixo, o primeiro intervalo saía negativo.
  const dt = Math.min(Math.max((agora - ultimo) / 1000, 0), 0.05);
  ultimo = agora;
  if (cena) {
    const { pecas, cotas: posCotas } = cena.quadro(dt, { reduzirMovimento });
    for (const p of pecas) {
      const el = etiquetas.get(p.id);
      const acesa = p.id === estado.selecionada || p.id === cena.hover;
      // Na bancada o número já está impresso na manta: a etiqueta só aparece na peça acesa.
      const noModo = estado.modo === 'explodido' || (estado.modo === 'cameras' && CAMERAS_PECAS.has(p.id) && p.id !== 'carcaca' && p.id !== 'vidro-traseiro');
      const mostrar = p.visivel && (noModo || acesa);
      // Só opacidade zero deixava um fiapo da etiqueta: esconde de verdade.
      el.style.opacity = mostrar ? '1' : '0';
      el.style.visibility = mostrar ? 'visible' : 'hidden';
      el.classList.toggle('acesa', acesa);
      if (mostrar) el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-3px, -50%)`;
    }
    posCotas.forEach((c, i) => {
      const el = cotas[i];
      el.style.visibility = c.visivel ? 'visible' : 'hidden';
      if (c.visivel) el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) translate(-50%, -50%)`;
    });
  }
  requestAnimationFrame(laco);
}
requestAnimationFrame(laco);
