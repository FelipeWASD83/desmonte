// Materiais e texturas do celular. Toda textura é desenhada em canvas aqui
// mesmo, nada baixado. Cada chamada devolve material novo: cada peça acende
// sozinha quando é escolhida, sem arrastar as outras junto.
import * as THREE from 'three';

export function textura(largura, altura, desenhar, { repetir = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  desenhar(c.getContext('2d'), largura, altura);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repetir);
  }
  t.anisotropy = 8;
  return t;
}

// Semente fixa: o que é "aleatório" sai igual toda vez que abre.
export function aleatorio(semente) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// A trama da malha térmica: argolas encaixadas, como cota de malha.
const MALHA = textura(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#6b6e72';
  ctx.fillRect(0, 0, w, h);
  const passo = 16;
  for (let y = -passo; y < h + passo; y += passo * 0.8) {
    const linha = Math.round(y / (passo * 0.8));
    for (let x = -passo; x < w + passo; x += passo) {
      const cx = x + (linha % 2 ? passo / 2 : 0);
      ctx.beginPath();
      ctx.arc(cx, y, passo * 0.55, 0, Math.PI * 2);
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#2a2c2f';
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#d7dade';
      ctx.stroke();
    }
  }
});
MALHA.wrapS = MALHA.wrapT = THREE.RepeatWrapping;

// Os pilares por dentro da câmara de vapor aparecem de leve na chapa.
const CHAPA_VAPOR = textura(512, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#8c9197';
  ctx.fillRect(0, 0, w, h);
  const r = aleatorio(3);
  for (let k = 0; k < 900; k++) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`;
    ctx.fillRect(0, r() * h, w, 1);
  }
  for (let y = 24; y < h; y += 34) {
    for (let x = 24; x < w; x += 34) {
      const g = ctx.createRadialGradient(x, y, 1, x, y, 9);
      g.addColorStop(0, 'rgba(40,44,48,0.22)');
      g.addColorStop(1, 'rgba(40,44,48,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 10, y - 10, 20, 20);
    }
  }
});

// Etiqueta da bateria: só os números que as fontes publicaram.
const ETIQUETA_BATERIA = textura(1024, 512, (ctx, w, h) => {
  ctx.fillStyle = '#1d1f22';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#cfd3d7';
  ctx.font = '600 58px "JetBrains Mono", monospace';
  ctx.fillText('Li-ion', 70, 150);
  ctx.font = '400 44px "JetBrains Mono", monospace';
  ctx.fillText('5567 mAh', 70, 250);
  ctx.fillText('21.751 Wh', 70, 320);
  ctx.fillStyle = 'rgba(207,211,215,0.55)';
  ctx.font = '400 30px "JetBrains Mono", monospace';
  ctx.fillText('adesivo de liberação elétrica', 70, 410);
});

// A tampa do A20 Pro.
const TAMPA_A20 = textura(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#16171a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(210,214,220,0.8)';
  ctx.font = '600 38px "Archivo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A20', w / 2, 118);
  ctx.font = '500 30px "Archivo", sans-serif';
  ctx.fillText('PRO', w / 2, 160);
  ctx.font = '400 16px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(210,214,220,0.45)';
  ctx.fillText('N2 · 2 nm', w / 2, 204);
});

// Espiral de cobre da bobina.
const ESPIRAL = textura(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#1a1411';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  ctx.lineWidth = 5;
  for (let r = 70; r < 250; r += 9) {
    ctx.strokeStyle = r % 2 ? '#c27a45' : '#b06a38';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
});

// Grade do alto-falante.
const TELA_FALANTE = textura(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#0d0e10';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#34373c';
  for (let y = 4; y < h; y += 8) for (let x = (y / 8) % 2 ? 8 : 4; x < w; x += 8) ctx.fillRect(x, y, 3, 3);
});
TELA_FALANTE.wrapS = TELA_FALANTE.wrapT = THREE.RepeatWrapping;

// O grão do jateado: ruído fino que vira mapa de aspereza e de relevo. Sem
// ele o alumínio parece plástico liso; com ele, o reflexo se quebra em
// microbrilho, como no aparelho. Mapa em milímetro (UV das peças é em mm).
const GRAO = textura(
  1024,
  1024,
  (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const r = aleatorio(71);
    for (let i = 0; i < w * h; i++) {
      // Duas escalas de grão: um fino por pixel e um mais largo, suave.
      const v = 150 + (r() - 0.5) * 120;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.globalAlpha = 0.05;
    for (let k = 0; k < 900; k++) {
      ctx.fillStyle = r() > 0.5 ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 2 + r() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  { srgb: false }
);
GRAO.wrapS = GRAO.wrapT = THREE.RepeatWrapping;
GRAO.repeat.set(1 / 6, 1 / 6); // um ladrilho a cada 6 mm

// Os anéis dos elementos que aparecem dentro da lente, embaixo da safira.
const OLHO = textura(512, 512, (ctx, w, h) => {
  const c = w / 2;
  const fundo = ctx.createRadialGradient(c, c, 4, c, c, c);
  fundo.addColorStop(0, '#05070a');
  fundo.addColorStop(0.55, '#0b1016');
  fundo.addColorStop(0.8, '#141a22');
  fundo.addColorStop(1, '#07090c');
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, w, h);
  const aneis = [0.97, 0.9, 0.78, 0.64, 0.5, 0.36];
  aneis.forEach((f, i) => {
    ctx.strokeStyle = i % 2 ? 'rgba(120,150,200,0.22)' : 'rgba(200,210,230,0.16)';
    ctx.lineWidth = i === 0 ? 10 : 3;
    ctx.beginPath();
    ctx.arc(c, c, f * c, 0, Math.PI * 2);
    ctx.stroke();
  });
  // O diafragma lá no fundo e o elemento central.
  ctx.fillStyle = '#020304';
  ctx.beginPath();
  ctx.arc(c, c, 0.28 * c, 0, Math.PI * 2);
  ctx.fill();
  // Os reflexos azul e roxo do tratamento antirreflexo dos elementos.
  const brilho = (x, y, r, cor) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, cor);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  brilho(c * 0.86, c * 0.8, c * 0.34, 'rgba(90,110,230,0.55)');
  brilho(c * 1.12, c * 1.14, c * 0.22, 'rgba(150,90,210,0.35)');
  brilho(c * 0.9, c * 0.84, c * 0.07, 'rgba(210,225,255,0.85)');
});

// A lente Fresnel do flash: anéis finos num branco leitoso.
const FRESNEL = textura(256, 256, (ctx, w, h) => {
  const c = w / 2;
  ctx.fillStyle = '#e9e8e2';
  ctx.fillRect(0, 0, w, h);
  for (let r = 6; r < c; r += 7) {
    ctx.strokeStyle = `rgba(120,118,110,${0.18 + (r / c) * 0.25})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // O LED amarelado no meio.
  ctx.fillStyle = '#f2dd9c';
  ctx.fillRect(c - 22, c - 22, 44, 44);
});

// Todos os materiais de alumínio e de vidro traseiro, pra trocar a cor de uma vez.
export const PINTADOS = { aluminio: [], vidro: [], anel: [], antena: [] };

export const M = {
  aluminio: () => {
    // Anodizado: metal por baixo de uma camada tingida. Metálico de menos o
    // bastante pra cor aparecer com a luz, e não só o reflexo do estúdio.
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x34353a,
      metalness: 0.6,
      roughness: 0.46,
      roughnessMap: GRAO,
      bumpMap: GRAO,
      bumpScale: 0.15,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      specularIntensity: 0.9,
    });
    PINTADOS.aluminio.push(m);
    return m;
  },
  // Os anéis das lentes são polidos, um pouco mais brilhantes que o resto.
  anel: () => {
    const m = new THREE.MeshPhysicalMaterial({ color: 0x34353a, metalness: 0.78, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.06 });
    PINTADOS.anel.push(m);
    return m;
  },
  vidroTraseiro: () => {
    // Vidro jateado: fosco por fora (o grão espalha o reflexo), com uma camada
    // lisa por cima que ainda pega a luz de raspão.
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x2c2d31,
      metalness: 0.05,
      roughness: 0.62,
      roughnessMap: GRAO,
      clearcoat: 0.55,
      clearcoatRoughness: 0.38,
      sheen: 0.12,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0xffffff),
      specularIntensity: 1,
    });
    PINTADOS.vidro.push(m);
    return m;
  },
  vidroPreto: () => new THREE.MeshPhysicalMaterial({ color: 0x050507, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 }),
  // Vidro de lente: só o reflexo, somado ao que está atrás (como na `abertura`).
  lente: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x0c1418,
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.8,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [230, 420],
      envMapIntensity: 2.4,
    }),
  flash: () => new THREE.MeshPhysicalMaterial({ map: FRESNEL, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
  aroFlash: () => new THREE.MeshPhysicalMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.12, clearcoat: 1 }),
  // As linhas de antena: plástico fosco puxado pro tom do alumínio (a cor sai do pintar()).
  antena: () => {
    const m = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    PINTADOS.antena.push(m);
    return m;
  },
  olhoDeLente: () => new THREE.MeshPhysicalMaterial({ map: OLHO, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.9, iridescenceIOR: 1.4, iridescenceThicknessRange: [240, 460], envMapIntensity: 1.6 }),
  reflexo: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.9,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  oled: () => new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.6, metalness: 0.3 }),
  plasticoBranco: () => new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.55 }),
  plasticoPreto: () => new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.6 }),
  aco: () => new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: 0.32, metalness: 1 }),
  acoEscuro: () => new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.4, metalness: 0.9 }),
  chapaVapor: () => new THREE.MeshStandardMaterial({ map: CHAPA_VAPOR, color: 0xd9dde1, roughness: 0.3, metalness: 0.95 }),
  malha: () => {
    const t = MALHA.clone();
    t.repeat.set(2.5, 2.5);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.9, color: 0xe8eaee });
  },
  pcb: () => new THREE.MeshStandardMaterial({ color: 0x102722, roughness: 0.5, metalness: 0.2 }),
  blindagem: () => new THREE.MeshStandardMaterial({ color: 0xb4b9be, roughness: 0.42, metalness: 0.75 }),
  chip: () => new THREE.MeshStandardMaterial({ color: 0x151619, roughness: 0.35, metalness: 0.3 }),
  a20: () => new THREE.MeshStandardMaterial({ map: TAMPA_A20, roughness: 0.3, metalness: 0.4 }),
  ouro: () => new THREE.MeshStandardMaterial({ color: 0xd9a95a, roughness: 0.25, metalness: 1 }),
  cobre: () => new THREE.MeshStandardMaterial({ map: ESPIRAL, roughness: 0.35, metalness: 0.9, color: 0xffffff }),
  ima: () => new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.3, metalness: 0.85 }),
  ferrite: () => new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.8 }),
  bateria: () => new THREE.MeshStandardMaterial({ map: ETIQUETA_BATERIA, roughness: 0.5, metalness: 0.2 }),
  bandeja: () => new THREE.MeshStandardMaterial({ color: 0xa9aeb4, roughness: 0.38, metalness: 1 }),
  // Os flex são de poliimida: aquele âmbar translúcido que aparece em todo desmonte.
  flex: () => new THREE.MeshStandardMaterial({ color: 0xb8742a, roughness: 0.4, metalness: 0.15 }),
  falante: () => {
    const t = TELA_FALANTE.clone();
    t.repeat.set(3, 1.2);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0.2 });
  },
  sensor: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x2a1f3c,
      roughness: 0.16,
      metalness: 0.55,
      iridescence: 1,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [280, 760],
    }),
  laminas: () => new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide }),
  prisma: () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x0e1c22,
      roughness: 0.02,
      metalness: 0,
      clearcoat: 1,
      iridescence: 0.4,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  safira: () => new THREE.MeshPhysicalMaterial({ color: 0x17181b, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03 }),
  // A tela mostra a saída do sensor como ela é: os bytes já estão em sRGB,
  // então vão direto pro canvas, sem conversão nem névoa.
  tela: (mapa) =>
    new THREE.ShaderMaterial({
      uniforms: { mapa: { value: mapa } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D mapa; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(mapa, vUv).rgb, 1.0); }',
    }),
};

// Troca a cor do celular inteiro.
export function pintar(acabamento) {
  for (const m of PINTADOS.aluminio) m.color.setHex(acabamento.aluminio);
  for (const m of PINTADOS.anel) m.color.setHex(acabamento.aluminio);
  for (const m of PINTADOS.vidro) m.color.setHex(acabamento.vidro);
  // A antena é o alumínio puxado pro cinza: clara no preto, mais escura no prata.
  const antena = new THREE.Color(acabamento.aluminio).lerp(new THREE.Color(0x8c8c8c), 0.45);
  for (const m of PINTADOS.antena) m.color.copy(antena);
}
