// Punto de acople futuro. NO importa ni monta el juego original.
export type ExperienceEvent =
 | {type:'OPEN_GAME';entry:'rescue-prologue'|'resume';profile:'birthday'|'demo'}
 | {type:'RETURN_TO_MEMORIES'}
 | {type:'SAVE_EXPERIENCE_PROGRESS';version:1;giftOpened:boolean;visited:string[]};
export interface GameBridge {
 send(event:ExperienceEvent):void;
}
export function createPreviewBridge(onOpen:()=>void):GameBridge {
 return {send(event){if(event.type==='OPEN_GAME')onOpen();}};
}
