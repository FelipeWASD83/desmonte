// Confere a óptica contra o que as fontes publicam. Roda com `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../js/optica.js';

const { ultra, principal, tele } = O.CAMERAS;
const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} longe de ${b} (±${tol})`);

test('focal real da principal fica perto de 6,8 mm', () => {
  perto(O.focalReal(principal), 6.8, 0.05, 'focal da principal');
});

test('furo em f/1,48 dá os 4,6 mm que o iFixit mediu', () => {
  perto(O.diametroDaAbertura(principal, 1.48), 4.6, 0.05, 'diâmetro em f/1,48');
});

test('f/1,48 deixa entrar ~7,3× mais luz que f/4 (número do iFixit)', () => {
  perto(O.luzRelativa(1.48, 4.0), 7.3, 0.05, 'luz relativa');
});

test('o sensor de 1/1,28" dá o pixel de 1,22 µm que a Apple publica', () => {
  perto(O.pixelEmMicra(principal), 1.22, 0.01, 'pixel da principal');
  perto(O.pixelEmMicra(principal) * 2, principal.pixelQuad, 0.02, 'quad-pixel da principal');
});

test('o sensor de 1/2,55" da ultra dá o quad-pixel de 1,4 µm da Apple', () => {
  perto(O.pixelEmMicra(ultra) * 2, ultra.pixelQuad, 0.02, 'quad-pixel da ultra');
});

test('a ultra enxerga perto dos 120° da Apple na diagonal', () => {
  perto(O.campoDeVisao(ultra).diagonal, 120, 3, 'campo da ultra');
});

test('2× e 8× são recorte: dobram a focal equivalente (48 e 200 mm)', () => {
  assert.equal(O.focalEquivalente(principal, 2), 48);
  assert.equal(O.focalEquivalente(tele, 2), 200);
  const inteiro = O.campoDeVisao(principal, 1).horizontal;
  const recortado = O.campoDeVisao(principal, 2).horizontal;
  // Quem cai pela metade é a tangente do meio-ângulo, não o ângulo.
  const tg = (graus) => Math.tan((graus * Math.PI) / 360);
  perto(tg(recortado), tg(inteiro) / 2, 1e-9, 'tangente do meio-ângulo');
});

test('a focal equivalente volta pela diagonal do full frame', () => {
  for (const cam of [ultra, principal, tele]) {
    perto(O.focalReal(cam) * O.fatorDeCorte(cam), cam.equivalente, 1e-9, cam.id);
  }
});

test('a tele não cabe reta no celular: por isso o prisma', () => {
  assert.ok(O.caminhoDaTele() > O.ESPESSURA_DO_CELULAR * 1.5);
});

test('foco no infinito: ponto no infinito sai nítido e perto sai borrado', () => {
  const f = O.focalReal(principal);
  assert.equal(O.circuloDeConfusao({ f, N: 1.48, foco: Infinity, objeto: Infinity }), 0);
  assert.ok(O.circuloDeConfusao({ f, N: 1.48, foco: Infinity, objeto: 300 }) > O.cocAceitavel(principal));
});

test('fechar a abertura aumenta a faixa nítida', () => {
  const f = O.focalReal(principal);
  const c = O.cocAceitavel(principal);
  const aberta = O.profundidadeDeCampo({ f, N: 1.48, foco: 400, c });
  const fechada = O.profundidadeDeCampo({ f, N: 4, foco: 400, c });
  assert.ok(fechada.perto < aberta.perto && fechada.longe > aberta.longe);
  assert.ok(aberta.perto < 400 && aberta.longe > 400);
});

test('foco na hiperfocal vai até o infinito', () => {
  const f = O.focalReal(principal);
  const c = O.cocAceitavel(principal);
  const H = O.hiperfocal(f, 2.8, c);
  assert.equal(O.profundidadeDeCampo({ f, N: 2.8, foco: H, c }).longe, Infinity);
});

test('exposição: o tempo nunca passa de 1/25 s, o ISO compensa', () => {
  const a = O.exposicao(1.48);
  const b = O.exposicao(4);
  assert.equal(a.iso, 125);
  assert.ok(b.segundos <= 1 / 25 + 1e-12);
  perto((b.iso / a.iso) * (b.segundos / a.segundos), O.luzRelativa(1.48, 4), 0.1, 'luz total compensada');
});

test('as 6 lâminas fazem um hexágono do tamanho do furo', () => {
  const forma = O.formaDaAbertura(2.8);
  assert.equal(forma.pontos.length, 6);
  perto(forma.raioInscrito * 2, O.diametroDaAbertura(principal, 2.8), 1e-9, 'raio inscrito');
  assert.equal(forma.redonda, false);
  assert.equal(O.formaDaAbertura(1.48).redonda, true);
});

test('estabilização corta o rastro do tremor a um décimo', () => {
  const sem = O.rastroDoTremor(principal, 1, 1 / 25, { ois: false });
  const com = O.rastroDoTremor(principal, 1, 1 / 25, { ois: true });
  assert.ok(sem > 2, `sem OIS o rastro devia aparecer: ${sem}`);
  perto(com / sem, O.SOBRA_COM_OIS, 1e-9, 'sobra');
});

test('respiro de foco: focar perto fecha o campo um pouco', () => {
  assert.ok(O.campoDeVisao(principal, 1, 150).horizontal < O.campoDeVisao(principal, 1, Infinity).horizontal);
});
