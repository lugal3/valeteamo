export type PrologueStage='intro'|'feed-cat'|'cat-fed'|'meet-couple'|'defend'|'talk-louis'|'talk-luis'|'walk-together'|'disappearance'|'ribbon'|'petals'|'wheel'|'door'|'window'|'house';
export type PrologueEvent='churu'|'fed'|'arrived'|'met'|'victory'|'louis'|'luis'|'clearing'|'abducted'|'ribbon'|'petals'|'wheel'|'locked'|'enter';
export type PrologueCharacter='Kitty'|'Luis'|'Vale'|'Louis';
export type PrologueLine={speaker:PrologueCharacter;text:string;tone?:import('./dialogue-feel.js').DialogueTone};
export type PrologueState={version:number;stage:PrologueStage;hp:number;clues:number;completed:boolean;fedGreyCat:boolean;metCouple:boolean;discoveries?:readonly string[]};
export const PROLOGUE_SAVE_KEY:string;
export const PROLOGUE_VERSION:number;
export const PROLOGUE_START:Readonly<PrologueState>;
export const STAGES:PrologueStage[];
export const PROLOGUE_DIALOGUES:Record<string,PrologueLine[]>;
export const PROLOGUE_OBJECTIVES:Record<PrologueStage,string>;
export function advancePrologue(state:PrologueState,event:PrologueEvent):PrologueState;
export function hurtPrologue(state:PrologueState,amount?:number):PrologueState;
export function healPrologue(state:PrologueState,amount?:number):PrologueState;
export function parsePrologue(raw:string|null):PrologueState;
export function loadPrologue():PrologueState;
export function savePrologue(state:PrologueState):boolean;
export function resetPrologue():void;
export function openPrologueSave(storage?:Storage):{readonly state:PrologueState;save:(state:PrologueState)=>boolean;reset:()=>boolean}|undefined;

export const OPTIONAL_DISCOVERIES:readonly string[];
export function recordPrologueDiscovery(state:PrologueState,id:string):PrologueState;

export type JourneyMemory={fedEmy:boolean;metCouple:boolean;discoveries:readonly string[]};
export function journeyMemory(state?:PrologueState):JourneyMemory;
export function journeyEcho(memory?:JourneyMemory):string;
