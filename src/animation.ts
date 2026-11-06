export type Facing = 'down'|'up'|'left'|'right';
export type PlayerState = 'idle'|'walk'|'shoot'|'charge'|'hurt'|'dead';
export function facingOf(x:number,y:number,previous:Facing):Facing {
 if(Math.hypot(x,y)<.1)return previous;
 return Math.abs(x)>Math.abs(y)?x<0?'left':'right':y<0?'up':'down';
}
export function playerPose(clock:number,moving:boolean,facing:Facing,shooting:boolean,charging:boolean,hurt:boolean,dead:boolean) {
 const state:PlayerState=dead?'dead':hurt?'hurt':charging?'charge':shooting?'shoot':moving?'walk':'idle';
 const frame=moving?1+Math.floor(clock/115)%4:Math.floor(clock/1700)%4===3?5:0;
 const texture=dead?'kitty-dead':hurt?'kitty-hurt':`kitty-${facing==='left'?'right':facing}-${frame}${shooting?'-shoot':''}`;
 return {state,texture,flip:facing==='left'};
}
