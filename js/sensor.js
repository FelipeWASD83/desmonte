// O sensor de verdade de cada câmera: uma câmera virtual no lugar da lente,
// enxergando só a oficina (camada 1), com o campo de visão da focal real e do
// tamanho do sensor. Depois vem o desfoque: um shader que, pra cada pixel,
// calcula o borrão com a MESMA fórmula do optica.js (lente fina, focal real,
// o f/ e o foco do painel) e espalha a luz no formato do furo — hexágono das 6
// lâminas na principal, redondo na ultra e na tele.
//
// Veio da `abertura` e foi adaptado: três lentes em lugares diferentes da ilha
// (a paralaxe entre elas é real), recorte de 2× e 8×, tremor de mão com e sem
// estabilização, e a foto com o rastro do tremor durante a exposição.
import * as THREE from 'three';
import * as O from './optica.js';
import { CAMADA_FOTO } from './cenario.js';

export const LARGURA = 960;
export const ALTURA = 720;
const RAIO_MAXIMO = 84;
const AMOSTRAS = 420;
// Quanto o sensor anda no 3D em relação ao que ele anda de verdade: o
// movimento real (centésimos de milímetro) não daria pra ver.
export const AMPLIACAO_DO_CARRINHO = 25;

const VERTICE = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAGMENTO = /* glsl */ `
#include <packing>
uniform sampler2D tCor;
uniform sampler2D tProf;
uniform vec2 resolucao;
uniform float perto;
uniform float longe;
uniform float foco;
uniform float fNum;
uniform float focal;
uniform float pxPorMm;
uniform float maxRaio;
uniform float passo;
uniform float laminas;
uniform float redonda;
uniform float rotacao;
uniform float exposicao;
uniform float piscar;
varying vec2 vUv;

float distancia(vec2 uv) {
  float d = texture2D(tProf, uv).x;
  if (d >= 0.99999) return 1.0e9;
  return -perspectiveDepthToViewZ(d, perto, longe);
}

float imagem(float x) { return x * focal / (x - focal); }

// Raio do borrão em pixels: A·|v − vf|/v, o mesmo circuloDeConfusao() do optica.js.
float raio(float x) {
  float c = (focal / fNum) * abs(imagem(x) - imagem(foco)) / imagem(x);
  return min(0.5 * c * pxPorMm, maxRaio);
}

float poligono(float ang) {
  if (redonda > 0.5) return 1.0;
  float setor = 6.2831853 / laminas;
  float a = mod(ang - rotacao, setor) - 0.5 * setor;
  return cos(3.14159265 / laminas) / cos(a);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 paraSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec3 soma = texture2D(tCor, vUv).rgb;
  float dC = distancia(vUv);
  float rC = raio(dC);
  float total = 1.0;
  float r = passo;
  float ang = 0.0;
  vec2 px = 1.0 / resolucao;
  for (int i = 0; i < ${AMOSTRAS}; i++) {
    if (r >= maxRaio) break;
    ang += 2.39996323;
    vec2 tc = vUv + vec2(cos(ang), sin(ang)) * px * r;
    vec3 c = texture2D(tCor, tc).rgb;
    float d = distancia(tc);
    float rs = raio(d);
    if (d > dC) rs = clamp(rs, 0.0, rC * 2.0);
    float m = smoothstep(r - 0.5, r + 0.5, rs * poligono(ang));
    soma += mix(soma / total, c, m);
    total += 1.0;
    r += passo / r;
  }
  vec3 cor = aces(soma / total * exposicao);
  cor *= 1.0 - piscar;
  gl_FragColor = vec4(paraSrgb(cor), 1.0);
}`;

export class Sensor {
  // `lentes`: posição de cada lente no plano da ilha, em mm, relativa à principal
  // e já nas coordenadas da foto (x pra direita da imagem, y pra cima).
  constructor(renderer, scene, cenario, canvasPrevia, lentes) {
    this.renderer = renderer;
    this.cenario = cenario;
    this.lentes = lentes;
    this.canvas = canvasPrevia;
    canvasPrevia.width = LARGURA;
    canvasPrevia.height = ALTURA;
    this.ctx = canvasPrevia.getContext('2d');
    this.imagem = this.ctx.createImageData(LARGURA, ALTURA);
    this.buffer = new Uint8Array(LARGURA * ALTURA * 4);
    this.piscar = 0;
    this.tremor = { x: 0, y: 0 };

    this.camera = new THREE.PerspectiveCamera(50, LARGURA / ALTURA, 5, 3e6);
    this.camera.layers.set(CAMADA_FOTO);
    this.olho = new THREE.Group();
    this.olho.add(this.camera);
    cenario.grupo.add(this.olho);
    this.scene = scene;

    this.rtCena = new THREE.WebGLRenderTarget(LARGURA, ALTURA, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(LARGURA, ALTURA),
    });
    // A saída fica "sem espaço de cor" de propósito: o shader já escreve em
    // sRGB. Marcada como sRGB, a placa convertia de novo na escrita (a foto
    // saía lavada) e ler os pixels de volta ficava umas três vezes mais lento.
    this.rtSaida = new THREE.WebGLRenderTarget(LARGURA, ALTURA);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTICE,
      fragmentShader: FRAGMENTO,
      uniforms: {
        tCor: { value: this.rtCena.texture },
        tProf: { value: this.rtCena.depthTexture },
        resolucao: { value: new THREE.Vector2(LARGURA, ALTURA) },
        perto: { value: this.camera.near },
        longe: { value: this.camera.far },
        foco: { value: 1000 },
        fNum: { value: 1.48 },
        focal: { value: 6.8 },
        pxPorMm: { value: 100 },
        maxRaio: { value: 10 },
        passo: { value: 0.5 },
        laminas: { value: O.LAMINAS },
        redonda: { value: 1 },
        rotacao: { value: -Math.PI / 2 },
        exposicao: { value: 1.45 },
        piscar: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadroTela = new THREE.Scene();
    this.quadroTela.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.cameraTela = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(CAMADA_FOTO);
    this.config = null;
  }

  get textura() {
    return this.rtSaida.texture;
  }

  // Põe o olho na lente da câmera escolhida, com o campo e o desfoque do momento.
  ajustar({ zoom, N, foco }) {
    const z = O.zoomPorId(zoom);
    const cam = O.CAMERAS[z.camera];
    const f = O.focalReal(cam);
    const l = this.lentes[z.camera];
    this.camera.position.set(l.x, l.y, 0);
    this.camera.fov = O.campoDeVisao(cam, z.recorte, foco).vertical;
    this.camera.updateProjectionMatrix();
    const alturaMm = cam.sensor.altura / z.recorte;
    const pxPorMm = ALTURA / alturaMm;
    const u = this.material.uniforms;
    u.focal.value = f;
    u.foco.value = foco === Infinity ? 1e9 : foco;
    u.fNum.value = N;
    u.pxPorMm.value = pxPorMm;
    // Só a principal tem lâminas; na ultra e na tele o furo é fixo e redondo.
    u.redonda.value = z.camera !== 'principal' || O.formaDaAbertura(N).redonda ? 1 : 0;
    // O maior borrão da cena (do objeto mais perto ao infinito) decide o tamanho da espiral.
    const maisPerto = Math.max(cam.focoMinimo * 0.6, 55);
    const maior = Math.max(O.circuloDeConfusao({ f, N, foco, objeto: maisPerto }), O.circuloDeConfusao({ f, N, foco, objeto: Infinity }));
    const maxRaio = Math.min(RAIO_MAXIMO, Math.max(1, 0.5 * maior * pxPorMm));
    u.maxRaio.value = maxRaio;
    u.passo.value = Math.max(0.5, (maxRaio * maxRaio) / (2 * AMOSTRAS * 0.95));
    this.config = { zoom: z, cam, N, foco };
  }

  // Inclina a câmera virtual pelo tremor (em graus).
  _inclinar(t) {
    this.camera.rotation.set((t.y * Math.PI) / 180, (t.x * Math.PI) / 180, 0);
  }

  renderizar(copiar = true) {
    this._inclinar(this.tremor);
    this.material.uniforms.piscar.value = this.piscar;
    const r = this.renderer;
    const antes = r.getRenderTarget();
    r.setRenderTarget(this.rtCena);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(this.rtSaida);
    r.render(this.quadroTela, this.cameraTela);
    r.setRenderTarget(antes);
    if (!copiar) return;
    r.readRenderTargetPixels(this.rtSaida, 0, 0, LARGURA, ALTURA, this.buffer);
    const linha = LARGURA * 4;
    const dados = this.imagem.data;
    for (let y = 0; y < ALTURA; y++) dados.set(this.buffer.subarray((ALTURA - 1 - y) * linha, (ALTURA - y) * linha), y * linha);
    this.ctx.putImageData(this.imagem, 0, 0);
  }

  // Toque na prévia (u, v de 0 a 1, v de cima pra baixo): distância, ao longo
  // do eixo da lente, do que estiver ali. É o toque-pra-focar.
  distanciaEm(u, v) {
    this.cenario.grupo.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(u * 2 - 1, 1 - v * 2), this.camera);
    const hits = this.raycaster.intersectObject(this.cenario.grupo, true);
    const alvo = hits.find((h) => h.object.isMesh && !h.object.userData.fundo);
    if (!alvo) return Infinity;
    const local = this.camera.worldToLocal(alvo.point.clone());
    return -local.z;
  }

  // A foto: renderização nova, na hora. Com a mão tremendo, a exposição é
  // dividida em pedaços e cada um sai com o tremor daquele instante — a média
  // é o rastro que a foto de verdade teria.
  foto({ t0 = 0, segundos = 1 / 100, tremendo = false, ois = true } = {}, qualidade = 0.9) {
    const piscar = this.piscar;
    const tremorAntes = this.tremor;
    this.piscar = 0;
    const pedacos = tremendo ? 12 : 1;
    const soma = new Float32Array(LARGURA * ALTURA * 4);
    const k = ois ? O.SOBRA_COM_OIS : 1;
    for (let i = 0; i < pedacos; i++) {
      const t = tremendo ? O.tremor(t0 + (segundos * i) / Math.max(1, pedacos - 1)) : { x: 0, y: 0 };
      this.tremor = { x: t.x * k, y: t.y * k };
      this.renderizar(false);
      this.renderer.readRenderTargetPixels(this.rtSaida, 0, 0, LARGURA, ALTURA, this.buffer);
      for (let j = 0; j < soma.length; j++) soma[j] += this.buffer[j];
    }
    const linha = LARGURA * 4;
    const dados = this.imagem.data;
    for (let y = 0; y < ALTURA; y++) {
      const origem = (ALTURA - 1 - y) * linha;
      const destino = y * linha;
      for (let x = 0; x < linha; x++) dados[destino + x] = soma[origem + x] / pedacos;
    }
    this.ctx.putImageData(this.imagem, 0, 0);
    const url = this.canvas.toDataURL('image/jpeg', qualidade);
    this.tremor = tremorAntes;
    this.piscar = piscar;
    return url;
  }
}
