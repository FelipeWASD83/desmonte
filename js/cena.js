// O palco 3D: a bancada de reparo, o celular e os quatro modos (montado,
// explodido, na bancada, câmeras). Quem manda no estado é o principal.js;
// aqui só obedece.
import * as THREE from 'three';
import * as O from './optica.js';
import { construirAparelho, desenharInterface, NO_MODO_CAMERAS } from './aparelho.js';
import { LENTES } from './cameras.js';
import { construirBancada, COR_TAMPO } from './manta.js';
import { construirCenario } from './cenario.js';
import { Sensor, AMPLIACAO_DO_CARRINHO } from './sensor.js';
import { Orbita } from './orbita.js';
import { pintar } from './materiais.js';
import { ACABAMENTOS } from './textos.js';

const ACAO = new THREE.Color(0xff5b24);
const suave = (t) => t * t * (3 - 2 * t);
const EM_PE_Y = 136; // centro do celular em pé, acima da manta

function visivelDeVerdade(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export class Cena {
  constructor(canvas, canvasPrevia) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('sem WebGL');
    this.canvas = canvas;
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // O compilador de shader do Windows (ANGLE) solta aviso de precisão à toa.
    renderer.debug.checkShaderErrors = false;
    renderer.setClearColor(COR_TAMPO, 1);

    this.scene = new THREE.Scene();
    // A névoa apaga a borda do tampo na cor do fundo da página.
    this.scene.fog = new THREE.Fog(COR_TAMPO, 1900, 5600);
    this.camera = new THREE.PerspectiveCamera(30, 1, 3, 20000);
    this.scene.environment = this._estudio();

    // Luz de oficina: uma chave larga e neutra de cima, que desenha a sombra
    // na manta, um preenchimento frio e um recorte por trás.
    this.chave = new THREE.DirectionalLight(0xfff3e8, 3.0);
    this.chave.position.set(-300, 820, 420);
    this.chave.castShadow = true;
    this.chave.shadow.mapSize.set(4096, 4096); // roda só no PC: pode gastar
    Object.assign(this.chave.shadow.camera, { left: -620, right: 620, top: 620, bottom: -620, near: 50, far: 2400 });
    this.chave.shadow.bias = -0.0008;
    this.chave.shadow.normalBias = 1.6;
    this.scene.add(this.chave);
    const frio = new THREE.DirectionalLight(0xdce6ff, 1.1);
    frio.position.set(460, 320, -320);
    this.scene.add(frio);
    const recorte = new THREE.DirectionalLight(0xffffff, 1.3);
    recorte.position.set(80, 300, -700);
    this.scene.add(recorte);
    this.scene.add(new THREE.HemisphereLight(0xd7e2ea, 0x16191c, 0.75));

    // A oficina que as lentes fotografam, e o sensor.
    this.cenario = construirCenario();
    this.scene.add(this.cenario.grupo);
    // Posição de cada lente em relação à principal, nas coordenadas da foto:
    // com o celular deitado na mão, a direita da foto é o −y do celular e o
    // alto da foto é o +x.
    const p = LENTES.principal;
    const lentesFoto = Object.fromEntries(Object.entries(LENTES).map(([id, l]) => [id, { x: -(l.y - p.y), y: l.x - p.x }]));
    this.sensor = new Sensor(renderer, this.scene, this.cenario, canvasPrevia, lentesFoto);

    this.ap = construirAparelho(this.sensor.textura, ACAO);
    this.scene.add(this.ap.raiz);
    this.pecas = this.ap.pecas;
    this.porId = this.ap.porId;

    this.bancada = construirBancada(this.pecas);
    this.scene.add(this.bancada.grupo);

    for (const peca of this.pecas) {
      peca.materiais = new Set();
      peca.objeto.traverse((o) => {
        if (!o.isMesh) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => m.emissive && peca.materiais.add(m));
        if (o.material.blending !== THREE.AdditiveBlending && !o.material.transparent) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
    }
    // As partes das câmeras guardam onde nasceram: o modo câmeras soma a partir dali.
    this.modulos = { principal: this.ap.cameras.principal, ultra: this.ap.cameras.ultra, tele: this.ap.cameras.tele };
    for (const m of Object.values(this.modulos)) for (const parte of m.partes) parte.base = parte.objeto.position.clone();

    this.orbita = new Orbita(this.camera, canvas);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.estado = null;
    this.peso = { explodir: 0, bancada: 0, cameras: 0, montado: 1 };
    this.semiAtual = null;
    this.hover = null;
    this.selecionada = null;
    this.tempo = 0;
    this.quadroN = 0;
    this.aoEscolher = null;
    this.reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    canvas.addEventListener('pointermove', (e) => this._pairar(e));
    canvas.addEventListener('pointerleave', () => this._definirHover(null));
    canvas.addEventListener('pointerup', (e) => {
      if (!this.orbita.foiClique()) return;
      const peca = this._pecaEm(e);
      this.aoEscolher?.(peca ? peca.id : null);
    });
  }

  // Estúdio de mentira pro reflexo do metal e do vidro: sala cinza, um
  // softbox grande em cima, uma faixa de janela fria de lado e o chão escuro.
  _estudio() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(2000, 2000, 2000), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.21, 0.22), side: THREE.BackSide })));
    const painel = (w, h, cor, x, y, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: cor, side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      s.add(m);
    };
    painel(1100, 700, new THREE.Color(3.2, 3.1, 3.0), -200, 900, 200);
    painel(160, 1200, new THREE.Color(1.6, 1.8, 2.1), 900, 200, -300);
    painel(160, 1200, new THREE.Color(1.3, 1.25, 1.2), -900, 150, 500);
    painel(700, 300, new THREE.Color(0.9, 0.95, 1.0), 200, 300, -900);
    // Uma régua de luz baixa pela frente: é ela que desenha o metal visto de perto.
    painel(1400, 220, new THREE.Color(1.4, 1.4, 1.45), 0, 40, 950);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const tex = pm.fromScene(s, 0.04).texture;
    pm.dispose();
    return tex;
  }

  redimensionar(w, h, desvio = 0) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    if (desvio) this.camera.setViewOffset(w, h, desvio, 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  // Em tela em pé ou no celular, afasta mais pra caber.
  _caber(d, largura = 1) {
    return d * Math.max(1, (1.25 * largura) / this.camera.aspect);
  }

  enquadrar(modo, instantaneo = false) {
    const c = this.bancada.centro;
    const v = {
      montado: { alvo: new THREE.Vector3(0, EM_PE_Y, 0), theta: 0.62, phi: 1.3, distancia: this._caber(760, 0.6), minDist: 120 },
      explodido: { alvo: new THREE.Vector3(18, EM_PE_Y - 8, -34), theta: 0.5, phi: 1.2, distancia: this._caber(820, 0.9), minDist: 120 },
      bancada: { alvo: new THREE.Vector3(c.x, 0, c.z - 30), theta: 0, phi: 0.52, distancia: this._caber(1420, 0.8), minDist: 120 },
      cameras: { alvo: new THREE.Vector3(-6, EM_PE_Y + 57, 40), theta: 0.62, phi: 1.24, distancia: this._caber(165, 0.8), minDist: 35 },
    }[modo];
    this.orbita.irPara(v);
    if (instantaneo || this.reduzirMovimento) {
      this.orbita.alvo.copy(v.alvo);
      this.orbita.theta = v.theta;
      this.orbita.phi = v.phi;
      this.orbita.distancia = v.distancia;
      this.orbita.estadoDestino = null;
    }
  }

  focarPeca(id) {
    const p = this.porId[id];
    if (!p) return;
    // Mira onde a peça vai PARAR no modo atual, não onde ela está agora: logo
    // depois de trocar de modo, ela ainda está no começo da animação.
    const e = this.estado;
    const alvo = p.base.clone();
    if (e.modo === 'explodido') alvo.addScaledVector(p.explodir, e.explodir);
    else if (e.modo === 'bancada') alvo.add(p.bancada);
    else if (e.modo === 'cameras') alvo.add(p.camera);
    const deitado = e.modo === 'bancada';
    const pose = new THREE.Matrix4().compose(
      new THREE.Vector3(0, deitado ? 0 : EM_PE_Y, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(deitado ? -Math.PI / 2 : 0, deitado ? 0 : Math.PI, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    alvo.applyMatrix4(pose);
    const perto = this.estado?.modo === 'cameras' ? 2.4 : 3.4;
    this.orbita.irPara({ alvo, distancia: this._caber(Math.max(this.estado?.modo === 'cameras' ? 60 : 110, p.raio * perto), 0.6) });
    if (this.reduzirMovimento) {
      const d = this.orbita.estadoDestino;
      this.orbita.alvo.copy(d.alvo);
      this.orbita.distancia = d.distancia;
      this.orbita.estadoDestino = null;
    }
  }

  aplicar(estado) {
    const antes = this.estado;
    this.estado = { ...estado };
    if (!antes || antes.modo !== estado.modo) {
      this.enquadrar(estado.modo, !antes);
      for (const p of this.pecas) p.objeto.visible = estado.modo !== 'cameras' || NO_MODO_CAMERAS.has(p.id);
    }
    if (!antes || antes.acabamento !== estado.acabamento) pintar(ACABAMENTOS.find((a) => a.id === estado.acabamento));
    const cam = O.CAMERAS[O.zoomPorId(estado.zoom).camera];
    const N = cam.id === 'principal' ? estado.N : cam.passos[0];
    if (!antes || antes.zoom !== estado.zoom || antes.N !== estado.N || antes.foco !== estado.foco) {
      this.sensor.ajustar({ zoom: estado.zoom, N, foco: estado.foco });
    }
    if (!antes || antes.zoom !== estado.zoom || antes.N !== estado.N) {
      desenharInterface(this.ap.tela, { zoomId: estado.zoom, zooms: O.ZOOMS, N, camera: cam.id === 'principal' ? 'FUSION' : cam.id === 'ultra' ? 'ULTRA' : 'TELE' });
    }
    this._definirSelecao(estado.selecionada);
  }

  // O "piscar" do visor quando a foto sai, como no app de câmera.
  disparar() {
    this.sensor.piscar = 1;
  }

  _pairar(e) {
    if (this.orbita.arrastando) return;
    const p = this._pecaEm(e);
    this._definirHover(p ? p.id : null);
  }

  _pecaEm(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.ap.raiz, true);
    for (const h of hits) {
      if (!h.object.isMesh || !visivelDeVerdade(h.object)) continue;
      const id = h.object.userData.peca;
      if (id) return this.porId[id];
    }
    return null;
  }

  _definirHover(id) {
    if (this.hover === id) return;
    this.hover = id;
    this.canvas.style.cursor = id ? 'pointer' : '';
    this._pintarSelecao();
  }

  _definirSelecao(id) {
    if (this.selecionada === id) return;
    this.selecionada = id;
    this._pintarSelecao();
  }

  _pintarSelecao() {
    for (const p of this.pecas) {
      const k = p.id === this.selecionada ? 0.4 : p.id === this.hover ? 0.18 : 0;
      for (const m of p.materiais) {
        m.emissive.copy(ACAO);
        m.emissiveIntensity = k;
      }
    }
  }

  // Um quadro: anima, fotografa, desenha e devolve onde as etiquetas caem.
  quadro(dt, { reduzirMovimento = false } = {}) {
    this.tempo += dt;
    const e = this.estado;
    const alvo = {
      explodir: e.modo === 'explodido' ? e.explodir : 0,
      bancada: e.modo === 'bancada' ? 1 : 0,
      cameras: e.modo === 'cameras' ? 1 : 0,
      montado: e.modo === 'montado' ? 1 : 0,
    };
    const k = reduzirMovimento ? 1 : 1 - Math.exp(-dt * 2.8);
    for (const chave of Object.keys(alvo)) this.peso[chave] += (alvo[chave] - this.peso[chave]) * k;
    const we = suave(THREE.MathUtils.clamp(this.peso.explodir, 0, 1));
    const wb = suave(THREE.MathUtils.clamp(this.peso.bancada, 0, 1));
    const wc = suave(THREE.MathUtils.clamp(this.peso.cameras, 0, 1));

    // O celular em pé de costas pra quem olha (as letras da manta ficam do
    // lado certo), ou deitado de tela pra cima: no caminho ele vira.
    const raiz = this.ap.raiz;
    raiz.position.set(0, EM_PE_Y * (1 - wb), 0);
    raiz.rotation.set((-Math.PI / 2) * wb, Math.PI * (1 - wb), 0);

    for (const p of this.pecas) {
      p.objeto.position.copy(p.base).addScaledVector(p.explodir, we).addScaledVector(p.bancada, wb).addScaledVector(p.camera, wc);
    }
    const bt = this.porId.botoes;
    bt.lados.forEach((lado, i) => lado.objeto.position.copy(lado.explodir).multiplyScalar(we).addScaledVector(bt.ladosBancada[i], wb));

    // As partes de dentro das câmeras se separam no modo câmeras.
    for (const m of Object.values(this.modulos)) for (const parte of m.partes) parte.objeto.position.copy(parte.base).addScaledVector(parte.camera, wc);

    // Tremor de mão e estabilização: o sensor anda pro lado contrário.
    const zoom = O.zoomPorId(e.zoom);
    const camAtiva = O.CAMERAS[zoom.camera];
    if (e.tremor && !reduzirMovimento) {
      const t = O.tremor(this.tempo);
      const sobra = e.ois ? O.SOBRA_COM_OIS : 1;
      this.sensor.tremor = { x: t.x * sobra, y: t.y * sobra };
      if (e.ois) {
        const f = O.focalReal(camAtiva);
        const rad = Math.PI / 180;
        const car = this.modulos[zoom.camera].carrinho;
        // Deslocamento que desfaz o giro (f·θ), ampliado pra dar pra ver.
        // A foto em pé é o +x do celular e a foto deitada é o −y (ver lentesFoto),
        // e a imagem na lente sai invertida: os dois eixos acabam com o mesmo sinal.
        car.position.x += f * t.y * rad * (1 - sobra) * AMPLIACAO_DO_CARRINHO;
        car.position.y += f * t.x * rad * (1 - sobra) * AMPLIACAO_DO_CARRINHO;
      }
    } else {
      this.sensor.tremor = { x: 0, y: 0 };
    }

    // Lâminas da principal: seguem o f/ com transição.
    const rFora = 3.4;
    const semiAlvo = e.N <= O.PASSOS_PRINCIPAL[0] ? rFora : O.diametroDaAbertura(O.CAMERAS.principal, e.N) / 2;
    if (this.semiAtual === null) this.semiAtual = semiAlvo;
    const novo = reduzirMovimento ? semiAlvo : this.semiAtual + (semiAlvo - this.semiAtual) * (1 - Math.exp(-dt * 7));
    if (Math.abs(novo - this.semiAtual) > 1e-4 || !this.laminasFeitas) {
      this.semiAtual = novo;
      this.modulos.principal.ajustarLaminas(novo);
      this.laminasFeitas = true;
    }

    // O caminho da luz aparece na câmera escolhida, no modo câmeras.
    for (const [id, m] of Object.entries(this.modulos)) {
      const ver = wc > 0.6 && id === zoom.camera;
      m.raios.visible = ver;
      if (ver) m.atualizarRaios(id === 'principal' ? e.N : camAtiva.passos[0]);
    }

    // As cotas só no montado.
    const cotas = this.ap.cotas;
    cotas.grupo.visible = this.peso.montado > 0.02;
    cotas.material.opacity = 0.9 * this.peso.montado;

    this.orbita.atualizar(dt, { respirar: !reduzirMovimento && e.modo === 'montado' });
    this.cenario.atualizar(this.tempo, reduzirMovimento);
    this.sensor.piscar = Math.min(1, Math.max(0, this.sensor.piscar - dt * 6));
    this.quadroN++;
    // Primeiro a foto (a tela do celular usa ela), depois a vista principal.
    this.sensor.renderizar(this.quadroN % 2 === 0 || this.sensor.piscar > 0);
    this.renderer.render(this.scene, this.camera);
    return this._etiquetas();
  }

  _etiquetas() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const v = new THREE.Vector3();
    const projetar = (obj, local) => {
      v.copy(local);
      obj.localToWorld(v);
      v.project(this.camera);
      return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, naFrente: v.z < 1 && v.z > -1 };
    };
    const zero = new THREE.Vector3();
    const pecas = this.pecas.map((p) => {
      const q = projetar(p.objeto, zero);
      return { id: p.id, numero: p.numero, x: q.x, y: q.y, visivel: q.naFrente && visivelDeVerdade(p.objeto) };
    });
    const cotas = this.ap.cotas.rotulos.map((r) => {
      const q = projetar(this.ap.raiz, r.ponto);
      return { texto: r.texto, x: q.x, y: q.y, visivel: q.naFrente && this.peso.montado > 0.5 };
    });
    return { pecas, cotas };
  }
}

