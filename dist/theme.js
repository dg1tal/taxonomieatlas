// Apply before styles load to avoid a light flash; does not touch navigation state.
(()=>{
 const key='taxonomy-theme',root=document.documentElement,media=window.matchMedia('(prefers-color-scheme: dark)');
 const valid=value=>['light','dark','system'].includes(value)?value:'system';
 let preference='system';try{preference=valid(localStorage.getItem(key));}catch{}
 function apply(){const theme=preference==='system'?(media.matches?'dark':'light'):preference;root.dataset.theme=theme;root.dataset.themePreference=preference;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#141c18':'#f6f5ef';document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===preference)));}
 apply();
 media.addEventListener('change',apply);
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=valid(event.newValue);apply();}});
 document.addEventListener('DOMContentLoaded',()=>{apply();document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{preference=valid(button.dataset.themeChoice);try{localStorage.setItem(key,preference);}catch{}apply();}));});
})();
