(function(){
'use strict';
const D=window.PH_DATA,G=window.PH_GAME,$=s=>document.querySelector(s);
const KEY='pokerhub-v2',OLD='pokerhub-local-v1';
const defaults=()=>({name:'Player',theme:'green',wallet:2500,xp:0,completed:[],daily:[],handsPlayed:0,wins:0,losses:0,ties:0,currentStreak:0,bestStreak:0,handCounter:0,achievements:[],history:[],savedTopics:[],partners:[],clubs:[],tour:{status:'idle',round:0},activeGame:null});
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function getStore(){let d=defaults();try{let s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')return {...d,...s,tour:{...d.tour,...(s.tour||{})}};let legacy=JSON.parse(localStorage.getItem(OLD)||'null');if(legacy){d.name=String(legacy.name||'Player').slice(0,25);d.wallet=Number(legacy.chips)||2500;d.xp=Number(legacy.xp)||0;d.wins=Number(legacy.wins)||0;d.handsPlayed=Number(legacy.played)||0;d.completed=(legacy.completed||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<D.lessons.length);return d}}catch(e){}return d}
let state=getStore(),page='home',table=null,lessonSelected=0,lessonAnswer=null,topicSelected=0,dailyAnswer=null;
let lab={hole:[],board:[],focus:'hole',result:null,working:false},calc={pot:80,call:20},toastTimer=null,profileTab='overview';
const icon={home:'⌂',play:'♠',academy:'▤',challenges:'✧',lab:'◇',coach:'✦',ranked:'★',tournaments:'♛',community:'♧',profile:'◉'};
const items=[['home','Dashboard'],['play','Play Poker'],['academy','Academy'],['challenges','Challenges'],['lab','Hand Lab'],['coach','Coach'],['ranked','Rankings'],['tournaments','Tournaments'],['community','Friends & Clubs'],['profile','Profile']];
const words={win:'WIN',loss:'LOSS',tie:'SPLIT'};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('Could not save locally',e)}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,3100)}
function achievement(id){if(!state.achievements.includes(id)){state.achievements.push(id);setTimeout(()=>toast('Achievement unlocked: '+(D.achievements.find(a=>a.id===id)||{name:id}).name),200)}}
function xp(n){state.xp=Math.max(0,Number(state.xp||0)+n);save()}
function rank(){let r=D.ranks[0];for(let v of D.ranks)if(state.xp>=v.min)r=v;return r}
function nextRank(){return D.ranks.find(r=>r.min>state.xp)}
function level(){return Math.floor(state.xp/150)+1}
function dateKey(){let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function dailyIndex(){let k=dateKey().replace(/-/g,'');return (Number(k)*7+17)%D.lessons.length}
function card(c,small){if(!c)return '<span class="playing '+(small?'mini ':'')+'placeholder" aria-label="Empty card slot"></span>';let r=c[0]==='T'?'10':c[0],s=c[1];return '<span class="playing '+(small?'mini ':'')+('♥♦'.includes(s)?'red':'')+'" aria-label="'+r+' '+s+'"><span>'+r+'</span><span class="middleSuit">'+s+'</span></span>'}
function back(small){return '<span class="playing back '+(small?'mini':'')+'" aria-label="Face-down card"></span>'}
function panel(title,inside,extra){return '<section class="panel '+(extra||'')+'"><div class="cardTitle"><h2>'+title+'</h2></div>'+inside+'</section>'}
function button(text,act,klass){return '<button type="button" class="btn '+(klass||'')+'" onclick="'+act+'">'+text+'</button>'}
function lead(k,h,p){return '<div class="eyebrow">'+k+'</div><h1>'+h+'</h1><p class="pageLead">'+p+'</p>'}
function progressBar(p){return '<div class="progress"><div style="width:'+Math.max(0,Math.min(100,p))+'%"></div></div>'}
function nav(){
 $('#navigation').innerHTML='<div class="navLabel">EXPLORE</div><div class="nav">'+items.map(([id,name])=>'<button type="button" data-nav="'+id+'" class="'+(page===id?'active':'')+'" title="'+name+'" aria-current="'+(page===id?'page':'false')+'"><span style="font-size:19px;width:21px;text-align:center">'+icon[id]+'</span><span class="text">'+name+'</span></button>').join('')+'</div>';
 $('#playerMini').innerHTML='<button class="miniProfile" data-nav="profile"><span class="avatar">'+esc((state.name||'P')[0].toUpperCase())+'</span><span class="info"><strong>'+esc(state.name)+'</strong><br><span class="muted small">'+rank().name+' · Level '+level()+'</span></span></button><div class="sideLegal info">Free play chips · No purchases or cash value</div>';
 $('#chipBalance').textContent=Number(state.wallet||0).toLocaleString()+' chips';
 $('#topRank').textContent=rank().name;
 document.body.className=state.theme==='green'?'':'theme-'+(['purple','blue','amber'].includes(state.theme)?state.theme:'green');
}
function go(p){if(!items.some(i=>i[0]===p))p='home';page=p;if(location.hash.slice(1)!==p)location.hash=p;render();window.scrollTo({top:0,behavior:'smooth'})}
function render(){nav();let views={home,play,academy,challenges,handLab,lab:handLab,coach,ranked,tournaments,community,profile};let v=views[page]||home;$('#content').innerHTML='<div class="animateIn">'+v()+'</div>';document.title=(items.find(i=>i[0]===page)||['','PokerHub'])[1]+' · PokerHub'}
function home(){
 let next=nextRank(),count=state.completed.length,rate=state.handsPlayed?Math.round(state.wins/state.handsPlayed*100):0;
 let today=state.daily.includes(dateKey());
 return '<section class="hero"><div class="eyebrow">♠ WELCOME TO POKERHUB</div><h1>Play the hand.<br>Learn the game.</h1><p>A complete, free poker learning playground. Practice at a real turn-based table, explore interactive lessons, and track your improvement—without betting real money.</p><div class="actions">'+button('♠ Play a hand →','App.startPractice()')+button('Explore Academy','App.go(\'academy\')','secondary')+'</div></section>'+
 '<div class="grid cols4" style="margin-bottom:17px">'+
 '<section class="panel kpi"><div class="panelLabel">Learning Rank</div><div class="statValue accentText">'+rank().icon+' '+rank().name+'</div><span class="muted small">Level '+level()+'</span></section>'+
 '<section class="panel kpi"><div class="panelLabel">Total XP</div><div class="statValue">'+state.xp.toLocaleString()+'</div>'+progressBar(next?state.xp/next.min*100:100)+'</section>'+
 '<section class="panel kpi"><div class="panelLabel">Practice Wins</div><div class="statValue">'+state.wins+'</div><span class="muted small">'+rate+'% of '+state.handsPlayed+' completed hands</span></section>'+
 '<section class="panel kpi"><div class="panelLabel">Lessons Mastered</div><div class="statValue">'+count+' <span class="muted small">/ '+D.lessons.length+'</span></div>'+progressBar(100*count/D.lessons.length)+'</section></div>'+
 '<div class="split"><div class="stack">'+
 panel('Pick up where you left off','<div class="grid cols2">'+feature('♠','Play Poker','Challenge a computer opponent at an interactive Hold’em table.','Play now','App.go(\'play\')')+feature('▤','Poker Academy','Learn with '+D.lessons.length+' interactive questions and feedback.','Start lesson','App.go(\'academy\')')+feature('◇','Hand Lab','Build a five-card hand or estimate your odds against a random opponent.','Analyze cards','App.go(\'lab\')')+feature('♛','Solo Cup','Win three consecutive practice matches to claim a local trophy.','Open tournament','App.go(\'tournaments\')')+'</div>')+
 panel('Your recent hands',state.history.length?state.history.slice(0,4).map(h=>'<div class="listRow"><div><strong>'+esc((words[h.result]||h.result))+'</strong> <span class="muted small">· '+esc(h.mode==='tournament'?'Solo Cup':'Solo Practice')+' · '+esc(h.date)+'</span></div><span class="tag '+(h.result==='win'?'':'mutedTag')+'">Pot '+h.pot+'</span></div>').join(''):'<div class="empty">No hands yet. Your first session starts one click away.</div>')+
 '</div><div class="stack">'+panel('Daily brain teaser','<div class="row between"><span class="tag">'+(today?'✓ Complete':'Today’s challenge')+'</span><span class="muted tiny">'+esc(dateKey())+'</span></div><h3 style="margin-top:16px">'+esc(D.lessons[dailyIndex()].name)+'</h3><p class="muted small">One quick question, one useful idea. Build a learning habit.</p>'+button(today?'Review today →':'Try the challenge →','App.go(\'challenges\')',today?'secondary':'') )+
 panel('Next milestone','<div class="row between"><strong>'+(next?next.icon+' '+next.name:'♛ Master')+'</strong><span class="muted small">'+(next?state.xp+' / '+next.min:'Max rank')+' XP</span></div>'+progressBar(next?state.xp/next.min*100:100)+'<p class="muted small" style="margin-top:14px">Learning XP tracks practice, not online matchmaking skill.</p>')+'</div></div>';
}
function feature(icon,title,desc,label,action){return '<article class="featureCard"><div style="font-size:26px;color:var(--accent)">'+icon+'</div><h3>'+title+'</h3><p>'+desc+'</p>'+button(label+' →',action,'secondary sm')+'</article>'}
function restore(){
 if(state.activeGame&&state.activeGame.status==='playing'){table=new G.Table(state.activeGame,{change:onGameChange,finish:onGameFinish})}
 else if(state.activeGame&&state.activeGame.status==='finished'){table=new G.Table(state.activeGame,{change:onGameChange,finish:onGameFinish})}
}
function onGameChange(s){state.activeGame=s;save();if(page==='play'||page==='tournaments'||page==='coach')render()}
function onGameFinish(s){
 if(state.history.some(h=>h.id===s.mode+':'+s.handNo))return;
 if(s.mode==='practice')state.wallet+=s.heroStack;
 state.handsPlayed++;
 if(s.result==='win'){state.wins++;state.currentStreak++;state.bestStreak=Math.max(state.bestStreak,state.currentStreak);if(state.wins===1)achievement('first-win');if(state.wins>=3)achievement('three-wins')}
 else if(s.result==='loss'){state.losses++;state.currentStreak=0}else{state.ties++;state.currentStreak=0}
 achievement('first-hand');if(state.handsPlayed>=10)achievement('ten-hands');
 xp(s.result==='win'?25:12);
 state.history.unshift({id:s.mode+':'+s.handNo,date:new Date().toLocaleString(),mode:s.mode,result:s.result,hero:s.hero,bot:s.bot,board:s.board,pot:s.pot,why:s.lastResult});
 state.history=state.history.slice(0,45);
 if(s.mode==='tournament'){
 if(s.result==='win'){state.tour.round++;state.tour.status=state.tour.round>=3?'champion':'between';if(state.tour.status==='champion'){achievement('tournament');xp(150)}}else state.tour.status='eliminated';
 }
 save();render();
}
function startGame(mode){
 if(table&&table.s&&table.s.status==='playing'){go(mode==='tournament'?'tournaments':'play');return}
 if(mode==='practice'&&state.wallet<100){state.wallet+=500;toast('Added 500 free practice chips.')}
 const buyIn=mode==='tournament'?500:Math.min(500,Math.floor(state.wallet));
 if(mode==='practice')state.wallet-=buyIn;
 state.handCounter++;save();
 if(table)table.destroy();table=G.Table.newHand(buyIn,state.handCounter,mode,{change:onGameChange,finish:onGameFinish});
 save();go(mode==='tournament'?'tournaments':'play');
}
function startPractice(){if(table&&table.s.status==='playing'){if(table.s.mode==='practice'){go('play');return}toast('Finish your Solo Cup hand first.');go('tournaments');return}startGame('practice')}
function startTour(){if(table&&table.s.status==='playing'){go(table.s.mode==='tournament'?'tournaments':'play');return}state.tour={status:'playing',round:0};save();startGame('tournament')}
function nextTour(){if(table&&table.s.status==='playing'){go('tournaments');return}if(state.tour.status!=='between'){toast('Start a Solo Cup run first.');return}state.tour.status='playing';save();startGame('tournament')}
function gameAct(kind){
 if(!table||table.s.status!=='playing')return;
 let target=kind==='raise'?Number($('#raiseAmount')&&$('#raiseAmount').value):null;
 const res=table.act('hero',kind,target);if(res&&res.error)toast(res.error);
}
function gameView(s){
 const phases=['Preflop','Flop','Turn','River'],heroTurn=s.status==='playing'&&s.turn==='hero',call=Math.max(0,s.currentBet-s.heroPut);
 const stack=s.heroStack,canRaise=stack>call&&s.heroPut+stack>s.currentBet;
 const minTo=s.currentBet===0?20:s.currentBet+s.minRaise,defaultTo=Math.min(s.heroPut+stack,minTo),heroEval=G.evaluate([...s.hero,...s.board]);
 let msg=s.status==='finished'?(s.result==='win'?'You won this hand!':s.result==='tie'?'Split pot!':'Computer wins this hand.'):(heroTurn?'Your move. Take your time.':'Computer is deciding…');
 return '<div class="feltWrap"><div class="row between"><span class="tag">'+(s.status==='playing'?phases[s.phase]:'Hand complete')+'</span><span class="muted small">Blinds 10 / 20 · '+(s.heroButton?'You are button':'Computer is button')+'</span></div><div class="felt"><div class="seat '+(s.turn==='bot'?'isTurn':'')+'"><div class="seatIcon">🤖</div><div><strong>Computer</strong><div class="small">'+s.botStack+' chips'+(s.botPut?' · '+s.botPut+' committed':'')+'</div></div><div class="seatCards">'+(s.status==='finished'?s.bot.map(c=>card(c,true)).join(''):back(true)+back(true))+'</div></div><div class="centerTable"><div class="potBadge">◈ POT '+s.pot.toLocaleString()+'</div><div class="communityCards">'+Array.from({length:5},(_,i)=>card(s.board[i])).join('')+'</div></div><div class="seat '+(heroTurn?'isTurn':'')+'"><div class="seatIcon">'+esc(state.name[0]||'P').toUpperCase()+'</div><div><strong>'+esc(state.name)+'</strong><div class="small">'+s.heroStack+' chips'+(s.heroPut?' · '+s.heroPut+' committed':'')+'</div></div><div class="seatCards">'+s.hero.map(c=>card(c,true)).join('')+'</div></div></div>'+
 '<div class="notice '+(s.status==='finished'&&s.result==='win'?'ok':'')+'" aria-live="polite"><div class="row between"><strong>'+esc(msg)+'</strong><span class="tag mutedTag">'+(heroEval?heroEval.name:'Starting hand')+'</span></div>'+(s.status==='finished'?'<p class="small muted" style="margin-top:6px">Your cards: '+esc(s.hero.join(' '))+' · Opponent: '+esc(s.bot.join(' '))+'</p>':'')+'</div>'+
 (s.status==='playing'?'<div class="tableControls">'+button('Fold','App.gameAct(\'fold\')','danger'+(!heroTurn?' disabled':''))+
 (call?button('Call '+Math.min(call,stack),'App.gameAct(\'call\')',heroTurn?'':'secondary'):button('Check','App.gameAct(\'check\')',heroTurn?'':'secondary'))+
 '<label class="field">Raise to<input id="raiseAmount" type="number" min="'+minTo+'" max="'+(stack+s.heroPut)+'" step="10" value="'+defaultTo+'" '+(heroTurn?'':'disabled')+'></label>'+
 '<button class="btn" '+(!heroTurn||!canRaise?'disabled':'')+' onclick="App.gameAct(\'raise\')">Bet / Raise</button>'+
 '<button class="btn gold" '+(!heroTurn?'disabled':'')+' onclick="App.gameAct(\'allin\')">All-in</button></div><p class="muted tiny" style="margin:10px 0 0">Enter the total bet for this street (raise to), not the extra amount. The computer uses a basic practice strategy.</p>':
 '<div class="actions" style="margin-top:14px">'+button(s.mode==='tournament'?'Tournament hub →':'Deal next hand →',s.mode==='tournament'?'App.go(\'tournaments\')':'App.startPractice()')+button('View history','App.go(\'profile\')','secondary')+'</div>')+'</div>';
}
function play(){
 if(table&&table.s&&table.s.status==='playing'&&table.s.mode==='tournament')return lead('PRACTICE POKER','Play against the computer','Your Solo Cup match is running in the tournament section.')+panel('Tournament hand in progress',button('Return to Solo Cup →','App.go(\'tournaments\')'));
 if(!table||!table.s||table.s.mode!=='practice')return lead('FREE PLAY · NO CASH VALUE','The table is waiting.','A heads-up poker game with actual betting rounds, a computer opponent, showdown comparisons, and free practice chips.')+
 '<div class="hero"><div class="eyebrow">SOLO TABLE · TEXAS HOLD’EM</div><h1>Get in the game.</h1><p>Take your seat and practice checking, calling, raising and folding. Chips have no monetary value, and you can refill for free.</p>'+button('♠ Deal a new hand →','App.startPractice()')+'</div>'+
 '<div class="grid cols3">'+feature('♠','Live Decisions','You act in turn, with the button rotating between hands.','Start playing','App.startPractice()')+feature('★','Hand Rankings','Every showdown uses the strongest five-card combination.','Open Hand Lab','App.go(\'lab\')')+feature('✦','Get coaching','Understand the decisions behind common poker actions.','Learn concepts','App.go(\'coach\')')+'</div>';
 return lead('SOLO PRACTICE','Texas Hold’em Table','Play for virtual chips only. Both players start each hand with the same table buy-in.')+
 '<div class="split"><div>'+gameView(table.s)+'</div><div class="stack">'+panel('Table insights',insights(table.s))+
 panel('Action history','<div class="gameLog" aria-live="polite">'+table.s.log.map(v=>'<div>• '+esc(v)+'</div>').join('')+'</div>')+
 panel('Session progress','<div class="gameStat"><div><strong>'+state.handsPlayed+'</strong><br><span class="muted tiny">Hands</span></div><div><strong>'+state.wins+'</strong><br><span class="muted tiny">Wins</span></div><div><strong>'+state.xp+'</strong><br><span class="muted tiny">XP</span></div></div>')+'</div></div>';
}
function insights(s){
 let n=Math.max(0,s.currentBet-s.heroPut),den=s.pot+n,pct=den?100*n/den:0;
 let evalH=G.evaluate([...s.hero,...s.board]),phase=['Preflop','Flop','Turn','River'][s.phase];
 return '<div class="row between"><span class="muted small">Street</span><strong>'+phase+'</strong></div><div class="listRow"><span class="muted small">To call</span><strong>'+n+' chips</strong></div><div class="listRow"><span class="muted small">Break-even call equity</span><strong>'+(n?pct.toFixed(1)+'%':'No call required')+'</strong></div><div class="listRow"><span class="muted small">Current made hand</span><strong>'+(evalH?evalH.name:'Not enough board cards')+'</strong></div><p class="muted tiny" style="margin-top:13px">Pot odds alone do not tell you the true chance of winning. You also need to consider possible opponent hands.</p>'+button('Explore strategy →','App.go(\'coach\')','secondary sm');
}
function academy(){
 let selected=D.lessons[lessonSelected]||D.lessons[0],done=state.completed.includes(lessonSelected),sections=[...new Set(D.lessons.map(l=>l.section))];
 return lead('INTERACTIVE LEARNING','Poker Academy','24 playable bite-sized lessons. Answer real questions, learn why, and earn XP when you first master a topic.')+
 '<div class="grid cols3" style="margin-bottom:17px">'+panel('Lessons completed','<div class="statValue">'+state.completed.length+' / '+D.lessons.length+'</div>'+progressBar(100*state.completed.length/D.lessons.length))+panel('XP per lesson','<div class="statValue accentText">+50 XP</div><p class="muted small">Earned on the first correct completion</p>')+panel('Next rank','<div class="statValue">'+(nextRank()?nextRank().name:'Master')+'</div><p class="muted small">Keep studying to improve your rank</p>')+'</div>'+
 '<div class="split"><section class="panel"><h2>Learning library</h2>'+sections.map(section=>'<div class="eyebrow" style="margin:20px 0 9px">'+esc(section)+'</div><div class="lessonList">'+D.lessons.map((l,i)=>l.section===section?'<button class="lessonRow '+(i===lessonSelected?'active':'')+'" onclick="App.openLesson('+i+')"><span class="row" style="flex-wrap:nowrap"><span class="lessonNum">'+esc(l.icon)+'</span><span><strong>'+esc(l.name)+'</strong><br><span class="muted tiny">Lesson '+(i+1)+'</span></span></span><span class="tag '+(state.completed.includes(i)?'':'mutedTag')+'">'+(state.completed.includes(i)?'✓ Done':'Study')+'</span></button>':'').join('')+'</div>').join('')+'</section>'+
 '<section class="panel"><div class="row between"><span class="eyebrow">LESSON '+(lessonSelected+1)+' / '+D.lessons.length+'</span><span class="tag">'+(done?'✓ Mastered':'Ready to learn')+'</span></div><h2 style="margin-top:15px">'+esc(selected.name)+'</h2><p class="muted">'+esc(selected.intro)+'</p><div class="notice" style="margin:19px 0"><strong>Think about this</strong><p style="margin:7px 0 0">'+esc(selected.q)+'</p></div>'+
 '<div class="choices">'+selected.answers.map((a,i)=>'<button class="choice '+(lessonAnswer===null?'':i===selected.correct?'correct':i===lessonAnswer?'incorrect':'')+'" '+(lessonAnswer===null?'':'disabled')+' onclick="App.answerLesson('+i+')"><span class="choiceKey">'+String.fromCharCode(65+i)+'</span><span>'+esc(a)+'</span></button>').join('')+'</div>'+
 (lessonAnswer===null?'<div class="notice" style="margin-top:15px">💡 '+esc(selected.tip)+'</div>':'<div class="notice '+(lessonAnswer===selected.correct?'ok':'warn')+'" style="margin-top:15px"><strong>'+(lessonAnswer===selected.correct?'Nice work!':'Not quite—learn from the answer.')+'</strong><p style="margin-top:8px">'+esc(selected.why)+'</p></div>')+
 '<div class="actions" style="margin-top:18px">'+button('← Previous','App.openLesson('+Math.max(0,lessonSelected-1)+')','secondary')+button(lessonSelected===D.lessons.length-1?'Back to lesson 1 →':'Next lesson →','App.openLesson('+(lessonSelected+1)%D.lessons.length+')')+(lessonAnswer!==null?button('Try again','App.openLesson('+lessonSelected+')','ghost'):'')+'</div></section></div>';
}
function openLesson(i){lessonSelected=Math.max(0,Math.min(D.lessons.length-1,Number(i)||0));lessonAnswer=null;render();window.scrollTo({top:0,behavior:'smooth'})}
function answerLesson(i){if(lessonAnswer!==null)return;lessonAnswer=i;if(i===D.lessons[lessonSelected].correct&&!state.completed.includes(lessonSelected)){state.completed.push(lessonSelected);xp(50);achievement('first-lesson');if(state.completed.length>=5)achievement('five-lessons');if(state.completed.length===D.lessons.length)achievement('all-lessons');save();toast('Correct! +50 XP')}render()}
function challenges(){
 let idx=dailyIndex(),l=D.lessons[idx],done=state.daily.includes(dateKey());
 return lead('DAILY PRACTICE','Today’s Challenge','A new knowledge question each calendar day. Earn bonus learning XP for the first successful answer.')+
 '<div class="split">'+panel('Daily question','<div class="row between"><span class="tag">'+esc(dateKey())+'</span><span class="tag gold">'+(done?'✓ Complete':'+30 XP')+'</span></div><h2 style="margin-top:20px">'+esc(l.name)+'</h2><p class="muted">'+esc(l.intro)+'</p><div class="notice"><strong>'+esc(l.q)+'</strong></div><div class="choices" style="margin-top:14px">'+l.answers.map((a,i)=>'<button class="choice '+(dailyAnswer===null?'':i===l.correct?'correct':i===dailyAnswer?'incorrect':'')+'" '+(dailyAnswer!==null?'disabled':'')+' onclick="App.answerDaily('+i+')"><span class="choiceKey">'+String.fromCharCode(65+i)+'</span>'+esc(a)+'</button>').join('')+'</div>'+(dailyAnswer!==null?'<div class="notice '+(dailyAnswer===l.correct?'ok':'warn')+'" style="margin-top:15px">'+esc(l.why)+'</div><div class="actions" style="margin-top:13px">'+button('Try question again','App.retryDaily()','secondary')+'</div>':'') )+
 panel('Your challenge record','<div class="statValue">'+state.daily.length+'</div><p class="muted">Unique daily questions completed</p>'+progressBar(Math.min(100,state.daily.length*10))+'<div class="divider"></div><h3>Keep practicing</h3><p class="muted small">Daily challenges are skill drills, not wagering contests. No entry fees or prizes.</p>'+button('See all lessons →','App.go(\'academy\')','secondary'))+'</div>';
}
function answerDaily(i){if(dailyAnswer!==null)return;dailyAnswer=i;let l=D.lessons[dailyIndex()];if(i===l.correct&&!state.daily.includes(dateKey())){state.daily.push(dateKey());xp(30);achievement('daily');toast('Daily challenge complete! +30 XP');save()}render()}
function retryDaily(){dailyAnswer=null;render()}
function handLab(){
 let all=[...lab.hole,...lab.board],v=G.evaluate(all),focus=lab.focus==='hole'?'Your two cards':'Community cards';
 let total=lab.result,canRun=lab.hole.length===2&&lab.board.length<=5;
 return lead('EXPLORE THE DECK','Hand Lab','Build poker hands, inspect their rankings, or estimate showdown equity against one random computer hand.')+
 '<div class="stack">'+panel('Your scenario','<div class="row between"><span class="panelLabel">PRIVATE HOLE CARDS</span><span class="tag mutedTag">'+lab.hole.length+' / 2</span></div><div class="row" style="margin:10px 0 18px">'+Array.from({length:2},(_,i)=>card(lab.hole[i])).join('')+'</div><div class="row between"><span class="panelLabel">COMMUNITY CARDS</span><span class="tag mutedTag">'+lab.board.length+' / 5</span></div><div class="row" style="margin:10px 0 17px">'+Array.from({length:5},(_,i)=>card(lab.board[i])).join('')+'</div>'+
 '<div class="actions"><span class="muted small">Adding to:</span><div class="segment"><button class="'+(lab.focus==='hole'?'active':'')+'" onclick="App.labFocus(\'hole\')">Your hand</button><button class="'+(lab.focus==='board'?'active':'')+'" onclick="App.labFocus(\'board\')">The board</button></div>'+button('Clear','App.labClear()','ghost sm')+'</div><p class="muted tiny" style="margin-top:12px">Click a card again to remove it. Choose '+focus.toLowerCase()+' to fill that area.</p>')+
 '<div class="split">'+panel('Pick cards','<div class="picker">'+G.S.map(s=>'<div class="pickerGroup"><div class="suitLabel '+('♥♦'.includes(s)?'red':'')+'">'+s+'</div>'+G.R.map(r=>{let c=r+s,p=all.includes(c);return '<button title="'+(r==='T'?'10':r)+s+'" class="'+(p?'picked ': ' ')+('♥♦'.includes(s)?'red':'')+'" onclick="App.labPick(\''+c+'\')">'+(r==='T'?'10':r)+'</button>'}).join('')+'</div>').join('')+'</div>')+
 panel('Hand breakdown','<div class="notice '+(v?'ok':'')+'"><div class="panelLabel">BEST MADE HAND</div><h2 style="margin:9px 0">'+(v?esc(v.name):'Choose 5+ cards')+'</h2>'+(v?'<div class="row">'+v.cards.map(c=>card(c,true)).join('')+'</div>':'<p class="muted small">You have selected '+all.length+' of the 5–7 cards needed to evaluate a made hand.</p>')+'</div><div class="divider"></div><h3>Equity simulator</h3><p class="muted small">Fill your two hole cards and any 0–5 community cards. Estimate your showdown chances versus one uniformly random opponent. Results are approximate.</p>'+button(lab.working?'Calculating…':'Estimate equity','App.labEstimate()',lab.working?'secondary':'')+(total?'<div class="grid cols3" style="margin-top:16px"><div><div class="statValue">'+(total.equity*100).toFixed(1)+'%</div><span class="muted tiny">Split-pot adjusted equity</span></div><div><div class="statValue">'+(total.wins/total.trials*100).toFixed(1)+'%</div><span class="muted tiny">Win frequency</span></div><div><div class="statValue">'+(total.ties/total.trials*100).toFixed(1)+'%</div><span class="muted tiny">Tie frequency</span></div></div><p class="muted tiny" style="margin-top:14px">Simulated '+total.trials+' complete boards; every estimate can vary slightly.</p>':'')+'</section>'.replace('</section>',''))+'</div>'+
 panel('Poker hand ranking reference','<div class="grid cols3">'+G.CATS.slice().reverse().map((x,i)=>'<div class="featureCard" style="min-height:78px"><span class="tag gold">#'+(i+1)+'</span><strong style="margin-top:9px">'+x+'</strong></div>').join('')+'</div>')+'</div>';
}
function labFocus(m){lab.focus=m;render()}
function labClear(){lab={hole:[],board:[],focus:'hole',result:null,working:false};render()}
function labPick(c){
 let h=lab.hole.indexOf(c),b=lab.board.indexOf(c);
 if(h>=0)lab.hole.splice(h,1);else if(b>=0)lab.board.splice(b,1);
 else if(lab.focus==='hole'){if(lab.hole.length>=2){toast('Your hand can contain only two cards.');return}lab.hole.push(c)}
 else{if(lab.board.length>=5){toast('The board holds at most five cards.');return}lab.board.push(c)}
 lab.result=null;render();if([...lab.hole,...lab.board].length>=5)achievement('analyze');save();
}
function labEstimate(){if(lab.working)return;if(lab.hole.length!==2){toast('Choose both private cards first.');return}lab.working=true;lab.result=null;render();setTimeout(()=>{try{lab.result=G.equity(lab.hole,lab.board,650)}catch(e){console.error(e);toast('Could not calculate equity.')}lab.working=false;if(page==='lab')render()},40)}
function coach(){
 let t=D.topics[topicSelected],s=table&&table.s&&table.s.status==='playing'?table.s:null;
 let pot=calc.pot,call=calc.call,pct=pot+call?100*call/(pot+call):0;
 return lead('YOUR STRATEGY GUIDE','Poker Coach','Explore common decisions, review your current hand, and practice pot-odds calculations. This is an interactive rules-based coach, not a connected AI model.')+
 '<div class="split"><div class="stack">'+panel('Choose a strategy topic','<div class="lessonList">'+D.topics.map((x,i)=>'<button class="lessonRow '+(topicSelected===i?'active':'')+'" onclick="App.chooseTopic('+i+')"><span>'+esc(x.q)+'</span><span class="accentText">→</span></button>').join('')+'</div>')+
 panel('Practice pot odds','<div class="grid cols2"><label class="field">Pot before calling<input type="number" id="potInput" min="0" max="1000000" value="'+esc(calc.pot)+'"></label><label class="field">Amount to call<input type="number" id="callInput" min="0" max="1000000" value="'+esc(calc.call)+'"></label></div><div class="actions" style="margin-top:15px">'+button('Calculate','App.calcOdds()')+'</div><div class="notice" style="margin-top:14px"><div class="panelLabel">BREAK-EVEN EQUITY</div><div class="statValue">'+pct.toFixed(1)+'%</div><p class="muted small">Call ÷ (current pot + call). This is a simplified calculation, excluding future betting and special situations.</p></div>')+'</div>'+
 '<div class="stack">'+panel('Coach explains','<span class="tag">LESSON '+(topicSelected+1)+'</span><h2 style="margin-top:16px">'+esc(t.q)+'</h2><p>'+esc(t.a)+'</p><div class="notice"><strong>Try it in practice</strong><p class="small muted" style="margin-top:7px">The best way to understand a decision is to encounter it at the table.</p></div><div class="actions" style="margin-top:16px">'+button('Play a hand →','App.startPractice()','secondary')+'</div>')+
 panel('Current hand insight',s?insights(s):'<p class="muted small">Start a solo practice hand to see street, call amount, made hand strength, and a basic pot-odds hint here.</p>'+button('Open poker table →','App.go(\'play\')','secondary'))+'</div></div>';
}
function chooseTopic(i){topicSelected=i;render()}function calcOdds(){let a=Number($('#potInput').value),b=Number($('#callInput').value);if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0){toast('Enter two non-negative numbers.');return}calc={pot:Math.min(1e6,a),call:Math.min(1e6,b)};render()}
function ranked(){
 let current=rank(),next=nextRank();
 return lead('YOUR LEARNING LADDER','Rankings','Build your personal learning rank through lessons, challenges, and practice. This is local XP progression—not a worldwide ranked multiplayer ladder.')+
 '<div class="grid cols3" style="margin-bottom:17px">'+panel('Current rank','<div class="statValue accentText">'+current.icon+' '+current.name+'</div><span class="muted">'+current.desc+'</span>')+panel('Your total XP','<div class="statValue">'+state.xp.toLocaleString()+'</div>'+progressBar(next?state.xp/next.min*100:100))+panel('Next milestone','<div class="statValue">'+(next?next.name:'Master')+'</div><span class="muted">'+(next?next.min-state.xp+' more XP':'Top learning tier reached')+'</span>')+'</div>'+
 panel('Learning tiers','<div class="rankTrack">'+D.ranks.map(r=>'<div class="rankMark '+(r.name===current.name?'current':'')+'"><span class="rankIcon">'+r.icon+'</span><div style="flex:1"><strong>'+r.name+'</strong><div class="muted tiny">'+r.desc+'</div></div><span class="tag '+(state.xp>=r.min?'':'mutedTag')+'">'+(state.xp>=r.min?'✓ Reached':r.min+' XP')+'</span></div>').join('')+'</div>')+
 '<div class="notice" style="margin-top:16px">Online matchmaking, verified global ratings, and competitive leaderboards require secure shared accounts and a multiplayer server. They are not active yet.</div>';
}
function tournaments(){
 let t=state.tour,active=table&&table.s&&table.s.status==='playing'&&table.s.mode==='tournament',stage=Math.min(2,t.round||0);
 return lead('OFFLINE TOURNAMENT MODE','Solo Cup','A free best-of-your-skills challenge: beat three consecutive computer opponents to earn the Solo Cup trophy. No entry fees, stakes, or cash prizes.')+
 '<div class="grid cols3" style="margin-bottom:18px">'+panel('Current run','<div class="statValue">'+(t.status==='champion'?'Champion':t.status==='eliminated'?'Eliminated':t.status==='idle'?'Not started':'Round '+(stage+1))+'</div><p class="muted small">Free solo challenge · 500 starting virtual chips per match</p>')+panel('Matches won','<div class="statValue">'+(t.round||0)+' / 3</div>'+progressBar(100*(t.round||0)/3))+panel('Completion reward','<div class="statValue goldText">♛ +150 XP</div><p class="muted small">One-time Solo Cup achievement</p>')+'</div>'+
 panel('Tournament bracket','<div class="bracket">'+['Opening Round','Semifinal','Final Table'].map((label,i)=>'<div class="bracketStep '+(i<(t.round||0)?'done':i===stage?'current':'')+'"><div class="eyebrow">'+(i<(t.round||0)?'✓ CLEARED':'MATCH '+(i+1))+'</div><h3 style="margin-top:9px">'+label+'</h3><span class="muted tiny">You vs. Computer '+(i+1)+'</span></div>').join('')+'</div><div class="actions" style="margin-top:19px">'+
 (t.status==='idle'?button('♛ Start Solo Cup','App.startTour()'):t.status==='between'?button('Continue to match '+(t.round+1)+' →','App.nextTour()'):t.status==='eliminated'?button('Try again','App.startTour()'):t.status==='champion'?button('Play a new cup','App.startTour()'):active?'':button('Open the table','App.go(\'tournaments\')'))+'</div>')+
 (active?'<div style="margin-top:17px">'+gameView(table.s)+'</div>':(table&&table.s&&table.s.mode==='tournament'&&table.s.status==='finished'?'<div style="margin-top:17px">'+gameView(table.s)+'</div>':''));
}
function community(){
 return lead('LOCAL STUDY SPACE','Friends & Clubs','Keep a personal list of study partners and make study groups on this device. Invitations, messaging and online club syncing are not active.')+
 '<div class="split"><div class="stack">'+panel('Study partners','<label class="field">Partner nickname<input id="newPartner" maxlength="30" placeholder="Add someone you practice with"></label><div class="actions" style="margin-top:11px">'+button('Add nickname','App.addPartner()')+'</div><div class="divider"></div>'+(state.partners.length?state.partners.map((p,i)=>'<div class="listRow"><span class="row"><span class="avatar">'+esc(p[0].toUpperCase())+'</span><strong>'+esc(p)+'</strong></span>'+button('Remove','App.removePartner('+i+')','ghost sm')+'</div>').join(''):'<div class="empty">Your list is empty. This is a private notebook, not a friend-request system.</div>'))+
 panel('Your study clubs','<label class="field">Study club name<input id="newClub" maxlength="40" placeholder="e.g. Friday Poker Club"></label><div class="actions" style="margin-top:11px">'+button('Create local club','App.addClub()')+'</div><div class="divider"></div>'+(state.clubs.length?state.clubs.map((c,i)=>'<div class="listRow"><div><strong>♧ '+esc(c)+'</strong><p class="muted tiny" style="margin:0">Saved on this device only</p></div>'+button('Remove','App.removeClub('+i+')','ghost sm')+'</div>').join(''):'<div class="empty">No local study clubs yet.</div>'))+'</div>'+
 '<div class="stack">'+panel('Community roadmap','<div class="listRow"><span>✓ Local learning profile</span><span class="tag">Available</span></div><div class="listRow"><span>✓ Personal study lists</span><span class="tag">Available</span></div><div class="listRow"><span>Shared online friend requests</span><span class="tag mutedTag">Needs backend</span></div><div class="listRow"><span>Real-time multiplayer tables</span><span class="tag mutedTag">Needs backend</span></div><div class="listRow"><span>Online club messaging</span><span class="tag mutedTag">Needs backend</span></div><div class="listRow"><span>Global leaderboards</span><span class="tag mutedTag">Needs backend</span></div>')+
 panel('Share PokerHub','<p class="muted small">Once you publish this repository using GitHub Pages, you can share the website link with friends. Each visitor’s progress will stay in their own browser.</p>'+button('Copy expected site address','App.copyLink()','secondary')+'</div></div>';
}
function addPartner(){const e=$('#newPartner'),name=e.value.trim().slice(0,30);if(!name){toast('Enter a nickname.');return}if(state.partners.length>=30){toast('Maximum 30 local partners.');return}if(!state.partners.includes(name))state.partners.push(name);save();render();toast('Nickname saved locally')}
function removePartner(i){state.partners.splice(i,1);save();render()}
function addClub(){const e=$('#newClub'),name=e.value.trim().slice(0,40);if(!name){toast('Enter a club name.');return}if(state.clubs.length>=15){toast('Maximum 15 local clubs.');return}if(!state.clubs.includes(name))state.clubs.push(name);save();render();toast('Study club saved locally')}
function removeClub(i){state.clubs.splice(i,1);save();render()}
function copyLink(){const url='https://apmunn.github.io/Pokerhub/';if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(url).then(()=>toast('Expected URL copied (once Pages is enabled)'),()=>toast(url));else toast(url)}
function profile(){
 const recent=state.history.slice(0,12);
 return lead('PERSONAL PROGRESS','Player Profile','Customize your experience, review practice results, and back up progress saved in this browser.')+
 '<div class="grid cols3" style="margin-bottom:17px">'+panel('Profile','<div class="row"><span class="avatar" style="width:50px;height:50px;font-size:22px">'+esc(state.name[0]||'P').toUpperCase()+'</span><div><h3 style="margin-bottom:0">'+esc(state.name)+'</h3><span class="muted small">'+rank().name+' · Level '+level()+'</span></div></div>')+panel('Hands played','<div class="statValue">'+state.handsPlayed+'</div><span class="muted small">'+state.wins+' wins · '+state.losses+' losses · '+state.ties+' ties</span>')+panel('Learning progress','<div class="statValue">'+state.completed.length+' / '+D.lessons.length+'</div>'+progressBar(100*state.completed.length/D.lessons.length))+'</div>'+
 '<div class="split"><div class="stack">'+panel('Account preferences','<label class="field">Display name<input id="displayName" maxlength="25" value="'+esc(state.name)+'"></label><div class="field" style="margin-top:15px">Accent theme<select id="themeSelect"><option value="green" '+(state.theme==='green'?'selected':'')+'>Classic green</option><option value="purple" '+(state.theme==='purple'?'selected':'')+'>Royal purple</option><option value="blue" '+(state.theme==='blue'?'selected':'')+'>Ocean blue</option><option value="amber" '+(state.theme==='amber'?'selected':'')+'>Warm amber</option></select></div><div class="actions" style="margin-top:17px">'+button('Save preferences','App.saveProfile()')+button('Download backup','App.exportProgress()','secondary')+'</div><div class="divider"></div><label class="field">Restore backup JSON<input type="file" id="restoreInput" accept=".json,application/json" onchange="App.importProgress(event)"></label><p class="muted tiny" style="margin-top:11px">This site has no login server. Progress is only on this device and browser unless you download a backup.</p><div class="actions">'+button('Get 500 free chips','App.refill()','secondary sm')+button('Reset progress…','App.resetProgress()','danger sm')+'</div>')+
 panel('Recent hand history',recent.length?recent.map(h=>'<div class="listRow"><div><span class="tag '+(h.result==='win'?'':'mutedTag')+'">'+esc(words[h.result]||h.result)+'</span><strong style="margin-left:6px">'+esc(h.mode==='tournament'?'Solo Cup':'Practice')+'</strong><div class="muted tiny" style="margin-top:5px">'+esc(h.date)+' · You: '+esc(h.hero.join(' '))+' · Pot '+h.pot+'</div></div><span class="muted tiny">'+(h.why==='showdown'?'Showdown':'Fold')+'</span></div>').join(''):'<div class="empty">Your hand history will appear here after your first game.</div>')+'</div>'+
 panel('Achievements','<div class="stack">'+D.achievements.map(a=>'<div class="rankMark '+(state.achievements.includes(a.id)?'current':'')+'"><span class="rankIcon">'+a.icon+'</span><div style="flex:1"><strong>'+esc(a.name)+'</strong><div class="muted tiny">'+esc(a.desc)+'</div></div><span class="tag '+(state.achievements.includes(a.id)?'':'mutedTag')+'">'+(state.achievements.includes(a.id)?'✓ Unlocked':'Locked')+'</span></div>').join('')+'</div>')+'</div></div>';
}
function saveProfile(){let name=$('#displayName').value.trim(),th=$('#themeSelect').value;if(!name){toast('Name cannot be empty.');return}state.name=name.slice(0,25);state.theme=['green','purple','blue','amber'].includes(th)?th:'green';save();render();toast('Preferences saved')}
function refill(){state.wallet+=500;save();render();toast('Added 500 free virtual chips')}
function exportProgress(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pokerhub-progress-'+dateKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Downloaded local progress backup')}
function importProgress(e){
 const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>1000000){toast('Backup must be under 1 MB.');return}
 const reader=new FileReader();reader.onload=()=>{try{let obj=JSON.parse(String(reader.result));if(!obj||typeof obj!=='object'||typeof obj.name!=='string'||!Array.isArray(obj.completed)||!Number.isFinite(Number(obj.wallet)))throw Error('Invalid backup');if(table)table.destroy();let d=defaults();state={...d,...obj,name:obj.name.slice(0,25),theme:['green','purple','blue','amber'].includes(obj.theme)?obj.theme:'green',wallet:Math.max(0,Math.min(1e8,Math.floor(obj.wallet))),xp:Math.max(0,Math.min(1e8,Math.floor(Number(obj.xp)||0))),completed:obj.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<D.lessons.length),tour:{...d.tour,...(obj.tour||{})},activeGame:null};state.history=Array.isArray(obj.history)?obj.history.slice(0,45):[];state.achievements=Array.isArray(obj.achievements)?obj.achievements:[];state.partners=Array.isArray(obj.partners)?obj.partners.slice(0,30).map(String):[];state.clubs=Array.isArray(obj.clubs)?obj.clubs.slice(0,15).map(String):[];state.daily=Array.isArray(obj.daily)?obj.daily:[];table=null;save();render();toast('Progress restored from backup')}catch(err){toast('Could not read that PokerHub backup.')}};reader.readAsText(file);
}
function resetProgress(){if(!confirm('Permanently reset all PokerHub progress stored in this browser?'))return;if(table)table.destroy();state=defaults();table=null;lessonAnswer=null;dailyAnswer=null;save();go('home');toast('Local progress reset')}
const API={go,startPractice,startTour,nextTour,gameAct,openLesson,answerLesson,answerDaily,retryDaily,labFocus,labClear,labPick,labEstimate,chooseTopic,calcOdds,addPartner,removePartner,addClub,removeClub,copyLink,saveProfile,refill,exportProgress,importProgress,resetProgress};
window.App=API;
document.addEventListener('click',e=>{let b=e.target.closest('[data-nav]');if(b){go(b.getAttribute('data-nav'));return}});
window.addEventListener('hashchange',()=>{let p=location.hash.substring(1);if(items.some(i=>i[0]===p)&&p!==page){page=p;render()}});
restore();let hash=location.hash.substring(1);if(items.some(i=>i[0]===hash))page=hash;render();
})();