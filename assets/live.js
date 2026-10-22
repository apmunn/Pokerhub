/* PokerHub Live Rooms — embedded in the main app; free fictional chips only. */
(()=>{'use strict';
 const VARIANTS={holdem:{name:'Texas Hold’em',hole:2,rule:'Use any five of your seven available cards.'},omaha:{name:'Omaha',hole:4,rule:'Use exactly two private cards and three board cards.'},omaha5:{name:'Five-Card Omaha',hole:5,rule:'Use exactly two private cards and three board cards.'}};
 let root=null,ws=null,room=null,token=null,latest=null,pending=null,selected='holdem',playerName='Player',disposed=false,started=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const find=id=>root?.querySelector('#'+id);
 const getSession=k=>{try{return sessionStorage.getItem(k)}catch{return null}};
 const setSession=(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}};
 const options=()=>Object.entries(VARIANTS).map(([k,v])=>'<option value="'+k+'">'+esc(v.name)+'</option>').join('');
 function markup(){
  return '<div class="stack ph-live">'+
   '<section class="hero ph-live-hero"><span class="eyebrow">♠ LIVE TABLES · PRIVATE ROOMS</span><h1>Bring your friends to the table.</h1><p>Host a free multiplayer practice game with 2–6 people. No registration, purchases, deposits or prizes. Rooms are temporary and reset if the host server restarts.</p><div class="actions"><span class="tag">♠ Texas Hold’em</span><span class="tag">♣ Omaha</span><span class="tag">♦ Five-Card Omaha</span></div></section>'+
   '<section id="ph-live-lobby" class="split"><div class="stack"><div class="panel"><h2>Create a room</h2><p class="muted small">Select a game and choose a nickname. Share the invitation code with friends.</p><div class="ph-live-form"><label class="field">Your nickname<input id="ph-live-name" maxlength="24" autocomplete="nickname" placeholder="Player"></label><label class="field">Game type<select id="ph-live-variant">'+options()+'</select></label></div><div class="actions"><button type="button" class="btn" id="ph-live-create">Create private room →</button></div></div>'+
   '<div class="panel"><h2>Join a room</h2><p class="muted small">Enter the room code sent by the host.</p><div class="ph-live-form"><label class="field">Six-character room code<input id="ph-live-code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="A1B2C3"></label><button type="button" class="btn secondary" id="ph-live-join">Join table →</button></div></div></div>'+
   '<aside class="stack"><div class="panel"><h2>How multiplayer works</h2><div class="listRow"><span>Players per room</span><strong>2–6</strong></div><div class="listRow"><span>Practice chips</span><strong>1,000 per hand</strong></div><div class="listRow"><span>Blinds</span><strong>10 / 20</strong></div><div class="listRow"><span>Raise size</span><strong>Fixed +20</strong></div><p class="muted small">This is a learning beta. There are no all-ins, side pots, or real stakes. Omaha uses fixed raises, not full pot-limit rules.</p><div class="actions"><button type="button" class="btn ghost" id="ph-live-guide">Compare poker variants →</button></div></div></aside></section>'+
   '<section class="panel ph-live-room" id="ph-live-room" hidden><div class="row between"><div><div class="eyebrow">LIVE PRACTICE TABLE</div><h2>Room <span id="ph-live-room-code"></span></h2></div><div class="actions"><button type="button" class="btn secondary sm" id="ph-live-copy">Copy invite link</button><button type="button" class="btn ghost sm" id="ph-live-leave">Leave room</button></div></div>'+
   '<div class="row between ph-live-details"><span class="tag" id="ph-live-variant-name"></span><label class="field" id="ph-live-host-choice" hidden>Host game<select id="ph-live-host-variant">'+options()+'</select></label></div>'+
   '<p class="muted small" id="ph-live-rule"></p><div id="ph-live-players" class="ph-live-seats" aria-label="Players at this table"></div>'+
   '<div class="ph-live-felt"><p class="ph-live-street" id="ph-live-street"></p><div class="ph-live-cards" id="ph-live-board" aria-label="Community cards"></div><p class="ph-live-pot" id="ph-live-pot"></p><p class="ph-live-message" id="ph-live-message" aria-live="polite"></p></div>'+
   '<div class="ph-live-bottom"><div><h3>Your private cards</h3><div class="ph-live-cards" id="ph-live-hand" aria-label="Your hand"></div></div><div><h3>Actions</h3><div class="actions" id="ph-live-actions"></div></div></div>'+
   '<p class="muted tiny">Leaving or reloading during a hand may fold your cards. Your chips reset each hand; rooms do not save permanently.</p></section>'+
   '<p class="notice" role="status" aria-live="polite" id="ph-live-status">Choose a game to create or join a room.</p>'+
  '</div>';
 }
 function status(message){const node=find('ph-live-status');if(node)node.textContent=message}
 function send(message){if(ws?.readyState===1)ws.send(JSON.stringify(message));else status('Not connected. Select create or join to reconnect.')}
 function connect(message){
  if(ws?.readyState===1)return send(message);
  pending=message;
  if(ws?.readyState===0)return;
  try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws')}catch{status('Could not open the live server. Try again.');return}
  status('Connecting to the live table…');
  ws.onopen=()=>{status('Connected.');if(pending){send(pending);pending=null}};
  ws.onerror=()=>status('Multiplayer is unavailable. The server may be asleep or restarting.');
  ws.onclose=()=>{if(!disposed)status('Disconnected from the live server. Rejoin the room to reconnect.')};
  ws.onmessage=event=>{
   let m;try{m=JSON.parse(event.data)}catch{return}
   if(m.type==='error'){if(m.message==='Room not found'){setSession('ph-room','');setSession('ph-token','')}status(String(m.message||'The server declined the request.'));return}
   if(m.type==='joined'){
    room=m.room;token=m.token;setSession('ph-room',room);setSession('ph-token',token);
    status('Joined room '+room+'. Share the code and invite your friends.');
    const lobby=find('ph-live-lobby'),table=find('ph-live-room');if(lobby)lobby.hidden=true;if(table)table.hidden=false;
   }
   if(m.type==='state'){latest=m;paint()}
  };
 }
 function makeCard(c){
  const e=document.createElement('span');e.className='ph-live-card'+(/[♥♦]/.test(c)?' is-red':'');
  e.textContent=String(c).replace(/^T/,'10');e.setAttribute('aria-label',String(c).replace(/^T/,'10'));return e
 }
 function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
 function action(label,fn,cls,disabled=false){
  const b=el('button','btn '+(cls||''),label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b
 }
 function paint(){
  const s=latest;if(!s||!root)return;
  find('ph-live-room-code').textContent=s.room;
  const variant=VARIANTS[s.variant]||VARIANTS.holdem;
  find('ph-live-variant-name').textContent=variant.name;
  find('ph-live-rule').textContent=variant.rule;
  const choice=find('ph-live-host-choice');
  choice.hidden=s.seat!==0||s.game?.status==='playing';
  find('ph-live-host-variant').value=s.variant||'holdem';
  const seats=find('ph-live-players');seats.replaceChildren(...s.players.map((p,i)=>{
   const d=el('div','ph-live-seat'+(s.game?.turn===i?' is-turn':'')+(i===s.seat?' is-you':''));
   d.append(el('strong','', (i===0?'♛ ':'')+p.name+(i===s.seat?' (You)':'')));
   d.append(el('span','muted small',p.stack+' chips'+(p.connected?'':' · Offline')+(s.game?.folded?.[i]?' · Folded':'')));
   return d
  }));
  const g=s.game;find('ph-live-board').replaceChildren(...(g?.board||[]).map(makeCard));find('ph-live-hand').replaceChildren(...(g?.hand||[]).map(makeCard));
  find('ph-live-street').textContent=g?['Preflop','Flop','Turn','River'][g.phase]||'Showdown':'Waiting for players';
  find('ph-live-pot').textContent=g?'Pot · '+g.pot+' practice chips':'No hand running';
  find('ph-live-message').textContent=g?.message||'The host starts a hand when everyone joins.';
  const buttons=find('ph-live-actions');buttons.replaceChildren();
  if(!g||g.status==='finished'){
   if(s.seat===0)buttons.append(action(g?'Deal next hand':'Start first hand',()=>send({type:'start'}),'',s.players.length<2||s.players.some(p=>!p.connected)));
   else buttons.append(el('p','muted small','Waiting for the host to start a hand.'));
   if(g?.shown){const show=el('p','muted small','Showdown · '+g.shown.map((cards,i)=>cards?s.players[i].name+': '+cards.join(' '):'').filter(Boolean).join(' · '));buttons.append(show)}
   return;
  }
  if(g.folded?.[s.seat]){buttons.append(el('p','muted small','You folded. Waiting for the hand to finish.'));return}
  if(g.turn!==s.seat){buttons.append(el('p','muted small','Waiting for '+(s.players[g.turn]?.name||'the next player')+'…'));return}
  const due=Math.max(0,g.bet-g.put[s.seat]),stack=s.players[s.seat].stack;
  buttons.append(action('Fold',()=>send({type:'act',action:'fold'}),'danger'));
  buttons.append(action(due?'Call '+due:'Check',()=>send({type:'act',action:due?'call':'check'}),'secondary',due>stack));
  buttons.append(action('Raise +20',()=>send({type:'act',action:'raise'}),'',due+20>stack));
 }
 function mount(host,initialVariant,opts={}){
  if(!host)return;
  if(root&&root!==host)unmount();
  root=host;disposed=false;selected=VARIANTS[initialVariant]?initialVariant:'holdem';playerName=typeof opts.name==='string'?opts.name.slice(0,24):'Player';
  root.innerHTML=markup();
  find('ph-live-name').value=playerName;find('ph-live-variant').value=selected;
  const requested=new URLSearchParams(location.search).get('room');
  if(/^[0-9A-F]{6}$/i.test(requested||''))find('ph-live-code').value=requested.toUpperCase();
  find('ph-live-create').onclick=()=>{playerName=find('ph-live-name').value.trim().slice(0,24)||'Player';selected=find('ph-live-variant').value;connect({type:'create',name:playerName,variant:selected})};
  find('ph-live-join').onclick=()=>{const c=find('ph-live-code').value.trim().toUpperCase();if(!/^[0-9A-F]{6}$/.test(c)){status('Enter a valid six-character code.');return}playerName=find('ph-live-name').value.trim().slice(0,24)||'Player';connect({type:'join',room:c,name:playerName,token:getSession('ph-room')===c?getSession('ph-token'):null})};
  find('ph-live-host-variant').onchange=e=>send({type:'variant',variant:e.target.value});
  find('ph-live-copy').onclick=()=>{if(!room)return;const url=new URL('./',location.href);url.searchParams.set('room',room);url.hash='live';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url.href).then(()=>status('Invite link copied.'),()=>status('Share: '+url.href));else status('Share: '+url.href)};
  find('ph-live-leave').onclick=()=>{if(latest?.game?.status==='playing'&&!confirm('Leaving during a hand will fold your cards. Leave this room?'))return;leave()};
  find('ph-live-guide').onclick=()=>{if(window.App?.go)window.App.go('variants')};
  if(latest&&ws?.readyState===1&&room){find('ph-live-lobby').hidden=true;find('ph-live-room').hidden=false;paint()}
  else{const savedRoom=getSession('ph-room'),savedToken=getSession('ph-token');if(savedRoom&&savedToken&&(!requested||requested.toUpperCase()===savedRoom)&&/^[0-9A-F]{6}$/.test(savedRoom))connect({type:'join',room:savedRoom,token:savedToken,name:playerName})}
 }
 function leave(){
  disposed=true;if(ws){ws.onclose=null;try{ws.close()}catch{}}ws=null;room=null;token=null;latest=null;pending=null;
  setSession('ph-room','');setSession('ph-token','');
  if(root)mount(root,selected,{name:playerName})
 }
 function unmount(){
  if(ws){ws.onclose=null;try{ws.close()}catch{}}ws=null;root=null;latest=null;room=null;token=null;pending=null;disposed=true;started=false
 }
 function beforeLeave(){if(latest?.game?.status==='playing')return confirm('Leaving this live room may fold your hand. Continue?');return true}
 window.PH_LIVE={mount,unmount,beforeLeave,setVariant:v=>{if(VARIANTS[v])selected=v},getVariant:()=>selected};
})();
