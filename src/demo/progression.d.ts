export type RescueState={version:2;phase:'garden'|'heart'|'abduction'|'trail'|'house'|'end';heart:boolean;abducted:boolean;trail:boolean;house:boolean;rescued:boolean};
export const RESCUE_SAVE_KEY:string;export const RESCUE_VERSION:2;export const START:RescueState;
export function parseRescue(raw:string|null):RescueState;
export function advanceRescue(state:RescueState,event:'heart'|'abduction'|'trail'|'house'|'rescue'):RescueState;
export function loadRescue():RescueState;export function saveRescue(s:RescueState):boolean;export function resetRescue():void;