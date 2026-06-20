'use strict';
const CATS=['Action','Adventure','Comedy','Drama','Fantasy','Romance','Horror','Sci-Fi','Sports','Slice of Life','Mystery','Thriller','Psychological','Mecha','Supernatural','Historical','Martial Arts','School','Music','Ecchi'];
const GC={Action:'#ef4444',Adventure:'#f97316',Comedy:'#eab308',Drama:'#a855f7',Fantasy:'#6366f1',Romance:'#ec4899',Horror:'#991b1b','Sci-Fi':'#06b6d4',Sports:'#22c55e','Slice of Life':'#84cc16',Mystery:'#8b5cf6',Thriller:'#4c0519',Psychological:'#7e22ce',Mecha:'#2563eb',Supernatural:'#c026d3',Historical:'#b45309','Martial Arts':'#dc2626',School:'#0891b2',Music:'#db2777',Ecchi:'#f43f5e'};
const GI={Action:'bolt',Adventure:'compass',Comedy:'laugh-beam',Drama:'masks-theater',Fantasy:'dragon',Romance:'heart',Horror:'ghost','Sci-Fi':'rocket',Sports:'futbol','Slice of Life':'coffee',Mystery:'magnifying-glass',Thriller:'skull',Psychological:'brain',Mecha:'robot',Supernatural:'wand-magic-sparkles',Historical:'landmark','Martial Arts':'hand-fist',School:'graduation-cap',Music:'music',Ecchi:'heart'};
const RM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

let THREE_INIT=false;

// ===== THEME =====
let currentTheme=localStorage.getItem('afy_theme')||'volcanic';
const themeColors={volcanic:0xf97316,crimson:0xd32f2f,emerald:0x2e7d32,violet:0x9c27b0,ocean:0x1976d2};
document.documentElement.setAttribute('data-theme',currentTheme);
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.theme-option').forEach(o=>o.classList.toggle('active',o.dataset.t===currentTheme));
  const icons={volcanic:'fa-palette',crimson:'fa-droplet',emerald:'fa-leaf',violet:'fa-wand-magic-sparkles',ocean:'fa-water'};
  const el=document.getElementById('themeIcon');
  if(el)el.className='fas '+(icons[currentTheme]||'fa-palette');
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
  const icons={volcanic:'fa-palette',crimson:'fa-droplet',emerald:'fa-leaf',violet:'fa-wand-magic-sparkles',ocean:'fa-water'};
  const el=document.getElementById('themeIcon');
  if(el)el.className='fas '+(icons[t]||'fa-palette');
  if(typeof updateThreeColor==='function')updateThreeColor(themeColors[t]||0xf97316);
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

// ===== THREE.JS — GPU CINEMATIC BACKGROUND =====
let threeScene,threeCamera,threeRenderer,threeShapes=[],threeParticles,threeMouseX=0,threeMouseY=0,threeTime=0,threeScrollY=0;
let threeCurrentColor=0xf97316;
let threeTargetX=0,threeTargetY=0;

function updateThreeColor(c){
  threeCurrentColor=c;
  if(threeParticles&&threeParticles.material.uniforms)
    threeParticles.material.uniforms.uColor.value.setHex(c);
  threeShapes.forEach(m=>{
    if(m.material&&m.material.color&&!m.userData.fixedColor)
      m.material.color.setHex(c);
  });
}

function createParticleShader(baseColor){
  const hue=new THREE.Color(baseColor);
  return new THREE.ShaderMaterial({
    uniforms:{uColor:{value:hue},uTime:{value:0},uPixelRatio:{value:Math.min(window.devicePixelRatio,2)}},
    vertexShader:`
      attribute float aSize;attribute float aGlow;
      varying float vGlow;
      uniform float uPixelRatio;
      void main(){
        vGlow=aGlow;
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=aSize*uPixelRatio*(6.0/-mvPosition.z);
        gl_Position=projectionMatrix*mvPosition;
      }
    `,
    fragmentShader:`
      uniform vec3 uColor;uniform float uTime;
      varying float vGlow;
      void main(){
        float d=distance(gl_PointCoord,vec2(0.5));
        if(d>0.5)discard;
        float glow=1.0-smoothstep(0.0,0.5,d);
        float core=1.0-smoothstep(0.0,0.2,d);
        vec3 col=mix(uColor,vec3(1.0),core*0.4);
        float alpha=glow*0.6*(0.7+0.3*sin(uTime*0.5+vGlow*6.28));
        gl_FragColor=vec4(col,alpha);
      }
    `,
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false
  });
}

function initThree(){
  if(THREE_INIT||typeof THREE==='undefined')return;
  THREE_INIT=true;
  try{
    const canvas=document.getElementById('three-canvas');
    if(!canvas)return;
    threeScene=new THREE.Scene();
    threeCamera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,1000);
    threeRenderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    threeRenderer.setSize(window.innerWidth,window.innerHeight);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    threeShapes=[];

    const isMobile=window.innerWidth<768;
    const shapeCount=isMobile?15:30;
    const colors=[threeCurrentColor,0xfb923c,0xfdba74,0x1a1a2e,0x6b7280,0xffffff];
    const geometries=[
      new THREE.IcosahedronGeometry(1,0),new THREE.OctahedronGeometry(1,0),
      new THREE.TorusGeometry(0.8,0.3,8,16),new THREE.DodecahedronGeometry(0.9,0),
      new THREE.TorusKnotGeometry(0.7,0.25,64,8),
      new THREE.TetrahedronGeometry(1,0),new THREE.ConeGeometry(0.8,1.4,6)
    ];

    for(let i=0;i<shapeCount;i++){
      const geo=geometries[Math.floor(Math.random()*geometries.length)];
      const colorIdx=Math.floor(Math.random()*colors.length);
      const isPrimary=colorIdx===0;
      const mat=new THREE.MeshPhysicalMaterial({
        color:colors[colorIdx],
        metalness:isPrimary?0.7:0.3,roughness:isPrimary?0.15:0.4,
        transparent:true,opacity:0.06+Math.random()*0.12,
        wireframe:Math.random()>0.65,
        clearcoat:isPrimary?0.4:0,clearcoatRoughness:0.3,
        envMapIntensity:0.6
      });
      const mesh=new THREE.Mesh(geo,mat);
      const range=isMobile?18:28;
      mesh.position.set(
        (Math.random()-0.5)*range,
        (Math.random()-0.5)*(range*0.7),
        (Math.random()-0.5)*(range*0.5)-6
      );
      mesh.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,0);
      mesh.userData={
        rotSpeed:{x:(Math.random()-0.5)*0.012,y:(Math.random()-0.5)*0.012},
        floatSpeed:0.1+Math.random()*0.2,floatOffset:Math.random()*Math.PI*2,
        origPos:mesh.position.clone(),
        mouseInfluence:0.4+Math.random()*0.6,fixedColor:!isPrimary
      };
      threeScene.add(mesh);threeShapes.push(mesh);
    }

    const pCount=isMobile?250:800;
    const pGeo=new THREE.BufferGeometry();
    const pPos=new Float32Array(pCount*3),pSize=new Float32Array(pCount),pGlow=new Float32Array(pCount);
    for(let i=0;i<pCount;i++){
      pPos[i*3]=(Math.random()-0.5)*60;
      pPos[i*3+1]=(Math.random()-0.5)*50;
      pPos[i*3+2]=(Math.random()-0.5)*40-5;
      pSize[i]=0.3+Math.random()*1.2;
      pGlow[i]=Math.random();
    }
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
    pGeo.setAttribute('aSize',new THREE.BufferAttribute(pSize,1));
    pGeo.setAttribute('aGlow',new THREE.BufferAttribute(pGlow,1));

    const pMat=createParticleShader(threeCurrentColor);
    threeParticles=new THREE.Points(pGeo,pMat);
    threeScene.add(threeParticles);

    threeCamera.position.z=12;
    threeCamera.position.y=0.8;

    document.addEventListener('mousemove',e=>{
      threeTargetX=(e.clientX/window.innerWidth-0.5)*2;
      threeTargetY=(e.clientY/window.innerHeight-0.5)*2;
    },{passive:true});

    document.addEventListener('touchmove',e=>{
      const t=e.touches[0];
      if(t){threeTargetX=(t.clientX/window.innerWidth-0.5)*2;threeTargetY=(t.clientY/window.innerHeight-0.5)*2;}
    },{passive:true});

    window.addEventListener('scroll',()=>{threeScrollY=window.scrollY;},{passive:true});

    function animate(){
      requestAnimationFrame(animate);
      threeTime+=0.006;
      threeMouseX+=(threeTargetX-threeMouseX)*0.035;
      threeMouseY+=(threeTargetY-threeMouseY)*0.035;

      const sf=Math.min(threeScrollY/1500,1);
      threeCamera.position.x+=((threeMouseX*3)-threeCamera.position.x)*0.012;
      threeCamera.position.y+=((-threeMouseY*2)-threeCamera.position.y+sf*1.2)*0.012;
      threeCamera.lookAt(threeScene.position);

      if(threeParticles.material.uniforms)
        threeParticles.material.uniforms.uTime.value=threeTime;

      threeShapes.forEach(m=>{
        m.rotation.x+=m.userData.rotSpeed.x;
        m.rotation.y+=m.userData.rotSpeed.y;

        const baseY=m.userData.origPos.y+Math.sin(threeTime*m.userData.floatSpeed+m.userData.floatOffset)*0.4;
        const attractX=threeMouseX*m.userData.mouseInfluence*0.2;
        const attractY=threeMouseY*m.userData.mouseInfluence*0.2;

        m.position.x+=(m.userData.origPos.x+attractX-m.position.x)*0.015;
        m.position.y+=(baseY+attractY-m.position.y)*0.015;

        const pulse=1+Math.sin(threeTime*0.3+m.userData.floatOffset)*0.04;
        m.scale.set(pulse,pulse,pulse);
      });

      threeParticles.rotation.y+=0.0002;
      threeParticles.rotation.x=Math.sin(threeTime*0.015)*0.015;

      threeRenderer.render(threeScene,threeCamera);
    }
    animate();

    window.addEventListener('resize',()=>{
      threeCamera.aspect=window.innerWidth/window.innerHeight;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(window.innerWidth,window.innerHeight);
      if(threeParticles.material.uniforms)
        threeParticles.material.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio,2);
    },{passive:true});
  }catch(e){console.log('Three.js init:',e.message);}
}

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
      item.style.transform='translateY(20px)';
      item.style.transition='opacity 0.45s cubic-bezier(0.22,1,0.36,1),transform 0.45s cubic-bezier(0.22,1,0.36,1)';
      item.style.transitionDelay=(20+(i%12)*35)+'ms';
      requestAnimationFrame(()=>{item.style.opacity='1';item.style.transform='translateY(0)';});
    });
  });
}

// ===== BUTTON MOUSE GLOW =====
function initButtonGlow(){
  document.querySelectorAll('.btn-filled').forEach(btn=>{
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      btn.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      btn.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
}

// ===== MAGNETIC BUTTONS =====
function initMagneticButtons(){
  if(RM||typeof gsap==='undefined')return;
  document.querySelectorAll('.btn-filled,.btn-outlined,.cat-card,.ep-pill').forEach(el=>{
    const xTo=gsap.quickTo(el,'x',{duration:0.4,ease:'power2.out'});
    const yTo=gsap.quickTo(el,'y',{duration:0.4,ease:'power2.out'});
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const dx=(e.clientX-r.left-r.width/2)*0.12;
      const dy=(e.clientY-r.top-r.height/2)*0.12;
      xTo(dx);yTo(dy);
    });
    el.addEventListener('mouseleave',()=>{xTo(0);yTo(0);});
  });
}

// ===== CARD 3D TILT =====
function initCardTilt(){
  if(RM)return;
  document.querySelectorAll('.anime-card,.cat-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width;
      const y=(e.clientY-r.top)/r.height;
      card.style.transform=`perspective(800px) rotateX(${(0.5-y)*12}deg) rotateY(${(x-0.5)*12}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave',()=>{card.style.transform='';});
  });
}

// ===== GSAP SCROLL ANIMATIONS =====
function initGSAPScroll(){
  if(RM||typeof gsap==='undefined'||typeof ScrollTrigger==='undefined')return;

  const hero=document.querySelector('.hero');
  if(hero)gsap.to(hero,{yPercent:15,scale:1.05,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1}});

  const glow=document.querySelector('.landing-glow');
  if(glow)gsap.to(glow,{scale:1.4,opacity:0.2,ease:'none',scrollTrigger:{trigger:glow.closest('.landing'),start:'top top',end:'bottom top',scrub:1}});

  document.querySelectorAll('.sect-head').forEach(head=>{
    gsap.from(head,{y:30,opacity:0,duration:0.5,ease:'power2.out',scrollTrigger:{trigger:head,start:'top 90%',toggleActions:'play none none reverse'}});
  });

  const syn=document.querySelector('.detail-syn');
  if(syn)gsap.from(syn,{y:20,opacity:0,duration:0.5,scrollTrigger:{trigger:syn,start:'top 85%'}});
}

// ===== HERO REVEAL ANIMATION =====
function initHeroReveal(){
  if(RM||typeof gsap==='undefined')return;
  const hero=document.querySelector('.landing,.hero');
  if(!hero)return;
  const tl=gsap.timeline({defaults:{ease:'power3.out',duration:0.6}});
  tl.from('.landing-badge,.hero-chip',{y:30,opacity:0,duration:0.4})
    .from('.landing-title,.hero-title',{y:40,opacity:0},"-=0.2")
    .from('.landing-desc,.hero-desc',{y:20,opacity:0},"-=0.15")
    .from('.landing-feats,.hero-sub',{y:15,opacity:0},"-=0.1")
    .from('.landing .btn-filled,.landing .btn-outlined,.hero-acts',{y:15,opacity:0,stagger:0.08},"-=0.1");
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
  const w=window.innerWidth,fixes=[];
  document.querySelectorAll('.card-grid, .cat-grid, .card-row, .filter-row, .alpha-bar').forEach(el=>{
    const style=getComputedStyle(el);
    if(style.display==='grid'){
      const cols=style.gridTemplateColumns;
      if(cols.includes('repeat')&&cols.includes('minmax')){
        el.dataset.afyOrigCols=el.dataset.afyOrigCols||cols;
        el.style.gridTemplateColumns='repeat(auto-fill,minmax('+(w<400?100:120)+'px,1fr))';
        el.style.gap=w<400?'6px':'8px';
        fixes.push(el.className.split(' ')[0]+': tightened cols');
      }
    }
  });
  document.querySelectorAll('.nav-search input, .fg input, .fg textarea, select').forEach(el=>{
    if(el.offsetWidth>w-32){el.style.fontSize='12px';el.style.padding='8px 12px';fixes.push(el.tagName+': shrunk');}
  });
  document.querySelectorAll('.landing-title, .hero-title, .detail-title, .pg-head h1').forEach(el=>{
    if(el.offsetWidth>w-32){const fs=parseFloat(getComputedStyle(el).fontSize);el.style.fontSize=Math.max(20,fs-4)+'px';fixes.push(el.className.split(' ')[0]+': '+el.style.fontSize);}
  });
  document.querySelectorAll('.landing-feats,.detail-wrap').forEach(el=>{
    if(el.offsetWidth>w-16){el.style.gap='8px';fixes.push('tightened');}
  });
  if(fixes.length)console.log('[afy] layout fixes:',fixes.join(', '));
}

// ===== APP BAR SCROLL EFFECT =====
function initAppBarScroll(){
  const bar=document.getElementById('topAppBar');
  if(!bar)return;
  window.addEventListener('scroll',()=>{
    bar.style.borderBottomColor=window.scrollY>10?'var(--glass-border)':'transparent';
  },{passive:true});
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  initBackToTop();initKeys();
  gsap.registerPlugin(ScrollTrigger);
  if(!RM){
    initThree();
    initStaggerEntrance();
    initButtonGlow();
    initMagneticButtons();
    initCardTilt();
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
