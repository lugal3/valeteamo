import {routeCenter,type RescueMapId} from './rescue-overworld';
import {NIGHT_HOUSE} from './night-house-layout';
import type {IsoPoint} from '../isometric';
import type {EpilogueStage} from './epilogue-progress.js';

export type EpilogueChapter={map:RescueMapId;spawn:IsoPoint;target:IsoPoint;title:string;objective:string;action:string;next:EpilogueStage;light:number;couple:boolean};
const path=(u:number):IsoPoint=>({u,v:routeCenter(u)});
// Return through the very same four maps, in reverse. Short walks leave
// room for optional exploration without requiring a second long campaign.
export const EPILOGUE_CHAPTERS:Record<Exclude<EpilogueStage,'complete'>,EpilogueChapter>={
 outside:{map:'night_neighborhood',spawn:{...NIGHT_HOUSE.gate},target:{u:72,v:8.25},title:'Por fin estamos fuera',objective:'Sal a la calle con Louis y Emy y vuelve al bosque',action:'Volver al bosque',next:'return-path',light:.11,couple:false},
 'return-path':{map:'dusk_search',spawn:path(62),target:path(52),title:'El camino de vuelta',objective:'Sigue el sendero de regreso',action:'Regresar al jardín',next:'reunion',light:.045,couple:false},
 reunion:{map:'afternoon_meeting',spawn:path(32),target:path(28),title:'Otra vez juntos',objective:'Encuentra a Luis y Vale',action:'Saludar a Luis y Vale',next:'celebration',light:.015,couple:true},
 celebration:{map:'morning_garden',spawn:path(20),target:path(17.5),title:'Una sorpresa para Vale',objective:'Acércate al picnic con todos',action:'Celebrar juntos',next:'complete',light:0,couple:true}
};
