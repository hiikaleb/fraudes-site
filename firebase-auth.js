/* fraude. — camada Firebase opcional */
(function(){
  const cfg=window.FRAUDE_FIREBASE_CONFIG;
  if(!cfg || !window.firebase) return;
  try{
    if(!firebase.apps.length) firebase.initializeApp(cfg);
    const auth=firebase.auth();
    window.FRAUDE_FIREBASE={auth,db:firebase.firestore(),storage:firebase.storage()};
    auth.onAuthStateChanged(user=>{
      if(user){
        localStorage.setItem('fraude_demo_user',user.displayName||user.email.split('@')[0]);
        localStorage.setItem('fraude_uid',user.uid);
      }else{
        localStorage.removeItem('fraude_demo_user');
        localStorage.removeItem('fraude_uid');
      }
      document.dispatchEvent(new CustomEvent('fraude:authchange',{detail:{user}}));
    });
  }catch(err){console.warn('Firebase não inicializado:',err);}
})();
