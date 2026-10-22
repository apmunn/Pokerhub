(function(){
'use strict';
const R='23456789TJQKA'.split(''), S=['♠','♥','♦','♣'], FULL=R.flatMap(r=>S.map(s=>r+s));
const CATS=['High Card','One Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush'];
const fullDeck=()=>FULL.slice();
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){let n=Math.floor(Math.random()*(i+1));[a[i],a[n]]=[a[n],a[i]]}return a}
function rank(c){return R.indexOf(c[0])+2}
function scoreFive(c){
 if(!c||c.length!==5)return null;
 const sorted=c.map(rank).sort((a,b)=>b-a);
 const count={};sorted.forEach(v=>count[v]=(count[v]||0)+1);
 const groups=Object.keys(count).map(Number).sort((a,b)=>count[b]-count[a]||b-a);
 const flush=c.every(v=>v[1]===c[0][1]);
 const uniq=[...new Set(sorted)];if(uniq.includes(14))uniq.push(1);
 let straight=0;for(let i=0;i<=uniq.length-5;i++)if(uniq[i]-uniq[i+4]===4){straight=uniq[i];break}
 let cat,kickers;
 if(straight&&flush){cat=8;kickers=[straight]}
 else if(count[groups[0]]===4){cat=7;kickers=[groups[0],groups[1]]}
 else if(count[groups[0]]===3&&count[groups[1]]===2){cat=6;kickers=groups.slice(0,2)}
 else if(flush){cat=5;kickers=sorted}
 else if(straight){cat=4;kickers=[straight]}
 else if(count[groups[0]]===3){cat=3;kickers=groups}
 else if(count[groups[0]]===2&&count[groups[1]]===2){cat=2;kickers=groups}
 else if(count[groups[0]]===2){cat=1;kickers=groups}
 else{cat=0;kickers=sorted}
 return [cat,...kickers,...Array(5).fill(0)].slice(0,6);
}
function compare(a,b){if(!a||!b)return 0;for(let i=0;i<Math.max(a.length,b.length);i++){let d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
function evaluate(cards){
 if(!Array.isArray(cards)||cards.length<5||cards.length>7)return null;
 let bestScore=null,bestCards=null;
 for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
 const hand=[cards[a],cards[b],cards[c],cards[d],cards[e]],s=scoreFive(hand);
 if(!bestScore||compare(s,bestScore)>0){bestScore=s;bestCards=hand}
 }
 return {score:bestScore,category:bestScore[0],name:CATS[bestScore[0]],cards:bestCards};
}
function estimatePre(cards){let a=rank(cards[0]),b=rank(cards[1]),high=Math.max(a,b),low=Math.min(a,b),pair=a===b,suited=cards[0][1]===cards[1][1],connected=high-low<=2;return Math.max(.14,Math.min(.94, .18+high*.031+low*.008+(pair?.25:0)+(suited?.065:0)+(connected?.035:0)))}
function estimateStrength(cards,board){const e=evaluate([...cards,...board]);if(!e)return estimatePre(cards);let val=[.22,.46,.62,.77,.82,.87,.92,.96,.99][e.category];return Math.min(.99,val+Math.min(.09,(e.score[1]||0)/250))}
class Table{
 constructor(saved,callbacks){this.s=saved||null;this.cb=callbacks||{};this.timer=null;if(this.s&&this.s.status==='playing'&&this.s.turn==='bot')this.botSoon()}
 static newHand(buyIn,handNo,mode,callbacks){
 const n=Math.max(40,Math.round(buyIn)),deck=shuffle(fullDeck()),hero=deck.splice(0,2),bot=deck.splice(0,2),heroButton=handNo%2===0;
 const s={mode:mode||'practice',handNo,deck,hero,bot,board:[],phase:0,heroButton,turn:heroButton?'hero':'bot',heroStack:n,botStack:n,heroPut:0,botPut:0,currentBet:0,minRaise:20,pot:0,status:'playing',result:null,winner:null,log:[],lastResult:null,acted:{hero:false,bot:false},buyIn:n,started:Date.now()};
 const t=new Table(s,callbacks);t.note('New hand. '+(heroButton?'You are the button (small blind).':'Computer is the button (small blind).'));
 t.pay('hero',heroButton?10:20);t.pay('bot',heroButton?20:10);s.currentBet=20;
 t.note('Blinds posted: 10 / 20.');t.emit();if(s.turn==='bot')t.botSoon();return t;
 }
 setCallbacks(cb){this.cb=cb||{};if(this.s&&this.s.status==='playing'&&this.s.turn==='bot')this.botSoon()}
 snapshot(){return JSON.parse(JSON.stringify(this.s))}
 note(message){this.s.log.unshift(message);this.s.log=this.s.log.slice(0,60)}
 emit(){if(this.cb.change)this.cb.change(this.snapshot())}
 pay(who,amount){let s=this.s,stock=who+'Stack',put=who+'Put',paid=Math.max(0,Math.min(s[stock],Math.floor(amount)));s[stock]-=paid;s[put]+=paid;s.pot+=paid;return paid}
 toCall(who){let s=this.s;return Math.max(0,s.currentBet-s[who+'Put'])}
 mayAct(who){return !!this.s&&this.s.status==='playing'&&this.s.turn===who}
 act(who,kind,amount){
 if(!this.mayAct(who))return {error:'It is not your turn.'};
 let s=this.s,other=who==='hero'?'bot':'hero',due=this.toCall(who);
 if(kind==='fold'){this.note((who==='hero'?'You':'Computer')+' folded.');this.finish(other,'fold');return {ok:true}}
 if(kind==='check'){if(due>0)return {error:'You must call, raise, or fold.'};this.note((who==='hero'?'You':'Computer')+' checked.');s.acted[who]=true}
 else if(kind==='call'){if(due===0)return this.act(who,'check');let paid=this.pay(who,due);this.note((who==='hero'?'You':'Computer')+' called '+paid+'.');s.acted[who]=true}
 else if(kind==='raise'||kind==='allin'){
 const available=s[who+'Put']+s[who+'Stack'];
 let target=kind==='allin'?available:Math.floor(Number(amount));
 if(!Number.isFinite(target)||target<=s[who+'Put'])return {error:'Enter a valid raise amount.'};
 target=Math.min(target,available);
 if(target<=s.currentBet){if(target===available)return this.act(who,'call');return {error:'Your raise must exceed the current bet.'}}
 const minimum=s.currentBet+s.minRaise;
 if(target<minimum&&target<available)return {error:'Minimum raise-to amount: '+minimum+'.'};
 const prev=s.currentBet,paid=this.pay(who,target-s[who+'Put']);
 if(!paid)return {error:'Not enough chips on the table.'}
 s.currentBet=s[who+'Put'];
 if(s.currentBet-prev>=s.minRaise)s.minRaise=s.currentBet-prev;
 this.note((who==='hero'?'You':'Computer')+(kind==='allin'?' went all-in for ':' raised to ')+s.currentBet+'.');
 s.acted[who]=true;s.acted[other]=false;
 }else return {error:'Unknown action.'};
 this.advanceAfter(who);return {ok:true}
 }
 advanceAfter(who){
 let s=this.s;if(s.status!=='playing')return;
 const other=who==='hero'?'bot':'hero';
 if(s.heroPut!==s.botPut){
 const short=s.heroPut<s.botPut?'hero':'bot',long=short==='hero'?'bot':'hero';
 if(s[short+'Stack']===0){
 const extra=s[long+'Put']-s[short+'Put'];s[long+'Stack']+=extra;s[long+'Put']-=extra;s.pot-=extra;
 this.note('Uncalled '+extra+' chips returned.');
 this.runout();return;
 }
 }
 if(s.heroPut===s.botPut){
 if(s.heroStack===0||s.botStack===0){this.runout();return}
 if(s.acted.hero&&s.acted.bot){this.nextStreet();return}
 }
 s.turn=other;this.emit();if(other==='bot')this.botSoon();
 }
 nextStreet(){
 const s=this.s;
 if(s.phase===3){this.showdown();return}
 s.phase++;this.dealStreet();
 s.heroPut=0;s.botPut=0;s.currentBet=0;s.minRaise=20;
 s.acted={hero:false,bot:false};
 s.turn=s.heroButton?'bot':'hero';
 this.emit();if(s.turn==='bot')this.botSoon();
 }
 dealStreet(){const s=this.s;const label=['','Flop','Turn','River'][s.phase];let n=s.phase===1?3:1;s.board.push(...s.deck.splice(0,n));this.note(label+' dealt.')}
 runout(){const s=this.s;while(s.phase<3){s.phase++;this.dealStreet()}this.showdown()}
 finish(winner,why){
 const s=this.s;clearTimeout(this.timer);
 s.status='finished';s.winner=winner;s.result=winner==='hero'?'win':winner==='bot'?'loss':'tie';
 if(winner==='hero')s.heroStack+=s.pot;
 else if(winner==='bot')s.botStack+=s.pot;
 else{let half=Math.floor(s.pot/2);s.heroStack+=half;s.botStack+=s.pot-half}
 s.lastResult=why;s.turn=null;
 this.note(winner==='hero'?'You win '+s.pot+' chips!':winner==='bot'?'Computer wins '+s.pot+' chips.':'The pot is split.');
 this.emit();
 if(this.cb.finish)this.cb.finish(this.snapshot());
 }
 showdown(){
 const s=this.s,h=evaluate([...s.hero,...s.board]),b=evaluate([...s.bot,...s.board]),cmp=compare(h.score,b.score);
 this.note('Showdown: '+h.name+' vs '+b.name+'.');
 this.finish(cmp>0?'hero':cmp<0?'bot':'tie','showdown');
 }
 botSoon(){
 clearTimeout(this.timer);
 if(!this.s||!this.mayAct('bot'))return;
 this.timer=setTimeout(()=>this.botMove(),380+Math.floor(Math.random()*380));
 }
 botMove(){
 if(!this.mayAct('bot'))return;
 const s=this.s,due=this.toCall('bot'),strength=estimateStrength(s.bot,s.board),r=Math.random(),risk=due/(s.pot+due||1);
 if(due>0){
 if(strength<.44&&risk>.27&&r<.64){this.act('bot','fold');return}
 const raiseTo=s.currentBet+Math.max(s.minRaise,20);
 if(strength>.76&&r<.26&&s.botPut+s.botStack>raiseTo){this.act('bot','raise',raiseTo);return}
 this.act('bot','call');return
 }
 if(s.botStack>40&&strength>.68&&r<.32){
 const bet=Math.min(s.botPut+s.botStack,s.botPut+20+Math.floor(Math.random()*5)*10);
 this.act('bot','raise',bet);return
 }
 if(s.botStack>60&&r<.08){this.act('bot','raise',s.botPut+20);return}
 this.act('bot','check');
 }
 destroy(){clearTimeout(this.timer)}
}
function equity(hero,board,trials){
 if(!hero||hero.length!==2||board.length>5||new Set([...hero,...board]).size!==hero.length+board.length)return null;
 const source=FULL.filter(c=>![...hero,...board].includes(c));const count=Math.max(100,Math.min(1200,trials||600));let wins=0,ties=0,losses=0;
 for(let i=0;i<count;i++){
 const deck=shuffle(source),opp=deck.slice(0,2),full=board.concat(deck.slice(2,7-board.length));
 const a=evaluate([...hero,...full]),b=evaluate([...opp,...full]),cmp=compare(a.score,b.score);
 if(cmp>0)wins++;else if(cmp===0)ties++;else losses++;
 }
 return {wins,ties,losses,trials:count,equity:(wins+ties/2)/count};
}
window.PH_GAME={Table,R,S,FULL,CATS,evaluate,compare,scoreFive,equity,estimateStrength,shuffle};
})();