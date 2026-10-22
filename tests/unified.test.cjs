'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function setup(){
 const elements=new Map(),calls=[];
 const node=id=>{
  if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',className:'',hidden:false,value:'',checked:false,
   style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){return null}});
  return elements.get(id);
 };
 const document={
  body:{className:''},documentElement:{style:{setProperty(){}},classList:{toggle(){}}},
  querySelector(selector){if(selector==='#live-root'&&!node('#content').innerHTML.includes('id="live-root"'))return null;return node(selector)},
  querySelectorAll(){return []},getElementById:id=>node('#'+id),addEventListener(){}
 };
 const store={
  'pokerhub-v2':JSON.stringify({name:'Learner',xp:1800,wallet:2600,completed:[0],partners:['Alex']}),
  'pokerhub-portal-v3':JSON.stringify({bio:'Learning poker.',avatar:'♦',friends:['Jordan'],clubs:['Study Club'],activity:[{text:'Welcome',date:'Today',read:false}]})
 };
 const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
 const location={hash:'#home',protocol:'https:',href:'https://example.test/index.html',search:'',host:'example.test'};
 const mockWindow={addEventListener(){},scrollTo(){},matchMedia(){return {matches:false}}};
 new Function('window',read('assets/data.js'))(mockWindow);
 const game={exports:{}};new Function('module','window',read('assets/game.js'))(game,mockWindow);mockWindow.PH_GAME=game.exports;
 mockWindow.PH_LIVE={mount:(host,v,opts)=>calls.push({host,v,opts}),unmount(){},beforeLeave:()=>true,setVariant(){}};
 new Function('window','document','localStorage','location','navigator','setTimeout','clearTimeout','console','confirm',read('assets/app.js'))(
  mockWindow,document,localStorage,location,{},()=>1,()=>{},console,()=>true);
 return {app:mockWindow.App,node,store,calls};
}
test('all fourteen sections render inside the unified dashboard',()=>{
 const {app,node,calls}=setup();
 const routes=['home','play','live','variants','academy','challenges','lab','coach','ranked','tournaments','community','profile','notifications','settings'];
 for(const route of routes){assert.doesNotThrow(()=>app.go(route),route);assert.ok(node('#content').innerHTML.length>70,route)}
 assert.equal(calls.length,1);assert.equal(calls[0].v,'holdem');
});
test('old Player Center friends and clubs survive the unified transition',()=>{
 const {app,node}=setup();app.go('community');
 assert.match(node('#content').innerHTML,/Jordan/);
 assert.match(node('#content').innerHTML,/Study Club/);
 assert.match(node('#content').innerHTML,/Alex/);
});
test('variant selection uses the selected game',()=>{
 const {app,calls}=setup();app.openVariant('omaha5');assert.equal(calls[calls.length-1].v,'omaha5');
});
test('settings and local notifications keep the previous profile',()=>{
 const {app,node,store}=setup();app.go('settings');
 assert.match(node('#content').innerHTML,/Learning poker/);
 node('#settingsTheme').value='purple';node('#settingsBio').value='Updated learner bio';
 node('#settingsAvatar').value='♥';node('#settingsMotion').checked=true;node('#settingsNotify').checked=true;
 app.saveSettings();
 const center=JSON.parse(store['pokerhub-portal-v3']);
 assert.equal(center.bio,'Updated learner bio');assert.equal(center.avatar,'♥');
 assert.equal(center.accent,'purple');assert.equal(center.reducedMotion,true);
 app.go('notifications');assert.match(node('#content').innerHTML,/Player Center settings updated/);
});
test('legacy entry points direct visitors to the dashboard',()=>{
 assert.ok(read('portal.html').includes("location.replace('index.html#'+dest)"));
 assert.ok(read('multiplayer.html').includes("target.hash='live'"));
 assert.ok(read('variants.html').includes("location.replace('index.html#variants')"));
});
test('unified scripts are syntactically valid',()=>{
 for(const file of ['assets/live.js','assets/app.js','assets/portal.js','assets/game.js','assets/data.js','sw.js']){
  assert.doesNotThrow(()=>new Function(read(file)),file);
 }
});
