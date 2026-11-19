/* Portfólio do Pedro Neves: animações, idioma (PT/EN), dados ao vivo e terminal. Sem framework. */

/* ---------- idioma ---------- */
let LANG = localStorage.getItem('lang') || ((navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en');
const L = (pt, en) => (LANG === 'en' ? en : pt);
const PT = {};
document.querySelectorAll('[data-i18n]').forEach(el => { PT[el.dataset.i18n] = el.innerHTML; });
const META = {
  pt: { title: 'Pedro Neves · Dados, IA e Python', desc: document.querySelector('meta[name=description]').content },
  en: { title: 'Pedro Neves · Data, AI and Python', desc: 'Pedro Neves, Data Science & AI student at FGV EMAp and Python developer. LED-UFAL research grantee on a pilot with Hapvida and creator of medalhas.online.' },
};
function applyLang() {
  document.documentElement.lang = L('pt-BR', 'en');
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = LANG === 'en' ? (window.EN[k] || PT[k]) : PT[k]; });
  document.querySelectorAll('[data-alt-en]').forEach(el => { el.dataset.altPt ??= el.alt; el.alt = LANG === 'en' ? el.dataset.altEn : el.dataset.altPt; });
  document.title = META[LANG].title;
  document.querySelector('meta[name=description]').content = META[LANG].desc;
  document.getElementById('lang').textContent = L('EN', 'PT');
  renderAwards(); if (WAKA) drawWaka(WAKA); renderChips(); if (booted) bootTerminal(true);
}
document.getElementById('lang').addEventListener('click', () => { LANG = LANG === 'pt' ? 'en' : 'pt'; localStorage.setItem('lang', LANG); applyLang(); });

/* ---------- cursor, bolha, botões magnéticos ---------- */
const blob = document.getElementById('blob'), cur = document.getElementById('cur');
let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my;
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.style.left = mx + 'px'; cur.style.top = my + 'px'; });
(function loop() { bx += (mx - bx) * .06; by += (my - by) * .06; blob.style.left = bx + 'px'; blob.style.top = by + 'px'; requestAnimationFrame(loop); })();
document.querySelectorAll('a,.t,.m,button').forEach(a => { a.addEventListener('mouseenter', () => cur.classList.add('big')); a.addEventListener('mouseleave', () => cur.classList.remove('big')); });
const win = document.getElementById('win');
win.addEventListener('mouseenter', () => cur.classList.add('off'));
win.addEventListener('mouseleave', () => cur.classList.remove('off'));
document.querySelectorAll('.mag').forEach(m => {
  m.addEventListener('mousemove', e => { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .35}px,${(e.clientY - r.top - r.height / 2) * .5}px)`; });
  m.addEventListener('mouseleave', () => (m.style.transform = ''));
});

/* ---------- blocos: brilho que segue o mouse ---------- */
document.querySelectorAll('.t').forEach(t => t.addEventListener('pointermove', e => { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px'); }));

/* ---------- medalhas.online ao vivo ---------- */
let AWARDS = 854456, LIVE = false;
function renderAwards() {
  document.getElementById('awards').textContent = AWARDS.toLocaleString(L('pt-BR', 'en-US'));
  document.getElementById('liveTag').textContent = LIVE ? L('● ao vivo', '● live') : '';
}
fetch('https://medalhas.online/api/v1/').then(r => r.json()).then(d => { AWARDS = d.premiacoes; LIVE = true; renderAwards(); }).catch(() => {});

/* ---------- WakaTime (data/wakatime.json, atualizado por uma GitHub Action) ---------- */
const LC = ['#ff5b2e', '#f5c542', '#2ee6a6', '#7aa2ff', '#b14bff'];
const MES = { Jan: ['jan', 'Jan'], Feb: ['fev', 'Feb'], Mar: ['mar', 'Mar'], Apr: ['abr', 'Apr'], May: ['mai', 'May'], Jun: ['jun', 'Jun'], Jul: ['jul', 'Jul'], Aug: ['ago', 'Aug'], Sep: ['set', 'Sep'], Oct: ['out', 'Oct'], Nov: ['nov', 'Nov'], Dec: ['dez', 'Dec'] };
let WAKA = null;
function drawWaka(w) {
  WAKA = w;
  document.getElementById('wkH').firstChild.textContent = w.horas.toLocaleString(L('pt-BR', 'en-US'));
  const m = (w.desde || '').match(/^(\w{3})\w* \d+ (\d{4})$/);
  if (m) document.getElementById('wkSince').textContent = L('desde ', 'since ') + (MES[m[1]] ? MES[m[1]][LANG === 'en' ? 1 : 0] : m[1]) + L('/', ' ') + m[2];
  const Ls = w.linguagens, tot = Ls.reduce((a, l) => a + l.pct, 0), bar = document.getElementById('wkL');
  const fresh = !bar.children.length;
  bar.innerHTML = Ls.map((l, i) => `<i style="background:${LC[i]};width:${fresh ? 0 : 100 * l.pct / tot}%" data-w="${100 * l.pct / tot}"></i>`).join('');
  bar.parentElement.querySelector('.lk')?.remove();
  bar.insertAdjacentHTML('afterend', '<div class="lk">' + Ls.map((l, i) => `<span style="--lc:${LC[i]}">${l.nome} ${Math.round(l.pct)}%</span>`).join('') + '</div>');
  if (fresh) setTimeout(() => bar.querySelectorAll('i').forEach(i => (i.style.width = i.dataset.w + '%')), 250);
}
fetch('data/wakatime.json', { cache: 'no-cache' }).then(r => r.json()).then(drawWaka)
  .catch(() => drawWaka({ horas: 199, desde: 'Oct 28 2024', linguagens: [{ nome: 'Python', pct: 41.9 }, { nome: 'HTML', pct: 32.5 }, { nome: 'TypeScript', pct: 8.7 }, { nome: 'JavaScript', pct: 2.9 }, { nome: 'CSS', pct: 1.5 }] }));

/* ---------- lista de trabalho: card colorido que segue o cursor ---------- */
const pv = document.getElementById('pv');
document.querySelectorAll('.list li').forEach(li => {
  li.style.setProperty('--hc', li.dataset.c);
  li.addEventListener('mouseenter', () => { document.getElementById('pk').textContent = li.dataset.k; document.getElementById('pvv').textContent = LANG === 'en' ? li.dataset.ven : li.dataset.v; pv.style.background = li.dataset.c; pv.classList.add('on'); });
  li.addEventListener('mouseleave', () => pv.classList.remove('on'));
  li.addEventListener('mousemove', e => { pv.style.left = e.clientX + 'px'; pv.style.top = e.clientY + 'px'; });
});

/* ---------- revelar ao rolar ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

/* ---------- terminal ---------- */
const out = document.getElementById('out');
const P = '<span class="tp">pedro</span><span class="td">@</span><span class="tu">neves</span> <span class="td">~</span> <span class="tk">❯</span> ';
const btn = c => `<span class="cb" data-c="${c}">${c}</span>`;
const LOGO = `██████╗ ███████╗██████╗ ██████╗  ██████╗
██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔═══██╗
██████╔╝█████╗  ██║  ██║██████╔╝██║   ██║
██╔═══╝ ██╔══╝  ██║  ██║██╔══██╗██║   ██║
██║     ███████╗██████╔╝██║  ██║╚██████╔╝
╚═╝     ╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ `;
const card = (dir, meta, body) => `<div class="tcard"><span class="tk">${dir}/</span> <span class="td">· ${meta}</span>\n${body}</div>`;
const PROJ = {
  hapvida: () => card('hapvida', L('bolsa LED-UFAL · 2026 — agora', 'LED-UFAL grant · 2026 — now'), L(
    `Dá para prever quanto tempo um paciente com <span class="ts">síndrome coronariana</span> fica internado?
Equipe de 5. Agora: dados, análise exploratória, literatura e plano para 2027.
<span class="td">status:</span> <span class="tp">● em andamento</span>`,
    `Can we predict how long a patient with <span class="ts">coronary syndrome</span> stays in hospital?
Team of 5. Now: data, exploratory analysis, literature and a 2027 plan.
<span class="td">status:</span> <span class="tp">● in progress</span>`)),
  medalhas: () => card('medalhas', L('pessoal · 2026 · ', 'personal · 2026 · ') + '<a href="https://medalhas.online" target="_blank">medalhas.online ↗</a>', L(
    `Medalhistas de <span class="tm">23 olimpíadas</span> (1979–2026) num lugar só, com API pública.`,
    `Medalists from <span class="tm">23 olympiads</span> (1979–2026) in one place, with a public API.`) +
    `\n<span class="td">$</span> curl medalhas.online/api/v1/ <span class="td">→</span> {"premiacoes": <span class="tm">${AWARDS}</span>}\n` +
    L('Identidade sem CPF · servidor em Python puro · Cloud Run · 132 testes', 'Identity without national ID · pure-Python server · Cloud Run · 132 tests')),
  intercambio: () => card(L('intercambio', 'exchange'), 'Daqui Pra o Mundo · ' + L('Inglaterra', 'England'), L(
    `<span class="tm">1 mês</span> na Inglaterra · Londres → Brighton\nInglês <span class="tm">C1</span> certificado`,
    `<span class="tm">1 month</span> in England · London → Brighton\n<span class="tm">C1</span>-certified English`)),
  tce: () => card('tce-al', L('bolsa LED-UFAL · out–nov 2026', 'LED-UFAL grant · Oct–Nov 2026'), L(
    `NLP para o Tribunal de Contas de Alagoas.
<span class="tm">85 mil</span> páginas do Diário Oficial · OCR seletivo · <span class="tm">10,5 mil</span> atos extraídos
10 modelos de texto comparados · melhor AUC <span class="tm">0,80</span>`,
    `NLP for the Alagoas State Court of Accounts.
<span class="tm">85k</span> Official Gazette pages · selective OCR · <span class="tm">10.5k</span> acts extracted
10 text models compared · best AUC <span class="tm">0.80</span>`)),
  peti: () => card('peti-2027', L('bolsa LED-UFAL · equipe de 6', 'LED-UFAL grant · team of 6'), L(
    `Plataforma Django das trilhas de olimpíada de matemática.
Permissão papel × escopo · provisionamento de aulas · trava otimista
<span class="tm">478</span> testes · <span class="tm">+20k</span> linhas · hoje: <span class="ts">consultor técnico</span>`,
    `Django platform for math olympiad training tracks.
Role × scope permissions · class provisioning · optimistic locking
<span class="tm">478</span> tests · <span class="tm">+20k</span> lines · now: <span class="ts">technical consultant</span>`)),
  olimpo: () => card('olimpo', L('bolsa NES · SigmaCamp · abr–jul 2026', 'NES · SigmaCamp grant · Apr–Jul 2026'), L(
    `Inscrição e seleção do ETAPA SigmaCamp e do SigmaFestival Nordeste.
Formulários com Markdown/LaTeX · upload · e-mails · CSV/ZIP · suporte com <span class="ts">RAG + Gemini</span>`,
    `Applications and selection for ETAPA SigmaCamp and SigmaFestival Nordeste.
Markdown/LaTeX forms · uploads · e-mails · CSV/ZIP · <span class="ts">RAG + Gemini</span> help desk`)),
  lib: () => card('lib_school', L('doado à minha antiga escola · ', 'donated to my former school · ') + `<a href="https://github.com/PedroVNeves/lib_school" target="_blank">${L('código', 'code')} ↗</a>`, L(
    `Biblioteca escolar fora do papel: <span class="tm">12 mil</span> livros, empréstimos por turma, jogo de leitura.
<span class="td">status: ○ encerrado, ficou 4 meses no ar</span>`,
    `A school library off paper: <span class="tm">12k</span> books, loans by class, a reading game.
<span class="td">status: ○ retired after 4 months live</span>`)),
  sigma: () => card('sigma', '2025 · <a href="https://sigmachallenge.com.br" target="_blank">sigmachallenge.com.br ↗</a>', L('Landing page de captação do SigmaChallenge.', "SigmaChallenge's sign-up landing page.")),
  canguru: () => card('canguru', L('pesquisa NES/UFAL · 2025', 'NES/UFAL research · 2025'), L(
    `Capacitação no Método Canguru (bebês prematuros) para profissionais e famílias.
Núcleo em Django · chatbot <span class="ts">RAG</span> · migração para PostgreSQL · <span class="tm">29</span> commits`,
    `Kangaroo Mother Care training for health workers and families.
Django core · <span class="ts">RAG</span> chatbot · PostgreSQL migration · <span class="tm">29</span> commits`)),
  wikirace: () => card('wikirace', L('FGV · Matemática Discreta · ', 'FGV · Discrete Math · ') + `<a href="https://github.com/PedroVNeves/wikirace" target="_blank">${L('código', 'code')} ↗</a>`, L(
    `Wikipédia PT como grafo: <span class="tm">1,2 mi</span> artigos, <span class="tm">80 mi</span> links.`,
    `Portuguese Wikipedia as a graph: <span class="tm">1.2M</span> articles, <span class="tm">80M</span> links.`) + `
${L('BFS bidirecional  ', 'bidirectional BFS ')}  <span class="barg" style="width:200px"></span> 100%
${L('A* semântico (w=8)', 'semantic A* (w=8) ')}  <span class="barg" style="width:112px"></span> 56%  · ${L('1,04× o ótimo', '1.04× optimal')}
${L('guloso semântico  ', 'semantic greedy   ')}  <span class="barg" style="width:20px"></span> 10%`),
  chuva: () => card(L('chuva', 'rain'), L('FGV · Análise Exploratória · dupla · ', 'FGV · Exploratory Analysis · pair · ') + `<a href="https://github.com/PedroVNeves/Quando_a_chuva_vira_problema" target="_blank">${L('código', 'code')} ↗</a>`, L(
    `Quanta chuva, e onde, vira problema no Rio?
<span class="tm">29 mi</span> leituras de pluviômetros × ocorrências do COR (BigQuery) · GeoPandas · UTM`,
    `How much rain, and where, becomes a problem in Rio?
<span class="tm">29M</span> rain-gauge readings × emergency incidents (BigQuery) · GeoPandas · UTM`)),
};
const ALIAS = { exchange: 'intercambio', rain: 'chuva' };
const CMD = {
  help: () => `${L('comandos', 'commands')}: ${[L('sobre', 'about'), L('agora', 'now'), L('projetos', 'projects'), 'skills', L('olimpiadas', 'olympiads'), L('contato', 'contact'), 'clear'].map(btn).join('  ')}
<span class="td">${L('Tab completa · ↑ repete o último comando', 'Tab completes · ↑ repeats the last command')}</span>`,
  sobre: () => L(`<span class="tk"># Pedro Neves</span>
18 anos · Maceió → São Paulo · <span class="ts">Ciência de Dados & IA na FGV EMAp</span>
Programo em Python e gosto de pegar dado bagunçado e terminar com algo que alguém usa.`,
    `<span class="tk"># Pedro Neves</span>
18 · Maceió → São Paulo · <span class="ts">Data Science & AI at FGV EMAp</span>
I write Python and like turning messy data into something people use.`),
  agora: () => L(`<span class="tp">●</span> Bolsista no LED-UFAL, piloto com a <span class="tk">Hapvida</span> (predição de internação)
<span class="tp">●</span> Consultor técnico do PETI 2027
<span class="tp">●</span> Mantendo o medalhas.online · ${btn('abrir hapvida')}`,
    `<span class="tp">●</span> LED-UFAL grantee on a pilot with <span class="tk">Hapvida</span> (length-of-stay prediction)
<span class="tp">●</span> Technical consultant for PETI 2027
<span class="tp">●</span> Maintaining medalhas.online · ${btn('open hapvida')}`),
  projetos: () => Object.keys(PROJ).map(p => '<span class="td">drwxr-xr-x</span>  ' + btn(L('abrir ', 'open ') + (p === 'intercambio' ? L(p, 'exchange') : p === 'chuva' ? L(p, 'rain') : p))).join('\n'),
  skills: () => [['Python', 10], ['pandas / numpy', 8], ['scikit-learn', 7], ['Django', 8], ['SQL / Postgres', 7], ['NLP / embeddings', 7], ['Docker / Cloud Run', 6], ['PyTorch', 4]]
    .map(([n, v]) => n.padEnd(20, ' ') + '<span class="tp">' + '█'.repeat(v) + '</span><span class="td">' + '░'.repeat(10 - v) + '</span>').join('\n'),
  olimpiadas: () => L(`🥈 OBMEP 2025 · prata nacional + ouro regional
🥈 OBMEP 2024 · prata nacional + ouro regional
🎖  OBMEP 2023 · menção honrosa
🥉 OBMEP 2022 · bronze nacional
🥈 OAM · prata
<span class="td">fonte: o meu próprio</span>`, `🥈 OBMEP 2025 · national silver + regional gold
🥈 OBMEP 2024 · national silver + regional gold
🎖  OBMEP 2023 · honorable mention
🥉 OBMEP 2022 · national bronze
🥈 OAM · silver
<span class="td">source: my own</span>`) + ' <a href="https://medalhas.online/aluno/pedro-henrique-vasconcelos-neves-al" target="_blank">medalhas.online ↗</a>',
  contato: () => `email     <a href="mailto:pedro.vasconcelosneves@gmail.com">pedro.vasconcelosneves@gmail.com</a>
linkedin  <a href="https://www.linkedin.com/in/pedro-vasconcelos-neves" target="_blank">/in/pedro-vasconcelos-neves</a>
github    <a href="https://github.com/PedroVNeves" target="_blank">/PedroVNeves</a>`,
  sudo: () => L('<span class="tr">pedro não está no arquivo sudoers.</span> Este incidente será reportado. 👀', '<span class="tr">pedro is not in the sudoers file.</span> This incident will be reported. 👀'),
};
Object.assign(CMD, { about: CMD.sobre, now: CMD.agora, projects: CMD.projetos, olympiads: CMD.olimpiadas, contact: CMD.contato, ls: CMD.projetos, whoami: CMD.sobre });
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function print(html, cls = 'line') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; return d; }
function run(raw) {
  const c = raw.trim(); print(P + esc(c)); if (!c) return;
  if (c === 'clear') { out.innerHTML = ''; return; }
  const [a, ...rest] = c.split(' ');
  if (['abrir', 'open', 'cd', 'cat'].includes(a) && rest.length) {
    let k = rest.join(' ').replace(/\/$/, ''); k = ALIAS[k] || k;
    print(PROJ[k] ? PROJ[k]() : `<span class="tr">${L('não achei', 'not found')} "${esc(k)}".</span> ${L('tente', 'try')} ${btn(L('projetos', 'projects'))}`);
    return;
  }
  print(CMD[c] ? CMD[c]() : `<span class="tr">zsh: ${L('comando não encontrado', 'command not found')}: ${esc(c)}</span> · ${L('tente', 'try')} ${btn('help')}`);
}
let hist = [], hi = -1, input = null, booted = false, bootTimer = null;
function prompt(focus) {
  const d = print(P + '<input id="cmd" autocomplete="off" spellcheck="false" aria-label="comando">', 'line inl'); input = d.querySelector('input');
  if (focus) input.focus({ preventScroll: true });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = input.value; d.remove(); run(v); if (v.trim()) hist.unshift(v); hi = -1; prompt(true); }
    if (e.key === 'Tab') { e.preventDefault(); const all = [...Object.keys(CMD), ...Object.keys(PROJ).map(k => L('abrir ', 'open ') + k), 'clear']; const m = all.find(x => x.startsWith(input.value)); if (m) input.value = m; }
    if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.min(hi + 1, hist.length - 1); if (hist[hi] !== undefined) input.value = hist[hi]; }
  });
}
function renderChips() {
  const cs = [L('agora', 'now'), L('projetos', 'projects'), L('abrir hapvida', 'open hapvida'), L('abrir medalhas', 'open medalhas'), L('abrir intercambio', 'open exchange'), 'skills', L('olimpiadas', 'olympiads'), L('contato', 'contact'), 'clear'];
  document.getElementById('chips').innerHTML = cs.map(c => `<span data-c="${c}">${c}</span>`).join('');
}
function bootTerminal(instant) {
  clearInterval(bootTimer); out.innerHTML = ''; input = null;
  const boot = [L('[ ok ] carregando café.service', '[ ok ] starting coffee.service'), L('[ ok ] montando /projetos', '[ ok ] mounting /projects'), L('[ ok ] conectando ao LED-UFAL', '[ ok ] connecting to LED-UFAL')];
  const finish = () => { print(LOGO, 'line ascii'); print(L('Olá! Sou o <span class="tk">Pedro</span>. Digite ', "Hi! I'm <span class=\"tk\">Pedro</span>. Type ") + btn('help') + L(' ou comece por ', ' or start with ') + btn(L('agora', 'now')) + '.\n'); prompt(false); };
  if (instant) { boot.forEach(b => print(`<span class="td">${b}</span>`)); finish(); return; }
  let i = 0; bootTimer = setInterval(() => { if (i < boot.length) print(`<span class="td">${boot[i++]}</span>`); else { clearInterval(bootTimer); finish(); } }, 260);
}
win.addEventListener('click', e => {
  const c = e.target.closest('[data-c]');
  if (c) { input && input.closest('.line').remove(); run(c.dataset.c); prompt(true); return; }
  if (e.target.tagName !== 'A') input && input.focus({ preventScroll: true });
});
new IntersectionObserver((es, o) => { if (!es[0].isIntersecting || booted) return; booted = true; o.disconnect(); bootTerminal(false); }, { threshold: .4 }).observe(win);

/* ---------- copiar e-mail ---------- */
document.getElementById('copy').addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation();
  const b = e.currentTarget;
  navigator.clipboard.writeText('pedro.vasconcelosneves@gmail.com').then(() => {
    b.textContent = L('Copiado! ✓', 'Copied! ✓');
    setTimeout(() => (b.textContent = L('Copiar e-mail', 'Copy e-mail')), 1800);
  });
});

/* ---------- começa ---------- */
renderChips();
if (LANG !== 'pt') applyLang(); else document.getElementById('lang').textContent = 'EN';
