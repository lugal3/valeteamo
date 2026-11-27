import type {HouseTrial} from './house-trials';

export type HouseCheckpointStore={checkpoint:unknown;save:(checkpoint:object|null)=>void|boolean};
export type HouseLaunchOptions={demo?:boolean;onRescue?:(muted?:boolean)=>void;initialMuted?:boolean;trial?:boolean;fieldTutorials?:boolean;entry?:string;scenario?:HouseTrial;checkpointStore?:HouseCheckpointStore};
export function launchHouse(onExit:()=>void,checkpoint?:string,options?:HouseLaunchOptions):()=>void;
