const CACHE='solar-atlas-v3';
const SHELL=['./','./index.html','./style.css?v=3','./app.js?v=3','./orbits.js','./assets/three.module.min.js','./assets/OrbitControls.js','./assets/2k_saturn_ring_alpha.png','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const maps=['sun','mercury','venus_atmosphere','earth_daymap','mars','jupiter','saturn','uranus','neptune'];
const ASSETS=[...SHELL,...maps.map(name=>`./assets/1k_${name}.webp`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   try{const response=await fetch(event.request);if(response.ok)cache.put('./index.html',response.clone());return response;}
   catch{return await cache.match('./index.html')||Response.error();}
  }
  const cached=await cache.match(event.request);if(cached)return cached;
  const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response;
 })());
});
