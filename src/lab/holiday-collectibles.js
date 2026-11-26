// Optional collectibles are independent of story puzzles and collision.
// The altar keepsake has a stable ID for a later puzzle gate.
export const PLUSH_IDS=Object.freeze(['plush-gift','plush-stairs','plush-altar']);
export const PLUSH_NAMES=Object.freeze(['Kitty de Navidad','Kitty exploradora','Kitty de los recuerdos']);
const tones=[[.87,.30,.45],[.58,.53,.84],[.94,.66,.76]];
export function installHolidayCollectibles(add,obj,floor,power){
 const tree={on:true,supply:power},gift={age:0,opening:false,opened:false,parts:[]};
 const plushes=PLUSH_IDS.map((id,i)=>{
  const [x,y,z]=[[11.96,floor+.18,2.60],[10.96,.20,6.85],[12.55,floor+.97,.72]][i];
  const item=obj(id,i===0?'gift':'collectible',i===0?'Abrir regalo':PLUSH_NAMES[i],x,y,z,{index:i,taken:false,requiresCrouch:i===1});
  if(i===0)return item;
  const part=(name,dx,dy,dz,w,h,d,color,extra={})=>add(id+'-'+name,x+dx,y+dy,z+dz,w,h,d,'glove',false,{dynamic:true,source:item,sourceOffset:[dx,dy,dz],castShadow:false,color,shape:'round',segments:6,rings:3,...extra});
  const white=[.99,.92,.89],ink=[.13,.085,.10];
  const parts=[part('body',0,-.035,0,.19,.19,.13,tones[i]),part('head',0,.095,0,.27,.20,.16,white),
   part('ear-l',-.087,.18,0,.083,.10,.075,white,{shape:'ear'}),part('ear-r',.087,.18,0,.083,.10,.075,white,{shape:'ear'}),
   part('eye-l',-.048,.094,.075,.021,.033,.015,ink),part('eye-r',.048,.094,.075,.021,.033,.015,ink),
   part('nose',0,.065,.081,.025,.019,.012,[1,.73,.24]),part('bow-a',.08,.168,.065,.073,.05,.035,tones[i]),part('bow-b',.13,.17,.063,.073,.05,.035,tones[i]),
   part('paw-l',-.09,-.05,.04,.069,.08,.07,white),part('paw-r',.09,-.05,.04,.069,.08,.07,white),
   part('foot-l',-.058,-.13,.04,.082,.07,.092,white),part('foot-r',.058,-.13,.04,.082,.07,.092,white)];
  // The first keepsake is represented by its wrapped box, not a visible plush.
  item.parts=parts;
  return item;
 });
 obj('holiday-tree-switch','holiday-switch','Luces del árbol',12.01,floor+1.04,2.43,{tree});
 return {tree,gift,plushes};
}
export function holidayPowered(holiday){return !!(holiday?.tree.on&&holiday.tree.supply.on);}
export function collectedPlushes(holiday){return holiday.plushes.filter(item=>item.taken).map(item=>item.id);}
export function beginGift(holiday,reduced=false){
 const item=holiday.plushes[0];
 if(item.taken||holiday.gift.opening)return false;
 holiday.gift.opening=true;holiday.gift.age=reduced?.72:0;item.interactable=false;return true;
}
function poseGift(holiday){
 const gift=holiday.gift,t=Math.min(1,gift.age/.72),e=t*t*(3-2*t);
 for(const {box,y,z} of gift.parts){box.y=y+.17*e;box.z=z-.15*e;box.pitch=-1.22*e;}
}
export function advanceGift(holiday,dt){
 const gift=holiday.gift;if(!gift.opening)return null;
 gift.age=Math.min(.72,gift.age+Math.max(0,dt));poseGift(holiday);
 if(gift.age<.72)return null;
 gift.opening=false;gift.opened=true;holiday.plushes[0].taken=true;return holiday.plushes[0];
}
export function collectPlush(holiday,item){
 if(item.kind!=='collectible'||!holiday.plushes.includes(item)||item.taken||item.interactable===false)return false;
 item.taken=true;return true;
}
export function restoreHoliday(holiday,saved){
 if(!holiday)return;
 holiday.tree.on=saved?.treeLights!==false;
 const ids=new Set(Array.isArray(saved?.plushes)?saved.plushes:[]);
 for(const item of holiday.plushes)item.taken=ids.has(item.id);
 if(holiday.plushes[0].taken){holiday.gift.opened=true;holiday.gift.age=.72;poseGift(holiday);}
}
