'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const {FULL,shuffle,evaluate,compare}=require('./assets/game.js');
const root=__dirname,rooms=new Map(),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end()}
 if(p==='/health')return res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,rooms:rooms.size}));
 const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.stat(file,(err,st)=>{if(err||!st.isFile())return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res)});
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:2048});
function send(ws,msg){if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg))}
function code(){let c;do{c=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(c));return c}
function state(r,i){const g=r.game;return {type:'state',room:r.code,seat:i,players:r.players.map((p,j)=>p?{name:p.name,stack:p.stack,connected:!!p.ws&&p.ws.readyState===WebSocket.OPEN,seat:j}:null),game:g?{board:g.board,hand:g.hands[i],pot:g.pot,phase:g.phase,turn:g.turn,bet:g.bet,put:g.put,deckRemaining:g.deck.length,status:g.status,message:g.message,winner:g.winner,shown:g.status==='finished'?g.hands:null}:null}}
function broadcast(r){r.players.forEach((p,i)=>{if(p)send(p.ws,state(r,i))})}
function start(r){
 if(r.players.some(p=>!p))return;
 const deck=shuffle(FULL),hands=[deck.splice(0,2),deck.splice(0,2)];
 r.players.forEach(p=>p.stack=1000);
 r.game={deck,hands,board:[],pot:30,phase:0,turn:0,bet:20,put:[10,20],status:'playing',message:'New hand: player 1 acts first.',winner:null,acted:[false,false]};
 broadcast(r);
}
function payout(r,winner,message){
 const g=r.game;g.status='finished';g.turn=null;g.winner=winner;g.message=message;
 if(winner===null){const half=Math.floor(g.pot/2);r.players[0].stack+=half;r.players[1].stack+=g.pot-half}
 else r.players[winner].stack+=g.pot;
 broadcast(r);
}
function advance(r){
 const g=r.game;
 if(g.phase===3){const a=evaluate([...g.hands[0],...g.board]),b=evaluate([...g.hands[1],...g.board]);const cmp=compare(a.score,b.score);return payout(r,cmp===0?null:cmp>0?0:1,'Showdown: '+a.name+' versus '+b.name+'.')}
 g.phase++;g.board.push(...g.deck.splice(0,g.phase===1?3:1));g.bet=0;g.put=[0,0];g.acted=[false,false];g.turn=1;g.message=['','Flop','Turn','River'][g.phase]+' dealt.';broadcast(r)
}
function act(r,i,action){
 const g=r.game;if(!g||g.status!=='playing'||g.turn!==i)return 'Not your turn.';
 const other=1-i,due=g.bet-g.put[i],p=r.players[i];
 if(action==='fold')return payout(r,other,p.name+' folded.'),null;
 if(action==='check'&&due!==0)return 'You must call or fold.';
 if(action==='call'||action==='check'){
  if(due>p.stack)return 'Not enough chips to call.';
  p.stack-=due;g.pot+=due;g.put[i]+=due;g.acted[i]=true;
 }else if(action==='raise'){
  const amount=due+20;if(amount>p.stack)return 'Not enough chips to raise.';
  p.stack-=amount;g.pot+=amount;g.put[i]+=amount;g.bet=g.put[i];g.acted=[false,false];g.acted[i]=true;
 }else return 'Invalid action.';
 if(g.acted[0]&&g.acted[1]&&g.put[0]===g.put[1])advance(r);
 else {g.turn=other;g.message=p.name+' '+action+'s.';broadcast(r)}
 return null;
}
function attach(ws,r,i){const p=r.players[i];if(p.ws&&p.ws!==ws)p.ws.close();p.ws=ws;ws.room=r.code;ws.seat=i;broadcast(r)}
wss.on('connection',ws=>{
 ws.on('message',raw=>{
  let m;try{m=JSON.parse(raw.toString())}catch{return send(ws,{type:'error',message:'Invalid message'})}
  if(!m||typeof m!=='object')return;
  if(m.type==='create'){
   if(ws.room)return send(ws,{type:'error',message:'Already in a room'});
   const r={code:code(),players:[{name:String(m.name||'Player').slice(0,24),token:crypto.randomBytes(16).toString('hex'),stack:1000,ws},null],game:null,created:Date.now()};
   rooms.set(r.code,r);ws.room=r.code;ws.seat=0;send(ws,{type:'joined',room:r.code,token:r.players[0].token});broadcast(r);
  }else if(m.type==='join'){
   if(ws.room)return send(ws,{type:'error',message:'Already in a room'});
   const r=rooms.get(String(m.room||'').toUpperCase());if(!r)return send(ws,{type:'error',message:'Room not found'});
   const idx=r.players.findIndex(p=>p&&p.token===m.token);
   if(idx!==-1){attach(ws,r,idx);send(ws,{type:'joined',room:r.code,token:r.players[idx].token});return}
   if(r.players[1])return send(ws,{type:'error',message:'Room full'});
   r.players[1]={name:String(m.name||'Player 2').slice(0,24),token:crypto.randomBytes(16).toString('hex'),stack:1000,ws};
   ws.room=r.code;ws.seat=1;send(ws,{type:'joined',room:r.code,token:r.players[1].token});start(r);
  }else if(m.type==='act'){
   const r=rooms.get(ws.room);if(!r||r.players[ws.seat]?.ws!==ws)return;
   const error=act(r,ws.seat,m.action);if(error)send(ws,{type:'error',message:error});
  }else if(m.type==='next'){
   const r=rooms.get(ws.room);if(!r||r.players[ws.seat]?.ws!==ws)return;
   if(r.game?.status==='finished')start(r);
  }
 });
 ws.on('close',()=>{const r=rooms.get(ws.room);if(r&&r.players[ws.seat]?.ws===ws){r.players[ws.seat].ws=null;broadcast(r)}});
});
setInterval(()=>{for(const [id,r] of rooms)if(Date.now()-r.created>24*3600*1000||r.players.every(p=>!p||!p.ws))rooms.delete(id)},3600000).unref();
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('PokerHub multiplayer listening on '+(process.env.PORT||3000)));
