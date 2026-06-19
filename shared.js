'use strict';
const CATS=['Action','Adventure','Comedy','Drama','Fantasy','Romance','Horror','Sci-Fi','Sports','Slice of Life'];
const GC={Action:'#ef4444',Adventure:'#f97316',Comedy:'#eab308',Drama:'#a855f7',Fantasy:'#6366f1',Romance:'#ec4899',Horror:'#991b1b','Sci-Fi':'#06b6d4',Sports:'#22c55e','Slice of Life':'#84cc16'};
const GI={Action:'bolt',Adventure:'compass',Comedy:'laugh-beam',Drama:'masks-theater',Fantasy:'dragon',Romance:'heart',Horror:'ghost','Sci-Fi':'rocket',Sports:'futbol','Slice of Life':'coffee'};
const RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let THREE_INIT=false;

// ===== THEME =====
let currentTheme=localStorage.getItem('afy_theme')||'volcanic';
document.documentElement.setAttribute('data-theme',currentTheme);
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.theme-option').forEach(o=>o.classList.toggle('active',o.dataset.t===currentTheme));
  const icons={volcanic:'fa-palette',crimson:'fa-droplet',emerald:'fa-leaf',violet:'fa-wand-magic-sparkles',ocean:'fa-water'};
  const el=document.getElementById('themeIcon');
  if(el)el.className='fas '+(icons[currentTheme]||'fa-palette');
});

document.addEventListener('click',(e)=>{
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

// ===== THREE.JS BACKGROUND =====
function initThree(){
  if(THREE_INIT||typeof THREE==='undefined')return;
  THREE_INIT=true;
  try{
    const canvas=document.getElementById('three-canvas');
    if(!canvas)return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    const shapes=[];
    const colors=[0xf97316,0xfb923c,0xfdba74,0x1a1a2e,0x6b7280];
    const geometries=[
      new THREE.IcosahedronGeometry(1,0),new THREE.OctahedronGeometry(1,0),
      new THREE.TorusGeometry(0.8,0.3,8,16),new THREE.DodecahedronGeometry(0.9,0),
      new THREE.TorusKnotGeometry(0.7,0.25,64,8)
    ];
    for(let i=0;i<15;i++){
      const geo=geometries[Math.floor(Math.random()*geometries.length)];
      const mat=new THREE.MeshPhysicalMaterial({
        color:colors[Math.floor(Math.random()*colors.length)],
        metalness:0.3,roughness:0.4,transparent:true,
        opacity:0.15+Math.random()*0.2,wireframe:Math.random()>0.5
      });
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set((Math.random()-0.5)*20,(Math.random()-0.5)*15,(Math.random()-0.5)*15-5);
      mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0);
      mesh.userData={rotSpeed:{x:(Math.random()-0.5)*0.01,y:(Math.random()-0.5)*0.01},floatAmp:Math.random()*0.3,floatSpeed:0.2+Math.random()*0.3,floatOffset:Math.random()*Math.PI*2};
      scene.add(mesh);shapes.push(mesh);
    }
    const pCount=200;
    const pGeo=new THREE.BufferGeometry();
    const pPos=new Float32Array(pCount*3);
    for(let i=0;i<pCount*3;i++)pPos[i]=(Math.random()-0.5)*40;
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
    const pMat=new THREE.PointsMaterial({color:0xf97316,size:0.05,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending});
    const particles=new THREE.Points(pGeo,pMat);
    scene.add(particles);
    camera.position.z=8;
    let mouseX=0,mouseY=0;
    document.addEventListener('mousemove',(e)=>{mouseX=(e.clientX/window.innerWidth-0.5)*2;mouseY=(e.clientY/window.innerHeight-0.5)*2;},{passive:true});
    let time=0;
    function animate(){
      requestAnimationFrame(animate);time+=0.01;
      camera.position.x+=(mouseX*2-camera.position.x)*0.02;
      camera.position.y+=(-mouseY*2-camera.position.y)*0.02;
      camera.lookAt(scene.position);
      shapes.forEach(m=>{m.rotation.x+=m.userData.rotSpeed.x;m.rotation.y+=m.userData.rotSpeed.y;m.position.y+=Math.sin(time*m.userData.floatSpeed+m.userData.floatOffset)*0.002;});
      particles.rotation.y+=0.0005;
      renderer.render(scene,camera);
    }
    animate();
    window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);},{passive:true});
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

// ===== BOOKMARKS HELPERS =====
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
  return '<div class="anime-card" onclick="location=\'detail.html?id='+esc(a.id)+'\'"><div class="card-vis glass-card"><img src="'+esc(a.poster||'')+'" alt="'+esc(a.title)+'" width="160" height="224" loading="lazy" /><div class="card-overlay"><span class="card-play"><i class="fas fa-play"></i></span><button class="card-bm'+(bms.includes(a.id)?' on':'')+'" onclick="event.stopPropagation();this.classList.toggle(\'on\');toggleBM(\''+esc(a.id)+'\')" aria-label="Bookmark"><i class="fas fa-bookmark"></i></button></div><span class="card-badge">'+esc(a.type||'TV')+'</span>'+(a.rating>=9?'<span class="card-hot"><i class="fas fa-fire"></i></span>':'')+'</div><div class="card-txt"><h3>'+esc(a.title)+'</h3><div class="card-row-meta"><span><i class="fas fa-star" style="color:var(--accent)"></i> '+(a.rating||0)+'</span><span>'+(a.totalEpisodes||0)+' eps</span></div><div class="card-tags">'+(a.genres||[]).slice(0,2).map(g=>'<span class="ctag" style="--tc:'+(GC[g]||'var(--accent)')+'">'+esc(g)+'</span>').join('')+'</div></div></div>';
}

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded',()=>{
  initBackToTop();initKeys();
  gsap.registerPlugin(ScrollTrigger);
  if(!RM)initThree();
});
