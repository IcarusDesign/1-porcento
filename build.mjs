// Gera o site estático em _site/ a partir de conteudo/.
// Uso: node build.mjs            (local, endereços a partir de /)
//      BASE=/1-porcento node build.mjs   (GitHub Pages)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const OUT = path.join(ROOT, '_site');
const BASE = (process.env.BASE || '').replace(/\/$/, '');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'conteudo/site.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ---------- utilidades ----------
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const url = (p = '/') => (/^https?:/.test(p) ? p : BASE + p);
const yes = (v) => /^(sim|yes|true)$/i.test(String(v || '').trim());
const svg = (file, cls) => read(`assets/${file}`).replace('<svg ', `<svg class="${cls}" `);

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${url(h)}">${t}</a>`);
}

function media(src, alt, ratio = '16/9') {
  if (!src) return `<div class="media media--vazio" style="aspect-ratio:${ratio}"><span>${esc(alt || 'Imagem do projeto')}</span></div>`;
  if (/\.(mp4|webm)$/i.test(src))
    return `<div class="media" style="aspect-ratio:${ratio}"><video src="${url(src)}" muted loop playsinline preload="none" data-auto aria-label="${esc(alt)}"></video><button class="video-pausa" type="button" aria-label="Pausar vídeo">Pausar</button></div>`;
  if (!ratio) return `<div class="media media--natural"><img src="${url(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>`;
  return `<div class="media" style="aspect-ratio:${ratio}"><img src="${url(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>`;
}
// Agrupa categorias parecidas para os filtros
const grupo = (c = '') =>
  /log[óo]tipo|identidade/i.test(c) ? 'Identidade e logótipos'
  : /social/i.test(c) ? 'Social media'
  : /capa/i.test(c) ? 'Capas de álbum'
  : /cartaz/i.test(c) ? 'Cartazes'
  : /artwork|ilustra|fotografia/i.test(c) ? 'Artwork'
  : /v[íi]deo|motion/i.test(c) ? 'Vídeo'
  : 'Design gráfico';
const primeiraImagem = (body) => (body.match(/!\[[^\]]*\]\(([^)]+)\)/) || [])[1];

// Markdown mínimo: ## títulos, parágrafos, listas, imagens (lado a lado se na mesma linha)
function markdown(md) {
  const blocks = md.trim().split(/\n\s*\n/);
  return blocks.map((b) => {
    b = b.trim();
    if (b.startsWith('## ')) return `<h2 class="caso-h2 revela">${inline(b.slice(3))}</h2>`;
    const imgs = [...b.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)];
    if (imgs.length && b.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim() === '') {
      const cls = imgs.length > 1 ? 'galeria galeria--duas' : 'galeria';
      return `<div class="${cls} revela">${imgs.map((m) => media(m[2], m[1], m[2] ? null : (imgs.length > 1 ? '4/5' : '16/9'))).join('')}</div>`;
    }
    if (/^- /m.test(b)) return `<ul class="lista revela">${b.split('\n').map((l) => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`;
    return `<p class="revela">${inline(b.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
}

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return [{}, text];
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return [data, m[2]];
}

// ---------- projetos ----------
const dir = path.join(ROOT, 'conteudo/projetos');
const projetos = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.md') && f !== 'LEIA-ME.md')
  .map((f) => {
    const [d, body] = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { ...d, slug: f.replace(/\.md$/, ''), body, ordem: Number(d.ordem) || 99 };
  })
  .sort((a, b) => a.ordem - b.ordem);

// ---------- peças comuns ----------
const contactos = () => {
  const out = [];
  if (site.email) out.push(`<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`);
  if (site.whatsapp) out.push(`<a href="https://wa.me/${esc(site.whatsapp)}" rel="noopener">WhatsApp</a>`);
  return out;
};
const redes = () => site.redes.filter((r) => r.url).map((r) => `<a href="${esc(r.url)}" rel="noopener">${esc(r.nome)}</a>`);

function layout({ titulo, descricao, caminho, imagem, corpo, tema = '' }) {
  const t = titulo ? `${titulo} — ${site.nome}` : `${site.nome} — Design e produção audiovisual`;
  const d = descricao || site.descricao;
  const og = imagem ? `<meta property="og:image" content="${esc(site.url + imagem)}">` : '';
  return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${esc(site.url + caminho)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${esc(site.url + caminho)}">
${og}
<meta name="theme-color" content="#EEE24B">
<link rel="icon" href="${url('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${url('/assets/site.css')}">
</head>
<body class="${tema}">
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
<header class="nav" id="nav">
  <div class="nav__in">
    <a class="nav__logo" href="${url('/')}" aria-label="${site.nome} — início">${svg('logo.svg', 'logo')}</a>
    <button class="nav__menu" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
    <nav id="menu" class="nav__links" aria-label="Principal">
      <a href="${url('/#projetos')}">Projetos</a>
      <a href="${url('/#servicos')}">Serviços</a>
      <a href="${url('/#estudio')}">Estúdio</a>
      <a class="nav__cta" href="${url('/#contacto')}">Vamos conversar</a>
    </nav>
  </div>
</header>
<main id="conteudo">
${corpo}
</main>
<footer class="rodape">
  <div class="caixa rodape__in">
    <div class="rodape__marca">${svg('logo.svg', 'logo')}<p>Estúdio criativo de design e produção audiovisual.<br>Cabo Verde.</p></div>
    <div class="rodape__col"><h2>Contacto</h2>${contactos().join('') || '<span class="pendente">E-mail e WhatsApp por definir</span>'}</div>
    <div class="rodape__col"><h2>Redes</h2>${redes().join('') || '<span class="pendente">Redes por definir</span>'}</div>
    <div class="rodape__base"><span>© ${new Date().getFullYear()} ${site.nome}</span><a href="${url('/privacidade/')}">Política de privacidade</a></div>
  </div>
</footer>
<script>window.SITE = ${JSON.stringify({ formulario: site.formulario, email: site.email })};</script>
<script src="${url('/assets/site.js')}" defer></script>
</body>
</html>`;
}

function cartao(p, i, uniforme = false) {
  const largo = !uniforme && (i === 0 || i % 3 === 0);
  const capa = largo ? (primeiraImagem(p.body) || p.capa) : p.capa;
  return `<a class="projeto ${largo ? 'projeto--largo' : ''} revela" data-cat="${esc(grupo(p.categoria))}" href="${url(`/projetos/${p.slug}/`)}">
    ${p.video ? media(p.video, p.titulo, largo ? '16/9' : '4/3') : media(capa, `Capa do projeto ${p.titulo}`, largo ? '16/9' : '4/3')}
    <div class="projeto__info">
      <div><h3>${esc(p.titulo)}</h3><p>${esc(p.categoria)}${yes(p.conceptual) ? ' · Projeto conceptual' : ''}</p></div>
      <span class="projeto__ver">Ver projeto <span aria-hidden="true">→</span></span>
    </div>
    ${yes(p.exemplo) ? '<span class="etiqueta">Exemplo — substituir</span>' : ''}
  </a>`;
}

// ---------- página inicial ----------
const destaques = projetos.filter((p) => yes(p.destaque)).slice(0, 6);
const servicos = [
  ['Identidade e design', 'Identidade visual, sistemas gráficos, materiais institucionais e peças de comunicação.', 'edificio-paris'],
  ['Vídeo e movimento', 'Vídeos institucionais, campanhas, edição e motion graphics.', ''],
  ['Fotografia e conteúdo', 'Fotografia, captação aérea e conteúdos para plataformas digitais.', 'artwork-cabo-verde'],
];
const processo = [
  ['Entender', 'Conhecer a marca, o público e o objetivo.'],
  ['Definir', 'Estabelecer a ideia e a direção visual.'],
  ['Criar', 'Desenvolver, apresentar e refinar.'],
  ['Entregar', 'Preparar os materiais para a utilização prevista.'],
];

const home = `
<section class="abertura" aria-labelledby="t-abertura">
  <div class="caixa">
    <h1 id="t-abertura" class="abertura__titulo">O detalhe muda&nbsp;tudo<span class="ponto" aria-hidden="true"></span><span class="sr">.</span></h1>
    <p class="abertura__sub">Design e produção audiovisual para marcas que querem ser reconhecidas.</p>
    <div class="acoes">
      <a class="botao botao--preto" href="#projetos">Ver projetos</a>
      <a class="ligacao" href="#contacto">Vamos conversar <span aria-hidden="true">→</span></a>
    </div>
  </div>
</section>

<section class="seccao projetos" id="projetos" aria-labelledby="t-projetos">
  <div class="caixa">
    <div class="seccao__topo revela"><h2 id="t-projetos" class="titulo-seccao">Projetos</h2><p class="intro">Uma seleção de trabalho recente.</p></div>
    <div class="grelha-projetos">${destaques.map((p, i) => cartao(p, i)).join('')}</div>
    <div class="projetos__mais revela">
      ${site.behance ? `<a class="ligacao" href="${esc(site.behance)}" rel="noopener">Mais trabalhos no Behance <span aria-hidden="true">↗</span></a>` : ''}
    </div>
  </div>
</section>

<section class="seccao servicos" id="servicos" aria-labelledby="t-servicos">
  <div class="caixa">
    <h2 id="t-servicos" class="titulo-seccao revela">Da primeira ideia<br>ao último detalhe.</h2>
    <div class="servicos__lista">
      ${servicos.map(([t, d, s], i) => {
        const p = projetos.find((x) => x.slug === s);
        return `<article class="servico revela">
        <span class="servico__num">0${i + 1}</span>
        <div class="servico__texto"><h3>${t}</h3><p>${d}</p>${p ? `<a class="ligacao" href="${url(`/projetos/${p.slug}/`)}">Ver ${esc(p.titulo)} <span aria-hidden="true">→</span></a>` : ''}</div>
        ${p ? `<div class="servico__img">${media(p.capa, t, '4/3')}</div>` : ''}
      </article>`;
      }).join('')}
    </div>
  </div>
</section>

<section class="conceito" aria-labelledby="t-conceito">
  <div class="caixa">
    <h2 id="t-conceito" class="conceito__titulo revela">Há sempre um detalhe<br>que faz a diferença.</h2>
    <p class="conceito__texto revela">O 1 PORCENTO nasce dessa atenção: à ideia, à imagem e à forma como uma marca se apresenta.</p>
    <span class="conceito__um revela" aria-hidden="true">1%</span>
  </div>
</section>

<section class="seccao estudio" id="estudio" aria-labelledby="t-estudio">
  <div class="caixa estudio__grelha">
    <div class="revela">
      <h2 id="t-estudio" class="titulo-seccao">Estúdio</h2>
      <div class="estudio__simbolo">${svg('simbolo.svg', 'simbolo')}</div>
    </div>
    <div class="estudio__texto revela">
      <p class="grande">Um estúdio criativo nascido em Cabo Verde, a trabalhar com marcas locais e internacionais.</p>
      <p>Trabalhamos perto de cada cliente, com uma direção criativa consistente do primeiro esboço à entrega final. Conforme o projeto, juntamos fotógrafos, realizadores e outros profissionais de confiança.</p>
      <p class="pendente">[Opcional: apresentação do fundador — nome, percurso e uma frase sobre a forma de trabalhar.]</p>
      <ul class="principios">
        <li><strong>Proximidade</strong> com o cliente em cada etapa.</li>
        <li><strong>Direção criativa</strong> consistente.</li>
        <li><strong>Cuidado</strong> na execução, até ao último detalhe.</li>
      </ul>
    </div>
  </div>
</section>

<section class="seccao processo" aria-labelledby="t-processo">
  <div class="caixa">
    <h2 id="t-processo" class="titulo-seccao revela">Como trabalhamos</h2>
    <ol class="processo__passos">
      ${processo.map(([t, d], i) => `<li class="revela"><span class="passo__num">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="contacto" id="contacto" aria-labelledby="t-contacto">
  <div class="caixa contacto__grelha">
    <div class="revela">
      <h2 id="t-contacto" class="contacto__titulo">O próximo projeto<br>pode começar aqui.</h2>
      <div class="contacto__canais">${contactos().join('') || '<span class="pendente">[E-mail e WhatsApp por definir]</span>'}</div>
    </div>
    <form class="form revela" id="form" novalidate>
      <div class="campo"><label for="f-nome">Nome</label><input id="f-nome" name="nome" autocomplete="name" required></div>
      <div class="campo"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="campo"><label for="f-marca">Marca ou empresa <span class="opcional">(opcional)</span></label><input id="f-marca" name="marca" autocomplete="organization"></div>
      <div class="campo"><label for="f-tipo">Tipo de projeto</label>
        <select id="f-tipo" name="tipo" required>
          <option value="">Escolher…</option>
          <option>Identidade e design</option><option>Vídeo e movimento</option><option>Fotografia e conteúdo</option><option>Outro / vários</option>
        </select></div>
      <div class="campo campo--largo"><label for="f-desc">Breve descrição</label><textarea id="f-desc" name="descricao" rows="4" required></textarea></div>
      <input class="armadilha" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="form__fim campo--largo">
        <button class="botao botao--preto" type="submit">Falar sobre um projeto</button>
        <p class="form__estado" role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>`;

// ---------- página de projeto ----------
function paginaProjeto(p, i) {
  const seguinte = projetos[(i + 1) % projetos.length];
  const creditos = (p.creditos || '').split(';').map((c) => c.trim()).filter(Boolean);
  const servs = (p.servicos || '').split(',').map((s) => s.trim()).filter(Boolean);
  return layout({
    titulo: p.titulo, descricao: p.resumo, caminho: `/projetos/${p.slug}/`, imagem: p.capa,
    corpo: `
<article class="caso">
  <header class="caso__topo">
    <div class="caixa">
      <p class="caso__cat">${esc(p.categoria)}${p.ano ? ` · ${esc(p.ano)}` : ''}${yes(p.conceptual) ? ' · Projeto conceptual' : ''}</p>
      <h1 class="caso__titulo">${esc(p.titulo)}</h1>
      ${p.resumo ? `<p class="caso__resumo">${esc(p.resumo)}</p>` : ''}
      ${yes(p.exemplo) ? '<p class="etiqueta etiqueta--fixa">Exemplo — substituir pelo projeto real</p>' : ''}
    </div>
  </header>
  ${p.video || !primeiraImagem(p.body) ? `<div class="caixa caso__capa">${p.video ? media(p.video, p.titulo) : media(p.capa, 'Imagem principal do projeto')}</div>` : ''}
  <div class="caixa caso__corpo">
    ${markdown(p.body)}
    <div class="caso__ficha revela">
      <div><h2>Cliente</h2><p>${esc(p.cliente || '—')}</p></div>
      <div><h2>Serviços</h2><ul>${servs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><h2>Créditos</h2><ul>${creditos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
      ${p.behance ? `<div><h2>Também no</h2><p><a class="ligacao" href="${esc(p.behance)}" rel="noopener">Behance <span aria-hidden="true">↗</span></a></p></div>` : ''}
    </div>
  </div>
  <nav class="caso__seguinte" aria-label="Próximo projeto">
    <a class="caixa" href="${url(`/projetos/${seguinte.slug}/`)}"><span>Próximo projeto</span><strong>${esc(seguinte.titulo)} <span aria-hidden="true">→</span></strong></a>
  </nav>
</article>
<section class="contacto contacto--curto">
  <div class="caixa"><h2 class="contacto__titulo">Tem um projeto em mente?</h2><a class="botao botao--preto" href="${url('/#contacto')}">Falar sobre um projeto</a></div>
</section>`,
  });
}

const privacidade = layout({
  titulo: 'Política de privacidade', caminho: '/privacidade/',
  corpo: `<article class="caso"><header class="caso__topo"><div class="caixa"><h1 class="caso__titulo">Política de privacidade</h1></div></header>
  <div class="caixa caso__corpo">
    <p class="pendente">[Texto provisório — rever antes da publicação.]</p>
    <p>Os dados enviados pelo formulário de contacto (nome, e-mail, marca e descrição do projeto) são usados apenas para responder ao seu pedido e não são partilhados com terceiros para fins comerciais.</p>
    <p>Este site não usa cookies de publicidade. Para pedir a consulta ou eliminação dos seus dados, contacte-nos${site.email ? ` através de <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ''}.</p>
  </div></article>`,
});

// ---------- escrever ----------
fs.rmSync(OUT, { recursive: true, force: true });
const write = (p, html) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), html); };
write('index.html', layout({ caminho: '/', corpo: home, tema: 'inicio' }));
projetos.forEach((p, i) => write(`projetos/${p.slug}/index.html`, paginaProjeto(p, i)));
write('privacidade/index.html', privacidade);
write('404.html', layout({ titulo: 'Página não encontrada', caminho: '/404.html', corpo: `<section class="abertura abertura--curta"><div class="caixa"><h1 class="abertura__titulo">Falta aqui 1%.</h1><p class="abertura__sub">Esta página não existe.</p><div class="acoes"><a class="botao botao--preto" href="${url('/')}">Voltar ao início</a></div></div></section>` }));
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
if (fs.existsSync(path.join(ROOT, 'media'))) fs.cpSync(path.join(ROOT, 'media'), path.join(OUT, 'media'), { recursive: true });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...projetos.map((p) => `/projetos/${p.slug}/`)].map((u) => `<url><loc>${site.url}${u}</loc></url>`).join('')}</urlset>\n`);
console.log(`Site gerado em _site/ (${projetos.length} projetos, BASE="${BASE}")`);
