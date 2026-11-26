export function trialEmyStage(step?:number):'following'|'trunk';
export function trialStartPose(step:number):{x:number;y:number;z:number;yaw:number;pitch:number}|null;
export function trialCheckpoint(step:number):{version:2;stage:string;picked:string[];emy:{stage:'following'|'trunk'};[key:string]:unknown};
