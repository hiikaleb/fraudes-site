/* ===================================================
   fraude. — golpes.js
   Interatividade da página "Os golpes":
   - cada card expande/recolhe ao clicar (accordion)
   - comentários por golpe, salvos no localStorage,
     visíveis para leitura a todos, mas só é possível
     comentar estando "logado" (demo do common.js)
   - compartilhamento individual por golpe (mini share)
   =================================================== */
(function(){
  const COMMENTS_KEY = 'fraude_comments';

  function loadComments(){
    try{ return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}'); }
    catch(e){ return {}; }
  }
  function saveComments(data){
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(data));
  }

  function currentUser(){
    return localStorage.getItem('fraude_demo_user');
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderComments(container){
    const golpeId = container.dataset.golpeId;
    const all = loadComments();
    const list = all[golpeId] || [];
    const user = currentUser();

    const listHtml = list.length
      ? list.map(c => `
          <div class="comment-item">
            <div class="comment-head"><span class="comment-author">${escapeHtml(c.author)}</span><span class="comment-date">${c.date}</span></div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
          </div>`).join('')
      : `<div class="comment-empty">Nenhum comentário ainda. Seja o primeiro a compartilhar sua experiência.</div>`;

    const formHtml = user
      ? `<form class="comment-form" data-golpe-id="${golpeId}">
           <textarea placeholder="Já passou por algo parecido? Conte aqui." maxlength="400" required></textarea>
           <button type="submit" class="comment-submit">Comentar como ${escapeHtml(user)}</button>
         </form>`
      : `<div class="comment-locked">
           <span>Entre para deixar um comentário.</span>
           <button type="button" class="comment-login-btn">Entrar</button>
         </div>`;

    container.innerHTML = `
      <div class="comment-title">Comentários (${list.length})</div>
      <div class="comment-list">${listHtml}</div>
      ${formHtml}`;

    const form = container.querySelector('.comment-form');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const textarea = form.querySelector('textarea');
        const text = textarea.value.trim();
        if(!text) return;
        const data = loadComments();
        if(!data[golpeId]) data[golpeId] = [];
        data[golpeId].unshift({
          author: currentUser(),
          text: text,
          date: new Date().toLocaleDateString('pt-BR')
        });
        saveComments(data);
        renderComments(container);
      });
    }

    const loginBtn = container.querySelector('.comment-login-btn');
    if(loginBtn){
      loginBtn.addEventListener('click', function(){
        const modal = document.getElementById('login-modal');
        if(modal) modal.classList.add('open');
      });
    }
  }

  function renderAllComments(){
    document.querySelectorAll('.golpe-comments').forEach(renderComments);
  }

  function buildGolpeModal(){
    if(document.getElementById('golpe-modal')) return document.getElementById('golpe-modal');
    const modal=document.createElement('div');
    modal.id='golpe-modal';
    modal.className='modal-overlay golpe-modal-overlay';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="golpe-modal-box" role="dialog" aria-modal="true" aria-labelledby="golpe-modal-title"><button type="button" class="modal-close" id="golpe-modal-close" aria-label="Fechar">&times;</button><div class="golpe-modal-kicker">Detalhes do golpe</div><div id="golpe-modal-cover"></div><div id="golpe-modal-title" class="golpe-modal-title"></div><div id="golpe-modal-content"></div></div>`;
    document.body.appendChild(modal);

    const close=()=>{
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('modal-open');
      document.getElementById('golpe-modal-cover').innerHTML='';
      document.getElementById('golpe-modal-content').innerHTML='';
      modal._card=null;
    };
    document.getElementById('golpe-modal-close').addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
    modal._close=close;
    return modal;
  }

  function wireAccordion(){
    const modal=buildGolpeModal();
    document.querySelectorAll('.golpe-card').forEach(card=>{
      const toggle=card.querySelector('.golpe-toggle');
      const more=card.querySelector('.golpe-more');
      if(!toggle||!more)return;
      toggle.addEventListener('click',()=>{
        const content=document.getElementById('golpe-modal-content');
        const cover=document.getElementById('golpe-modal-cover');
        const title=document.getElementById('golpe-modal-title');
        const inner=more.querySelector('.golpe-more-inner');
        const photo=card.querySelector('.photo-block');
        const name=card.querySelector('.golpe-name');
        if(!content||!inner)return;

        modal._card=card;
        // Capa: copia a imagem já resolvida pelo common.js (inclusive remoto).
        cover.innerHTML='';
        if(photo){
          const coverEl=document.createElement('div');
          coverEl.className='golpe-modal-cover';
          const bg=photo.style.backgroundImage;
          if(bg) coverEl.style.backgroundImage=bg;
          else {
            const local=photo.getAttribute('data-img');
            if(local) coverEl.style.backgroundImage=`url("${local}")`;
          }
          coverEl.innerHTML='<span class="golpe-modal-cover-label">' + (photo.querySelector('.cat-tag')?.textContent || 'Golpe') + '</span>';
          cover.appendChild(coverEl);
        }
        title.textContent=name ? name.textContent.trim() : '';
        content.innerHTML='';
        // Clone o conteúdo em vez de mover o nó original: comentários e eventos continuam estáveis.
        const clone=inner.cloneNode(true);
        content.appendChild(clone);
        renderComments(content.querySelector('.golpe-comments'));
        wireMiniShareWithin(content);
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
        document.body.classList.add('modal-open');
      });
    });
  }

  function wireMiniShareWithin(root){
    root.querySelectorAll('.mini-share-btn').forEach(btn=>{
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        const card=modalCardForContent();
        const name=card ? card.querySelector('.golpe-name').textContent : document.title;
        const network=btn.dataset.network;
        const id=card ? card.dataset.golpeId : '';
        const raw=window.location.href.split('#')[0]+'#'+id;
        if(network==='whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent('Golpe: '+name+' — fraude.')}%20${encodeURIComponent(raw)}`,'_blank','noopener,width=600,height=500');
        else if(network==='copy') navigator.clipboard?.writeText(raw).then(()=>{const old=btn.innerHTML;btn.innerHTML='✓';setTimeout(()=>btn.innerHTML=old,1400);});
      });
    });
  }

  function modalCardForContent(){
    const modal=document.getElementById('golpe-modal');
    return modal && modal._card;
  }

  function wireMiniShare(){
    document.querySelectorAll('.mini-share-btn').forEach(btn => {
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        const card = btn.closest('.golpe-card');
        const name = card ? card.querySelector('.golpe-name').textContent : document.title;
        const network = btn.dataset.network;
        const url = encodeURIComponent(window.location.href.split('#')[0] + '#' + (card ? card.dataset.golpeId : ''));
        const title = encodeURIComponent('Golpe: ' + name + ' — fraude.');
        if(network === 'whatsapp'){
          window.open(`https://wa.me/?text=${title}%20${url}`, '_blank', 'noopener,width=600,height=500');
        } else if(network === 'copy'){
          navigator.clipboard.writeText(decodeURIComponent(url)).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '✓';
            setTimeout(() => btn.innerHTML = original, 1400);
          });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(!document.getElementById('golpes-grid')) return;
    wireAccordion();
    wireMiniShare();
    renderAllComments();
  });

  document.addEventListener('fraude:authchange', renderAllComments);
})();
