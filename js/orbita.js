// Controle de órbita próprio (veio da `abertura`): o three guardado não traz o
// OrbitControls. Arrastar gira, roda ou pinça aproxima, e dá pra mandar a
// câmera ir pra um ponto com transição macia (é assim que ela chega em cada
// peça). Aqui a câmera nunca desce abaixo da bancada.
import * as THREE from 'three';

export class Orbita {
  constructor(camera, elemento) {
    this.camera = camera;
    this.elemento = elemento;
    this.alvo = new THREE.Vector3();
    this.theta = -0.95; // em volta de y
    this.phi = 1.18; // do polo
    this.distancia = 420;
    this.alvoDestino = null;
    this.estadoDestino = null;
    this.minDist = 70;
    this.maxDist = 900;
    this.velocidade = { theta: 0, phi: 0 };
    this.arrastando = false;
    this.ponteiros = new Map();
    this.moveu = 0;
    this.ocioso = 0;
    this.phiMaximo = 1.48; // não passa pra baixo da manta
    this._ligar();
  }

  _ligar() {
    const el = this.elemento;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.arrastando = true;
      this.moveu = 0;
      this.ocioso = 0;
      this.estadoDestino = null;
    });
    el.addEventListener('pointermove', (e) => {
      const anterior = this.ponteiros.get(e.pointerId);
      if (!anterior) return;
      const dx = e.clientX - anterior.x;
      const dy = e.clientY - anterior.y;
      if (this.ponteiros.size === 2) {
        // Pinça nunca é clique: sem isso, soltar os dois dedos virava dois toques
        // e desmarcava a peça, jogando a câmera de volta pra longe.
        this.moveu = Infinity;
        const [a, b] = [...this.ponteiros.values()];
        const antes = Math.hypot(a.x - b.x, a.y - b.y);
        this.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [c, d] = [...this.ponteiros.values()];
        const depois = Math.hypot(c.x - d.x, c.y - d.y);
        if (antes > 0) this.zoom(antes / depois);
        return;
      }
      this.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.moveu += Math.abs(dx) + Math.abs(dy);
      this.velocidade.theta = -dx * 0.006;
      this.velocidade.phi = -dy * 0.006;
      this.theta += this.velocidade.theta;
      this.phi = THREE.MathUtils.clamp(this.phi + this.velocidade.phi, 0.12, this.phiMaximo);
    });
    const soltar = (e) => {
      this.ponteiros.delete(e.pointerId);
      if (this.ponteiros.size === 0) this.arrastando = false;
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.estadoDestino = null;
        this.ocioso = 0;
        this.zoom(Math.exp(e.deltaY * 0.0012));
      },
      { passive: false }
    );
  }

  zoom(fator) {
    this.distancia = THREE.MathUtils.clamp(this.distancia * fator, this.minDist, this.maxDist);
  }

  // Leva a câmera pra um enquadramento, sem pulo.
  irPara({ alvo, theta = this.theta, phi = this.phi, distancia = this.distancia, minDist = null }) {
    // Em tela em pé o enquadramento passa do limite; o limite do zoom acompanha, senão a primeira rolagem dava um pulo.
    this.maxDist = Math.max(1600, distancia * 1.15);
    if (minDist !== null) this.minDist = minDist;
    // Pega o caminho curto em volta do eixo, senão ela dá uma volta inteira.
    let t = theta;
    while (t - this.theta > Math.PI) t -= Math.PI * 2;
    while (t - this.theta < -Math.PI) t += Math.PI * 2;
    this.estadoDestino = { alvo: alvo.clone(), theta: t, phi, distancia };
  }

  atualizar(dt, { respirar = true } = {}) {
    const k = 1 - Math.exp(-dt * 4.2);
    if (this.estadoDestino) {
      const d = this.estadoDestino;
      this.alvo.lerp(d.alvo, k);
      this.theta += (d.theta - this.theta) * k;
      this.phi += (d.phi - this.phi) * k;
      this.distancia += (d.distancia - this.distancia) * k;
      if (this.alvo.distanceTo(d.alvo) < 0.05 && Math.abs(d.theta - this.theta) < 1e-3 && Math.abs(d.distancia - this.distancia) < 0.1) {
        this.estadoDestino = null;
      }
    } else if (!this.arrastando) {
      // Inércia depois de soltar, e um balanço bem lento quando ninguém mexe há um tempo.
      this.theta += this.velocidade.theta;
      this.phi = THREE.MathUtils.clamp(this.phi + this.velocidade.phi, 0.12, this.phiMaximo);
      this.velocidade.theta *= Math.exp(-dt * 5);
      this.velocidade.phi *= Math.exp(-dt * 5);
      this.ocioso += dt;
      if (respirar && this.ocioso > 6) this.theta += dt * 0.045;
    }
    const s = Math.sin(this.phi);
    this.camera.position.set(
      this.alvo.x + this.distancia * s * Math.sin(this.theta),
      this.alvo.y + this.distancia * Math.cos(this.phi),
      this.alvo.z + this.distancia * s * Math.cos(this.theta)
    );
    this.camera.lookAt(this.alvo);
  }

  // Clique de verdade (não arrasto) — quem escolhe peça usa isso.
  foiClique() {
    return this.moveu < 6;
  }
}
