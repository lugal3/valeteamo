import type {HouseTrial} from './house-trials';

export type HouseCheckpointStore={checkpoint:unknown;save:(checkpoint:object|null)=>void};
export type HouseLaunchOptions={demo?:boolean;onRescue?:()=>void;trial?:boolean;entry?:string;scenario?:HouseTrial;checkpointStore?:HouseCheckpointStore};
export function launchHouse(onExit:()=>void,checkpoint?:string,options?:HouseLaunchOptions):()=>void;
