// Physical movement keys survive Shift/CapsLock/layout changes between down/up.
const CODES={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
export function movementKey(event){
 if(event.code&&event.code!=='Unidentified')return CODES[event.code]||null;
 const key=event.key||'';return key.startsWith('Arrow')?CODES[key]||null:/^[wasd]$/i.test(key)?key.toLowerCase():null;
}
export function releasedPointer(event,type){return (type==='mouse'||type==='pen')&&event.buttons===0;}
export function hasControlTouch(touches,control){return Array.from(touches||[]).some(t=>control?.contains(t.target));}
