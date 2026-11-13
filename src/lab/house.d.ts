import type {HouseTrial} from './house-trials';

export type HouseLaunchOptions={demo?:boolean;onRescue?:()=>void;trial?:boolean;entry?:string;scenario?:HouseTrial};
export function launchHouse(onExit:()=>void,checkpoint?:string,options?:HouseLaunchOptions):()=>void;
