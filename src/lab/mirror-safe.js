export const SAFE_CODE='1505';
export const MIRROR_HINT_SECONDS=60;
export const MIRROR_HINT='La escritura parece reflejada… quizá el espejo del baño pueda ayudarte.';

// Session-only puzzle. Menus, phone, cinematics and loss of focus stop its clock.
export class MirrorSafePuzzle{
 constructor(completed=false){this.reset(completed);}
 reset(completed=false){this.collected=completed;this.revealed=completed;this.opened=completed;this.activeSeconds=0;this.hintShown=false;}
 collect(){if(this.collected)return false;this.collected=true;return true;}
 advance(dt,{active=true,mirror=false}={}){
  if(!active||!this.collected||this.revealed)return null;
  if(mirror){this.revealed=true;return 'revealed';}
  this.activeSeconds+=Math.max(0,Number.isFinite(dt)?dt:0);
  if(this.activeSeconds>MIRROR_HINT_SECONDS&&!this.hintShown){this.hintShown=true;return 'hint';}
  return null;
 }
 submit(code,openDoor){
  if(this.opened)return 'already-open';
  if(String(code)!==SAFE_CODE)return 'wrong';
  if(!openDoor())return 'blocked';
  this.opened=true;return 'opened';
 }
 snapshot(){return {collected:this.collected,revealed:this.revealed,opened:this.opened,activeSeconds:this.activeSeconds,hintShown:this.hintShown};}
}
