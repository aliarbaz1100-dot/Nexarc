const CACHE_NAME='nexarc-sw-disabled-20260912-v37fix';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)))}catch(e){}try{await self.registration.unregister()}catch(e){}try{const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});clientsList.forEach(client=>client.postMessage({type:'NEXARC_CACHE_CLEARED'}))}catch(e){}return self.clients.claim()})())});
self.addEventListener('fetch',event=>{return});
