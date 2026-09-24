/* fraude. — prévia circular da pesquisa na home, com status visível */
(function(){
  let chart;
  function render(survey){
    const canvas=document.getElementById('panorama-chart'); if(!canvas)return;
    if(chart)chart.destroy();
    const count=document.getElementById('panorama-count'); const total=document.getElementById('panorama-total');
    if(count)count.textContent=`(${survey.total} respostas até agora)`; if(total)total.textContent=survey.total;
    const top=[...(survey.golpes||[])].sort((a,b)=>b.pct-a.pct).slice(0,5);
    chart=new Chart(canvas,{type:'doughnut',data:{labels:top.map(x=>x.label),datasets:[{data:top.map(x=>x.pct),backgroundColor:['#d81922','#242428','#f08a24','#2d67b1','#27845f'],borderColor:'#fff',borderWidth:3,hoverOffset:9}]},options:{responsive:true,maintainAspectRatio:false,cutout:'63%',animation:{animateRotate:true,animateScale:true,duration:900,easing:'easeOutQuart'},plugins:{legend:{position:'bottom',labels:{font:{size:10.5},boxWidth:10,padding:8,usePointStyle:true}},tooltip:{backgroundColor:'#16161a',padding:10,callbacks:{label:c=>`${c.label}: ${c.parsed}%`}}}}});
  }
  function setStatus(msg, isError){
    const el = document.getElementById('panorama-status');
    if(!el) return;
    if(!msg){ el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = isError ? `<span style="color:var(--red);">${msg}</span>` : msg;
  }
  function live(){
    const cfg=window.FRAUDE_SURVEY?.REFRESH;
    if(!cfg?.enabled)return;
    setStatus('verificando planilha…', false);
    window.fetchSheetJSONP(cfg.sheetId, cfg.gid, (rawRows, headers) => {
      const rows = rawRows.filter(r => Object.values(r).some(v => v && String(v).trim()));
      if(!rows.length){ setStatus('Não foi possível conectar à planilha agora — mostrando dados de referência.', true); return; }
      const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const find=(keys)=>{for(const key of keys){const k=norm(key);const h=headers.find(x=>norm(x).includes(k));if(h)return h;}return null;};
      const positive=v=>{ const x=norm(v); if(/nunca|desconhec/.test(x) || /^nao\b/.test(x)) return false; return /ja fui vitima|fui vitima|ja recebi/.test(x); };
      const hints=[
        ['phishing',['phishing','e-mail','email','link falso']],['oferta',['falsa oferta','emprego','premio']],['smishing',['smishing','sms']],['vishing',['vishing','ligacao']],['familiar',['falso familiar']],['ia',['golpes com ia','voz','video']],['clonagem',['clonagem de conta','clonagem']],['comprovante',['falso comprovante','comprovante']],['boleto',['boleto adulterado','boleto']],['maofantasma',['mao fantasma','acesso remoto']]
      ];
      const golpes=hints.map(([id,keys])=>{const col=find(keys);if(!col)return null;const n=rows.filter(r=>positive(r[col])).length;const base=(window.FRAUDE_SURVEY.golpes||[]).find(x=>x.id===id);return {id,label:base?.label||col,pct:Math.round(n/rows.length*100),vitima:0};}).filter(Boolean);
      if(golpes.length<3){ setStatus(`Não reconheci as perguntas na planilha (colunas: ${headers.slice(0,5).join(', ')}${headers.length>5?'…':''}) — mostrando dados de referência.`, true); return; }
      const liveData={...window.FRAUDE_SURVEY,total:rows.length,updated:new Date().toLocaleDateString('pt-BR'),golpes};
      window.FRAUDE_SURVEY=liveData; render(liveData);
      setStatus('dados ao vivo da planilha · atualizado agora', false);
    }, (err) => {
      console.warn('Planilha (home):', err);
      setStatus((err && err.message) || 'Não foi possível conectar à planilha agora — mostrando dados de referência.', true);
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{if(!document.getElementById('panorama-chart'))return; if(window.FRAUDE_SURVEY)render(window.FRAUDE_SURVEY); live();});
})();
