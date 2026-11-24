import type {PrologueStage} from './prologue-story.js';
export type PrologueAct=Readonly<{id:'morning'|'abduction'|'dusk'|'night';label:string;title:string;stages:readonly PrologueStage[]}>;
export const PROLOGUE_ACTS:readonly PrologueAct[];
export function prologueAct(stage:PrologueStage):PrologueAct;
export function prologueProgress(stage:PrologueStage):{id:PrologueAct['id'];label:string;title:string;step:number;total:number};
export const HOUSE_HANDOFF_MS:number;
