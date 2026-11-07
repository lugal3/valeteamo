export type HouseLaunchOptions={demo?:boolean;onRescue?:()=>void;trial?:boolean;entry?:string};
export function launchHouse(onExit:()=>void,checkpoint?:string,options?:HouseLaunchOptions):()=>void;