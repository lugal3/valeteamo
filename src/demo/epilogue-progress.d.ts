export type EpilogueStage='outside'|'return-path'|'reunion'|'celebration'|'complete';
export type EpilogueState={version:1;stage:EpilogueStage};
export const EPILOGUE_STAGES:readonly EpilogueStage[];
export const EPILOGUE_START:Readonly<EpilogueState>;
export function parseEpilogue(raw:string|null):EpilogueState|null;
export function advanceEpilogue(state:EpilogueState,next:EpilogueStage):EpilogueState;
export function openEpilogueSave(storage?:Pick<Storage,'getItem'|'setItem'>):{readonly state:EpilogueState;advance(next:EpilogueStage):boolean}|undefined;

export function hasCompletedEpilogue(storage?:Pick<Storage,'getItem'>):boolean;
