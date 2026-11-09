// Session-only timeline. No writes to story/rescue saves; transitions are idempotent.
export class HouseEvents{
 constructor(){this.reset();}
 reset(){this.phase='explore';this.time=0;this.remaining=10;this.messages=[];this.notified=false;this.replied=false;this.replyAt=null;this.cues=new Set();}
 observe(puzzle){
  if(puzzle.key&&puzzle.symbol&&!this.notified){this.notified=true;this.messages.push({from:'Mi Luis ❤️',text:'Creo que está a punto de llegar a la casa.'});return 'message';}
  if(puzzle.door&&this.phase==='explore'){this.phase='arrival';this.time=0;return 'arrival';}return null;
 }
 read(){if(this.notified&&!this.replied&&this.replyAt===null)this.replyAt=.9;}
 advance(dt,hidden){
  const cues=[];if(this.replyAt!==null){this.replyAt-=dt;if(this.replyAt<=0){this.replyAt=null;this.replied=true;this.messages.push({from:'Tú',text:'Estoy a punto de descubrir algo. Veré qué puedo hacer.'});}}
  if(this.phase==='arrival'){this.time+=dt;for(const [at,name] of [[.45,'keys'],[1.2,'knock'],[2.25,'rattle']])if(this.time>=at&&!this.cues.has(name)){this.cues.add(name);cues.push(name);}if(this.time>=4){this.phase='hide';this.remaining=10;cues.push('hide');}}
  else if(this.phase==='hide'){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining===0){this.phase=hidden?'safe':'failed';cues.push(this.phase);}}
  return cues;
 }
 retry(){this.phase='arrival';this.time=0;this.remaining=10;this.cues.clear();}
}
