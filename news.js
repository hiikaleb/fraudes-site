/* ===================================================
   fraude. — news.js (reescrito)

   Antes: "Destaques curados" (fixo) + "Últimas notícias" (feed
   automático, seção separada) + "Histórico" (os mesmos 6 itens
   curados, sempre escondidos). Resultado: notícia nova nunca
   aparecia em destaque, e o histórico não tinha função real.

   Agora: existe UMA lista só. Notícias curadas + notícias
   encontradas automaticamente entram nela e são ordenadas por
   data. As mais recentes (até DESTAQUE_LIMIT) aparecem em
   "Destaques"; o que sobra — porque é mais antigo — vai para
   "Histórico". Assim, toda atualização nova sobe para destaque
   de verdade, e o histórico passa a guardar só o que é antigo.
   =================================================== */
(function(){

  const DESTAQUE_LIMIT = 6;

  const COVER_STYLES = [
    { cls:'pb-red',    icon:'<path d="M4 20V10M12 20V4M20 20v-7"/>' },
    { cls:'pb-ink',    icon:'<path d="M4 7h16M4 12h16M4 17h10"/>' },
    { cls:'pb-purple', icon:'<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z"/>' },
    { cls:'pb-blue',   icon:'<rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 8l9 6 9-6"/>' },
    { cls:'pb-amber',  icon:'<path d="M12 3a4 4 0 014 4v3a4 4 0 01-8 0V7a4 4 0 014-4Z"/><path d="M6 11a6 6 0 0012 0M12 17v4"/>' },
    { cls:'pb-green',  icon:'<path d="M6 4h8l4 4v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1Z"/><path d="M9 10h6M9 14h4"/>' },
  ];

  /* ---------- notícias curadas pela equipe (base fixa) ---------- */
  const CURATED = [
    {
      id:'curated-1', lang:'PT', cat:'Brasil', catClass:'cat-red', outlet:'Agência Brasil',
      url:'https://agenciabrasil.ebc.com.br/geral/noticia/2026-08/engenharia-social-responde-por-40-das-fraudes-financeiras-no-brasil',
      date:'2026-08-22T21:03:00', dateLabel:'22/08/2026 às 21h03',
      title:'Engenharia social responde por 40% das fraudes financeiras no Brasil',
      summary:'Levantamento mostra que golpes com manipulação da vítima — não falhas técnicas — lideram as fraudes registradas no país, com celular e Pix como principais meios.',
      img:'images/noticia-1.jpg', remote:'https://www.tnh1.com.br/media/_versions/2026/08/captura-de-tela-2026-08-22-162326_widelg.png',
      cover:0
    },
    {
      id:'curated-2', lang:'PT', cat:'Brasil', catClass:'cat-outline-red', outlet:'Valor Econômico',
      url:'https://valor.globo.com/publicacoes/especiais/seguranca-digital/noticia/2026/06/30/engenharia-social-testa-limites-dos-bancos-na-corrida-contra-golpes-via-pix.ghtml',
      date:'2026-06-30T12:00:00', dateLabel:'30/06/2026',
      title:'Engenharia social testa limites dos bancos na corrida contra golpes via Pix',
      summary:'Instituições financeiras reforçam rastreamento e prevenção em tempo real para tentar recuperar recursos desviados por golpes de manipulação.',
      img:'images/noticia-2.jpg', remote:null,
      cover:1
    },
    {
      id:'curated-3', lang:'PT', cat:'Institucional', catClass:'cat-purple', outlet:'Ministério Público de SC',
      url:'https://www.mpsc.mp.br/w/artigo/fraudes-cibern%C3%A9ticas-e-engenharia-social-a-resposta-do-minist%C3%A9rio-p%C3%BAblico-%C3%A0-nova-criminalidade-organizada',
      date:'2026-02-28T12:00:00', dateLabel:'28/02/2026',
      title:'Fraudes cibernéticas e engenharia social: a resposta do Ministério Público',
      summary:'Artigo institucional mapeia as modalidades mais recorrentes — golpe do falso advogado, phishing, spear phishing — e a atuação do MP contra o crime organizado digital.',
      img:'images/noticia-3.jpg', remote:null,
      cover:2
    },
    {
      id:'curated-4', lang:'EN', cat:'Internacional', catClass:'cat-blue', outlet:'Bitdefender',
      url:'https://www.bitdefender.com/en-us/blog/hotforsecurity/brazilians-continue-under-heavy-phishing-attack-with-banco-itau-bradesco-impersonations',
      date:'2025-06-01T12:00:00', dateLabel:'Data e horário não divulgados pela fonte',
      title:'Brazilians Continue Under Heavy Phishing Attack with Banco Itaú, Bradesco Impersonations',
      summary:'Análise internacional de segurança digital mapeia campanhas de phishing direcionadas a clientes de bancos brasileiros, com técnicas de imitação cada vez mais refinadas.',
      img:'images/noticia-4.jpg', remote:null,
      cover:3
    },
    {
      id:'curated-5', lang:'EN', cat:'Internacional', catClass:'cat-amber', outlet:'ICAEW',
      url:'https://www.icaew.com/insights/viewpoints-on-the-news/2025/jan-2025/how-to-guard-against-voice-cloning-and-deepfake-scams',
      date:'2025-01-15T12:00:00', dateLabel:'Janeiro de 2025 (dia e horário não divulgados)',
      title:'How to guard against voice cloning and deepfake scams',
      summary:'Guia de uma entidade contábil britânica sobre como golpes com clonagem de voz por IA têm avançado — e quais protocolos de verificação reduzem o risco.',
      img:'images/noticia-5.jpg', remote:null,
      cover:4
    },
    {
      id:'curated-6', lang:'PT', cat:'Brasil', catClass:'cat-green', outlet:'O Regional',
      url:'https://www.oregional.com.br/noticias/uma-ligacao-que-custou-r-22450-golpe-de-engenharia-social-e-responsabilidade-do-banco',
      date:'2025-05-01T12:00:00', dateLabel:'Data e horário não divulgados pela fonte',
      title:'Uma ligação que custou R$ 22.450 — golpe de engenharia social e responsabilidade do banco',
      summary:'Artigo analisa um caso concreto de vishing e discute até onde vai a responsabilidade da instituição financeira diante da manipulação da vítima.',
      img:'images/noticia-6.jpg', remote:null,
      cover:5
    },
    {
      id:'curated-7', lang:'PT', cat:'Internacional', catClass:'cat-blue', outlet:'ACI Worldwide / Business Wire',
      url:'https://www.businesswire.com/news/home/20241119020998/pt',
      date:'2024-11-19T12:00:00', dateLabel:'19/11/2024',
      title:'Brasil projeta maior crescimento em fraudes de pagamentos em tempo real no mundo, aponta relatório Scamscope',
      summary:'Relatório da ACI Worldwide em parceria com a GlobalData estima que perdas com golpes via Pix podem chegar a R$ 11 bilhões até 2028, com engenharia social como principal técnica usada.',
      img:'images/noticia-7.jpg', remote:'https://mms.businesswire.com/media/20241119020998/pt/2308239/22/ACI_Horizontal_Blue.jpg',
      cover:3
    },
  ];

  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const text=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();

  /* ---------- feed automático (Google News RSS via proxy CORS, sem exigir chave) ----------
     Antes: rss2json.com. Sem chave de API, esse serviço bloqueia a maioria
     dos pedidos anônimos (erro 429 "many people are using this at once"),
     por isso nunca trazia nada novo. Agora: busca o XML do Google Notícias
     direto, através de um proxy CORS público (sem cadastro), e faz o parse
     do XML no próprio navegador. Duas rotas de proxy, para o caso de uma
     estar fora do ar. */
  const FEEDS = [
    { url:'https://news.google.com/rss/search?q=golpe%20OR%20fraude%20OR%20phishing%20OR%20%22engenharia%20social%22&hl=pt-BR&gl=BR&ceid=BR:pt-419', lang:'PT' },
    { url:'https://news.google.com/rss/search?q=fraude%20digital%20OR%20golpe%20digital%20OR%20phishing&hl=pt-BR&gl=BR&ceid=BR:pt-419', lang:'PT' },
  ];
  const KEYWORDS=['golpe','golpes','fraude','fraudes','phishing','engenharia social','clonagem','deepfake','vishing','smishing','cibercrime','cybercrime','malware','pix'];
  const match=t=>KEYWORDS.some(k=>t.toLowerCase().includes(k));

  const CORS_PROXIES = [
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  ];

  async function fetchViaProxy(url){
    let lastErr;
    for(const buildProxyUrl of CORS_PROXIES){
      try{
        const r = await fetch(buildProxyUrl(url), { cache:'no-store' });
        if(!r.ok) throw new Error('http ' + r.status);
        const text = await r.text();
        if(!text || text.length < 50) throw new Error('resposta vazia');
        return text;
      }catch(e){ lastErr = e; }
    }
    throw lastErr || new Error('todos os proxies falharam');
  }

  function parseRssXml(xmlText, lang){
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if(doc.querySelector('parsererror')) throw new Error('xml inválido');
    return Array.from(doc.querySelectorAll('item')).map((it, idx) => {
      const title = it.querySelector('title')?.textContent || '';
      const link = it.querySelector('link')?.textContent || '';
      const pubDate = it.querySelector('pubDate')?.textContent || '';
      const source = it.querySelector('source')?.textContent || it.getElementsByTagNameNS('*','source')[0]?.textContent || 'Google Notícias';
      const descRaw = it.querySelector('description')?.textContent || '';
      return {
        id: 'live-' + btoa(unescape(encodeURIComponent(link || title || String(idx)))).slice(0,16).replace(/[^a-z0-9]/gi,''),
        lang, cat:'Atualização', catClass:'cat-outline-red', outlet: source || 'Google Notícias',
        url: link, date: pubDate || new Date().toISOString(), dateLabel: formatDate(pubDate),
        title: text(title), summary: text(descRaw).slice(0,190),
        img:null, remote:'', cover: idx % COVER_STYLES.length, isLive:true
      };
    });
  }

  async function fetchFeed(feed){
    const xml = await fetchViaProxy(feed.url);
    return parseRssXml(xml, feed.lang);
  }
  function formatDate(iso){
    try{ return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
    catch(e){ return 'Data não divulgada'; }
  }

  /* ---------- render ---------- */
  function coverSvg(idx){ return COVER_STYLES[idx % COVER_STYLES.length]; }

  function cardHtml(item){
    const style = coverSvg(item.cover);
    const remoteAttr = item.remote ? ` data-remote="${esc(item.remote)}"` : '';
    const imgAttr = item.img ? ` data-img="${esc(item.img)}"` : '';
    const liveTag = item.isLive ? '<span class="cat-tag cat-outline-red" style="position:absolute; top:10px; right:10px; z-index:2; background:#fff;">Novo</span>' : '';
    return `
      <a class="news-card reveal in" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" data-news-id="${item.id}">
        <div class="photo-block ${style.cls}"${imgAttr}${remoteAttr} data-cover="${String(item.cover+1).padStart(2,'0')}">
          <span class="photo-outlet">${esc(item.outlet)}</span>
          <span class="cat-tag ${item.catClass}">${esc(item.cat)}</span>
          ${liveTag}
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6">${style.icon}</svg>
        </div>
        <div class="news-body">
          <div class="news-source"><span>${esc(item.outlet)}</span><span class="lang-badge">${esc(item.lang)}</span></div>
          <div class="news-date">${esc(item.dateLabel)}</div>
          <div class="news-title">${esc(item.title)}</div>
          <p class="news-snippet">${esc(item.summary)}</p>
          <span class="news-readmore">${item.lang==='EN' ? 'Read on original site →' : 'Ler no site original →'}</span>
        </div>
      </a>`;
  }

  function timelineHtml(items){
    const groups = {};
    items.forEach(it=>{
      const d = new Date(it.date);
      const valid = !isNaN(d.getTime());
      const key = valid ? d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}) : 'Data não divulgada pela fonte';
      groups[key] = groups[key] || [];
      groups[key].push(it);
    });
    return Object.entries(groups).map(([label, its]) => `
      <div class="timeline-group-label">${esc(label)}</div>
      ${its.map(it => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-date">${esc(it.dateLabel)}</div>
          <div class="timeline-title"><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></div>
          <div class="timeline-source">${esc(it.outlet)}</div>
        </div>`).join('')}
    `).join('');
  }

  /* progressive image loading para os cards renderizados dinamicamente
     (a rotina do common.js só varre o que já existe no DOMContentLoaded) */
  function wirePhotosIn(container){
    container.querySelectorAll('.photo-block[data-img], .photo-block[data-remote]').forEach(function(el){
      const src = el.getAttribute('data-img');
      const remote = el.getAttribute('data-remote');
      function tryRemote(){
        if(!remote) return;
        const p2 = new Image();
        p2.onload = function(){ el.style.backgroundImage = "url('"+remote+"')"; el.classList.add('has-photo','has-photo-remote'); };
        p2.src = remote;
      }
      if(src){
        const p = new Image();
        p.onload = function(){ el.style.backgroundImage = "url('"+src+"')"; el.classList.add('has-photo'); };
        p.onerror = tryRemote;
        p.src = src;
      } else {
        tryRemote();
      }
    });
  }

  function renderAll(items){
    const sorted = [...items].sort((a,b) => new Date(b.date) - new Date(a.date));
    const destaques = sorted.slice(0, DESTAQUE_LIMIT);
    const historico = sorted.slice(DESTAQUE_LIMIT);

    const grid = document.getElementById('destaques-grid');
    if(grid){
      grid.innerHTML = destaques.map(cardHtml).join('');
      wirePhotosIn(grid);
    }

    const histBtn = document.getElementById('history-toggle');
    const histWrap = document.getElementById('news-history-wrap');
    const timeline = document.querySelector('#news-history-panel .timeline');
    if(timeline) timeline.innerHTML = timelineHtml(historico);
    if(histWrap) histWrap.style.display = historico.length ? '' : 'none';
    if(histBtn){
      const label = histBtn.querySelector('span') ? histBtn.innerHTML.replace(/^[^<]*/, `Ver ${historico.length} notícia${historico.length===1?'':'s'} anteriores `) : histBtn.innerHTML;
      if(histBtn.getAttribute('aria-expanded') !== 'true') histBtn.innerHTML = `Ver ${historico.length} notícia${historico.length===1?'':'s'} anteriores <span>↓</span>`;
    }
  }

  function dedupeKey(item){ return (item.url||'').replace(/https?:\/\//,'').replace(/\/$/,'').toLowerCase(); }

  async function load(){
    let all = [...CURATED];
    renderAll(all); // mostra o que já se tem, sem esperar a rede

    const statusEl = document.getElementById('feed-status');
    if(statusEl) statusEl.textContent = 'buscando manchetes novas automaticamente…';

    const results = await Promise.allSettled(FEEDS.map(fetchFeed));
    let liveItems = [];
    results.forEach(r => { if(r.status === 'fulfilled') liveItems.push(...r.value); });

    const seen = new Set(all.map(dedupeKey));
    liveItems = liveItems.filter(i => i.url && match(i.title + ' ' + i.summary) && !seen.has(dedupeKey(i)) && seen.add(dedupeKey(i)));

    if(liveItems.length){
      all = [...all, ...liveItems];
      renderAll(all);
      if(statusEl) statusEl.textContent = `${liveItems.length} notícia${liveItems.length===1?'':'s'} nova${liveItems.length===1?'':'s'} encontrada${liveItems.length===1?'':'s'} automaticamente e adicionada${liveItems.length===1?'':'s'} aos destaques.`;
    } else if(statusEl){
      if(location.protocol === 'file:'){
        statusEl.innerHTML = 'Este arquivo está aberto direto do computador (<code>file:///...</code>) — por segurança, o navegador bloqueia a busca automática de notícias nesse modo. Os destaques curados acima continuam valendo. Para a busca automática funcionar, hospede o site (ex: arraste a pasta em <a href="https://app.netlify.com/drop" target="_blank" rel="noopener" style="text-decoration:underline;">app.netlify.com/drop</a>, gratuito) e abra pelo link gerado.';
      } else {
        statusEl.textContent = 'Nenhuma manchete nova encontrada agora — os destaques atuais continuam valendo. A busca tenta de novo a cada visita.';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    load();
    const btn=document.getElementById('history-toggle'), panel=document.getElementById('news-history-panel');
    if(btn && panel) btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      const count = panel.querySelectorAll('.timeline-item').length;
      btn.innerHTML = open
        ? `Ver ${count} notícia${count===1?'':'s'} anteriores <span>↓</span>`
        : `Ocultar notícias anteriores <span>↑</span>`;
    });
  });
})();
