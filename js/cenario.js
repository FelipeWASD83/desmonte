// O que as câmeras do celular fotografam: a oficina no fim da tarde.
//
// Tudo em milímetro e em escala real, nas coordenadas do "olho": a lente
// principal na origem, olhando pra −z, y pra cima. Mora na camada 1: só as
// câmeras virtuais das lentes enxergam, a vista principal não.
//
// Cada distância foi escolhida pra uma lente ter o que mostrar:
// parafusos a 6–13 cm (macro da ultra), ferramentas a 20–35 cm, caneca a
// 48 cm, luminária a 90 cm, parede e janela a 1,6 m, e a cidade lá fora de
// 280 m a 1,2 km (a tele a 4× e 8× vive disso).
import * as THREE from 'three';
import { aleatorio } from './materiais.js';
import { texturaDeGrade } from './manta.js';

export const CAMADA_FOTO = 1;
const MESA_Y = -110; // o celular está 11 cm acima da bancada
const PAREDE_Z = -1600;
const INCLINACAO = -0.1; // o celular aponta um pouco pra cima: a tele enche a janela

function caixa(w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

function canvasTex(w, h, desenhar, repetir = null) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repetir);
  }
  return t;
}

// ---------- pertinho: a bandejinha de parafusos e as ferramentas ----------
// A bandeja magnética fica alta e colada no celular: os parafusos em cima dela
// ficam a 6–12 cm da lente, a distância do macro da ultra.
const TOPO_BANDEJA = MESA_Y + 86;
function parafusos(g) {
  const aco = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 1 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.35, metalness: 1 });
  const bandeja = new THREE.Mesh(new THREE.BoxGeometry(110, 86, 90), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.7 }));
  bandeja.position.set(70, MESA_Y + 43, -105);
  g.add(bandeja);
  const tampa = new THREE.Mesh(new THREE.PlaneGeometry(104, 84), new THREE.MeshStandardMaterial({ color: 0x3e4c55, roughness: 0.85 }));
  tampa.rotation.x = -Math.PI / 2;
  tampa.position.set(70, TOPO_BANDEJA + 0.05, -105);
  g.add(tampa);
  const r = aleatorio(29);
  const pontos = [
    [32, -76], [48, -70], [66, -84], [40, -96], [84, -92], [58, -110], [98, -118], [30, -126], [74, -134],
  ];
  pontos.forEach(([x, z], i) => {
    const p = new THREE.Group();
    const cabeca = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.6, 20), i % 3 ? aco : escuro);
    cabeca.position.y = 0.3;
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.55, 2.8, 12), i % 3 ? aco : escuro);
    corpo.rotation.z = Math.PI / 2;
    corpo.position.set(1.6, 0.6, 0);
    const fenda = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.3), escuro);
    fenda.position.y = 0.62;
    p.add(cabeca, corpo, fenda);
    p.rotation.y = r() * Math.PI * 2;
    p.position.set(x, TOPO_BANDEJA + 0.1, z);
    g.add(p);
  });
}

function ferramentas(g) {
  // Espátula de nylon preta, palheta azul e a chave de precisão.
  const nylon = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.55 });
  const espatula = new THREE.Mesh(new THREE.BoxGeometry(110, 4, 9), nylon);
  espatula.position.set(-95, MESA_Y + 2, -230);
  espatula.rotation.y = 0.5;
  g.add(espatula);
  const palheta = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.8, 3), new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.35, transparent: true, opacity: 0.85 }));
  palheta.position.set(40, MESA_Y + 0.4, -200);
  palheta.rotation.y = 0.9;
  g.add(palheta);
  const chave = new THREE.Group();
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 80, 6), new THREE.MeshStandardMaterial({ color: 0xff5b24, roughness: 0.4 }));
  cabo.rotation.z = Math.PI / 2;
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 60, 12), new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.25, metalness: 1 }));
  haste.rotation.z = Math.PI / 2;
  haste.position.x = 70;
  chave.add(cabo, haste);
  chave.position.set(70, MESA_Y + 6, -330);
  chave.rotation.y = -0.35;
  g.add(chave);
}

function caneca(g) {
  const ceramica = new THREE.MeshPhysicalMaterial({ color: 0xece8e0, roughness: 0.25, clearcoat: 0.6 });
  const c = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(42, 40, 96, 48, 1, true), ceramica);
  corpo.position.y = 48;
  const dentro = new THREE.Mesh(new THREE.CylinderGeometry(38.5, 37, 92, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9d4ca, roughness: 0.4, side: THREE.BackSide }));
  dentro.position.y = 50;
  const fundo = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 4, 48), ceramica);
  fundo.position.y = 2;
  const cafe = new THREE.Mesh(new THREE.CircleGeometry(38.5, 48), new THREE.MeshStandardMaterial({ color: 0x2a160c, roughness: 0.15 }));
  cafe.rotation.x = -Math.PI / 2;
  cafe.position.y = 78;
  const borda = new THREE.Mesh(new THREE.TorusGeometry(40.3, 1.8, 10, 48), ceramica);
  borda.rotation.x = Math.PI / 2;
  borda.position.y = 96;
  const alca = new THREE.Mesh(new THREE.TorusGeometry(20, 4, 12, 32, Math.PI * 1.25), ceramica);
  alca.position.set(-44, 50, 0);
  alca.rotation.z = Math.PI * 0.62;
  c.add(corpo, dentro, fundo, cafe, borda, alca);
  c.position.set(170, MESA_Y, -480);
  g.add(c);
}

// Organizador de gavetinhas com peças, à direita.
function organizador(g) {
  const plastico = new THREE.MeshStandardMaterial({ color: 0x2c3136, roughness: 0.6 });
  const o = new THREE.Group();
  o.add(caixa(260, 180, 140, plastico, 0, 90, 0));
  const cores = [0xe5e8ea, 0xd6dde2, 0xe9e2d4];
  for (let l = 0; l < 3; l++) {
    for (let k = 0; k < 4; k++) {
      const gaveta = caixa(58, 50, 4, new THREE.MeshStandardMaterial({ color: cores[(l + k) % 3], roughness: 0.4, transparent: true, opacity: 0.8 }), -96 + k * 64, 34 + l * 56, 71);
      o.add(gaveta);
      o.add(caixa(16, 4, 4, plastico, -96 + k * 64, 34 + l * 56 - 16, 74));
    }
  }
  o.position.set(330, MESA_Y, -760);
  o.rotation.y = -0.3;
  g.add(o);
}

// Luminária de braço com lâmpada quente: é a luz que ilumina a bancada, e vira
// bolinha de bokeh quando o foco está perto.
function luminaria(g) {
  const metal = new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.35, metalness: 0.8 });
  const l = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(70, 76, 18, 40), metal);
  base.position.y = 9;
  const braco1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 380, 12), metal);
  braco1.position.set(40, 190, 0);
  braco1.rotation.z = -0.22;
  const braco2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 320, 12), metal);
  braco2.position.set(170, 400, 0);
  braco2.rotation.z = 1.05;
  const cupula = new THREE.Mesh(new THREE.CylinderGeometry(22, 80, 110, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide }));
  cupula.position.set(300, 430, 0);
  cupula.rotation.z = 0.5;
  const lampada = new THREE.Mesh(new THREE.SphereGeometry(26, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 9.5, 5.2) }));
  lampada.position.set(318, 400, 0);
  l.add(base, braco1, braco2, cupula, lampada);
  const luz = new THREE.PointLight(0xffb36b, 2.6e5, 0, 2);
  luz.position.set(330, 370, 0);
  l.add(luz);
  l.position.set(-520, MESA_Y, -900);
  g.add(l);
}

// A parede do fundo: placa perfurada com ferramenta pendurada e a janela.
function parede(g) {
  const perfurada = canvasTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#b89a74';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(40,28,18,0.75)';
      for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [9, 4]
  );
  const mat = new THREE.MeshStandardMaterial({ map: perfurada, roughness: 0.85 });
  // A parede tem um buraco pra janela: quatro painéis em volta dele.
  // A janela fica no eixo das lentes, com o horizonte dentro: a tele a 4× e 8× olha pra ela.
  const J = { x0: -430, x1: 430, y0: -50, y1: 640 };
  const TOPO = 1400;
  const BAIXO = MESA_Y - 800;
  const ESQ = -2400;
  const DIR = 2400;
  const painel = (x0, x1, y0, y1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, PAREDE_Z);
    g.add(m);
  };
  painel(ESQ, J.x0, BAIXO, TOPO);
  painel(J.x1, DIR, BAIXO, TOPO);
  painel(J.x0, J.x1, J.y1, TOPO);
  painel(J.x0, J.x1, BAIXO, J.y0);
  // Batente e cruzeta da janela.
  const batente = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.4 });
  const e = 26;
  g.add(caixa(J.x1 - J.x0 + e * 2, e, 60, batente, (J.x0 + J.x1) / 2, J.y1 + e / 2, PAREDE_Z));
  g.add(caixa(J.x1 - J.x0 + e * 2, e, 60, batente, (J.x0 + J.x1) / 2, J.y0 - e / 2, PAREDE_Z));
  g.add(caixa(e, J.y1 - J.y0, 60, batente, J.x0 - e / 2, (J.y0 + J.y1) / 2, PAREDE_Z));
  g.add(caixa(e, J.y1 - J.y0, 60, batente, J.x1 + e / 2, (J.y0 + J.y1) / 2, PAREDE_Z));
  // Travessa alta (fora do eixo, pra não cortar a vista da tele).
  g.add(caixa(J.x1 - J.x0, 14, 30, batente, (J.x0 + J.x1) / 2, J.y1 - 150, PAREDE_Z));
  // Ferramentas penduradas na placa, à esquerda da janela.
  const cores = [0xff5b24, 0x1d1f22, 0x3a7bd5, 0xc9cdd2];
  for (let k = 0; k < 7; k++) {
    const alicate = caixa(22, 150 + (k % 3) * 40, 10, new THREE.MeshStandardMaterial({ color: cores[k % 4], roughness: 0.45, metalness: k % 4 === 3 ? 1 : 0.2 }), -1080 + k * 90, 380 - (k % 3) * 20, PAREDE_Z + 12);
    g.add(alicate);
  }
  // Prateleira à direita da janela com caixas de peças.
  const madeira = new THREE.MeshStandardMaterial({ color: 0x5b4431, roughness: 0.7 });
  g.add(caixa(900, 18, 220, madeira, 1000, 120, PAREDE_Z + 110));
  const caixinhas = [0x36506b, 0xd9d2c3, 0x7a2f2a, 0x2f3a33];
  for (let k = 0; k < 4; k++) g.add(caixa(160, 110 + (k % 2) * 40, 150, new THREE.MeshStandardMaterial({ color: caixinhas[k % 4], roughness: 0.7 }), 660 + k * 210, 185 + (k % 2) * 20, PAREDE_Z + 110));
}

// ---------- lá fora: céu de fim de tarde e prédios acendendo ----------
function janelasAcesas(semente) {
  return canvasTex(256, 512, (ctx, w, h) => {
    const r = aleatorio(semente);
    ctx.fillStyle = '#0d1016';
    ctx.fillRect(0, 0, w, h);
    for (let y = 10; y < h - 8; y += 20) {
      for (let x = 8; x < w - 8; x += 18) {
        const v = r();
        if (v < 0.58) continue;
        ctx.fillStyle = v > 0.9 ? '#cfe4ff' : v > 0.7 ? '#ffd9a0' : '#ffb867';
        ctx.globalAlpha = 0.45 + r() * 0.55;
        ctx.fillRect(x, y, 10, 11);
      }
    }
    ctx.globalAlpha = 1;
  });
}

function cidade(g) {
  // Céu: um domo grande com o degradê do crepúsculo.
  const ceu = canvasTex(8, 512, (ctx, w, h) => {
    const d = ctx.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, '#0e1a33');
    d.addColorStop(0.42, '#2d3f6b');
    d.addColorStop(0.5, '#7b5b73');
    d.addColorStop(0.535, '#e28a5a');
    d.addColorStop(0.56, '#f3b26b');
    d.addColorStop(1, '#3a2a2a');
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, w, h);
  });
  const domo = new THREE.Mesh(new THREE.SphereGeometry(2.4e6, 32, 24), new THREE.MeshBasicMaterial({ map: ceu, side: THREE.BackSide, color: new THREE.Color(1.2, 1.2, 1.2) }));
  domo.userData.fundo = true;
  g.add(domo);

  const r = aleatorio(5);
  const texs = [janelasAcesas(3), janelasAcesas(8), janelasAcesas(13)];
  const chao = MESA_Y - 12000; // a oficina fica num 4º andar
  for (let k = 0; k < 60; k++) {
    const dist = 280000 + r() * 900000;
    const ang = -0.34 + r() * 0.95;
    const x = Math.sin(ang) * dist;
    const z = -Math.cos(ang) * dist;
    const largura = 16000 + r() * 26000;
    const altura = 12000 + r() * 42000 * (1 - dist / 1500000);
    const t = texs[k % 3].clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(largura / 22000, altura / 40000);
    const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(2.4, 2.4, 2.4) });
    const predio = caixa(largura, altura, largura * 0.8, m, x, chao + altura / 2, z);
    predio.rotation.y = -ang;
    g.add(predio);
  }
  // A torre com a luz vermelha de aviação — alvo bom pra 8×.
  const torre = caixa(2400, 30000, 2400, new THREE.MeshBasicMaterial({ color: 0x0b0d12 }), 3500, chao + 15000, -220000);
  g.add(torre);
  const luzVermelha = new THREE.Mesh(new THREE.SphereGeometry(450, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(28, 2, 1.5) }));
  luzVermelha.position.set(3500, chao + 30400, -220000);
  g.add(luzVermelha);
  return { luzVermelha };
}

export function construirCenario() {
  const g = new THREE.Group();
  g.name = 'oficina';
  const mundo = new THREE.Group();
  mundo.rotation.x = INCLINACAO;
  g.add(mundo);

  // A bancada: tampo escuro e a mesma manta de silicone, com grade de 5 mm.
  const grade = texturaDeGrade(512, 100);
  grade.repeat.set(9, 7);
  const manta = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshStandardMaterial({ map: grade, roughness: 0.9 }));
  manta.rotation.x = -Math.PI / 2;
  manta.position.set(0, MESA_Y, -300);
  mundo.add(manta);
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(3000, 40, 1700), new THREE.MeshStandardMaterial({ color: 0x2a2e31, roughness: 0.8 }));
  tampo.position.set(0, MESA_Y - 20.5, -750);
  mundo.add(tampo);

  parafusos(mundo);
  ferramentas(mundo);
  caneca(mundo);
  organizador(mundo);
  luminaria(mundo);
  parede(mundo);
  const fora = cidade(mundo);

  // Luz do fim de tarde entrando pela janela, e um céu fraquinho.
  const janela = new THREE.DirectionalLight(0x9fb4e0, 0.8);
  janela.position.set(200, 900, -2400);
  mundo.add(janela);
  mundo.add(janela.target);
  mundo.add(new THREE.HemisphereLight(0x8594b4, 0x2a2420, 0.38));

  g.traverse((o) => {
    o.layers.set(CAMADA_FOTO);
    // A névoa da vista principal não entra na foto.
    if (o.material) o.material.fog = false;
    // Só metal e cerâmica refletem o estúdio da vista principal.
    const m = o.material;
    if (o.isMesh && m && 'envMapIntensity' in m && m.metalness < 0.5) m.envMapIntensity = 0.15;
  });

  return {
    grupo: g,
    atualizar(tempo, reduzir) {
      // A luz de aviação pisca devagar.
      const aceso = reduzir || Math.sin(tempo * 2.2) > 0.2;
      fora.luzVermelha.visible = aceso;
    },
  };
}
