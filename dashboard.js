/* ===================================================
   fraude. — dashboard.js
   Dados da pesquisa + gráficos circulares + atualização ao vivo
   com status visível (antes ficava tentando em silêncio) +
   painel exclusivo para quem estiver logado.
   =================================================== */
(function(){
  const RED = '#d81922';
  const MUTED = '#d9d7d2';
  const CHART_COLORS = ['#d81922','#242428','#f08a24','#2d67b1','#27845f','#7650a5','#b94f63','#77736d','#c7a14a','#4e7b86'];
  const charts = {};

  Chart.defaults.font.family = "'Source Sans 3', sans-serif";
  Chart.defaults.color = '#54545b';

  function destroy(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

  function doughnut(id, values, labels, opts={}){
    const el=document.getElementById(id); if(!el) return;
    destroy(id);
    const total=values.reduce((a,b)=>a+Number(b||0),0)||1;
    charts[id]=new Chart(el,{
      type:'doughnut',
      data:{labels,datasets:[{data:values,backgroundColor:opts.colors||CHART_COLORS,borderColor:'#fff',borderWidth:3,hoverOffset:8}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:opts.cutout||'62%',animation:{animateRotate:true,animateScale:true,duration:850,easing:'easeOutQuart'},
        plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:10,padding:9,usePointStyle:true}},tooltip:{backgroundColor:'#16161a',padding:10,callbacks:{label:c=>`${c.label}: ${c.parsed} (${Math.round(c.parsed/total*100)}%)`}}}}
    });
  }

  function renderGolpesChart(data){
    const el=document.getElementById('chart-golpes'); if(!el) return;
    destroy('chart-golpes');
    const sorted=[...data].sort((a,b)=>b.pct-a.pct).slice(0,6);
    charts['chart-golpes']=new Chart(el,{
      type:'doughnut',
      data:{labels:sorted.map(d=>d.label),datasets:[{data:sorted.map(d=>d.pct),backgroundColor:CHART_COLORS,borderColor:'#fff',borderWidth:3,hoverOffset:10}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'64%',animation:{animateRotate:true,animateScale:true,duration:950,easing:'easeOutQuart'},
        onClick:(evt,elements)=>{if(elements.length) showGolpeDetail(sorted[elements[0].index]);},
        onHover:(evt,elements)=>{evt.native.target.style.cursor=elements.length?'pointer':'default';},
        plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:10,padding:9,usePointStyle:true}},tooltip:{backgroundColor:'#16161a',padding:10,callbacks:{label:c=>`${c.label}: ${c.parsed}% — clique para detalhes`}}}}
    });
    showGolpeDetail(sorted[0]);
  }

  function showGolpeDetail(item){
    const box=document.getElementById('golpe-detail'); if(!box||!item)return;
    const total=window.FRAUDE_SURVEY.total;
    const vit=item.vitima||0;
    box.innerHTML=`<div class="golpe-detail-title">${item.label}</div><div class="golpe-detail-stats"><div><span class="golpe-detail-num">${item.pct}%</span><span class="golpe-detail-label">já recebeu tentativa ou foi vítima</span></div><div><span class="golpe-detail-num" style="color:var(--ink);">${vit}</span><span class="golpe-detail-label">pessoa${vit===1?'':'s'} caiu de fato no golpe (de ${total})</span></div></div>`;
  }

  function renderAll(survey){
    const count=document.getElementById('dash-count'); if(count)count.textContent=`${survey.total} respostas`;
    const grid=document.getElementById('dash-grid'); if(grid)grid.style.display='block';
    const ph=document.getElementById('dash-placeholder'); if(ph)ph.style.display='none';
    renderGolpesChart(survey.golpes||[]);
    doughnut('chart-idade',(survey.idade||[]).map(x=>x.val),(survey.idade||[]).map(x=>x.label));
    doughnut('chart-frequencia',(survey.frequencia||[]).map(x=>x.val),(survey.frequencia||[]).map(x=>x.label));
    doughnut('chart-atitude',(survey.atitude||[]).map(x=>x.val),(survey.atitude||[]).map(x=>x.label));
    renderExclusivePanel(survey);
  }

  /* ---------- status visível de atualização ---------- */
  function setStatus(state, text){
    const dot = document.getElementById('dash-live-dot');
    const label = document.getElementById('dash-live-indicator');
    const updated = document.getElementById('dash-updated');
    if(dot) dot.className = 'live-dot' + (state === 'error' ? ' live-dot-off' : '');
    if(label) label.textContent = text;
    if(updated){
      const now = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
      if(state === 'ok') updated.innerHTML = `conectado à planilha ao vivo · última verificação às ${now}`;
      else if(state === 'trying') updated.innerHTML = `verificando planilha às ${now}…`;
      else if(location.protocol === 'file:') updated.innerHTML = `<span style="color:var(--red);">este arquivo está aberto direto do computador (file:///...)</span> — para a planilha atualizar, hospede o site (veja o aviso abaixo) ou rode um servidor local.`;
      else updated.innerHTML = `<span style="color:var(--red);">${window.FRAUDE_DASH_LAST_ERROR || 'não foi possível conectar à planilha agora'}</span> — mostrando dados de referência de ${window.FRAUDE_SURVEY.updated}. <a href="#dash-help" id="dash-help-link" style="text-decoration:underline;">Por quê?</a>`;
    }
  }

  const HINTS=[
    {id:'phishing',kw:['phishing','e-mail','email','link falso']},{id:'vishing',kw:['vishing','ligação','ligacao']},{id:'smishing',kw:['smishing','sms']},
    {id:'familiar',kw:['falso familiar','familiar']},{id:'clonagem',kw:['clonagem de conta','clonagem']},{id:'comprovante',kw:['falso comprovante','comprovante']},
    {id:'boleto',kw:['boleto adulterado','boleto']},{id:'maofantasma',kw:['mão fantasma','mao fantasma','acesso remoto']},{id:'oferta',kw:['falsa oferta','emprego','prêmio','premio']},{id:'ia',kw:['golpes com ia','voz','vídeo','video']}
  ];
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function findColumn(headers,keys){
    const hs=headers.map(norm);
    for(const key of keys){const k=norm(key); const i=hs.findIndex(h=>h.includes(k)); if(i>=0)return headers[i];}
    return null;
  }
  function positive(v){
    const x=norm(v);
    if(/nunca|desconhec/.test(x) || /^nao\b/.test(x)) return false; // exclui respostas negativas ("nunca recebi", "não conheço"...)
    return /ja fui vitima|fui vitima|ja recebi/.test(x);
  }
  function victim(v){
    const x=norm(v);
    if(/nunca|desconhec/.test(x) || /^nao\b/.test(x)) return false;
    return /ja fui vitima|fui vitima/.test(x);
  }
  function mapQuestion(rows,headers,keys){
    const col=findColumn(headers,keys); if(!col)return [];
    const map={}; rows.forEach(r=>{let v=String(r[col]||'').trim(); if(!v)v='Não respondeu'; map[v]=(map[v]||0)+1;});
    return Object.entries(map).map(([label,val])=>({label,val}));
  }
  function computeFromRows(rows,headers){
    const total=rows.length; if(!total)return null;
    const debug=[];
    const golpes=HINTS.map(g=>{
      const col=findColumn(headers,g.kw); if(!col)return null;
      let exposed=0,vitima=0;
      const samples=[];
      rows.forEach(r=>{
        const v=r[col]||'';
        if(positive(v))exposed++;
        if(victim(v))vitima++;
        if(samples.length<4) samples.push(String(v).slice(0,60));
      });
      const base=(window.FRAUDE_SURVEY.golpes||[]).find(x=>x.id===g.id);
      debug.push({id:g.id, col, exposed, total, samples});
      return {id:g.id,label:base?base.label:col,pct:Math.round(exposed/total*100),vitima};
    }).filter(Boolean);
    window.FRAUDE_DASH_DEBUG = debug;
    if(golpes.length<3)return null;
    return {total,updated:new Date().toLocaleDateString('pt-BR'),golpes,
      idade:mapQuestion(rows,headers,['idade']),
      frequencia:mapQuestion(rows,headers,['frequência','frequencia','apps bancários','pix']),
      atitude:mapQuestion(rows,headers,['atitude você costuma tomar','atitude','número desconhecido','numero desconhecido'])};
  }
  function tryLiveRefresh(manual){
    const cfg=window.FRAUDE_SURVEY.REFRESH;
    if(!cfg||!cfg.enabled)return;
    setStatus('trying', manual ? 'atualizando agora…' : 'dados ao vivo da planilha');
    window.fetchSheetJSONP(cfg.sheetId, cfg.gid, (rawRows, headers) => {
      const rows = rawRows.filter(r => Object.values(r).some(v => v && String(v).trim()));
      const live=computeFromRows(rows,headers);
      if(!live){
        window.FRAUDE_DASH_LAST_ERROR = `não reconheci as perguntas na planilha (colunas encontradas: ${headers.slice(0,6).join(', ')}${headers.length>6?'…':''})`;
        setStatus('error'); return;
      }
      renderAll(live);
      window.FRAUDE_SURVEY=Object.assign({},window.FRAUDE_SURVEY,live);
      setStatus('ok', 'dados ao vivo da planilha');
      renderDebugPanel();
      window.dispatchEvent(new CustomEvent('fraude:survey-updated',{detail:live}));
    }, (err) => {
      console.warn('Planilha:', err);
      window.FRAUDE_DASH_LAST_ERROR = err && err.message ? err.message : 'não foi possível conectar à planilha agora';
      setStatus('error');
    });
  }

  function renderDebugPanel(){
    const box = document.getElementById('debug-panel'); if(!box) return;
    const debug = window.FRAUDE_DASH_DEBUG || [];
    if(!debug.length){ box.innerHTML = '<p class="section-desc">Sem dados de diagnóstico ainda.</p>'; return; }
    box.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
        <thead><tr style="text-align:left; border-bottom:2px solid var(--ink);">
          <th style="padding:6px 8px;">Golpe</th><th style="padding:6px 8px;">Coluna encontrada na planilha</th>
          <th style="padding:6px 8px;">Positivos</th><th style="padding:6px 8px;">Total</th><th style="padding:6px 8px;">Exemplos de respostas reais</th>
        </tr></thead>
        <tbody>
          ${debug.map(d => `<tr style="border-bottom:1px solid var(--line);">
            <td style="padding:6px 8px; font-weight:600;">${d.id}</td>
            <td style="padding:6px 8px; color:var(--ink-mute);">${(d.col||'—').slice(0,70)}</td>
            <td style="padding:6px 8px;">${d.exposed}</td>
            <td style="padding:6px 8px;">${d.total}</td>
            <td style="padding:6px 8px; color:var(--ink-mute);">${d.samples.map(s=>`"${s}"`).join(' · ')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  /* ---------- painel exclusivo (login) ---------- */
  function renderExclusivePanel(survey){
    const box = document.getElementById('exclusive-panel'); if(!box) return;
    const logged = !!(localStorage.getItem('fraude_demo_user'));
    if(!logged){
      box.innerHTML = `
        <div class="locked-box">
          <div class="locked-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="1"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg></div>
          <div class="locked-title">Cruzamento por faixa etária</div>
          <div class="locked-desc">Entre com uma conta gratuita para ver quais faixas etárias mais caem em cada tipo de golpe — detalhamento extra da mesma pesquisa, disponível só para cadastrados.</div>
          <button type="button" class="btn-primary" id="exclusive-login-btn">Entrar / cadastrar</button>
        </div>`;
      const btn = document.getElementById('exclusive-login-btn');
      if(btn) btn.addEventListener('click', () => { if(typeof window.FRAUDE_OPEN_LOGIN === 'function') window.FRAUDE_OPEN_LOGIN(); });
    } else {
      const idadeTop = (survey.idade||[]).slice().sort((a,b)=>b.val-a.val)[0];
      const golpeTop = (survey.golpes||[]).slice().sort((a,b)=>b.pct-a.pct)[0];
      box.innerHTML = `
        <div class="exclusive-badge">Conteúdo exclusivo · você está logado</div>
        <div class="dash-card">
          <div class="dash-card-title">Cruzamento por faixa etária</div>
          <div class="dash-card-sub">Estimativa a partir das respostas atuais — faixa etária mais numerosa e o golpe de maior exposição na amostra.</div>
          <div class="golpe-detail-stats" style="margin-top:14px;">
            <div><span class="golpe-detail-num">${idadeTop ? idadeTop.label : '—'}</span><span class="golpe-detail-label">faixa etária com mais respondentes na pesquisa</span></div>
            <div><span class="golpe-detail-num" style="color:var(--ink);">${golpeTop ? golpeTop.pct+'%' : '—'}</span><span class="golpe-detail-label">${golpeTop ? golpeTop.label : ''} — maior exposição entre todos os golpes</span></div>
          </div>
        </div>`;
    }
  }
  document.addEventListener('fraude:authchange', () => renderExclusivePanel(window.FRAUDE_SURVEY));

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('dash-grid'))return;
    renderAll(window.FRAUDE_SURVEY);
    setStatus('trying', 'verificando planilha…');
    tryLiveRefresh(false);
    const cfg=window.FRAUDE_SURVEY.REFRESH; if(cfg?.enabled)setInterval(()=>tryLiveRefresh(false),cfg.refreshMs||30000);
    const refreshBtn = document.getElementById('dash-refresh-btn');
    if(refreshBtn) refreshBtn.addEventListener('click', ()=>tryLiveRefresh(true));
  });
})();
