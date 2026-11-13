// =====================================================
// CONFIGURAÇÕES
// =====================================================
const TOTAL_FOTOS = 55; // quantas fotos tem na pasta "fotos"
const FOTOS = Array.from({ length: TOTAL_FOTOS }, (_, i) => `fotos/foto (${i + 1}).jpeg`);
const DATA_INICIO = "2026-05-13T16:00:00";
const VOLUME_MAXIMO = 0.5;
const DURACAO_VIAGEM = 6000;
const COMECAR_EM = 0; // pular dentro da parte do coração (ms), só pra testar

const COR = "#8a2be2", COR_NUCLEO = "#f1dcff", BRILHO_HALO = 6;
const TOTAL_CONTORNO = 120, TOTAL_DENTRO = 70;
const INTERVALO_CONTORNO = 60, INTERVALO_DENTRO = 110, DURACAO_ENTRADA = 900;
const DURACAO_FLASHES = 6000, TOTAL_CORTES = 51, TRANSPARENCIA_FOTO = 0.45;
const CHANCE_FICAR = 0.18;
const DURACAO_FASE_FOTOS = 25000, DURACAO_FOTO = 3200, TRANSPARENCIA_FOTOS_TELA = 0.3;
const MINIMO_FOTOS_FASE = 30; // com poucas fotos, repete pra preencher (com 50 não repete)

// =====================================================
// BASE
// =====================================================
const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");
const imagens = FOTOS.map((src) => { const i = new Image(); i.src = src; return i; });
const prontas = () => imagens.filter((i) => i.complete && i.naturalWidth > 0);
function embaralhar(lista) {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}
function ajustarTamanho() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", ajustarTamanho);
ajustarTamanho();

let fase = "presente"; // presente → viagem → coracao
let inicioFase = performance.now();

// =====================================================
// 1) PRESENTE
// =====================================================
const cena = document.getElementById("cena");
const presente = document.getElementById("presente");
let giroY = -30, giroX = -18, velocidade = 0.15;
let arrastando = false, moveu = 0, ultimoX = 0, ultimoY = 0;

cena.addEventListener("pointerdown", (e) => { arrastando = true; moveu = 0; ultimoX = e.clientX; ultimoY = e.clientY; cena.setPointerCapture(e.pointerId); });
cena.addEventListener("pointermove", (e) => {
  if (!arrastando) return;
  const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
  moveu += Math.abs(dx) + Math.abs(dy);
  giroY += dx * 0.5;
  giroX = Math.max(-45, Math.min(10, giroX - dy * 0.3));
  velocidade = dx * 0.5;
  ultimoX = e.clientX; ultimoY = e.clientY;
});
cena.addEventListener("pointerup", () => { arrastando = false; if (moveu < 8) abrirPresente(); });
cena.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") abrirPresente(); });

function girarPresente() {
  if (fase !== "presente") return;
  if (!arrastando) {
    // depois de aberto, volta devagar pra uma posição bonita de frente
    const alvo = aberto ? 0.05 : 0.15;
    giroY += velocidade;
    velocidade += (alvo - velocidade) * 0.03;
  }
  presente.style.transform = `translateY(calc(var(--t) * .2)) rotateX(${giroX}deg) rotateY(${giroY}deg)`;
}

// faíscas de luz que saem da caixa
const faiscas = document.getElementById("faiscas");
for (let i = 0; i < 14; i++) {
  const f = document.createElement("span");
  f.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
  f.style.setProperty("--dy", `${-80 - Math.random() * 160}px`);
  f.style.left = `${(Math.random() - 0.5) * 60}px`;
  f.style.top = `${-10 + Math.random() * 20}px`;
  f.style.animationDelay = `${Math.random() * 2.2}s`;
  const s = 3 + Math.random() * 4;
  f.style.width = f.style.height = `${s}px`;
  faiscas.appendChild(f);
}

// =====================================================
// 2) ABRIR
// =====================================================
const musica = document.getElementById("musica");
const botaoSom = document.getElementById("botaoSom");
let aberto = false;

function abrirPresente() {
  if (aberto) return;
  aberto = true;

  musica.volume = 0;
  musica.currentTime = COMECAR_EM / 1000; // acompanha o pulo do modo de teste
  musica.play().then(() => { document.body.classList.add("com-som"); subirVolume(); }).catch(() => {});

  document.body.classList.add("abrindo");                       // tampa sobe e a luz sai
  setTimeout(() => document.body.classList.add("clarao"), 2200); // luz toma a tela
  setTimeout(() => {
    document.getElementById("telaPresente").classList.add("saindo");
    document.getElementById("luz").classList.add("apagar");
    fase = "viagem";
    inicioFase = performance.now();
  }, 3300);
}
function subirVolume() {
  const id = setInterval(() => { musica.volume = Math.min(VOLUME_MAXIMO, musica.volume + 0.01); if (musica.volume >= VOLUME_MAXIMO) clearInterval(id); }, 80);
}
botaoSom.addEventListener("click", () => {
  if (musica.paused) { musica.play(); botaoSom.classList.remove("desligado"); }
  else { musica.pause(); botaoSom.classList.add("desligado"); }
});

// =====================================================
// ESTRELAS: riscos na viagem, pontinhos de espaço no resto
// =====================================================
const estrelas = Array.from({ length: 380 }, () => novaEstrela(true));
function novaEstrela(qualquer) {
  return { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: qualquer ? Math.random() : 1, zAnterior: 1, fase: Math.random() * 6.28, lilas: Math.random() < 0.15 };
}
function projetar(e, z) {
  const escala = Math.max(canvas.width, canvas.height) * 0.5;
  return [canvas.width / 2 + (e.x / z) * escala, canvas.height / 2 + (e.y / z) * escala];
}
function desenharRiscos(vel) {
  for (const e of estrelas) {
    e.zAnterior = e.z; e.z -= vel;
    if (e.z <= 0.01) { Object.assign(e, novaEstrela(false)); continue; }
    const [sx, sy] = projetar(e, e.z), [px, py] = projetar(e, e.zAnterior);
    ctx.strokeStyle = `rgba(225, 195, 255, ${Math.min(1, (1 - e.z) * 1.4)})`;
    ctx.lineWidth = Math.max(0.6, (1 - e.z) * 2.6);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx + 0.1, sy + 0.1); ctx.stroke();
  }
}
// espaço: estrelas piscando e vindo bem devagar na direção da tela
// quantidade e opacidade ajustáveis; dentro do coração ficam ainda mais apagadas
function desenharEspaco(agora, vel, quantidade = estrelas.length, opacidade = 1, apagarNoCoracao = false) {
  ctx.shadowBlur = 0;
  const escala = Math.min(canvas.width, canvas.height) / 40;
  const cx = canvas.width / 2, cy = canvas.height / 2 - escala * 2;

  for (let i = 0; i < quantidade; i++) {
    const e = estrelas[i];
    e.z -= vel;
    if (e.z <= 0.02) { Object.assign(e, novaEstrela(false)); continue; }
    const [sx, sy] = projetar(e, e.z);
    if (sx < -10 || sx > canvas.width + 10 || sy < -10 || sy > canvas.height + 10) continue;

    let alfa = opacidade;
    if (apagarNoCoracao) {
      // área aproximada do coração: uma elipse em volta dele
      const hx = (sx - cx) / escala / 17, hy = (sy - cy) / escala / 16 - 0.15;
      if (hx * hx + hy * hy < 1) alfa *= 0.3;
    }

    const perto = 1 - e.z;
    const piscar = 0.55 + 0.45 * Math.sin(agora * 0.002 + e.fase);
    ctx.globalAlpha = Math.min(1, perto * 1.3) * piscar * alfa;
    ctx.fillStyle = e.lilas ? "#c58cff" : "#efe2ff";
    const r = e.lilas ? 0.8 + perto * 2 : 0.5 + perto * 1.3;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2); // quadradinho é bem mais leve que círculo
  }
  ctx.globalAlpha = 1;
}

// =====================================================
// 3) VIAGEM
// =====================================================
const fotosVoando = [];
let proximaFotoViagem = 0, indiceViagem = 0;
function desenharFotosVoando(t, vel) {
  const lista = prontas();
  if (lista.length && t > 600 && t < DURACAO_VIAGEM - 900 && t >= proximaFotoViagem) {
    const a = Math.random() * 6.283, r = 0.35 + Math.random() * 0.5;
    fotosVoando.push({ img: lista[indiceViagem++ % lista.length], x: Math.cos(a) * r, y: Math.sin(a) * r, z: 1, giro: (Math.random() - 0.5) * 0.4 });
    proximaFotoViagem = t + 140;
  }
  const escala = Math.max(canvas.width, canvas.height);
  for (let i = fotosVoando.length - 1; i >= 0; i--) {
    const f = fotosVoando[i];
    f.z -= vel * 0.9;
    if (f.z <= 0.05) { fotosVoando.splice(i, 1); continue; }
    const w = (escala * 0.09) / f.z, h = w * (f.img.naturalHeight / f.img.naturalWidth);
    const [sx, sy] = projetar(f, f.z);
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - f.z) * 2) * 0.85;
    ctx.translate(sx, sy); ctx.rotate(f.giro);
    ctx.drawImage(f.img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

// =====================================================
// 4) CORAÇÃO E TUDO DEPOIS (seu código)
// =====================================================
function pontoDoCoracao(t) {
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}
const palavras = [];
function criarPalavra(x, y, z, tamanho, aparecerEm) {
  const dx = x, dy = y - 2, comp = Math.hypot(dx, dy) || 1, fica = Math.random() < CHANCE_FICAR;
  palavras.push({ x, y, z, tamanho, aparecerEm, fase: Math.random() * 6.28,
    dirX: dx / comp + (Math.random() - 0.5) * 0.6, dirY: dy / comp + (Math.random() - 0.5) * 0.6,
    fica, distancia: fica ? 6 + Math.random() * 22 : 35 + Math.random() * 50 });
}
for (let i = 0; i < TOTAL_CONTORNO; i++) {
  const p = pontoDoCoracao((i / TOTAL_CONTORNO) * 6.283), r = 0.95 + Math.random() * 0.08;
  criarPalavra(p.x * r, p.y * r, (Math.random() - 0.5) * 2, 0.8 + Math.random() * 0.4, i * INTERVALO_CONTORNO);
}
const fimContorno = TOTAL_CONTORNO * INTERVALO_CONTORNO + DURACAO_ENTRADA;
for (let i = 0; i < TOTAL_DENTRO; i++) {
  const p = pontoDoCoracao(Math.random() * 6.283), r = Math.sqrt(Math.random()) * 0.85;
  criarPalavra(p.x * r, p.y * r, (Math.random() - 0.5) * 10, 0.5 + Math.random() * 0.5, fimContorno + i * INTERVALO_DENTRO);
}
const coracaoCompleto = fimContorno + TOTAL_DENTRO * INTERVALO_DENTRO + DURACAO_ENTRADA;
const inicioFlashes = coracaoCompleto + 800;
const explosaoEm = inicioFlashes + DURACAO_FLASHES;
const inicioFotosTela = explosaoEm + 1500;
const fotoPrincipalEm = inicioFotosTela + DURACAO_FASE_FOTOS;
const explosaoFotoEm = fotoPrincipalEm + 3000;
const finalEm = explosaoFotoEm + 700;

function desenharFlashes(tempo, escala, cx, cy, cos, sen) {
  const t = tempo - inicioFlashes;
  if (t < 0 || t > DURACAO_FLASHES) return;
  const lista = prontas(); if (!lista.length) return;
  const progresso = t / DURACAO_FLASHES, pos = progresso ** 2 * TOTAL_CORTES;
  const img = lista[Math.floor(pos) % lista.length], dentro = pos % 1, env = Math.sin(progresso * Math.PI);
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const p = pontoDoCoracao((i / 100) * 6.283), x = p.x * 0.97, y = p.y * 0.97, per = 60 / (60 - x * sen);
    const X = cx + x * cos * escala * per, Y = cy + y * escala * per;
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.closePath(); ctx.clip();
  const L = 32 * escala, A = 30 * escala, zoom = 1.12 - dentro * 0.08;
  const s = Math.max(L / img.naturalWidth, A / img.naturalHeight) * zoom, w = img.naturalWidth * s, h = img.naturalHeight * s, my = cy + 2.5 * escala;
  ctx.shadowBlur = 0;
  ctx.globalAlpha = TRANSPARENCIA_FOTO * env * (1 - dentro * 0.4);
  ctx.drawImage(img, cx - w / 2, my - h / 2, w, h);
  ctx.globalCompositeOperation = "color"; ctx.globalAlpha = 0.6 * env; ctx.fillStyle = COR;
  ctx.fillRect(cx - L / 2, my - A / 2, L, A);
  ctx.restore();
}
function desenharClarao(tempo, momento, cx, cy, escala) {
  const t = tempo - momento; if (t < 0 || t > 600) return;
  const f = 1 - t / 600, raio = escala * (10 + t / 15);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, raio);
  g.addColorStop(0, `rgba(241, 220, 255, ${0.8 * f})`); g.addColorStop(0.4, `rgba(138, 43, 226, ${0.5 * f})`); g.addColorStop(1, "rgba(138, 43, 226, 0)");
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = g;
  ctx.fillRect(cx - raio, cy - raio, raio * 2, raio * 2);
}

const fotosNaTela = []; let agenda = null, proximaDaAgenda = 0;
function criarFotoNaTela(img, tempo) {
  const tam = Math.min(canvas.width, canvas.height) * (0.18 + Math.random() * 0.08), w = tam, h = tam * (img.naturalHeight / img.naturalWidth);
  let x, y;
  for (let k = 0; k < 15; k++) {
    x = w / 2 + Math.random() * (canvas.width - w); y = h / 2 + Math.random() * (canvas.height - h);
    if (fotosNaTela.every((f) => Math.hypot(f.x - x, f.y - y) > tam * 0.8)) break;
  }
  fotosNaTela.push({ img, x, y, w, h, nasceu: tempo, giro: (Math.random() - 0.5) * 0.12 });
}
function desenharFotosNaTela(tempo) {
  if (tempo < inicioFotosTela) return;
  if (agenda === null) {
    let lista = embaralhar(prontas());
    while (lista.length && lista.length < MINIMO_FOTOS_FASE) lista = lista.concat(embaralhar(prontas()));
    const intervalo = lista.length > 1 ? (DURACAO_FASE_FOTOS - DURACAO_FOTO) / (lista.length - 1) : 0;
    agenda = lista.map((img, i) => ({ img, em: inicioFotosTela + i * intervalo }));
  }
  while (proximaDaAgenda < agenda.length && tempo >= agenda[proximaDaAgenda].em) {
    const img = agenda[proximaDaAgenda].img;
    if (!fotosNaTela.some((f) => f.img === img)) criarFotoNaTela(img, tempo); // nunca a mesma ao mesmo tempo
    proximaDaAgenda++;
  }
  for (let i = fotosNaTela.length - 1; i >= 0; i--) {
    const f = fotosNaTela[i], vida = (tempo - f.nasceu) / DURACAO_FOTO;
    if (vida >= 1) { fotosNaTela.splice(i, 1); continue; }
    let a = 1; if (vida < 0.25) a = vida / 0.25; else if (vida > 0.75) a = (1 - vida) / 0.25;
    ctx.save();
    ctx.translate(f.x, f.y - vida * 15); ctx.rotate(f.giro); ctx.scale(1 + vida * 0.06, 1 + vida * 0.06);
    ctx.globalAlpha = a * TRANSPARENCIA_FOTOS_TELA; ctx.shadowBlur = 0;
    ctx.drawImage(f.img, -f.w / 2, -f.h / 2, f.w, f.h);
    ctx.restore();
  }
}

const PEDACOS = 9; let principal = null;
function prepararPrincipal() {
  const lista = prontas(); if (!lista.length) return null;
  const img = lista[Math.floor(Math.random() * lista.length)], prop = img.naturalHeight / img.naturalWidth;
  let w = Math.min(canvas.width, canvas.height) * 0.55, h = w * prop;
  if (h > canvas.height * 0.7) { h = canvas.height * 0.7; w = h / prop; }
  const pedacos = [], pw = w / PEDACOS, ph = h / PEDACOS, sw = img.naturalWidth / PEDACOS, sh = img.naturalHeight / PEDACOS;
  for (let l = 0; l < PEDACOS; l++) for (let c = 0; c < PEDACOS; c++) {
    const ox = -w / 2 + pw * (c + 0.5), oy = -h / 2 + ph * (l + 0.5), comp = Math.hypot(ox, oy) || 1;
    pedacos.push({ ox, oy, pw, ph, sx: c * sw, sy: l * sh, sw, sh, dirX: ox / comp + (Math.random() - 0.5) * 0.8, dirY: oy / comp + (Math.random() - 0.5) * 0.8, distancia: (0.6 + Math.random() * 1.4) * Math.max(w, h), giro: (Math.random() - 0.5) * 6 });
  }
  return { img, w, h, pedacos };
}
function desenharFotoPrincipal(tempo) {
  const t = tempo - fotoPrincipalEm; if (t < 0) return;
  if (principal === null) principal = prepararPrincipal();
  if (!principal) { mostrarConteudo(); return; }
  const { img, w, h, pedacos } = principal, cx = canvas.width / 2, cy = canvas.height / 2, te = tempo - explosaoFotoEm;
  ctx.save();
  if (te < 0) {
    const a = Math.min(1, t / 1200), s = 0.85 + 0.15 * (1 - (1 - a) ** 3);
    ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.shadowColor = COR; ctx.shadowBlur = 30;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else if (te < 1400) {
    const av = 1 - Math.exp(-te / 450), a = 1 - te / 1400;
    ctx.shadowBlur = 0;
    for (const p of pedacos) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(cx + p.ox + p.dirX * p.distancia * av, cy + p.oy + p.dirY * p.distancia * av);
      ctx.rotate(p.giro * av);
      ctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, -p.pw / 2, -p.ph / 2, p.pw, p.ph);
      ctx.restore();
    }
  }
  ctx.restore();
  if (tempo >= finalEm) mostrarConteudo();
}

function desenharCoracaoEDepois(agora, tempo) {
  const escala = Math.min(canvas.width, canvas.height) / 40, cx = canvas.width / 2, cy = canvas.height / 2 - escala * 2;
  let ang = 0;
  if (tempo > coracaoCompleto) { const t = tempo - coracaoCompleto; ang = Math.sin(t * 0.0004) * 0.3 * Math.min(1, t / 3000); }
  const cos = Math.cos(ang), sen = Math.sin(ang);

  desenharFlashes(tempo, escala, cx, cy, cos, sen);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const p of palavras) {
    if (tempo < p.aparecerEm) continue;
    let x = p.x, y = p.y, ae = 1;
    if (tempo > explosaoEm) {
      const te = tempo - explosaoEm, av = 1 - Math.exp(-te / 700);
      x += p.dirX * p.distancia * av; y += p.dirY * p.distancia * av;
      if (p.fica) { ae = 1 - 0.75 * Math.min(1, te / 2000); x += Math.sin(tempo * 0.0003 + p.fase) * 0.6; y += Math.cos(tempo * 0.0003 + p.fase) * 0.6; }
      else { ae = 1 - Math.min(1, te / 1500); if (ae <= 0) continue; }
    }
    const xg = x * cos + p.z * sen, zg = -x * sen + p.z * cos, per = 60 / (60 + zg);
    const X = cx + xg * escala * per, Y = cy + y * escala * per;
    const alfa = Math.min(1, (tempo - p.aparecerEm) / DURACAO_ENTRADA) * (0.75 + 0.25 * Math.sin(tempo * 0.004 + p.fase)) * Math.min(1, per * 0.9) * ae;
    ctx.font = `bold ${escala * 0.75 * p.tamanho * per}px Arial`;
    ctx.globalAlpha = alfa; ctx.fillStyle = COR; ctx.shadowColor = COR; ctx.shadowBlur = BRILHO_HALO;
    ctx.fillText("I LOVE YOU", X, Y);
    ctx.globalAlpha = alfa * 0.7; ctx.fillStyle = COR_NUCLEO; ctx.shadowBlur = 0;
    ctx.fillText("I LOVE YOU", X, Y);
  }
  ctx.globalAlpha = 1;

  desenharClarao(tempo, explosaoEm, cx, cy, escala);
  desenharFotosNaTela(tempo);
  desenharFotoPrincipal(tempo);
  desenharClarao(tempo, explosaoFotoEm, canvas.width / 2, canvas.height / 2, escala);
}

// =====================================================
// LOOP
// =====================================================
function animar(agora) {
  const t = agora - inicioFase;
  girarPresente();

  if (fase === "presente") {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    desenharEspaco(agora, 0.0004);
  } else if (fase === "viagem") {
    const p = t / DURACAO_VIAGEM;
    let vel;
    if (p < 0.25) vel = 0.002 + (p / 0.25) ** 2 * 0.04;
    else if (p < 0.8) vel = 0.042;
    else vel = 0.042 * (1 - (p - 0.8) / 0.2) + 0.0004;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
    desenharRiscos(vel);
    desenharFotosVoando(t, vel);
    if (t >= DURACAO_VIAGEM) { fase = "coracao"; inicioFase = agora; }
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    desenharEspaco(agora, 0.0002, 140, 0.85, true); // menos estrelas e mais apagadas
    desenharCoracaoEDepois(agora, t + COMECAR_EM);
  }
  requestAnimationFrame(animar);
}
requestAnimationFrame(animar);

// =====================================================
// 5) CONTEÚDO COM SCROLL
// =====================================================
let conteudoMostrado = false;
function mostrarConteudo() {
  if (conteudoMostrado) return;
  conteudoMostrado = true;
  document.body.classList.add("conteudo-ativo");
  window.scrollTo(0, 0);
  const conteudo = document.getElementById("conteudo");
  requestAnimationFrame(() => requestAnimationFrame(() => { conteudo.classList.add("visivel"); iniciarScroll(); }));
}

// dias juntos (até 1 ano: meses, dias, horas; depois: anos, meses, dias)
const inicioNamoro = new Date(DATA_INICIO);
const dd = (n) => String(n).padStart(2, "0");
document.getElementById("juntosDesde").textContent = "Juntos desde " + inicioNamoro.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
function tempoJuntos() {
  const agora = new Date();
  let anos = agora.getFullYear() - inicioNamoro.getFullYear(), meses = agora.getMonth() - inicioNamoro.getMonth(), dias = agora.getDate() - inicioNamoro.getDate();
  const hA = agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
  const hI = inicioNamoro.getHours() * 3600 + inicioNamoro.getMinutes() * 60 + inicioNamoro.getSeconds();
  if (hA < hI) dias--;
  if (dias < 0) { meses--; dias += new Date(agora.getFullYear(), agora.getMonth(), 0).getDate(); }
  if (meses < 0) { anos--; meses += 12; }
  let resto = hA - hI; if (resto < 0) resto += 86400;
  return { anos, meses, dias, horas: Math.floor(resto / 3600), minutos: Math.floor(resto / 60) % 60, segundos: resto % 60, total: Math.max(0, Math.floor((agora - inicioNamoro) / 86400000)) };
}
const plural = (n, um, varios) => (n === 1 ? um : varios);
function atualizarDias() {
  const t = tempoJuntos();
  const cartoes = t.anos >= 1
    ? [[t.anos, plural(t.anos, "ano", "anos")], [t.meses, plural(t.meses, "mês", "meses")], [t.dias, plural(t.dias, "dia", "dias")]]
    : [[t.meses, plural(t.meses, "mês", "meses")], [t.dias, plural(t.dias, "dia", "dias")], [t.horas, plural(t.horas, "hora", "horas")]];
  cartoes.forEach(([n, rotulo], i) => {
    document.getElementById(`c${i + 1}`).textContent = n;
    document.getElementById(`r${i + 1}`).textContent = rotulo;
  });
  document.getElementById("relogio").innerHTML = t.anos >= 1
    ? `${dd(t.horas)}<i>:</i>${dd(t.minutos)}<i>:</i>${dd(t.segundos)}`
    : `${dd(t.minutos)} min<i>:</i>${dd(t.segundos)} s`;
  document.getElementById("totalDias").textContent = t.total.toLocaleString("pt-BR");
}
atualizarDias();
setInterval(atualizarDias, 1000);

const fundo = document.getElementById("coracoesFundo");
for (let i = 0; i < 16; i++) {
  const c = document.createElement("span"), tam = 8 + Math.random() * 14;
  c.style.left = `${Math.random() * 100}%`; c.style.width = c.style.height = `${tam}px`;
  c.style.animationDuration = `${7 + Math.random() * 8}s`; c.style.animationDelay = `${-Math.random() * 12}s`;
  c.innerHTML = '<svg viewBox="0 0 64 64"><path d="M32 56S6 41 6 22a13 13 0 0 1 26-5 13 13 0 0 1 26 5c0 19-26 34-26 34Z" fill="currentColor"/></svg>';
  fundo.appendChild(c);
}

// abaixa a música do coração até sumir
function abaixarMusicaDeFundo() {
  const id = setInterval(() => {
    musica.volume = Math.max(0, musica.volume - 0.02);
    if (musica.volume <= 0) { musica.pause(); clearInterval(id); }
  }, 60);
}

// botão Descobrir
const botaoDescobrir = document.getElementById("botaoDescobrir");
botaoDescobrir.addEventListener("click", () => {
  if (botaoDescobrir.classList.contains("revelando")) return;
  botaoDescobrir.classList.add("revelando");
  document.getElementById("textoDescobrir").textContent = "Revelando...";
  setTimeout(() => {
    botaoDescobrir.classList.add("sumindo");
    setTimeout(() => { botaoDescobrir.style.display = "none"; document.getElementById("painelMusica").classList.add("aparecer"); }, 350);
    abaixarMusicaDeFundo(); // pra ela conseguir ouvir a "Mais Feliz" no Spotify
  }, 1300);
});
const frase = document.getElementById("frase");
frase.innerHTML = frase.textContent.split(" ").map((p) => `<span class="palavra">${p}</span>`).join(" ");

function iniciarScroll() {
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap || !window.ScrollTrigger || reduzir) {
    document.querySelectorAll(".palavra").forEach((p) => (p.style.opacity = 1));
    document.querySelectorAll(".ponto").forEach((p) => p.classList.add("ativo"));
    document.getElementById("progresso").style.transform = "scaleY(1)";
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll(".surge").forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, filter: "blur(8px)", duration: 1.2, delay: parseFloat(el.dataset.atraso || 0), ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" } });
  });
  document.querySelectorAll(".deco").forEach((deco) => {
    const esq = deco.classList.contains("esq");
    gsap.fromTo(deco, { x: esq ? -160 : 160, rotation: esq ? -60 : 60, opacity: 0 },
      { x: 0, rotation: (Math.random() - 0.5) * 30, opacity: 0.85, ease: "power2.out", scrollTrigger: { trigger: deco, start: "top 100%", end: "top 55%", scrub: 1 } });
    gsap.to(deco, { y: -70, ease: "none", scrollTrigger: { trigger: deco, start: "top bottom", end: "bottom top", scrub: true } });
  });
  gsap.to("#progresso", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#trilho", start: "top 60%", end: "bottom 60%", scrub: true } });
  document.querySelectorAll(".momento").forEach((m) => {
    const q = { trigger: m, start: "top 78%", toggleActions: "play none none reverse" };
    gsap.from(m.querySelectorAll(".data, h3"), { y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: q });
    gsap.from(m.querySelector(".foto"), { clipPath: "inset(100% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut", scrollTrigger: q });
    gsap.from(m.querySelector(".foto img"), { scale: 1.3, duration: 1.6, ease: "power3.out", scrollTrigger: q });
    gsap.from(m.querySelector(".texto"), { y: 30, opacity: 0, duration: 1, delay: 0.5, ease: "power2.out", scrollTrigger: q });
    ScrollTrigger.create({ trigger: m, start: "top 60%", onEnter: () => m.querySelector(".ponto").classList.add("ativo"), onLeaveBack: () => m.querySelector(".ponto").classList.remove("ativo") });
  });
  gsap.to(".frase .palavra", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".frase", start: "top 70%", end: "center 40%", scrub: true } });
  ScrollTrigger.refresh();
}
