'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const {FULL,shuffle,evaluate,compare}=require('./assets/game.js');
const root=__dirname,rooms=new Map(),MAX=6,mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end()}
 if(p==='/health')return res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,rooms:rooms.size}));
 const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.stat(file,(err,st)=>{if(err||!st.isFile())return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res)});
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:2048});
function send(ws,msg){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg))}
function code(){let c;do{c=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(c));return c}
function nextSeat(g,from,eligible){for(let j=1;j<=g.hands.length;j++){const i=(from+j)%g.hands.length;if(eligible(i))return i}return null}
function state(r,i){const g=r.game;return {type:'state',room:r.code,seat:i,host:0,maxPlayers:MAX,players:r.players.map((p,j)=>({name:p.name,stack:p.stack,connected:!!p.ws&&p.ws.readyState===WebSocket.OPEN,seat:j})),game:g?{board:g.board,hand:g.hands[i]||[],pot:g.pot,phase:g.phase,turn:g.turn,bet:g.bet,put:g.put,status:g.status,message:g.message,winners:g.winners,folded:g.folded,shown:g.status==='finished'?g.hands.map((h,j)=>g.folded[j]?null:h):null}:null}}
function broadcast(r){r.players.forEach((p,i)=>send(p.ws,state(r,i)))}
function payout(r,winners,message){const g=r.game;g.status='finished';g.turn=null;g.winners=winners;g.message=message;const share=Math.floor(g.pot/winners.length);winners.forEach(i=>r.players[i].stack+=share);r.players[winners[0]].stack+=g.pot-share*winners.length;broadcast(r)}
function showdown(r){const g=r.game;const live=g.folded.map((f,i)=>!f?i:null).filter(i=>i!==null);let best=null,winners=[];for(const i of live){const score=evaluate([...g.hands[i],...g.board]).score;if(best===null||compare(score,best)>0){best=score;winners=[i]}else if(compare(score,best)===0)winners.push(i)}payout(r,winners,'Showdown: '+winners.map(i=>r.players[i].name).join(' & ')+' won the pot.')}
function advance(r){const g=r.game;const live=g.folded.filter(f=>!f).length;if(live===1)return payout(r,[g.folded.findIndex(f=>!f)],'Last remaining player wins.');
 if(g.phase===3)return showdown(r);
 g.phase++;g.board.push(...g.deck.splice(0,g.phase===1?3:1));g.bet=0;g.put=g.put.map(()=>0);g.acted=g.acted.map(()=>false);g.turn=nextSeat(g,g.dealer,i=>!g.folded[i]);g.message=['','Flop','Turn','River'][g.phase]+' dealt.';broadcast(r)}
function start(r){if(r.players.length<2)return 'At least two players are needed.';if(r.players.some(p=>!p.ws||p.ws.readyState!==WebSocket.OPEN))return 'Everyone must be connected to start a hand.';const n=r.players.length;if(r.game?.status==='playing')return 'Hand already in progress.';
 // Each new hand uses an equal 1000-chip practice stack; no all-in or side-pot betting.
 const deck=shuffle(FULL),hands=Array.from({length:n},()=>deck.splice(0,2));r.dealer=((r.dealer??-1)+1)%n;
 const sb=n===2?r.dealer:(r.dealer+1)%n,bb=n===2?(r.dealer+1)%n:(r.dealer+2)%n;
 r.players.forEach((p,i)=>p.stack=1000-(i===sb?10:i===bb?20:0));
 const put=r.players.map((_,i)=>i===sb?10:i===bb?20:0);
 r.game={deck,hands,board:[],pot:30,phase:0,turn:(bb+1)%n,bet:20,put,folded:Array(n).fill(false),acted:Array(n).fill(false),dealer:r.dealer,status:'playing',message:'Hand started. Blinds 10/20.',winners:[]};broadcast(r);return null}
function act(r,i,action){const g=r.game;if(!g||g.status!=='playing'||g.turn!==i)return 'Not your turn.';const p=r.players[i],due=g.bet-g.put[i];if(action==='fold'){g.folded[i]=true;g.acted[i]=true}
 else if(action==='check'||action==='call'){if(action==='check'&&due)return 'You must call or fold.';if(due>p.stack)return 'Not enough chips; fold instead.';p.stack-=due;g.pot+=due;g.put[i]+=due;g.acted[i]=true}
 else if(action==='raise'){const amount=due+20;if(amount>p.stack)return 'Not enough chips to raise.';p.stack-=amount;g.pot+=amount;g.put[i]+=amount;g.bet=g.put[i];g.acted=g.acted.map((_,j)=>g.folded[j]);g.acted[i]=true}
 else return 'Invalid action.';
 const active=g.folded.filter(f=>!f).length;if(active===1)return payout(r,[g.folded.findIndex(f=>!f)],p.name+' folded. Last player wins.'),null;
 if(g.acted.every((v,j)=>v||g.folded[j])&&g.put.every((v,j)=>g.folded[j]||v===g.bet)){advance(r);return null}
 g.turn=nextSeat(g,i,j=>!g.folded[j]);g.message=p.name+' '+(action==='call'&&due===0?'checked':action==='raise'?'raised':action==='fold'?'folded':action==='call'?'called':'checked')+'.';broadcast(r);return null}
function attach(ws,r,i){const p=r.players[i];if(p.ws&&p.ws!==ws)p.ws.close();p.ws=ws;ws.room=r.code;ws.seat=i;send(ws,{type:'joined',room:r.code,token:p.token});broadcast(r)}
wss.on('connection',ws=>{
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return send(ws,{type:'error',message:'Invalid message'})}if(!m||typeof m!=='object')return;
 if(m.type==='create'){if(ws.room)return send(ws,{type:'error',message:'Already in a room'});const p={name:String(m.name||'Player').trim().slice(0,24)||'Player',token:crypto.randomBytes(16).toString('hex'),stack:1000,ws};const r={code:code(),players:[p],game:null,dealer:-1,created:Date.now()};rooms.set(r.code,r);ws.room=r.code;ws.seat=0;attach(ws,r,0)}
 else if(m.type==='join'){if(ws.room)return send(ws,{type:'error',message:'Already in a room'});const r=rooms.get(String(m.room||'').toUpperCase());if(!r)return send(ws,{type:'error',message:'Room not found'});const idx=r.players.findIndex(p=>p.token===m.token);if(idx!==-1)return attach(ws,r,idx);if(r.game?.status==='playing')return send(ws,{type:'error',message:'A hand is in progress. Join between hands.'});if(r.players.length>=MAX)return send(ws,{type:'error',message:'Room full (6 players)'});const p={name:String(m.name||'Player').trim().slice(0,24)||'Player',token:crypto.randomBytes(16).toString('hex'),stack:1000,ws};r.players.push(p);ws.room=r.code;ws.seat=r.players.length-1;attach(ws,r,ws.seat)}
 else if(m.type==='start'||m.type==='next'){const r=rooms.get(ws.room);if(!r||r.players[ws.seat]?.ws!==ws)return;if(ws.seat!==0)return send(ws,{type:'error',message:'Only the room host can start hands.'});const error=start(r);if(error)send(ws,{type:'error',message:error})}
 else if(m.type==='act'){const r=rooms.get(ws.room);if(!r||r.players[ws.seat]?.ws!==ws)return;const error=act(r,ws.seat,m.action);if(error)send(ws,{type:'error',message:error})}
 });
 ws.on('close',()=>{const r=rooms.get(ws.room);if(r&&r.players[ws.seat]?.ws===ws){r.players[ws.seat].ws=null;if(r.game?.status==='playing'&&!r.game.folded[ws.seat])act(r,ws.seat,'fold');broadcast(r)}});
});
setInterval(()=>{for(const [id,r] of rooms)if(Date.now()-r.created>24*3600*1000||r.players.every(p=>!p.ws))rooms.delete(id)},3600000).unref();
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('PokerHub multiplayer listening on '+(process.env.PORT||3000)));
