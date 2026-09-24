import * as THREE from 'three';
import { OrbitControls } from './assets/OrbitControls.js';
import { planets, position, elements, DAY, MIN_DATE, MAX_DATE, parseDate } from './orbits.js';
import { JPL_MIN, JPL_MAX, TOTAL_DAYS, formatDate, dateKey, sliderToTime, timeToSlider, utcDate } from './timeline.js';

const $=id=>document.getElementById(id);
const icons={
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 orbit:'<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="3"/>',
 target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 layers:'<path d="m12 3 10 6-10 6L2 9Zm-10 12 10 6 10-6M2 15l10 6 10-6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
 mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
 play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
 reverse:'<path d="m11 6-7 6 7 6m9-12-7 6 7 6"/>',
 'step-back':'<path d="M5 5v14m14-14-10 7 10 7Z"/>',
 'step-next':'<path d="M19 5v14M5 5l10 7-10 7Z"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.info}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const sun={id:'sun',name:'The Sun',kind:'Our local star',color:'#efbf83',radius:3.3,texture:'2k_sun.jpg',description:'The star at the heart of it all. Its gravity holds our planetary neighbourhood together.',fact:'The Sun contains about 99.8% of the solar system’s mass.'};
const moon={id:'moon',name:'The Moon',kind:'Earth’s natural satellite',color:'#c7c7be',radius:.24,diameter:3475,period:27.3217,rotation:27.3217,tilt:6.68,texture:'2k_moon.jpg',description:'Earth’s only natural satellite. Its orbit here is illustrative.',fact:'The Moon orbits Earth about once every 27.3 days.'};
const pluto={id:'pluto',name:'Pluto',kind:'Dwarf planet · illustrative orbit',color:'#baab9d',radius:.28,displayOrbit:81,diameter:2377,period:90560,rotation:-6.39,tilt:122.5,texture:'2k_pluto.jpg',description:'A distant dwarf planet in the Kuiper Belt. This orbit is illustrative and is not part of the JPL eight-planet approximation.',fact:'Pluto takes about 248 years to orbit the Sun.',base:[39.48,.2488,17.16,238.9,224.07,110.3],rate:[0,0,0,145.16,0,0]};
const bodies=[sun,...planets,moon,pluto];
const shareableIds=new Set(bodies.map(b=>b.id));
let applyingHash=false;
function syncHash(){if(applyingHash)return;const time='date='+dateKey(state.date);const hash='#'+time+'&body='+state.selected;if(location.hash!==hash)history.replaceState(null,'',hash);}
function readHash(){const data=new URLSearchParams(location.hash.slice(1));const date=parseDate(data.get('date')||'');const body=data.get('body');return {date,body:shareableIds.has(body)?body:null};}
const initialHash=readHash();
const state={date:initialHash.date??Math.max(MIN_DATE,Math.min(MAX_DATE,Date.now())),playing:false,speed:10,direction:1,selected:'sun',following:null,scale:'compact',view:'overview'};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,controls,starField,selectionGlow,flight=null,trackPosition=new THREE.Vector3(),lastTick=0,lastUI=0,lastOrbitDate=NaN,toastTimer,frameID,viewWidth=0,viewHeight=0;
const objects=new Map(),orbitLines=new Map(),labels=new Map();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),projected=new THREE.Vector3();
const assetErrors=[];
const optionalVisible=id=>id==='moon'?$('moon-toggle').checked:id==='pluto'?$('pluto-toggle').checked:true;
function showOptionalBody(id,show){const item=objects.get(id);item.root.visible=show;const orbit=orbitLines.get(id);if(orbit)orbit.visible=show&&$('orbits-toggle').checked;labels.get(id).hidden=!show;if(!show&&state.selected===id){selectBody(id==='moon'?'earth':'sun');if(state.following===id)setView('overview');}makeBodyList();updateLabels();}

function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function showInformation(show){$('inspector').hidden=!show;$('show-info').hidden=show;}
function selectedBody(){return bodies.find(x=>x.id===state.selected);}
function stat(label,value,unit=''){return `<div class="stat"><small>${label}</small><strong>${value}${unit?` <span>${unit}</span>`:''}</strong></div>`;}
function updateInspector(){
 const b=selectedBody();
 $('body-name').textContent=b.name;$('body-kind').textContent=b.kind.toUpperCase();$('body-description').textContent=b.description;$('body-fact').textContent=b.fact;
 if(b.id==='moon'){$('body-stats').innerHTML=stat('MEAN DIAMETER','3,475','km')+stat('ORBITAL PERIOD','27.3','days')+stat('FROM EARTH','384,400','km')+stat('MODEL','Illustrative');}
 else if(b.id==='sun'){$('body-stats').innerHTML=stat('DIAMETER','1.39M','km')+stat('STAR TYPE','G2V')+stat('AGE','4.6B','years')+stat('SURFACE','5,500','°C');}
 else{const p=position(b,visualTime()),distance=Math.hypot(...p),period=b.period<1000?Math.round(b.period):+(b.period/365.25).toFixed(1),unit=b.period<1000?'days':'years';
 $('body-stats').innerHTML=stat('MEAN DIAMETER',b.diameter.toLocaleString('en-US'),'km')+stat('ORBITAL PERIOD',period,unit)+stat('FROM THE SUN',distance.toFixed(2),'AU')+stat('LIGHT TRAVEL',(distance*8.31675).toFixed(1),'min');}
 $('focus-body').innerHTML=icon('target')+(state.following===b.id?'Following '+b.name.replace('The ',''):'Explore up close')+'<span>↗</span>';
}
function selectBody(id,{show=true}={}){
 if(!objects.has(id))throw new Error('Unknown celestial body.');
 state.selected=id;
 document.querySelectorAll('.body-button').forEach(el=>{const active=el.dataset.body===id;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
 labels.forEach((el,key)=>el.classList.toggle('selected',id===key));
 // Keep orbital paths quiet; selection is shown on the planet itself.
 orbitLines.forEach(line=>{line.material.opacity=.17;line.material.color.set('#778aa8');});
 if(selectionGlow){const item=objects.get(id);item.root.add(selectionGlow);selectionGlow.material.color.set(id==='sun'?'#ffd394':selectedBody().color);selectionGlow.scale.setScalar(item.body.radius*(id==='sun'?4.8:4.2));selectionGlow.visible=true;}
 updateInspector();syncHash();if(show)showInformation(true);
}
function makeBodyList(){
 $('body-count').textContent=(9+Number($('moon-toggle').checked)+Number($('pluto-toggle').checked))+' BODIES';
 $('body-list').innerHTML=bodies.filter(b=>optionalVisible(b.id)).map((b,i)=>`<button class="body-button${b.id===state.selected?' selected':''}" data-body="${b.id}" aria-pressed="${b.id===state.selected}" title="Select ${b.name}"><span class="body-dot" style="--body-color:${b.color}"></span><span>${b.name.replace('The ','')}</span><span class="body-order">${String(i).padStart(2,'0')}</span></button>`).join('');
 $('body-list').onclick=event=>{const button=event.target.closest('[data-body]');if(!button)return;selectBody(button.dataset.body);if(state.following)focusBody(button.dataset.body);};
}
function updateDateUI(force=false){
 const label=formatDate(state.date),progress=timeToSlider(state.date);
 if(force||document.activeElement!==$('date-input'))$('date-input').value=label;
 $('time-slider').value=progress;$('time-slider').style.setProperty('--progress',progress/TOTAL_DAYS*100+'%');
 $('time-slider').setAttribute('aria-valuetext',label);
 $('back-day').disabled=state.date<=MIN_DATE;$('next-day').disabled=state.date>=MAX_DATE;
 const valid=state.date>=JPL_MIN&&state.date<=JPL_MAX;
 $('era-status').textContent=valid?'JPL approximate orbits':'Illustrative orbits · outside JPL dates';
 $('era-status').title=valid?'Approximate orbital solution valid 3000 BCE–3000 CE':'Outside JPL’s fitted interval. The planet positions are illustrative.';
}
function setPlaying(value){
 state.playing=Boolean(value);$('play').innerHTML=icon(state.playing?'pause':'play');$('play').setAttribute('aria-label',state.playing?'Pause time':'Play time');
 $('play-state').textContent=state.playing?(state.direction<0?'REVERSE':'PLAYING'):'PAUSED';if(!state.playing)syncHash();
}
function setDirection(value){state.direction=value;$('reverse').classList.toggle('active',value<0);$('reverse').setAttribute('aria-pressed',String(value<0));setPlaying(state.playing);}
function setDate(value,{pause=true}={}){
 if(!Number.isFinite(value))throw new Error('Invalid date.');
 state.date=Math.max(MIN_DATE,Math.min(MAX_DATE,value));if(pause)setPlaying(false);
 $('date-error').textContent='';updateDateUI(true);updatePositions();updateOrbitLines();updateInspector();syncHash();
}
function visualTime(){return state.date;}
function displayPosition(b,milliseconds,E){const p=position(b,milliseconds,E);const factor=state.scale==='compact'?b.displayOrbit/b.base[0]:10;return new THREE.Vector3(p[0]*factor,p[2]*factor,-p[1]*factor);}
function makeTexture(loader,name){const source=name.endsWith('.jpg')?name.replace('2k_','1k_').replace('.jpg','.webp'):name;const texture=loader.load('./assets/'+source);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return texture;}
function makeGlow(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(255,199,100,0.48)');g.addColorStop(.28,'rgba(255,167,59,0.18)');g.addColorStop(.55,'rgba(255,127,25,0.04)');g.addColorStop(1,'rgba(255,116,20,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),color:0xffd096,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(23,23,1);return glow;
}
function makeSelectionGlow(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,24,64,64,64);
 g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.34,'rgba(255,255,255,.14)');g.addColorStop(.58,'rgba(255,255,255,.11)');g.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 return new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true}));
}
function makeStars(){
 const array=new Float32Array(4500*3),colors=new Float32Array(4500*3);let seed=8712;
 const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<4500;i++){const theta=random()*Math.PI*2,z=random()*2-1,r=800+random()*800,q=Math.sqrt(1-z*z);array.set([r*q*Math.cos(theta),r*z,r*q*Math.sin(theta)],i*3);const c=.25+random()*.45;colors.set([c*.87,c*.93,c],i*3);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(array,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 return new THREE.Points(geo,new THREE.PointsMaterial({size:1.2,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.62,depthWrite:false}));
}
function createObjects(loader){
 const sphere=new THREE.SphereGeometry(1,64,40);
 selectionGlow=makeSelectionGlow();
 bodies.forEach(b=>{
  const root=new THREE.Group(),tilt=new THREE.Group();tilt.rotation.z=(b.tilt||7.25)*Math.PI/180;root.add(tilt);
  const map=(b.id==='moon'||b.id==='pluto')?null:makeTexture(loader,b.texture);
  const mat=b.id==='sun'?new THREE.MeshBasicMaterial({map,color:0xffe3b4}):new THREE.MeshStandardMaterial({map,color:map?0xffffff:b.color,roughness:1,metalness:0});
  const mesh=new THREE.Mesh(sphere,mat);mesh.scale.setScalar(b.radius);mesh.userData.body=b.id;tilt.add(mesh);scene.add(root);
  if(b.id==='sun')root.add(makeGlow());
  if(b.id==='earth'){
   const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(b.radius*1.04,40,24),new THREE.ShaderMaterial({uniforms:{glowColor:{value:new THREE.Color('#4f99ff')}},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 glowColor;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),3.0);gl_FragColor=vec4(glowColor,f*0.38);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));tilt.add(atmosphere);
  }
  if(b.id==='saturn'){
   const inner=b.radius*1.24,outer=b.radius*2.3,geo=new THREE.RingGeometry(inner,outer,160),uv=geo.attributes.uv,pos=geo.attributes.position;
   for(let i=0;i<pos.count;i++){const radius=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(radius-inner)/(outer-inner),.5);}
   const ring=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:makeTexture(loader,'2k_saturn_ring_alpha.png'),side:THREE.DoubleSide,transparent:true,roughness:1,opacity:.9,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.userData.body=b.id;tilt.add(ring);
  }
  objects.set(b.id,{root,mesh,tilt,body:b});
  const label=document.createElement('span');label.className='planet-label';label.textContent=b.name.replace('The ','');$('labels').append(label);labels.set(b.id,label);
  if(b.id!=='sun'&&b.id!=='moon'){
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(361*3),3));
   const line=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:0x778aa8,transparent:true,opacity:.17,depthWrite:false}));scene.add(line);orbitLines.set(b.id,line);
  }
 });
 updatePositions();updateOrbitLines();
}
function updatePositions(){
 const date=visualTime();[...planets,pluto].forEach(b=>{const item=objects.get(b.id);if(!item)return;item.root.position.copy(displayPosition(b,date));item.mesh.rotation.y=((date/DAY/b.rotation)%1)*Math.PI*2;});
 const earth=objects.get('earth'),satellite=objects.get('moon');if(earth&&satellite){const angle=(date-utcDate(2000,1,1))/DAY/27.3217*Math.PI*2;satellite.root.position.copy(earth.root.position).add(new THREE.Vector3(1.55*Math.cos(angle),.14*Math.sin(angle*.91),1.55*Math.sin(angle)));satellite.mesh.rotation.y=angle;}
 const star=objects.get('sun');if(star)star.mesh.rotation.y=((date/DAY/25.38)%1)*Math.PI*2;
}
function updateOrbitLines(){
 const date=visualTime();
 [...planets,pluto].forEach(b=>{const line=orbitLines.get(b.id);if(!line)return;const attr=line.geometry.attributes.position;
  for(let i=0;i<361;i++){const p=displayPosition(b,date,i/360*Math.PI*2);attr.setXYZ(i,p.x,p.y,p.z);}attr.needsUpdate=true;line.geometry.computeBoundingSphere();
 });lastOrbitDate=date;
}
function setActiveView(id){['overview','inner-view','top-view'].forEach(x=>{const active=x===id;$(x).classList.toggle('active',active);$(x).setAttribute('aria-pressed',String(active));});}
function flyTo(target,offset,follow=null){
 state.following=follow;controls.enablePan=!follow;
 flight={from:camera.position.clone(),fromTarget:controls.target.clone(),target:target.clone(),offset:offset.clone(),start:performance.now(),duration:reducedMotion?0:1000,follow};
 trackPosition.copy(target);controls.minDistance=follow?(selectedBody().radius*1.45):.8;
}
function setView(mode='overview'){
 state.view=mode;state.following=null;controls.enablePan=true;
 $('back-system').hidden=true;
 const maxRadius=state.scale==='actual'?($('pluto-toggle').checked?400:307):($('pluto-toggle').checked?86:72);
 const mobile=innerWidth<900;const aspect=Math.max(.55,camera.aspect);
 let distance=maxRadius*(mobile?2.1:1.72)*Math.max(1,1.25/aspect);
 if(mode==='inner')distance=state.scale==='actual'?48:53;
 const offset=mode==='top'?new THREE.Vector3(0,distance,0.001):new THREE.Vector3(distance*.1,distance*.53,distance*.86);
 flyTo(new THREE.Vector3(),offset);setActiveView(mode==='inner'?'inner-view':mode==='top'?'top-view':'overview');
 $('scene-title').innerHTML=(mode==='inner'?'The inner worlds':'Our solar system')+'<span>.</span>';
 $('scene-subtitle').textContent=mode==='inner'?'Four rocky worlds. A closer perspective.':'8 planets. One extraordinary star.';
 updateInspector();
}
function focusBody(id=state.selected){
 if(!objects.has(id))return;selectBody(id);const item=objects.get(id),b=item.body;
 const distance=b.radius*(id==='saturn'?10:7.5)*Math.max(1,1/camera.aspect);
 const offset=new THREE.Vector3(.55,.26,1).normalize().multiplyScalar(distance);
 flyTo(item.root.position,offset,id);state.view='focus';setActiveView(null);
 $('back-system').hidden=false;
 $('scene-title').innerHTML=b.name+'<span>.</span>';$('scene-subtitle').textContent='Following '+b.name.replace('The ','')+' · Drag to explore';
 updateInspector();if(innerWidth<=560)showInformation(false);
}
function resize(){
 const bounds=$('scene').getBoundingClientRect();viewWidth=bounds.width;viewHeight=bounds.height;
 camera.aspect=viewWidth/viewHeight;camera.updateProjectionMatrix();renderer.setSize(viewWidth,viewHeight);
}
function updateLabels(){
 if(!$('labels-toggle').checked){$('labels').hidden=true;return;}$('labels').hidden=false;
 const box=$('scene').getBoundingClientRect(),parent=$('universe').getBoundingClientRect();
 objects.forEach((item,id)=>{
  const label=labels.get(id);projected.copy(item.root.position).project(camera);
  const visible=optionalVisible(id)&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&state.following!==id;
  label.hidden=!visible;if(visible){label.style.left=((projected.x+1)*viewWidth/2+box.left-parent.left)+'px';label.style.top=((-projected.y+1)*viewHeight/2+box.top-parent.top)+'px';}
 });
}
function tick(now){
 const delta=lastTick?Math.min((now-lastTick)/1000,.1):0;lastTick=now;
 if(state.playing&&!document.hidden){
  const next=state.date+delta*state.speed*state.direction*DAY;state.date=Math.min(MAX_DATE,Math.max(MIN_DATE,next));if(next<=MIN_DATE||next>=MAX_DATE){setPlaying(false);notify(next<=MIN_DATE?'Reached 10,000 BCE. Reverse direction to continue.':'Reached 10,000 CE. Reverse direction to continue.');}
  updatePositions();if(Math.abs(visualTime()-lastOrbitDate)>DAY*365.25*2)updateOrbitLines();
 }
 if(flight){
  const t=flight.duration?Math.min(1,(now-flight.start)/flight.duration):1,eased=1-Math.pow(1-t,3);
  const target=flight.follow?objects.get(flight.follow).root.position:flight.target;
  controls.target.lerpVectors(flight.fromTarget,target,eased);
  camera.position.lerpVectors(flight.from,target.clone().add(flight.offset),eased);
  trackPosition.copy(target);
  if(t>=1)flight=null;
 }else if(state.following){const target=objects.get(state.following).root.position;const shift=target.clone().sub(trackPosition);camera.position.add(shift);controls.target.add(shift);trackPosition.copy(target);}
 controls.update();renderer.render(scene,camera);updateLabels();
 if(now-lastUI>150){updateDateUI();if(state.playing)updateInspector();lastUI=now;}
 frameID=requestAnimationFrame(tick);
}
function hitTest(event){
 const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
 raycaster.setFromCamera(pointer,camera);const meshes=[];objects.forEach((o,id)=>{if(optionalVisible(id))o.root.traverse(child=>{if(child.userData.body)meshes.push(child);});});
 const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)return hit.object.userData.body;
 // A small screen-space hit target keeps distant planets easy to select.
 let closest=null,best=18;
 objects.forEach((o,id)=>{if(!optionalVisible(id))return;const p=o.root.position.clone().project(camera);if(p.z< -1||p.z>1)return;const d=Math.hypot((p.x+1)*rect.width/2+rect.left-event.clientX,(-p.y+1)*rect.height/2+rect.top-event.clientY);if(d<best){closest=id;best=d;}});return closest;
}
function connectUI(){
 $('play').onclick=()=>setPlaying(!state.playing);$('reverse').onclick=()=>{setDirection(-state.direction);notify(state.direction<0?'Time direction: backward':'Time direction: forward');};
 $('back-day').onclick=()=>setDate(state.date-DAY);$('next-day').onclick=()=>setDate(state.date+DAY);
 $('today').onclick=()=>{setDate(Date.now());notify('Returned to today');};
 $('moon-toggle').onchange=()=>showOptionalBody('moon',$('moon-toggle').checked);
 $('pluto-toggle').onchange=()=>{showOptionalBody('pluto',$('pluto-toggle').checked);setView('overview');};
 $('date-input').addEventListener('focus',()=>setPlaying(false));
 $('date-input').addEventListener('change',()=>{const value=parseDate($('date-input').value);if(value===null){$('date-error').textContent='Enter YYYY-MM-DD BCE or CE, from 10,000 BCE to 10,000 CE.';return;}setDate(value);});
 $('date-input').addEventListener('blur',()=>{if(parseDate($('date-input').value)===null){updateDateUI(true);}});
 $('date-input').addEventListener('keydown',event=>{if(event.key==='Enter'){$('date-input').blur();}});
 $('time-slider').oninput=()=>setDate(sliderToTime($('time-slider').value));
 document.querySelectorAll('[data-year]').forEach(el=>el.onclick=()=>setDate(utcDate(Number(el.dataset.year),1,1)));
 $('speed').onchange=()=>{state.speed=Number($('speed').value);};
 $('overview').onclick=()=>setView('overview');$('inner-view').onclick=()=>setView('inner');$('top-view').onclick=()=>setView('top');$('reset-view').onclick=()=>setView('overview');$('back-system').onclick=()=>setView('overview');
 $('focus-body').onclick=()=>focusBody();$('close-info').onclick=()=>showInformation(false);$('show-info').onclick=()=>showInformation(true);
 $('zoom-in').onclick=()=>zoom(.78);$('zoom-out').onclick=()=>zoom(1.28);
 $('orbits-toggle').onchange=()=>orbitLines.forEach((line,id)=>line.visible=$('orbits-toggle').checked&&(id!=='pluto'||$('pluto-toggle').checked));
 $('stars-toggle').onchange=()=>starField.visible=$('stars-toggle').checked;
 $('labels-toggle').onchange=()=>updateLabels();
 $('scale-mode').onchange=()=>setScale($('scale-mode').value);
 let autoStartedCinema=false,preCinemaSpeed=state.speed;
 const setCinema=active=>{
  const wasActive=document.documentElement.classList.contains('cinema');
  if(active===wasActive)return;
  document.documentElement.classList.toggle('cinema',active);
  $('fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');$('fullscreen').title=active?'Exit fullscreen':'Fullscreen';
  if(active){autoStartedCinema=!state.playing;if(autoStartedCinema){preCinemaSpeed=state.speed;state.speed=10;$('speed').value='10';if((state.date>=MAX_DATE&&state.direction>0)||(state.date<=MIN_DATE&&state.direction<0))setDirection(-state.direction);setPlaying(true);}if($('support-card'))$('support-card').hidden=true;}
  else if(autoStartedCinema){setPlaying(false);state.speed=preCinemaSpeed;$('speed').value=String(preCinemaSpeed);autoStartedCinema=false;}
  resize();
 };
 $('fullscreen').onclick=async()=>{if(document.documentElement.classList.contains('cinema')){setCinema(false);if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});return;}setCinema(true);if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen().catch(()=>{});};
 document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement)setCinema(true);else if(document.documentElement.classList.contains('cinema'))setCinema(false);});
 const openGuide=()=>{setPlaying(false);$('guide').showModal();};$('help').onclick=openGuide;$('model-info').onclick=openGuide;$('close-guide').onclick=()=>$('guide').close();
 $('guide').addEventListener('click',event=>{if(event.target===$('guide')){const box=$('guide').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('guide').close();}});
 document.addEventListener('keydown',event=>{
  if($('guide').open||event.altKey||event.metaKey||event.ctrlKey||/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(event.target.tagName))return;
  if(['KeyW','KeyA','KeyS','KeyD'].includes(event.code)){event.preventDefault();flight=null;const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta+=event.code==='KeyA'?.12:event.code==='KeyD'?-.12:0;spherical.phi=Math.max(.05,Math.min(Math.PI-.05,spherical.phi+(event.code==='KeyW'?.12:event.code==='KeyS'?-.12:0)));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();return;}
  if(event.code==='Space'){event.preventDefault();setPlaying(!state.playing);}
  if(event.key==='ArrowLeft'){event.preventDefault();setDate(state.date-DAY);}
  if(event.key==='ArrowRight'){event.preventDefault();setDate(state.date+DAY);}
  if(event.key.toLowerCase()==='r'||event.key==='Escape')setView('overview');
  if(event.key==='+'||event.key==='=')zoom(.8);if(event.key==='-')zoom(1.25);
 });
 let down=null,moved=false;
 renderer.domElement.addEventListener('pointerdown',event=>{if(event.isPrimary){down={x:event.clientX,y:event.clientY};moved=false;}});
 renderer.domElement.addEventListener('pointermove',event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)moved=true;if(!down&&event.pointerType==='mouse')renderer.domElement.style.cursor=hitTest(event)?'pointer':'grab';});
 renderer.domElement.addEventListener('pointerup',event=>{if(down&&!moved&&event.button===0){const id=hitTest(event);if(id)selectBody(id);}down=null;});
 renderer.domElement.addEventListener('pointercancel',()=>down=null);
 renderer.domElement.addEventListener('dblclick',event=>{const id=hitTest(event);if(id)focusBody(id);});
 controls.addEventListener('start',()=>{flight=null;});
 document.addEventListener('visibilitychange',()=>{lastTick=0;});
}
function zoom(factor){flight=null;const offset=camera.position.clone().sub(controls.target);const length=Math.min(controls.maxDistance,Math.max(controls.minDistance,offset.length()*factor));camera.position.copy(controls.target).add(offset.setLength(length));controls.update();}
function setScale(value){
 if(!['compact','actual'].includes(value))throw new Error('Unknown distance scale.');state.scale=value;$('scale-mode').value=value;
 objects.get('sun').root.scale.setScalar(value==='actual'?.4:1);
 $('scale-note').textContent=value==='compact'?'Planet sizes enlarged · Orbit distances compressed':'Planet sizes enlarged · Orbit distances proportional';
 updatePositions();updateOrbitLines();setView('overview');
}
function registerAgentTools(){
 if(!document.modelContext?.registerTool)return;
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const schema={type:'object',properties:{date:{type:'string',description:'Calendar date YYYY-MM-DD BCE or CE, from 10000 BCE to 10000 CE'},body:{type:'string',enum:bodies.map(x=>x.id)},view:{type:'string',enum:['overview','inner','top','focus']},playing:{type:'boolean'},direction:{type:'integer',enum:[-1,1]},daysPerSecond:{type:'number',minimum:0.000011574,maximum:3652.5}},additionalProperties:false};
 try{Promise.resolve(document.modelContext.registerTool({name:'configure_solar_system',title:'Explore the solar system',description:'Set the visible date, selected body, camera view, and time playback in Solar Atlas.',inputSchema:schema,annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object.');
  const allowed=Object.keys(schema.properties);if(Object.keys(input).some(k=>!allowed.includes(k)))throw new Error('Unknown option.');
  const date=input.date===undefined?undefined:parseDate(input.date);if(date===null)throw new Error('Enter a date from 10000 BCE to 10000 CE.');
  if(input.body!==undefined&&!bodies.some(b=>b.id===input.body))throw new Error('Unknown body.');
  if(input.view!==undefined&&!['overview','inner','top','focus'].includes(input.view))throw new Error('Unknown view.');
  if(input.playing!==undefined&&typeof input.playing!=='boolean')throw new Error('playing must be boolean.');
  if(input.direction!==undefined&&input.direction!==1&&input.direction!==-1)throw new Error('direction must be 1 or -1.');
  if(input.daysPerSecond!==undefined&&(!Number.isFinite(input.daysPerSecond)||input.daysPerSecond<0.000011574||input.daysPerSecond>3652.5))throw new Error('Speed is outside the supported range.');
  if(date!==undefined)setDate(date);if(input.body!==undefined){if(input.body==='moon'&&!$('moon-toggle').checked)$('moon-toggle').click();if(input.body==='pluto'&&!$('pluto-toggle').checked)$('pluto-toggle').click();selectBody(input.body);}
  if(input.direction!==undefined)setDirection(input.direction);
  if(input.daysPerSecond!==undefined){state.speed=input.daysPerSecond;const val=String(state.speed);if(!Array.from($('speed').options).some(o=>o.value===val)){const option=new Option(val+' days / second',val);$('speed').add(option);}$('speed').value=val;}
  if(input.view!==undefined){if(input.view==='focus')focusBody();else setView(input.view);}
  if(input.playing!==undefined)setPlaying(input.playing);
  await new Promise(resolve=>requestAnimationFrame(resolve));return {date:formatDate(state.date),body:state.selected,view:state.view,playing:state.playing,direction:state.direction,daysPerSecond:state.speed};
 }},{signal:lifecycle.signal})).catch(()=>{});}catch{}
}
function start(){
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width: 700px)').matches?1.5:2));renderer.setClearColor(0x070b12);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;$('scene').append(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(48,1,.01,5000);camera.position.set(12,64,112);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.8;controls.maxDistance=1500;controls.zoomSpeed=.8;controls.rotateSpeed=.6;
 scene.add(new THREE.AmbientLight(0xd9e4ff,1.2));const light=new THREE.PointLight(0xffefd9,3,0,0);scene.add(light);
 starField=makeStars();scene.add(starField);
 const manager=new THREE.LoadingManager();manager.onProgress=(_,loaded,total)=>$('load-status').textContent=`Preparing planets · ${loaded} / ${total}`;
 manager.onError=url=>assetErrors.push(url);
 manager.onLoad=()=>{$('loading').hidden=true;if(assetErrors.length)notify('Some surface maps could not load. Reload to try again.');};
 createObjects(new THREE.TextureLoader(manager));for(const id of ['moon','pluto']){const visible=initialHash.body===id;objects.get(id).root.visible=visible;const orbit=orbitLines.get(id);if(orbit)orbit.visible=visible;$(id+'-toggle').checked=visible;}selectBody(initialHash.body||'sun',{show:false});makeBodyList();resize();connectUI();updateDateUI(true);setView('overview');window.addEventListener('hashchange',()=>{const next=readHash();applyingHash=true;try{if(next.date!==null)setDate(next.date);if(next.body){if(!optionalVisible(next.body))$(next.body+'-toggle').click();selectBody(next.body);}}finally{applyingHash=false;}});
 if(innerWidth<=560)showInformation(false);
 new ResizeObserver(()=>{resize();}).observe($('scene'));
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameID);controls.dispose();renderer.dispose();},{once:true});
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();setPlaying(false);cancelAnimationFrame(frameID);$('webgl-error').hidden=false;});
 frameID=requestAnimationFrame(tick);registerAgentTools();
}
try{start();}catch(error){console.error('Solar Atlas could not initialize:',error);$('loading').hidden=true;$('webgl-error').hidden=false;}
