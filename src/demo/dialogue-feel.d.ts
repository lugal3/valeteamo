export type DialogueTone='warm'|'calm'|'suspense'|'alarm'|'whisper';
export const DIALOGUE_TONES:Readonly<Record<DialogueTone,{interval:number;pause:number;pitch:number;volume:number}>>;
export function dialogueGlyphs(text:string):string[];
export function dialogueDelay(glyphs:string[],index:number,tone?:DialogueTone):number;
export function dialogueVoice(glyphs:string[],index:number,speaker:string,tone?:DialogueTone):{frequency:number;duration:number;volume:number}|null;
export function dialogueWords(glyphs:string[]):{glyph:string;index:number}[][];
