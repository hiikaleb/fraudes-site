/* ===================================================
   fraude. — common.js
   Header, footer, menu, login demo, animações e share
   compartilhados entre todas as páginas do site.
   =================================================== */
(function(){

  const LOGO_SVG = '<svg class="logo-mark" viewBox="0 0 120 120" aria-hidden="true"><path d="M22 8 H92 V34 H46 V54 H82 V80 H46 V112 L22 96 Z" fill="#d81922"/></svg>';

  const NAV_ITEMS = [
    { href: 'index.html', label: 'Início', key: 'home' },
    { href: 'golpes.html', label: 'Os golpes', key: 'golpes' },
    { href: 'gatilhos.html', label: 'Como funciona', key: 'gatilhos' },
    { href: 'noticias.html', label: 'Notícias', key: 'noticias' },
    { href: 'dashboard.html', label: 'Dados da pesquisa', key: 'dashboard' },
    { href: 'opiniao.html', label: 'Opinião', key: 'opiniao' },
    { href: 'sobre.html', label: 'Sobre / créditos', key: 'sobre' }
  ];

  const activePage = document.body.getAttribute('data-page') || '';

  /* ---------- HEADER ---------- */
  function buildHeader(){
    const navHtml = NAV_ITEMS.map(item =>
      `<a href="${item.href}"${item.key === activePage ? ' class="active"' : ''}>${item.label}</a>`
    ).join('');

    return `
    <div class="breaking">
      <div class="breaking-inner">
        <span class="breaking-tag">Alerta</span>
        <div class="breaking-track">
          <div class="breaking-marquee">
            <span>Golpes por engenharia social respondem por até 40% das fraudes financeiras no Brasil — dados oficiais e pesquisa própria do CETEP.</span>
            <span>Aplicativos bancários permanecem tecnicamente invioláveis: as fraudes ocorrem por manipulação da vítima, segundo FEBRABAN (2025).</span>
            <span>Golpes por engenharia social respondem por até 40% das fraudes financeiras no Brasil — dados oficiais e pesquisa própria do CETEP.</span>
            <span>Aplicativos bancários permanecem tecnicamente invioláveis: as fraudes ocorrem por manipulação da vítima, segundo FEBRABAN (2025).</span>
          </div>
        </div>
      </div>
    </div>

    <header class="masthead">
      <div class="wrap masthead-inner">
        <a href="index.html" class="logo">
          ${LOGO_SVG}
          <div class="logo-divider"></div>
          <div>
            <div class="logo-text">fraude<span>.</span></div>
            <div class="logo-tagline">Engenharia social · Golpes digitais</div>
          </div>
        </a>
        <div class="masthead-right">
          <div class="masthead-date">Barreiras, BA · CETEP Bacia do Rio Grande</div>
          <div id="auth-slot"></div>
          <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>

    <div class="subnav">
      <div class="wrap">
        <nav class="subnav-inner" id="subnav-inner">${navHtml}</nav>
      </div>
    </div>`;
  }

  /* ---------- FOOTER ---------- */
  function buildFooter(){
    return `
    <div class="wrap footer-grid">
      <div>
        <div class="footer-brand-row">
          <svg class="footer-logo-mark" viewBox="0 0 120 120" aria-hidden="true"><path d="M22 8 H92 V34 H46 V54 H82 V80 H46 V112 L22 96 Z" fill="#d81922"/></svg>
          <div class="footer-brand">fraude<span>.</span></div>
        </div>
        <div class="footer-meta">Site desenvolvido como material de apoio ao Trabalho de Conclusão de Curso "Como a engenharia social é usada em golpes digitais e como prevenir esses ataques por meio de educação e tecnologia" — Curso Técnico em Informática, CETEP Bacia do Rio Grande, Barreiras/BA, 2026.</div>
      </div>
      <div class="footer-links">
        <a href="index.html">Início</a>
        <a href="golpes.html">Os golpes</a>
        <a href="noticias.html">Notícias</a>
        <a href="dashboard.html">Dados da pesquisa</a>
        <a href="opiniao.html">Opinião</a>
        <a href="sobre.html">Sobre / créditos</a>
      </div>
    </div>
    <div class="wrap footer-tag">Protótipo acadêmico — não representa um serviço de notícias oficial nem um banco ou instituição financeira real.</div>`;
  }

  /* ---------- LOGIN MODAL ---------- */
  function buildLoginModal(){
    if(document.getElementById('login-modal')) return;
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.id = 'login-modal';
    div.setAttribute('aria-hidden','true');
    div.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button type="button" class="modal-close" id="login-close" aria-label="Fechar">&times;</button>
        <div class="modal-title" id="login-title">Área do leitor</div>
        <div class="modal-sub">Entre para comentar e acessar os recursos da área do leitor.</div>
        <form id="login-form" novalidate>
          <div class="field"><label for="login-email">E-mail</label><input type="email" id="login-email" autocomplete="email" placeholder="seu@email.com" required></div>
          <div class="field"><label for="login-senha">Senha</label><input type="password" id="login-senha" autocomplete="current-password" placeholder="••••••••" required minlength="6"></div>
          <div id="login-error" class="login-error" role="alert" aria-live="polite"></div>
          <button type="submit" class="submit-btn" id="login-submit">Entrar</button>
        </form>
        <div class="modal-note" id="login-note">Firebase será usado automaticamente quando o projeto estiver configurado.</div>
      </div>`;
    document.body.appendChild(div);
  }

  function closeLogin(){
    const modal=document.getElementById('login-modal');
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }

  function openLogin(){
    const modal=document.getElementById('login-modal');
    if(!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    const input=document.getElementById('login-email');
    window.setTimeout(()=>input && input.focus(), 80);
  }

  function renderAuthSlot(){
    const slot = document.getElementById('auth-slot');
    if(!slot) return;
    const firebaseAuth = window.FRAUDE_FIREBASE && window.FRAUDE_FIREBASE.auth;
    const firebaseUser = firebaseAuth && firebaseAuth.currentUser;
    const session = firebaseUser ? (firebaseUser.displayName || firebaseUser.email || 'leitor') : localStorage.getItem('fraude_demo_user');

    if(session){
      slot.innerHTML = `<div class="user-chip"><span class="dot"></span> Olá, ${escapeHtml(session)} <button type="button" id="logout-btn">Sair</button></div>`;
      document.getElementById('logout-btn').addEventListener('click', async function(){
        try { if(firebaseAuth) await firebaseAuth.signOut(); } catch(err) { console.warn(err); }
        localStorage.removeItem('fraude_demo_user');
        localStorage.removeItem('fraude_uid');
        renderAuthSlot();
        document.dispatchEvent(new CustomEvent('fraude:authchange',{detail:{user:null}}));
      });
    } else {
      slot.innerHTML = `<button type="button" class="btn-login" id="login-open">Entrar</button>`;
      document.getElementById('login-open').addEventListener('click', openLogin);
    }
  }

  function escapeHtml(str){
    const div=document.createElement('div'); div.textContent=String(str ?? ''); return div.innerHTML;
  }

  function wireLoginModal(){
    const modal=document.getElementById('login-modal');
    if(!modal) return;
    document.getElementById('login-close').addEventListener('click', closeLogin);
    modal.addEventListener('click', e=>{ if(e.target===modal) closeLogin(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeLogin(); });

    const form=document.getElementById('login-form');
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const email=document.getElementById('login-email').value.trim();
      const senha=document.getElementById('login-senha').value;
      const error=document.getElementById('login-error');
      const submit=document.getElementById('login-submit');
      error.textContent='';
      if(!email || !senha){ error.textContent='Preencha e-mail e senha.'; return; }
      submit.disabled=true; submit.textContent='Entrando…';

      try{
        const auth=window.FRAUDE_FIREBASE && window.FRAUDE_FIREBASE.auth;
        if(auth){
          const result=await auth.signInWithEmailAndPassword(email, senha);
          localStorage.setItem('fraude_demo_user', result.user.displayName || email.split('@')[0]);
          localStorage.setItem('fraude_uid', result.user.uid);
        } else {
          // Modo local apenas quando Firebase ainda não foi configurado.
          localStorage.setItem('fraude_demo_user', email.split('@')[0]);
          localStorage.setItem('fraude_uid', 'demo-' + btoa(unescape(encodeURIComponent(email))).replace(/[^a-z0-9]/gi,'').slice(0,24));
        }
        closeLogin();
        renderAuthSlot();
        document.dispatchEvent(new CustomEvent('fraude:authchange',{detail:{user:(window.FRAUDE_FIREBASE&&window.FRAUDE_FIREBASE.auth&&window.FRAUDE_FIREBASE.auth.currentUser)||null}}));
      }catch(err){
        console.warn('Falha no login:', err);
        const code=err && err.code;
        error.textContent = code==='auth/invalid-credential' || code==='auth/wrong-password' || code==='auth/user-not-found'
          ? 'E-mail ou senha incorretos.'
          : (err && err.message ? err.message.replace('Firebase: ','') : 'Não foi possível entrar.');
      }finally{
        submit.disabled=false; submit.textContent='Entrar';
      }
    });
  }

  /* ---------- MOBILE MENU ---------- */
  function wireMobileMenu(){
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('subnav-inner');
    toggle.addEventListener('click', function(){
      nav.classList.toggle('open');
    });
  }

  /* ---------- REVEAL ON SCROLL ---------- */
  function wireReveal(){
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- COUNT-UP NUMBERS ---------- */
  function wireCounters(){
    const els = document.querySelectorAll('.count-up');
    if(!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
        const duration = 1200;
        const start = performance.now();
        function tick(now){
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = val.toFixed(decimals).replace('.', ',') + suffix;
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- SHARE BUTTONS ---------- */
  function wireShare(){
    const buttons = document.querySelectorAll('.share-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', function(){
        const network = btn.dataset.network;
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        let target = '';
        if(network === 'whatsapp') target = `https://wa.me/?text=${title}%20${url}`;
        else if(network === 'twitter') target = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        else if(network === 'facebook') target = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        else if(network === 'copy'){
          navigator.clipboard.writeText(window.location.href).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '✓';
            setTimeout(() => btn.innerHTML = original, 1400);
          });
          return;
        }
        if(target) window.open(target, '_blank', 'noopener,width=600,height=500');
      });
    });
  }

  /* ---------- FOTOS REAIS (auto-upgrade dos photo-blocks) ----------
     Cada .photo-block pode receber um atributo data-img="images/arquivo.jpg".
     Se o arquivo existir, a foto substitui o degradê automaticamente.
     Se não existir (ainda não foi enviado), o degradê + ícone continuam
     aparecendo normalmente — nada quebra. Basta colocar os arquivos na
     pasta /images com os nomes indicados que a foto some no lugar certo,
     sem tocar em nenhum HTML.

     Para os cards de NOTÍCIA (páginas com link externo), há também
     data-remote="https://...jpg" — a capa real hospedada no site da
     fonte original (não é uma cópia salva aqui, é um link direto pra
     imagem que já está no ar na matéria). data-img local tem
     prioridade; data-remote só entra se não existir arquivo local. */
  function wirePhotos(){
    document.querySelectorAll('.photo-block[data-img]').forEach(function(el){
      const src = el.getAttribute('data-img');
      const remote = el.getAttribute('data-remote');
      const probe = new Image();
      probe.onload = function(){
        el.style.backgroundImage = "url('" + src + "')";
        el.classList.add('has-photo');
      };
      probe.onerror = function(){
        if(!remote) return;
        const probe2 = new Image();
        probe2.onload = function(){
          el.style.backgroundImage = "url('" + remote + "')";
          el.classList.add('has-photo', 'has-photo-remote');
        };
        probe2.src = remote;
      };
      probe.src = src;
    });
  }

  /* ---------- TRANSIÇÃO ANIMADA ENTRE ABAS/PÁGINAS ----------
     Site é multi-página (cada aba é um .html separado), então a
     "troca de aba" anima a saída da página atual e a entrada da
     próxima: ao clicar num link interno, o corpo dá um fade/slide
     de saída e só então o navegador troca de página; a página que
     chega já nasce com um fade/slide de entrada (ver .page-enter
     no CSS, aplicada por padrão no <body>). */
  function wirePageTransitions(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.body.classList.add('page-enter');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ document.body.classList.add('page-enter-in'); });
    });

    const bar = document.createElement('div');
    bar.className = 'page-loadbar';
    document.documentElement.appendChild(bar);

    document.addEventListener('click', function(e){
      const link = e.target.closest('a[href]');
      if(!link) return;
      if(link.target === '_blank' || link.hasAttribute('download')) return;
      if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = link.getAttribute('href') || '';
      if(!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
      if(!href.endsWith('.html')) return;
      e.preventDefault();
      bar.classList.add('active');
      document.body.classList.remove('page-enter-in');
      document.body.classList.add('page-exit');
      setTimeout(function(){ window.location.href = href; }, 220);
    });
  }

  /* ---------- TELA DE CARREGAMENTO ---------- */
  function buildLoadingScreen(){
    if(document.getElementById('site-loading')) return;
    const loading = document.createElement('div');
    loading.id = 'site-loading';
    loading.className = 'site-loading';
    loading.innerHTML = `
      <div class="site-loading-inner" aria-label="Carregando">
        <div class="loading-mark">f<span>.</span></div>
        <div class="loading-line"><i></i></div>
        <div class="loading-label">carregando conteúdo</div>
      </div>`;
    document.documentElement.appendChild(loading);
    requestAnimationFrame(() => loading.classList.add('is-visible'));
    window.setTimeout(() => {
      loading.classList.add('is-done');
      window.setTimeout(() => loading.remove(), 420);
    }, 520);
  }

  /* Expõe abrir-login para outras páginas (ex: painel exclusivo do dashboard) */
  window.FRAUDE_OPEN_LOGIN = openLogin;

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', function(){
    buildLoadingScreen();
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if(headerSlot) headerSlot.innerHTML = buildHeader();
    if(footerSlot) footerSlot.innerHTML = buildFooter();
    buildLoginModal();
    renderAuthSlot();
    wireLoginModal();
    wireMobileMenu();
    wireReveal();
    wireCounters();
    wireShare();
    wirePhotos();
    wirePageTransitions();
  });

  /* garante que, ao voltar pelo botão "voltar" do navegador (bfcache),
     a página não fique presa no estado de saída (invisível) */
  window.addEventListener('pageshow', function(e){
    if(e.persisted){
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-enter-in');
    }
  });
})();
