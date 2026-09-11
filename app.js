(function(){
  'use strict';

  var BUILD='20260912-20664fix4';
  var allGames=[];
  var active=null;
  var heroIndex=0;
  var heroTimer=null;
  var loadTimer=null;
  var currentView='all';
  var rows=null,count=null,player=null,frame=null,title=null,hero=null,heroTitle=null,heroMeta=null,loading=null,intro=null,searchPanel=null,searchInput=null;
  var order=['Action','Racing','Sports','Zombie','Adventure','Arcade','Puzzle'];
  var blockedIds={'fiva-26':1,'football-random':1,'weight-puzzle-alt':1};
  var recentKey='nexarc_recent_games_v2';
  var listKey='nexarc_my_list_v1';
  var hasRendered=false;
  var FALLBACK=[
    {id:'ninja-run',title:'Ninja on the Run',category:'Action',embedUrl:'https://html5.gamemonetize.co/t8s82rq1o8991w55wzdccw4gv683i5sp/',featured:true},
    {id:'rise-zombies',title:'Rise Zombies',category:'Zombie',embedUrl:'https://html5.gamemonetize.co/z7qsjaenzkjwxxygugf00vkpti9kxc90/',featured:true},
    {id:'moto-x3m',title:'Moto X3M Bike Race',category:'Racing',embedUrl:'https://html5.gamemonetize.co/8kw0dtf9ucqguktev18480kx7wttl4mu/'},
    {id:'turbo-horizon',title:'Turbo Horizon Racing',category:'Racing',embedUrl:'https://html5.gamemonetize.co/h0mf9hr6povgwh9bkon32fqc9k5o6e6h/'},
    {id:'stock-car',title:'Stock Car Racing',category:'Racing',embedUrl:'https://html5.gamemonetize.co/1w6coppqgr7sdpn9esapoqrezqbcaizc/'},
    {id:'offroad-moto',title:'Offroad Moto Bike Racing',category:'Racing',embedUrl:'https://html5.gamemonetize.co/2gqe1qjo3qgtzkzcwklyrik5b1bt28d3/'},
    {id:'football-champs',title:'Football Champs',category:'Sports',embedUrl:'https://html5.gamemonetize.co/j6hp4zd200pbn92izelxerdfsqfoz8pp/'},
    {id:'football-flick',title:'Football Flick',category:'Sports',embedUrl:'https://html5.gamemonetize.co/necs6mnhw2igl2f96padhtfjc4gyhyz4/'},
    {id:'football-heads',title:'Football Heads',category:'Sports',embedUrl:'https://html5.gamemonetize.co/uzkm3h1igndrx9is3e3mzrhmwfpzv3zp/'},
    {id:'soccer-hero',title:'Soccer Hero',category:'Sports',embedUrl:'https://html5.gamemonetize.co/cl9ik2kgtk7kxt89jl9hr1dbzfxmv7k5/'},
    {id:'commando',title:'Commando Gun Shooting',category:'Action',embedUrl:'https://html5.gamemonetize.co/t2a672cdfu2471c0ek19v6fr26za27z7/'},
    {id:'dead-paradise',title:'Dead Paradise',category:'Action',embedUrl:'https://html5.gamemonetize.co/td7r994z5ls02swod3lm0gk9h2jl2jmi/'},
    {id:'survivalist',title:'Survivalist',category:'Action',embedUrl:'https://html5.gamemonetize.co/crvt23bbv3zouz2yvv9aktx282cpvn6p/'},
    {id:'stickman-archer',title:'Stickman Archer Bow Fight',category:'Action',embedUrl:'https://html5.gamemonetize.co/79tq8bz4t8p6wer1vuwiixv16ocbs42p/'},
    {id:'rocket-clash',title:'Rocket Clash',category:'Action',embedUrl:'https://html5.gamemonetize.co/9m57qag1zs48t89ofhg6ty6rudzydbdm/'},
    {id:'zombie-survival',title:'Zombie Survival',category:'Zombie',embedUrl:'https://html5.gamemonetize.co/b15gire8ae8p3yg8unwqjwzpbtbor7h3/'},
    {id:'stop-zombies',title:'Stop Zombies',category:'Zombie',embedUrl:'https://html5.gamemonetize.co/8sttq4hfxsvoveqhy43cp39updyjcs48/'},
    {id:'tower-defense-zombies',title:'Tower Defense Zombies',category:'Zombie',embedUrl:'https://html5.gamemonetize.co/79erubfx45uiq8ksuuxofo7h79s9b1t0/'},
    {id:'sliding-tile',title:'Sliding Tile Puzzle Game',category:'Puzzle',embedUrl:'https://html5.gamemonetize.co/v48ve1i2snfou1bv4yidv7pup1en4zu2/'}
  ];

  function byId(id){return document.getElementById(id)}
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn()}
  function hideIntro(){if(!intro)intro=byId('intro');if(!intro)return;intro.classList.add('hide');setTimeout(function(){try{intro.remove()}catch(e){}},650)}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function readStore(key){try{var v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(Boolean):[]}catch(e){return[]}}
  function writeStore(key,arr){try{localStorage.setItem(key,JSON.stringify(arr.slice(0,80)))}catch(e){}}
  function toast(msg){if(window.nexarcToast){window.nexarcToast(msg);return}var t=document.createElement('div');t.className='nxToast';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.classList.add('show')},20);setTimeout(function(){t.classList.remove('show');setTimeout(function(){try{t.remove()}catch(e){}},350)},1800)}
  function gameKey(g){try{return new URL(g.embedUrl).pathname.split('/').filter(Boolean)[0]||''}catch(e){return''}}
  function artList(g){var k=gameKey(g),list=[];[g.thumbnail,g.image,g.thumb].forEach(function(x){if(x&&list.indexOf(x)<0)list.push(x)});if(k){list.push('https://img.gamemonetize.com/'+k+'/512x384.jpg');list.push('https://img.gamemonetize.com/'+k+'/512x512.jpg');list.push('https://img.gamemonetize.com/'+k+'/512x340.jpg')}return list}
  function fallbackArt(){return 'linear-gradient(135deg,#28070c,#101216 55%,#050505)'}
  function validGame(g){if(!g||!g.id||!g.title||!g.embedUrl||blockedIds[g.id]||g.duplicateCandidate||g.mobileReady===false)return false;try{var u=new URL(g.embedUrl);return u.protocol==='https:'&&u.hostname==='html5.gamemonetize.co'}catch(e){return false}}
  function cleanCatalog(data){var pool=Array.isArray(data)?data:((data&&data.games)||[]),seenUrl={},seenId={},clean=[],dropped=[];pool.forEach(function(g){if(clean.length>=120)return;var ok=validGame(g)&&!seenUrl[g.embedUrl]&&!seenId[g.id];if(!ok){dropped.push((g&&g.id)||'unknown');return}seenUrl[g.embedUrl]=1;seenId[g.id]=1;clean.push(g)});window.NEXARC_CATALOG_STATS={loaded:clean.length,dropped:dropped,target:120,fullyTested:Number((data&&data.fullyTested)||0),source:clean.length<120?'fallback-or-partial':'single-master-games-json'};return clean}
  function findGame(id){for(var i=0;i<allGames.length;i++){if(String(allGames[i].id)===String(id))return allGames[i]}return null}
  function saveRecent(g){var ids=[g.id].concat(readStore(recentKey).filter(function(id){return id!==g.id})).slice(0,12);writeStore(recentKey,ids)}
  function gamesByIds(ids){return ids.map(function(id){return findGame(id)}).filter(Boolean)}
  function recentGames(){return gamesByIds(readStore(recentKey))}
  function myList(){return gamesByIds(readStore(listKey))}
  function toggleList(g){if(!g)return;var ids=readStore(listKey);var on=ids.indexOf(g.id)>-1;ids=on?ids.filter(function(id){return id!==g.id}):[g.id].concat(ids);writeStore(listKey,ids);toast(on?'Removed from My List':'Added to My List')}
  function card(g){var images=artList(g).join('|');return '<button class="card" data-id="'+esc(g.id)+'" aria-label="Play '+esc(g.title)+'"><span class="thumb"'+(images?' data-art="'+esc(images)+'"':'')+'></span><span class="playBadge">▶</span><span class="cardMeta"><b>'+esc(g.title)+'</b><small>'+esc(g.category||'Game')+' · Play Now</small></span></button>'}
  function setArtwork(el){if(!el||el.getAttribute('data-loaded')==='1')return;el.setAttribute('data-loaded','1');var urls=String(el.getAttribute('data-art')||'').split('|').filter(Boolean),i=0;function next(){var url=urls[i++];if(!url){el.style.backgroundImage=fallbackArt();return}var img=new Image();img.decoding='async';img.onload=function(){el.style.backgroundImage='url("'+url+'")';el.classList.add('artReady')};img.onerror=next;img.src=url}next()}
  function loadArtwork(){var els=[].slice.call(document.querySelectorAll('.thumb[data-art]'));if(!('IntersectionObserver'in window)){els.forEach(setArtwork);return}var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){setArtwork(e.target);io.unobserve(e.target)}})},{rootMargin:'360px 560px'});els.forEach(function(el){io.observe(el)})}
  function bindCards(){[].slice.call(document.querySelectorAll('.card')).forEach(function(b){b.onclick=function(){openGame(findGame(b.getAttribute('data-id')))}});[].slice.call(document.querySelectorAll('[data-seeall]')).forEach(function(b){b.onclick=function(){filterCategory(b.getAttribute('data-seeall'))}})}
  function setUrlState(q,cat){try{var u=new URL(location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');if(cat&&cat!=='all games')u.searchParams.set('cat',cat);else u.searchParams.delete('cat');history.replaceState(null,'',u.pathname+(u.search?u.search:'')+location.hash)}catch(e){}}
  function rowHtml(cat,gs,label){var action=label==='all'?'<button class="seeAll" data-seeall="'+esc(cat)+'">See all</button>':'<button class="seeAll" data-seeall="All Games">All games</button>';return '<section class="rowBlock"><div class="rowHead"><h3 class="rowTitle">'+esc(cat)+' Games</h3><div class="rowActions"><span>'+gs.length+' titles</span>'+action+'</div></div><div class="rail">'+gs.map(card).join('')+'</div></section>'}
  function render(list,label){if(!rows)return;list=list||allGames;label=label||'all';var groups={},html='';if(label==='all'){var rg=recentGames();if(rg.length)html+='<section class="rowBlock continueRow"><div class="rowHead"><h3 class="rowTitle">Continue Playing</h3><div class="rowActions"><span>'+rg.length+' recent</span></div></div><div class="rail">'+rg.map(card).join('')+'</div></section>'}list.forEach(function(g){var c=g.category||'More Games';if(!groups[c])groups[c]=[];groups[c].push(g)});Object.keys(groups).sort(function(a,b){var ai=order.indexOf(a),bi=order.indexOf(b);return(ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b)}).forEach(function(cat){html+=rowHtml(cat,groups[cat],label)});rows.innerHTML=html||'<div class="emptyState">No games found. Try another search.</div>';if(count)count.textContent=(list===allGames?allGames.length:list.length)+' games · instant play';bindCards();loadArtwork();if(window.nexarcBuildInsights)setTimeout(function(){try{window.nexarcBuildInsights()}catch(e){}},80)}
  function filterCategory(cat){var c=String(cat||'All Games').trim().toLowerCase();currentView=c;var list=c==='all games'?allGames:allGames.filter(function(g){return String(g.category||'').toLowerCase()===c});render(list,c);setUrlState('',c);if(searchPanel)searchPanel.classList.remove('open');if(searchInput)searchInput.value='';var target=byId('games');if(target)target.scrollIntoView({behavior:'smooth'});[].slice.call(document.querySelectorAll('.categoryBar a')).forEach(function(a){a.classList.toggle('active',a.textContent.trim().toLowerCase()===c)})}
  function setLoading(msg){if(loading)loading.textContent=msg||'Loading game…'}
  function openGame(g){if(!g||!g.embedUrl||!player||!frame)return;active=g;saveRecent(g);if(title)title.textContent=g.title;player.classList.add('open');player.classList.remove('loaded');player.setAttribute('aria-hidden','false');setLoading('Loading '+g.title+'…');frame.src=g.embedUrl;document.body.style.overflow='hidden';clearInterval(heroTimer);clearTimeout(loadTimer);try{location.hash='play-'+g.id}catch(e){}loadTimer=setTimeout(function(){if(active===g&&!player.classList.contains('loaded'))setLoading('Still loading — tap Retry if the game does not appear.')},10000)}
  function closeGame(){clearTimeout(loadTimer);if(frame)frame.src='about:blank';if(player){player.classList.remove('open','loaded');player.setAttribute('aria-hidden','true')}document.body.style.overflow='';active=null;if(location.hash.indexOf('#play-')===0)history.replaceState(null,'',location.pathname+location.search);if(currentView==='all')render(allGames,'all');if(allGames.length)startHero()}
  function featuredGames(){var picks=allGames.filter(function(g){return g.featured});return picks.length?picks:allGames.slice(0,Math.min(12,allGames.length))}
  function setHero(i){var picks=featuredGames();if(!picks.length||!hero)return;heroIndex=(i+picks.length)%picks.length;var g=picks[heroIndex],images=artList(g),x=0;if(heroTitle)heroTitle.textContent=g.title;if(heroMeta)heroMeta.textContent=(g.category||'Game')+' · Free to play · No download';hero.setAttribute('data-game-id',g.id);function next(){var image=images[x++];if(!image){hero.style.backgroundImage=fallbackArt();return}var probe=new Image();probe.decoding='async';probe.onload=function(){var live=featuredGames()[heroIndex];if(live&&live.id===g.id)hero.style.backgroundImage='linear-gradient(90deg,rgba(2,4,6,.94),rgba(2,4,6,.28)),url("'+image+'")'};probe.onerror=next;probe.src=image}next()}
  function startHero(){clearInterval(heroTimer);setHero(heroIndex);heroTimer=setInterval(function(){setHero(heroIndex+1)},7200)}
  function applyInitialState(){var p=new URLSearchParams(location.search),q=(p.get('q')||'').trim().toLowerCase(),cat=(p.get('cat')||'').trim(),play=(location.hash||'').replace('#play-','');if(q){if(searchPanel)searchPanel.classList.add('open');if(searchInput)searchInput.value=q;render(allGames.filter(function(g){return (g.title+' '+g.category).toLowerCase().indexOf(q)>-1}),'search');return}if(cat){filterCategory(cat);return}render(allGames,'all');var g=findGame(play);if(g)setTimeout(function(){openGame(g)},450)}
  function wireStatic(){
    if(frame)frame.addEventListener('load',function(){if(active&&frame.src!=='about:blank'){clearTimeout(loadTimer);if(player)player.classList.add('loaded')}});
    var closeBtn=byId('close');if(closeBtn)closeBtn.onclick=closeGame;
    var retryBtn=byId('retry');if(retryBtn)retryBtn.onclick=function(){if(!active)return;var g=active;if(player)player.classList.remove('loaded');setLoading('Reloading '+g.title+'…');if(frame){frame.src='about:blank';setTimeout(function(){if(active===g)frame.src=g.embedUrl},150)}};
    var fullBtn=byId('full');if(fullBtn)fullBtn.onclick=function(){try{if(frame&&frame.requestFullscreen)frame.requestFullscreen();else if(player&&player.requestFullscreen)player.requestFullscreen()}catch(e){}};
    var searchBtn=byId('searchBtn');if(searchBtn)searchBtn.onclick=function(){if(searchPanel)searchPanel.classList.add('open');setTimeout(function(){if(searchInput)searchInput.focus()},80)};
    var searchClose=byId('searchClose');if(searchClose)searchClose.onclick=function(){if(searchPanel)searchPanel.classList.remove('open');if(searchInput)searchInput.value='';setUrlState('',currentView);render(allGames,'all')};
    if(searchInput)searchInput.oninput=function(){var q=searchInput.value.trim().toLowerCase();setUrlState(q,'');[].slice.call(document.querySelectorAll('.categoryBar a')).forEach(function(a){a.classList.remove('active')});render(q?allGames.filter(function(g){return (g.title+' '+g.category).toLowerCase().indexOf(q)>-1}):allGames,q?'search':'all')};
    [].slice.call(document.querySelectorAll('.categoryBar a')).forEach(function(a){a.onclick=function(e){e.preventDefault();filterCategory(a.textContent)}});
    var heroPlay=byId('heroPlay');if(heroPlay)heroPlay.onclick=function(){var picks=featuredGames();openGame(picks[heroIndex]||allGames[0])};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(player&&player.classList.contains('open'))closeGame();else if(searchPanel)searchPanel.classList.remove('open')}});
  }
  function useCatalog(data,mode){
    var clean=cleanCatalog(data);
    if(!clean.length&&mode!=='fallback')clean=cleanCatalog({games:FALLBACK,fullyTested:0});
    if(!clean.length)throw new Error('empty catalog');
    allGames=clean;hasRendered=true;applyInitialState();startHero();hideIntro();
    if(count&&mode==='fallback')count.textContent=allGames.length+' games · backup mode';
    if(window.nexarcStatus)window.nexarcStatus('NEXARC ready',mode==='fallback'?'Backup game shelf loaded while full catalog syncs.':'Game library loaded successfully.');
  }
  function loadCatalog(){
    if(count)count.textContent='Loading games…';
    var fallbackTimer=setTimeout(function(){if(!hasRendered)useCatalog({games:FALLBACK,fullyTested:0},'fallback')},3200);
    var controller=null,signal=null;
    try{controller=new AbortController();signal=controller.signal;setTimeout(function(){try{controller.abort()}catch(e){}},8500)}catch(e){}
    fetch('/games.json?v='+BUILD+'&t='+Date.now(),{cache:'no-store',signal:signal}).then(function(res){if(!res.ok)throw new Error('games.json '+res.status);return res.json()}).then(function(data){clearTimeout(fallbackTimer);useCatalog(data,'full');console.info('[NEXARC] '+allGames.length+' source-verified games loaded.',window.NEXARC_CATALOG_STATS)}).catch(function(e){clearTimeout(fallbackTimer);console.error('[NEXARC] catalog failed',e);if(!hasRendered){try{useCatalog({games:FALLBACK,fullyTested:0},'fallback')}catch(err){if(count)count.textContent='Tap retry to load games';if(rows)rows.innerHTML='<div class="emptyState">Games could not load. <button id="catalogRetry" class="secondary">Retry</button></div>';var r=byId('catalogRetry');if(r)r.onclick=loadCatalog;hideIntro()}}});
  }
  function showMyList(){var list=myList();currentView='my-list';render(list,'my-list');var target=byId('games');if(target)target.scrollIntoView({behavior:'smooth'});toast(list.length?('My List: '+list.length+' games'):'My List is empty')}
  function init(){
    rows=byId('rows');count=byId('count');player=byId('player');frame=byId('gameFrame');title=byId('playerTitle');hero=byId('featured');heroTitle=byId('heroTitle');heroMeta=byId('heroMeta');loading=byId('loading');intro=byId('intro');searchPanel=byId('searchPanel');searchInput=byId('searchInput');
    window.addEventListener('load',function(){setTimeout(hideIntro,900)});setTimeout(hideIntro,2300);
    window.nexarcShowMyList=showMyList;
    window.nexarcPlayRandom=function(){if(allGames.length)openGame(allGames[Math.floor(Math.random()*allGames.length)]);else useCatalog({games:FALLBACK,fullyTested:0},'fallback')};
    window.nexarcAddActiveToList=function(){if(active)toggleList(active);else toast('Open a game first')};
    window.nexarcOpenSearch=function(){if(searchPanel)searchPanel.classList.add('open');setTimeout(function(){if(searchInput)searchInput.focus()},80)};
    window.addEventListener('nexarc-show-my-list',showMyList);
    wireStatic();loadCatalog();
  }
  ready(init);
})();
