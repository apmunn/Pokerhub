'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
global.window=global;
require('../assets/game.js');
const {Table,evaluate,compare,equity}=global.PH_GAME;
test('all nine hand categories rank correctly',()=>{
 const cases=[
 [['A♠','K♥','9♦','6♣','3♠'],0],
 [['A♠','A♥','K♦','Q♣','7♠'],1],
 [['A♠','A♥','K♦','K♣','7♠'],2],
 [['A♠','A♥','A♦','2♣','7♠'],3],
 [['A♠','2♥','3♦','4♣','5♠'],4],
 [['2♥','4♥','6♥','8♥','T♥'],5],
 [['Q♠','Q♥','Q♦','6♣','6♠'],6],
 [['7♠','7♥','7♦','7♣','A♠'],7],
 [['T♠','J♠','Q♠','K♠','A♠'],8]
 ];
 for(let [cards,cat]of cases)assert.equal(evaluate(cards).category,cat,cards.join(' '));
});
test('ace-low straight loses to six-high straight',()=>{
 const low=evaluate(['A♠','2♥','3♦','4♣','5♠']),high=evaluate(['2♠','3♥','4♦','5♣','6♠']);
 assert.ok(compare(low.score,high.score)<0);
});
test('best five cards are picked from seven',()=>{
 const hand=evaluate(['A♠','A♥','A♦','A♣','K♠','2♥','7♦']);
 assert.equal(hand.category,7);assert.equal(hand.cards.length,5);
});
test('heads-up betting moves through all streets and resolves chips',()=>{
 let finished=null;
 const t=Table.newHand(500,2,'practice',{change:()=>{},finish:s=>finished=s});
 assert.equal(t.s.pot,30);assert.equal(t.s.turn,'hero');
 assert.ok(t.act('hero','call').ok);
 assert.ok(t.act('bot','check').ok);assert.equal(t.s.phase,1);assert.equal(t.s.board.length,3);
 assert.ok(t.act('bot','check').ok);assert.ok(t.act('hero','check').ok);assert.equal(t.s.phase,2);
 assert.ok(t.act('bot','check').ok);assert.ok(t.act('hero','check').ok);assert.equal(t.s.phase,3);
 assert.ok(t.act('bot','check').ok);assert.ok(t.act('hero','check').ok);
 assert.equal(t.s.status,'finished');assert.ok(finished);assert.equal(t.s.board.length,5);
 assert.equal(t.s.heroStack+t.s.botStack,1000);t.destroy();
});
test('fold awards the pot without altering chip total',()=>{
 const t=Table.newHand(500,2,'practice',{});assert.ok(t.act('hero','fold').ok);
 assert.equal(t.s.result,'loss');assert.equal(t.s.heroStack+t.s.botStack,1000);t.destroy();
});
test('full all-in runs out the board after call',()=>{
 const t=Table.newHand(40,2,'practice',{});assert.ok(t.act('hero','allin').ok);
 assert.ok(t.act('bot','call').ok);assert.equal(t.s.status,'finished');
 assert.equal(t.s.board.length,5);assert.equal(t.s.heroStack+t.s.botStack,80);t.destroy();
});
test('invalid duplicate card equity request is rejected',()=>{
 assert.equal(equity(['A♠','A♠'],[],100),null);
});
test('equity estimates a premium pair above a weak hand against random opponent',()=>{
 const aces=equity(['A♠','A♥'],[],350).equity;
 const weak=equity(['7♣','2♦'],[],350).equity;
 assert.ok(aces>.69,'AA equity '+aces);assert.ok(aces>weak,'AA '+aces+' vs 72 '+weak);
});
