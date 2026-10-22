'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const http=require('node:http');
const WebSocket=require('ws');
const port=33000+Math.floor(Math.random()*25000);
const base='http://127.0.0.1:'+port;
let child;
function get(path){return new Promise((resolve,reject)=>http.get(base+path,res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,body}))}).on('error',reject))}
async function ready(){for(let i=0;i<80;i++){try{const r=await get('/health');if(r.status===200)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('server did not start')}
function socket(){return new Promise((resolve,reject)=>{const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');ws.once('open',()=>resolve(ws));ws.once('error',reject)})}
function wait(ws,predicate,timeout=3000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',onMessage);reject(Error('timed out waiting for message'))},timeout);function onMessage(raw){const msg=JSON.parse(raw.toString());if(predicate(msg)){clearTimeout(timer);ws.off('message',onMessage);resolve(msg)}}ws.on('message',onMessage)})}
test('multiplayer smoke: server, protected files, room, Omaha hand and private cards',async()=>{
 child=spawn(process.execPath,['server.cjs'],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:'ignore'});
 const sockets=[];try{
 await ready();
 assert.equal((await get('/health')).status,200);
 assert.equal((await get('/server.cjs')).status,404);
 assert.equal((await get('/tests/engine.test.cjs')).status,404);
 assert.equal((await get('/multiplayer.html')).status,200);
 const host=await socket();sockets.push(host);
 const joined=wait(host,m=>m.type==='joined');
 host.send(JSON.stringify({type:'create',name:'Host',variant:'omaha'}));
 const room=(await joined).room;
 const guest=await socket();sockets.push(guest);
 const guestJoin=wait(guest,m=>m.type==='joined');
 guest.send(JSON.stringify({type:'join',room,name:'Guest'}));
 await guestJoin;
 const hostHand=wait(host,m=>m.type==='state'&&m.game?.status==='playing');
 const guestHand=wait(guest,m=>m.type==='state'&&m.game?.status==='playing');
 host.send(JSON.stringify({type:'start'}));
 const [h,g]=await Promise.all([hostHand,guestHand]);
 assert.equal(h.variant,'omaha');
 assert.equal(h.game.hand.length,4);assert.equal(g.game.hand.length,4);
 assert.equal(h.game.board.length,0);assert.equal(h.game.pot,30);
 assert.notDeepEqual(h.game.hand,g.game.hand);
 assert.equal(h.game.hands,undefined,'server must not leak opponent cards');
 assert.equal(h.players.length,2);
 }finally{sockets.forEach(s=>s.close());child?.kill()}
});
