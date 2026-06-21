'use strict';
const CATS=['Action','Adventure','Comedy','Drama','Fantasy','Romance','Horror','Sci-Fi','Sports','Slice of Life','Mystery','Thriller','Psychological','Mecha','Supernatural','Historical','Martial Arts','School','Music','Ecchi'];
const GC={Action:'#ef4444',Adventure:'#f97316',Comedy:'#eab308',Drama:'#a855f7',Fantasy:'#6366f1',Romance:'#ec4899',Horror:'#991b1b','Sci-Fi':'#06b6d4',Sports:'#22c55e','Slice of Life':'#84cc16',Mystery:'#8b5cf6',Thriller:'#4c0519',Psychological:'#7e22ce',Mecha:'#2563eb',Supernatural:'#c026d3',Historical:'#b45309','Martial Arts':'#dc2626',School:'#0891b2',Music:'#db2777',Ecchi:'#f43f5e'};
const GI={Action:'bolt',Adventure:'compass',Comedy:'laugh-beam',Drama:'masks-theater',Fantasy:'dragon',Romance:'heart',Horror:'ghost','Sci-Fi':'rocket',Sports:'futbol','Slice of Life':'coffee',Mystery:'magnifying-glass',Thriller:'skull',Psychological:'brain',Mecha:'robot',Supernatural:'wand-magic-sparkles',Historical:'landmark','Martial Arts':'hand-fist',School:'graduation-cap',Music:'music',Ecchi:'heart'};
const RM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

// ===== THEME =====
let currentTheme=localStorage.getItem('afy_theme')||'emerald';
document.documentElement.setAttribute('data-theme',currentTheme);
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.theme-option').forEach(o=>o.classList.toggle('active',o.dataset.t===currentTheme));
  const icons={emerald:'fa-leaf',cobalt:'fa-droplet',ember:'fa-fire',violet:'fa-wand-magic-sparkles',ocean:'fa-water'};
  const el=document.getElementById('themeIcon');
  if(el)el.className='fas '+(icons[currentTheme]||'fa-leaf');
});

document.addEventListener('click',e=>{
  const tp=document.getElementById('themePanel');
  if(tp&&tp.classList.contains('open')&&!e.target.closest('.theme-toggle'))tp.classList.remove('open');
});

function toggleThemePanel(){const tp=document.getElementById('themePanel');if(tp)tp.classList.toggle('open');}

function setTheme(t){
  currentTheme=t;
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem('afy_theme',t);
  const tp=document.getElementById('themePanel');
  if(tp)tp.classList.remove('open');
  document.querySelectorAll('.theme-option').forEach(o=>o.classList.toggle('active',o.dataset.t===t));
  const icons={emerald:'fa-leaf',cobalt:'fa-droplet',ember:'fa-fire',violet:'fa-wand-magic-sparkles',ocean:'fa-water'};
  const el=document.getElementById('themeIcon');
  if(el)el.className='fas '+(icons[t]||'fa-leaf');
}

// ===== UTILITIES =====
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function gIC(c){return GI[c]||'tag';}

// ===== TOAST =====
function toast(m){
  const tk=document.getElementById('toastRack');
  if(!tk)return;
  const t=document.createElement('div');
  t.className='toast';t.innerHTML='<i class="fas fa-check-circle"></i> '+esc(m);
  tk.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},3000);
}

// ===== MOBILE MENU =====
function toggleMobileMenu(){
  const el=document.getElementById('navLinks');
  const btn=document.getElementById('menuBtn');
  if(!el)return;
  const o=el.classList.toggle('open');
  if(btn)btn.setAttribute('aria-expanded',o);
}
document.addEventListener('click',e=>{
  const el=document.getElementById('navLinks');
  if(el&&el.classList.contains('open')&&!e.target.closest('.nav-links')&&!e.target.closest('.mobile-menu-btn'))
    el.classList.remove('open');
});

// ===== BACK TO TOP =====
function initBackToTop(){
  const btn=document.getElementById('backToTop');
  if(!btn)return;
  window.addEventListener('scroll',()=>{btn.classList.toggle('visible',window.scrollY>400);},{passive:true});
}

// ===== KEYBOARD =====
function initKeys(){
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();const el=document.getElementById('searchInput');if(el)el.focus();}
    if(e.key==='Escape'){const el=document.getElementById('searchInput');if(el)el.blur();}
  });
}

// ===== BOOKMARKS =====
function getBMS(){return JSON.parse(localStorage.getItem('afy_bm')||'[]');}
function saveBMS(b){localStorage.setItem('afy_bm',JSON.stringify(b));}
function toggleBM(id){
  let bms=getBMS();const i=bms.indexOf(id);
  if(i>-1){bms.splice(i,1);toast('Removed from bookmarks');}else{bms.push(id);toast('Added to bookmarks');}
  saveBMS(bms);
  document.querySelectorAll('.card-bm').forEach(b=>{
    const c=b.closest('.anime-card');if(!c)return;
    const m=c.getAttribute('onclick')?.match(/'([^']+)'/);
    if(m)b.classList.toggle('on',bms.includes(m[1]));
  });
  return bms;
}
function getHIST(){return JSON.parse(localStorage.getItem('afy_hist')||'[]');}
function saveHIST(h){localStorage.setItem('afy_hist',JSON.stringify(h));}

// ===== CARD HTML =====
function cardHTML(a,bms){
  return '<div class="anime-card" onclick="location=\'detail.html?id='+esc(a.id)+'\'"><div class="card-vis"><img src="'+esc(a.poster||'')+'" alt="'+esc(a.title)+'" width="160" height="224" loading="lazy" /><div class="card-overlay"><span class="card-play"><i class="fas fa-play"></i></span><button class="card-bm'+(bms.includes(a.id)?' on':'')+'" onclick="event.stopPropagation();this.classList.toggle(\'on\');toggleBM(\''+esc(a.id)+'\')" aria-label="Bookmark"><i class="fas fa-bookmark"></i></button></div><span class="card-badge">'+esc(a.type||'TV')+'</span>'+(a.rating>=9?'<span class="card-hot"><i class="fas fa-fire"></i></span>':'')+'</div><div class="card-txt"><h3>'+esc(a.title)+'</h3><div class="card-row-meta"><span><i class="fas fa-star" style="color:var(--primary)"></i> '+(a.rating||0)+'</span><span>'+(a.totalEpisodes||0)+' eps</span></div><div class="card-tags">'+(a.genres||[]).slice(0,2).map(g=>'<span class="ctag" style="--tc:'+(GC[g]||'var(--primary)')+'">'+esc(g)+'</span>').join('')+'</div></div></div>';
}

// ===== SCROLL REVEAL =====
function initScrollReveal(){
  if(RM)return;
  const els=document.querySelectorAll('.afy-reveal');
  if(!els.length)return;
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');obs.unobserve(e.target);}});
  },{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
  els.forEach(el=>obs.observe(el));
}

// ===== STAGGER ENTRANCE =====
function initStaggerEntrance(){
  if(RM)return;
  document.querySelectorAll('.card-grid,.cat-grid,.ep-list').forEach(grid=>{
    const items=grid.children;
    if(!items.length)return;
    Array.from(items).forEach((item,i)=>{
      item.style.opacity='0';
      item.style.transform='translateY(12px)';
      item.style.transition='opacity 0.35s cubic-bezier(0.22,1,0.36,1),transform 0.35s cubic-bezier(0.22,1,0.36,1)';
      item.style.transitionDelay=(15+(i%12)*25)+'ms';
      requestAnimationFrame(()=>{item.style.opacity='1';item.style.transform='translateY(0)';});
    });
  });
}

// ===== GSAP SCROLL ANIMATIONS =====
function initGSAPScroll(){
  if(RM||typeof gsap==='undefined'||typeof ScrollTrigger==='undefined')return;
  document.querySelectorAll('.sect-head').forEach(head=>{
    gsap.from(head,{y:20,opacity:0,duration:0.4,ease:'power2.out',scrollTrigger:{trigger:head,start:'top 90%',toggleActions:'play none none reverse'}});
  });
}

// ===== HERO REVEAL ANIMATION =====
function initHeroReveal(){
  if(RM||typeof gsap==='undefined')return;
  const hero=document.querySelector('.landing,.hero');
  if(!hero)return;
  const tl=gsap.timeline({defaults:{ease:'power3.out',duration:0.5}});
  tl.from('.landing-badge,.hero-chip',{y:20,opacity:0,duration:0.3})
    .from('.landing-title,.hero-title',{y:30,opacity:0},"-=0.15")
    .from('.landing-desc,.hero-desc',{y:15,opacity:0},"-=0.1")
    .from('.landing-feats,.hero-sub',{y:10,opacity:0},"-=0.08")
    .from('.landing .btn-filled,.landing .btn-outlined,.hero-acts',{y:10,opacity:0,stagger:0.06},"=-0.08");
}

// ===== PAGE TRANSITIONS =====
function initPageTransitions(){
  if(!document.startViewTransition)return;
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a||!a.href)return;
    const url=new URL(a.href);
    if(url.origin!==location.origin)return;
    if(url.pathname===location.pathname&&url.hash)return;
    if(a.hasAttribute('download')||a.target==='_blank')return;
    e.preventDefault();
    document.startViewTransition(()=>{location.href=a.href;});
  });
}

// ===== AUTO LAYOUT =====
function autoFixLayout(){
  const html=document.documentElement;
  if(html.scrollWidth<=window.innerWidth)return;
  const w=window.innerWidth;
  document.querySelectorAll('.card-grid, .cat-grid, .card-row, .filter-row, .alpha-bar').forEach(el=>{
    const style=getComputedStyle(el);
    if(style.display==='grid'){
      const cols=style.gridTemplateColumns;
      if(cols.includes('repeat')&&cols.includes('minmax')){
        el.dataset.afyOrigCols=el.dataset.afyOrigCols||cols;
        el.style.gridTemplateColumns='repeat(auto-fill,minmax('+(w<400?100:120)+'px,1fr))';
        el.style.gap=w<400?'6px':'8px';
      }
    }
  });
}

// ===== APP BAR SCROLL EFFECT =====
function initAppBarScroll(){
  const bar=document.getElementById('topAppBar');
  if(!bar)return;
  window.addEventListener('scroll',()=>{
    bar.style.borderBottomColor=window.scrollY>10?'var(--border)':'transparent';
  },{passive:true});
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  initBackToTop();initKeys();
  if(typeof gsap!=='undefined'&&typeof ScrollTrigger!=='undefined')gsap.registerPlugin(ScrollTrigger);
  if(!RM){
    initStaggerEntrance();
    initGSAPScroll();
    initHeroReveal();
  }
  initScrollReveal();
  initPageTransitions();
  initAppBarScroll();
  setTimeout(autoFixLayout,100);
  let rt;
  window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(autoFixLayout,200);},{passive:true});
});