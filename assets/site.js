(() => {
  const html = document.documentElement;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => html.classList.add('pronto'));

  // Entradas ao chegar à secção
  const els = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window && !calmo) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('visivel'));
  }

  // Menu no telemóvel
  const nav = document.getElementById('nav');
  const botao = nav.querySelector('.nav__menu');
  const fechar = () => { nav.classList.remove('aberto'); botao.setAttribute('aria-expanded', 'false'); botao.textContent = 'Menu'; };
  botao.addEventListener('click', () => {
    const aberto = nav.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', String(aberto));
    botao.textContent = aberto ? 'Fechar' : 'Menu';
  });
  nav.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', fechar));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  // Vídeos: só tocam quando visíveis, sem som, com botão de pausa
  document.querySelectorAll('video[data-auto]').forEach((v) => {
    const b = v.parentElement.querySelector('.video-pausa');
    let pausado = calmo;
    const atualizar = () => { b.textContent = pausado ? 'Reproduzir' : 'Pausar'; b.setAttribute('aria-label', pausado ? 'Reproduzir vídeo' : 'Pausar vídeo'); };
    atualizar();
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pausado = !pausado; pausado ? v.pause() : v.play(); atualizar(); });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !pausado) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 }).observe(v);
  });

  // Formulário de contacto
  const form = document.getElementById('form');
  if (!form) return;
  const estado = form.querySelector('.form__estado');
  const cfg = window.SITE || {};

  const limparErro = (campo) => { campo.classList.remove('erro'); campo.querySelector('.msg-erro')?.remove(); };
  form.querySelectorAll('input, select, textarea').forEach((el) => el.addEventListener('input', () => limparErro(el.closest('.campo') || form)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let primeiro = null;
    form.querySelectorAll('[required]').forEach((el) => {
      const campo = el.closest('.campo');
      limparErro(campo);
      let msg = '';
      if (!el.value.trim()) msg = 'Preencha este campo.';
      else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) msg = 'Verifique o e-mail (ex.: nome@empresa.com).';
      if (msg) {
        campo.classList.add('erro');
        const id = el.id + '-erro';
        campo.insertAdjacentHTML('beforeend', `<span class="msg-erro" id="${id}">${msg}</span>`);
        el.setAttribute('aria-describedby', id);
        el.setAttribute('aria-invalid', 'true');
        primeiro ??= el;
      } else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    });
    if (primeiro) { estado.textContent = 'Falta corrigir alguns campos.'; primeiro.focus(); return; }

    const dados = new FormData(form);
    if (dados.get('_gotcha')) return; // spam

    if (!cfg.formulario) {
      if (cfg.email) {
        const corpo = `Nome: ${dados.get('nome')}\nE-mail: ${dados.get('email')}\nMarca: ${dados.get('marca') || '—'}\nTipo: ${dados.get('tipo')}\n\n${dados.get('descricao')}`;
        location.href = `mailto:${cfg.email}?subject=${encodeURIComponent('Novo projeto — ' + dados.get('tipo'))}&body=${encodeURIComponent(corpo)}`;
        estado.textContent = 'A abrir o seu programa de e-mail…';
      } else {
        estado.textContent = 'O formulário ainda não está ligado. O seu texto foi mantido.';
      }
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; estado.textContent = 'A enviar…';
    try {
      const r = await fetch(cfg.formulario, { method: 'POST', body: dados, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      form.classList.add('enviado');
      form.innerHTML = `<div class="confirmacao" tabindex="-1"><h3>Obrigado, ${String(dados.get('nome')).split(' ')[0].replace(/[<>&]/g, '')}.</h3><p>Recebemos a sua mensagem e respondemos em breve.</p></div>`;
      form.querySelector('.confirmacao').focus();
    } catch {
      btn.disabled = false;
      estado.textContent = `Não foi possível enviar agora. O seu texto foi mantido — tente de novo${cfg.email ? ' ou escreva para ' + cfg.email : ''}.`;
    }
  });
})();

// Filtro na página de todos os projetos
(() => {
  const f = document.querySelector('.filtros');
  if (!f) return;
  f.hidden = false;
  const cards = document.querySelectorAll('.grelha-projetos--tres .projeto');
  f.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    f.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    cards.forEach((c) => { c.hidden = !!b.dataset.filtro && c.dataset.cat !== b.dataset.filtro; c.classList.add('visivel'); });
  });
})();
