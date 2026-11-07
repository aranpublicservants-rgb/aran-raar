(()=>{'use strict';
const U=window.ARANUX,{$,$$,tr,language}=U;
const page=document.body.dataset.page,lang=language();
const RELEASE='20261107-5';
function versionLink(n){const u=new URL(n.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('.html')){u.searchParams.set('v',RELEASE);n.href=u.href;}}
// Redirect legacy language parameters to the corresponding complete-language URL.
const requested=new URLSearchParams(location.search).get('lang');
if(['en','fr'].includes(requested)&&requested!==lang){const target=new URL(page==='draft'?(requested==='fr'?'working-draft-fr.html':'working-draft.html'):(requested==='fr'?'fr.html':'index.html'),location.href);target.hash=location.hash;target.searchParams.set('v',RELEASE);location.replace(target.href);return;}
const home=lang==='fr'?'fr.html':'index.html',draft=lang==='fr'?'working-draft-fr.html':'working-draft.html';
$$('.draft-link').forEach(n=>n.href=draft);
$$('a[href]').forEach(versionLink);
document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(link)versionLink(link);},{capture:true});
const menu=$('#menu-toggle'),shell=$('.sticky-shell');
if(menu){menu.hidden=false;document.body.classList.add('menu-ready');menu.addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));});$('#primary-nav').addEventListener('click',e=>{if(e.target.closest('a')){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.focus();}});}
function measureHeader(){const sticky=shell&&getComputedStyle(shell).position==='sticky';document.documentElement.style.setProperty('--header-height',(sticky?shell.getBoundingClientRect().height:0)+'px');}
if(shell&&'ResizeObserver'in window)new ResizeObserver(measureHeader).observe(shell);window.addEventListener('resize',measureHeader);measureHeader();
// Transfer entries once within this tab during an explicit language change.
// No durable form storage is enabled by this handoff.
const key='aran-language-handoff';let handoff;
try{handoff=JSON.parse(sessionStorage.getItem(key)||'null');sessionStorage.removeItem(key);}catch{}
if(handoff&&handoff.page===page&&Date.now()-handoff.at<60000){
 for(const entry of handoff.controls||[]){const n=entry.id?document.getElementById(entry.id):document.querySelector('input[name="services"][value="'+entry.value+'"]');if(!n)continue;if(n.type==='checkbox')n.checked=entry.checked;else n.value=entry.value;n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));}
 window.ARANForms?.restoreState(handoff.formState);
 if(handoff.step!==undefined)document.dispatchEvent(new CustomEvent('aran:restorestep',{detail:handoff.step}));
 $('#global-status').textContent=tr('Language changed to English. Your form entries have been kept.','La langue est maintenant le français. Vos réponses ont été conservées.');
}
document.addEventListener('click',e=>{const link=e.target.closest('#language-link');if(!link)return;e.preventDefault();e.stopImmediatePropagation();const controls=$$('form input,form textarea,form select').filter(n=>n.type!=='submit'&&n.id!=='lesson-website').map(n=>({id:n.id||null,value:n.value,checked:n.checked}));const state={page,at:Date.now(),controls,formState:window.ARANForms?.exportState(),step:window.ARANLessonStep?.()};let stored=false;try{sessionStorage.setItem(key,JSON.stringify(state));stored=true;}catch{}
const hasEntries=controls.some(n=>n.checked||n.value&&n.id&&!['vol-language','vol-availability','lesson-topic','lesson-language'].includes(n.id));
if(!stored&&hasEntries){$('#global-status').classList.remove('sr-only');$('#global-status').textContent=tr('Browser storage is unavailable. Save or copy your form text before changing language.','Le stockage du navigateur est indisponible. Enregistrer ou copier le texte du formulaire avant de changer de langue.');$('#global-status').scrollIntoView();return;}
const target=new URL(link.href,location.href);target.hash=location.hash;location.assign(target.href);
},{capture:true});
// Keep all quick-search actions on the selected-language pages.
$('#quick-results')?.addEventListener('click',e=>{const n=e.target.closest('a');if(!n)return;const u=new URL(n.href);if(u.origin===location.origin){if(u.pathname.endsWith('/index.html'))u.pathname=u.pathname.slice(0,-10)+home;if(u.pathname.endsWith('/working-draft.html'))u.pathname=u.pathname.slice(0,-18)+draft;u.searchParams.delete('lang');n.href=u.href;}},{capture:true});
$$('a[href="#submission-privacy"]').forEach(n=>n.addEventListener('click',()=>$('#submission-privacy')?.setAttribute('tabindex','-1')));
})();
