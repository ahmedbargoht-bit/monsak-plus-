if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw-gm.js')
      .then(reg=>{
        console.log('SW registered:', reg.scope);
        // لو فيه نسخة SW جديدة نازلة — خليها تتفعّل فوراً بدل ما تفضل واقفة "waiting"
        reg.addEventListener('updatefound', ()=>{
          const nw = reg.installing;
          if(nw){
            nw.addEventListener('statechange', ()=>{
              if(nw.state==='installed' && navigator.serviceWorker.controller){
                nw.postMessage('SKIP_WAITING');
              }
            });
          }
        });
        document.addEventListener('visibilitychange', ()=>{
          if(document.visibilityState==='visible') reg.update();
        });
      })
      .catch(err=>console.log('SW error:', err));

    // لما SW جديد ياخد التحكم — رجّع تحميل الصفحة تلقائياً مرة واحدة عشان تظهر آخر نسخة
    let _swGmRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(_swGmRefreshing) return;
      _swGmRefreshing = true;
      window.location.reload();
    });
  });
}

