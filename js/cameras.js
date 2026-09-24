// Os módulos das três câmeras de trás e o do flash/LiDAR.
//
// Cada câmera tem as partes que se separam no modo câmeras (corpo, sensor no
// carrinho da estabilização, barril de lentes, e na principal as 6 lâminas) e
// o caminho da luz desenhado por dentro. Coordenadas do celular (ver
// aparelho.js): a luz vem de fora das costas (z negativo) e anda pra +z até o
// sensor, que olha pra −z.
//
// O que é da Apple: focal, f/, 6 lâminas, 4 reflexões no prisma. O que é
// desenho: o tamanho de cada módulo e a forma do prisma (ninguém publicou).
import * as THREE from 'three';
import { M } from './materiais.js';
import { caixa, cilindro, anel, disco, discoDeCostas, contorno, chapa, furo } from './formas.js';
import * as O from './optica.js';

// Centro de cada lente na ilha e o tamanho dos anéis, medidos na proporção
// das fotos de costas da página da Apple (a largura do celular, 78 mm, é a
// régua): principal em cima, ultra embaixo, tele quase no meio do celular.
export const LENTES = {
  principal: { x: 23, y: 69, raioAnel: 9.2, raioVidro: 7 },
  ultra: { x: 23, y: 49.3, raioAnel: 9.2, raioVidro: 7 },
  tele: { x: 2.5, y: 59, raioAnel: 9.2, raioVidro: 7 },
};
// Flash, LiDAR e microfone, medidos do mesmo jeito.
export const FLASH = { x: -22.5, y: 70.5 };
export const LIDAR = { x: -21, y: 50.5 };
export const MICROFONE = { x: -20.5, y: 60.5 };

const Z_SENSOR = 1.3; // a face do sensor (olhando pra −z)

function paredes(x0, y0, x1, y1, zDe, zAte, material) {
  const g = new THREE.Group();
  const e = 0.6;
  const w = x1 - x0;
  const h = y1 - y0;
  const zc = (zDe + zAte) / 2;
  const d = zAte - zDe;
  g.add(caixa(w, e, d, material, (x0 + x1) / 2, y0 + e / 2, zc, 0.15));
  g.add(caixa(w, e, d, material, (x0 + x1) / 2, y1 - e / 2, zc, 0.15));
  g.add(caixa(e, h - 2 * e, d, material, x0 + e / 2, (y0 + y1) / 2, zc, 0.15));
  g.add(caixa(e, h - 2 * e, d, material, x1 - e / 2, (y0 + y1) / 2, zc, 0.15));
  g.add(caixa(w, h, 0.5, material, (x0 + x1) / 2, (y0 + y1) / 2, zAte + 0.25, 0.15));
  return g;
}

// Sensor no carrinho da estabilização: moldura, pastilha de cerâmica e a área
// ativa iridescente. O lado comprido fica ao longo do celular (foto deitada).
function sensorNoCarrinho(cam, x, y, { largo, alto }) {
  const g = new THREE.Group();
  const s = cam.sensor;
  const moldura = contorno(x - alto / 2, y - largo / 2, x + alto / 2, y + largo / 2, 0.8);
  moldura.holes.push(furo(x - alto / 2 + 0.9, y - largo / 2 + 0.9, x + alto / 2 - 0.9, y + largo / 2 - 0.9, 0.3));
  g.add(chapa(moldura, Z_SENSOR - 0.2, Z_SENSOR + 0.6, M.acoEscuro()));
  g.add(caixa(s.altura + 1.4, s.largura + 1.6, 0.5, M.chip(), x, y, Z_SENSOR + 0.3, 0.1));
  const ativa = new THREE.Mesh(new THREE.PlaneGeometry(s.altura, s.largura), M.sensor());
  ativa.rotation.y = Math.PI; // olhando pra −z, de onde a luz vem
  ativa.position.set(x, y, Z_SENSOR);
  g.add(ativa);
  // As molas de fio que seguram o carrinho e deixam ele deslizar.
  const mola = M.ouro();
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    g.add(caixa(0.25, 2.2, 0.2, mola, x + (dx * alto) / 2, y + (dy * largo) / 2 - dy * 1.3, Z_SENSOR + 0.5, 0.05));
  }
  return { grupo: g, ativa };
}

function barril(x, y, raio, zFrente, zTras, raioVidro) {
  const g = new THREE.Group();
  g.add(cilindro(raio, zFrente, zTras, M.plasticoPreto(), x, y, 48));
  g.add(anel(raio - 0.2, raio + 0.35, zTras - 1.6, zTras - 0.2, M.acoEscuro(), x, y));
  g.add(discoDeCostas(raioVidro, zFrente - 0.01, M.lente(), x, y));
  // Os ímãs do motor de foco (VCM), dois de cada lado.
  const ima = M.ima();
  g.add(caixa(1.2, raio * 1.2, (zTras - zFrente) * 0.55, ima, x - raio - 0.9, y, (zFrente + zTras) / 2 + 0.6, 0.2));
  g.add(caixa(1.2, raio * 1.2, (zTras - zFrente) * 0.55, ima, x + raio + 0.9, y, (zFrente + zTras) / 2 + 0.6, 0.2));
  return g;
}

// As 6 lâminas: cada uma é a região além de um lado do hexágono, dentro do
// anel. Juntas, cobrem o anel menos o furo. Em f/1,48 elas somem no anel.
function diafragma(x, y, z) {
  const g = new THREE.Group();
  const rFora = 3.4;
  g.add(anel(rFora - 0.1, 4.8, z - 0.18, z + 0.18, M.acoEscuro(), x, y, { chanfro: 0.05 }));
  const laminas = new THREE.Group();
  laminas.position.set(x, y, z);
  const material = M.laminas();
  for (let i = 0; i < O.LAMINAS; i++) {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), material);
    m.position.z = -0.12 + i * 0.045;
    laminas.add(m);
  }
  g.add(laminas);
  const passo = (Math.PI * 2) / O.LAMINAS;
  const ajustar = (semi) => {
    const a = Math.min(semi, rFora);
    laminas.children.forEach((m, i) => {
      const phi = -Math.PI / 2 + i * passo;
      const forma = new THREE.Shape();
      const ini = phi - passo / 2;
      const fim = phi + passo / 2 + passo * 0.8;
      const n = 20;
      for (let k = 0; k <= n; k++) {
        const psi = ini + ((fim - ini) * k) / n;
        const d = Math.min(a / Math.cos(psi - phi), rFora);
        const px = d * Math.cos(psi);
        const py = d * Math.sin(psi);
        if (k === 0) forma.moveTo(px, py);
        else forma.lineTo(px, py);
      }
      for (let k = n; k >= 0; k--) {
        const psi = ini + ((fim - ini) * k) / n;
        forma.lineTo(rFora * Math.cos(psi), rFora * Math.sin(psi));
      }
      m.geometry.dispose();
      m.geometry = new THREE.ShapeGeometry(forma);
    });
  };
  return { grupo: g, ajustar, rFora };
}

function linhaDeLuz(cor) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 64), 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.95, depthTest: false });
  const l = new THREE.LineSegments(geo, mat);
  l.renderOrder = 5;
  l.frustumCulled = false;
  l.visible = false;
  l.userData.semSelecao = true;
  return l;
}

// Escreve os segmentos (pares de pontos) na linha.
export function escreverLinha(linha, segmentos) {
  const a = linha.geometry.attributes.position;
  let i = 0;
  for (const [p, q] of segmentos) {
    if (i + 2 > a.count) break;
    a.setXYZ(i++, p.x, p.y, p.z);
    a.setXYZ(i++, q.x, q.y, q.z);
  }
  a.needsUpdate = true;
  linha.geometry.setDrawRange(0, i);
}

function principal() {
  const { x, y } = LENTES.principal;
  const cam = O.CAMERAS.principal;
  const g = new THREE.Group();
  const corpo = paredes(x - 8.2, y - 8.2, x + 8.2, y + 8.2, -3.4, Z_SENSOR + 0.7, M.blindagem());
  const sensor = sensorNoCarrinho(cam, x, y, { largo: 13.2, alto: 10.6 });
  const lentes = barril(x, y, 5.1, -6.4, -1.0, 3.5);
  const iris = diafragma(x, y, -6.8);
  // O flex âmbar que leva a imagem até a placa.
  const flex = caixa(4, 8, 0.15, M.flex(), x - 10.5, y - 2, Z_SENSOR + 1.2, 0.05);
  corpo.add(flex);
  g.add(corpo, sensor.grupo, lentes, iris.grupo);
  const raios = linhaDeLuz(0xff5b24);
  g.add(raios);
  return {
    grupo: g,
    partes: [
      { objeto: corpo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: sensor.grupo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: lentes, camera: new THREE.Vector3(0, 0, -11) },
      { objeto: iris.grupo, camera: new THREE.Vector3(0, 0, -20) },
    ],
    carrinho: sensor.grupo,
    ajustarLaminas: iris.ajustar,
    raios,
    // Três raios paralelos entram pela borda e pelo meio do furo e vão pro
    // centro do sensor. As posições seguem as partes separadas.
    atualizarRaios(N) {
      const semi = O.diametroDaAbertura(cam, N) / 2;
      const zIris = -6.8 + iris.grupo.position.z;
      const zLente = -3.7 + lentes.position.z;
      const zSensor = Z_SENSOR + sensor.grupo.position.z;
      const cs = new THREE.Vector3(x + sensor.grupo.position.x, y + sensor.grupo.position.y, zSensor);
      const seg = [];
      for (const d of [-semi, 0, semi]) {
        const a = new THREE.Vector3(x, y + d, zIris - 16);
        const b = new THREE.Vector3(x, y + d, zIris);
        const c = new THREE.Vector3(x, y + d, zLente);
        seg.push([a, b], [b, c], [c, cs]);
      }
      escreverLinha(raios, seg);
    },
  };
}

function ultra() {
  const { x, y } = LENTES.ultra;
  const cam = O.CAMERAS.ultra;
  const g = new THREE.Group();
  const corpo = paredes(x - 6.6, y - 6.6, x + 6.6, y + 6.6, -3.4, Z_SENSOR + 0.7, M.blindagem());
  const sensor = sensorNoCarrinho(cam, x, y, { largo: 8.6, alto: 7.2 });
  const lentes = barril(x, y, 3.8, -6.4, -0.8, 2.6);
  corpo.add(caixa(3.5, 7, 0.15, M.flex(), x - 8.2, y, Z_SENSOR + 1.2, 0.05));
  g.add(corpo, sensor.grupo, lentes);
  const raios = linhaDeLuz(0xff5b24);
  g.add(raios);
  return {
    grupo: g,
    partes: [
      { objeto: corpo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: sensor.grupo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: lentes, camera: new THREE.Vector3(0, 0, -11) },
    ],
    carrinho: sensor.grupo,
    raios,
    // Na ultra, três feixes passam pelo centro da lente e caem no meio e nas
    // bordas do sensor (esquemático: com as peças separadas, o ângulo não é o real).
    atualizarRaios() {
      const zLente = -3.6 + lentes.position.z;
      const zSensor = Z_SENSOR + sensor.grupo.position.z;
      const meio = cam.sensor.largura / 2;
      const seg = [];
      const semi = O.diametroDaAbertura(cam, 2.2) / 2;
      for (const alvo of [-meio, 0, meio]) {
        // Um feixe que atravessa o centro da lente e cai na borda (ou no meio) do sensor.
        const c = new THREE.Vector3(x, y, zLente);
        const s = new THREE.Vector3(x, y + alvo, zSensor);
        const dir = c.clone().sub(s).normalize();
        const fora = c.clone().addScaledVector(dir, 14);
        for (const d of [-semi, semi]) {
          const off = new THREE.Vector3(0, d, 0);
          seg.push([fora.clone().add(off), c.clone().add(off)], [c.clone().add(off), s]);
        }
      }
      escreverLinha(raios, seg);
    },
  };
}

// A tele: a luz desce pela lente, entra no prisma, quica 4 vezes e deita no
// sensor, que fica de barriga pra baixo no fundo do módulo.
function tele() {
  const { x, y } = LENTES.tele;
  const g = new THREE.Group();
  const corpo = paredes(x - 18, y - 6.2, x + 5.8, y + 6.2, -3.6, 2.45, M.blindagem());
  const lentes = barril(x, y, 3.9, -6.6, -3.7, 2.8);
  const prisma = new THREE.Group();
  // O bloco de vidro (esquemático: a Apple não publicou o formato do prisma).
  const bloco = new THREE.ExtrudeGeometry(
    (() => {
      const s = new THREE.Shape();
      s.moveTo(x - 15.5, -3.0);
      s.lineTo(x + 5.2, -3.0);
      s.lineTo(x + 5.2, 1.9);
      s.lineTo(x - 15.5, 1.9);
      s.lineTo(x - 15.5, -3.0);
      return s;
    })(),
    { depth: 8, bevelEnabled: false }
  );
  // A forma foi desenhada em (x, z): gira pra ela ficar deitada no celular.
  bloco.rotateX(Math.PI / 2);
  bloco.translate(0, y + 4, 0);
  const vidro = new THREE.Mesh(bloco, M.prisma());
  vidro.renderOrder = 3;
  prisma.add(vidro);
  // Arestas do prisma, pra ele não sumir.
  const arestas = new THREE.LineSegments(new THREE.EdgesGeometry(bloco), new THREE.LineBasicMaterial({ color: 0x9fb8c2, transparent: true, opacity: 0.5 }));
  prisma.add(arestas);
  const cam = O.CAMERAS.tele;
  const sensor = sensorNoCarrinho(cam, x - 10.5, y, { largo: 8.6, alto: 7.2 });
  sensor.grupo.position.z = 0.75; // deitado embaixo do prisma (a cena guarda essa posição como base)
  corpo.add(caixa(3.5, 7, 0.15, M.flex(), x - 20, y, 2.3, 0.05));
  g.add(corpo, lentes, prisma, sensor.grupo);
  const raios = linhaDeLuz(0xff5b24);
  g.add(raios);
  // Os pontos do caminho: entrada, 4 reflexões e o sensor.
  const caminho = [
    [x, -24],
    [x, 1.6],
    [x - 3.5, -2.7],
    [x - 7, 1.6],
    [x - 10.5, -2.7],
    [x - 10.5, Z_SENSOR + 0.75],
  ];
  return {
    grupo: g,
    partes: [
      { objeto: corpo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: prisma, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: sensor.grupo, camera: new THREE.Vector3(0, 0, 0) },
      { objeto: lentes, camera: new THREE.Vector3(0, 0, -12) },
    ],
    carrinho: sensor.grupo,
    raios,
    atualizarRaios() {
      const seg = [];
      for (const dy of [-1.2, 0, 1.2]) {
        for (let i = 0; i < caminho.length - 1; i++) {
          const [ax, az] = caminho[i];
          const [bx, bz] = caminho[i + 1];
          seg.push([new THREE.Vector3(ax, y + dy, az), new THREE.Vector3(bx, y + dy, bz)]);
        }
      }
      escreverLinha(raios, seg);
    },
  };
}

function flashLidar() {
  const g = new THREE.Group();
  const cy = (FLASH.y + LIDAR.y) / 2;
  const cx = (FLASH.x + LIDAR.x) / 2;
  // Fino, embaixo da ilha e abaixo da placa.
  g.add(caixa(10, FLASH.y - LIDAR.y + 10, 1.4, M.plasticoPreto(), cx, cy, -2.7, 0.4));
  // LiDAR: emissor e receptor lado a lado.
  g.add(caixa(3, 3, 0.8, M.chip(), LIDAR.x - 1.5, LIDAR.y, -3.7, 0.2));
  g.add(caixa(3, 3, 0.8, M.chip(), LIDAR.x + 1.5, LIDAR.y, -3.7, 0.2));
  g.add(discoDeCostas(1, -4.12, M.lente(), LIDAR.x - 1.5, LIDAR.y));
  g.add(discoDeCostas(1, -4.12, M.lente(), LIDAR.x + 1.5, LIDAR.y));
  // O LED do flash.
  g.add(caixa(4, 4, 0.8, M.chip(), FLASH.x, FLASH.y, -3.7, 0.3));
  g.add(caixa(2.6, 2.6, 0.2, new THREE.MeshStandardMaterial({ color: 0xf4e9c8, roughness: 0.4 }), FLASH.x, FLASH.y, -4.12, 0.1));
  g.add(caixa(4, 14, 0.15, M.flex(), cx, LIDAR.y - 12, -2.0, 0.05));
  return g;
}

export function construirCameras() {
  return { principal: principal(), ultra: ultra(), tele: tele(), flashLidar: flashLidar() };
}
