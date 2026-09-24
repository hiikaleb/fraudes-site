/* ===================================================
   fraude. — survey-data.js
   Dados locais de referência da pesquisa aplicada via Google Forms
   (57 respostas, coletadas em agosto de 2026), calculado
   diretamente da planilha de respostas. Serve de base
   confiável para os gráficos: eles SEMPRE renderizam com
   esses números, mesmo se a planilha do Google não puder
   ser lida ao vivo (permissão, CORS, aba errada etc).

   Se REFRESH.enabled = true e a planilha estiver publicada
   como "Qualquer pessoa com o link", dashboard.js e
   home-chart.js tentam buscar os dados atualizados e
   substituem este snapshot automaticamente — sem quebrar
   nada se a busca falhar.
   =================================================== */
window.FRAUDE_SURVEY = {
  total: 57,
  updated: "24/08/2026",

  // % de exposição (já recebeu tentativa OU já foi vítima) por tipo de golpe
  golpes: [
    { id: "phishing",   label: "Phishing (e-mail/link falso)",     pct: 70, vitima: 2  },
    { id: "oferta",     label: "Falsa oferta (emprego/prêmio)",    pct: 68, vitima: 11 },
    { id: "smishing",   label: "Smishing (SMS)",                    pct: 68, vitima: 0  },
    { id: "vishing",    label: "Vishing (ligação)",                 pct: 47, vitima: 0  },
    { id: "familiar",   label: "Falso familiar (WhatsApp)",         pct: 47, vitima: 5  },
    { id: "ia",         label: "Golpes com IA (voz/vídeo)",         pct: 21, vitima: 0  },
    { id: "clonagem",   label: "Clonagem de conta",                 pct: 21, vitima: 7  },
    { id: "comprovante",label: "Falso comprovante",                 pct: 21, vitima: 9  },
    { id: "boleto",     label: "Boleto adulterado",                 pct: 16, vitima: 5  },
    { id: "maofantasma",label: "Mão fantasma (acesso remoto)",      pct: 9,  vitima: 2  },
  ],

  idade: [
    { label: "Menos de 18", val: 13 },
    { label: "18–25",       val: 14 },
    { label: "26–35",       val: 10 },
    { label: "36–45",       val: 12 },
    { label: "46–60",       val: 7  },
    { label: "Mais de 60",  val: 1  },
  ],

  frequencia: [
    { label: "Todos os dias",              val: 17 },
    { label: "Algumas vezes por semana",   val: 27 },
    { label: "Raramente",                  val: 2  },
    { label: "Não uso",                    val: 2  },
  ],

  atitude: [
    { label: "Ignora / desliga sem atender", val: 31 },
    { label: "Bloqueia o número",             val: 14 },
    { label: "Atende normalmente",            val: 8  },
    { label: "Pesquisa antes de responder",   val: 2  },
    { label: "Não respondeu",                 val: 2  },
  ],

  /* ---------- reconexão com a planilha ao vivo ----------
     Usa o método JSONP (tag <script>) em vez de fetch/XHR,
     porque esse é o único jeito de buscar dados do Google
     Sheets que funciona tanto em file:// (arquivo aberto
     por duplo clique) quanto em um site hospedado de verdade.
  */
  REFRESH: {
    enabled: true,
    sheetId: "11hbrzE8uGexPfHrKx97BGtfxz7mqZy0_l5ETexSVgJ8",
    gid: null, // se as respostas estiverem numa aba que não é a primeira, coloque aqui o número do gid (aparece na URL da planilha depois de #gid=)
    refreshMs: 30000,
  }
};

/* ---------- busca a planilha via JSONP (funciona em file:// e em hospedagem) ---------- */
window.fetchSheetJSONP = function(sheetId, gid, onData, onError){
  const cbName = 'fraudeSheetCb_' + Date.now() + '_' + Math.floor(Math.random()*10000);
  let timeoutId;
  function cleanup(){
    delete window[cbName];
    if(script.parentNode) script.parentNode.removeChild(script);
    clearTimeout(timeoutId);
  }
  window[cbName] = function(json){
    try{
      if(json.status === 'error'){
        const reason = (json.errors && json.errors[0] && (json.errors[0].detailed_message || json.errors[0].message || json.errors[0].reason)) || 'motivo desconhecido';
        cleanup();
        onError(new Error('Google recusou o acesso à planilha: ' + reason));
        return;
      }
      const cols = (json.table.cols || []).map(c => c.label || c.id || '');
      const rows = (json.table.rows || []).map(r => {
        const obj = {};
        cols.forEach((label, i) => {
          const cell = r.c && r.c[i];
          obj[label] = cell ? (cell.f != null ? cell.f : (cell.v != null ? cell.v : '')) : '';
        });
        return obj;
      });
      cleanup();
      onData(rows, cols);
    }catch(e){ cleanup(); onError(e); }
  };
  const gidParam = gid ? ('&gid=' + encodeURIComponent(gid)) : '';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${cbName}${gidParam}`;
  const script = document.createElement('script');
  script.src = url;
  script.onerror = function(){ cleanup(); onError(new Error('Não foi possível carregar o script da planilha (verifique o compartilhamento).')); };
  document.head.appendChild(script);
  timeoutId = setTimeout(() => { if(window[cbName]){ cleanup(); onError(new Error('Tempo esgotado ao buscar a planilha.')); } }, 9000);
};
