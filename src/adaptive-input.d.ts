export type InputMode='keyboard'|'touch'|'gamepad';
export type PadSample={moveX:number;moveY:number;aimX:number;aimY:number;buttons:readonly boolean[];pressed:readonly boolean[]};
export const EMPTY_PAD:PadSample;
export function radialStick(x:number,y:number,dead?:number):[number,number];
export function samplePad(pad:Gamepad|null,previous?:readonly boolean[]):PadSample;
export function initialInputMode():InputMode;
export function createInputSession(root:HTMLElement,onMode?:(mode:InputMode)=>void):{readonly mode:InputMode;poll:()=>PadSample;reset:()=>void;diagnostic:()=>{id:string;mapping:string;axes:number[];buttons:number[]}[];destroy:()=>void};
export function visibleButtons(root:Element):HTMLElement[];
export function padMenu(root:Element,pad:PadSample):boolean;
