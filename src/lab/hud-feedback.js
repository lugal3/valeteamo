// No DOM or browser dependency in the feedback controller.
const paths={
 examine:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
 door:'<path d="M4 21V3h15v18M7 21V5l9 2v14M12 12h1"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 8 8m-4-4 3-3m-1 5 3-3"/>',
 drawer:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M9 8h6m-6 8h6"/>',
 note:'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7m-7 4h7"/>',
 hide:'<path d="M3 20V4h18v16M12 4v16M8 10v4m8-4v4"/>',
 exit:'<path d="M11 3H4v18h7M9 12h12m-4-4 4 4-4 4"/>',
 pickup:'<path d="M6 14V8a1.5 1.5 0 0 1 3 0v3-5a1.5 1.5 0 0 1 3 0v5-4a1.5 1.5 0 0 1 3 0v5-3a1.5 1.5 0 0 1 3 0v6l-3 6H9l-5-6a2 2 0 0 1 2-1Z"/>',
 throw:'<path d="M3 18 19 5M12 5h7v7M3 10h5m-4 4h4"/>',
 cat:'<path d="M4 10V4l5 4h6l5-4v6a8 8 0 1 1-16 0Z"/><path d="M8 13h.1m7.9 0h.1M10 16l2 1 2-1"/>',
 light:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 3H9z"/>',
 piano:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14m5-14v14m5-14v14M9 5v8m6-8v8"/>',
 battery:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6m-3 5-3 5h6l-3 6"/>',
 torch:'<path d="M7 3h10l-2 7v11H9V10zM8 8h8m-5 6h2"/>',
 tool:'<path d="m4 20 9-9m-2-2 6-7 5 5-7 6z"/>',
 power:'<path d="M12 3v9m-5-7a9 9 0 1 0 10 0"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
 rescue:'<path d="M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z"/>',
 car:'<path d="m5 10 2-5h10l2 5M3 10h18v8H3zM6 18v2m12-2v2M6 14h2m8 0h2"/>',
 water:'<path d="M12 3c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/>',
 screen:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'
};
const kinds={door:'door',key:'key',drawer:'drawer',note:'note',hide:'hide',battery:'battery',flashlight:'torch',screwdriver:'tool',vent:'tool',piano:'piano','rc-car':'car',television:'screen','power-switch':'power','light-switch':'light',hatch:'lock',safe:'lock',rug:'pickup',tap:'water',cupboard:'drawer',rescue:'rescue','emy-cat':'cat','noise-prop':'pickup'};
export function interactionIcon(target,{throwing=false,hidden=false,lying=false}={}){
 if(throwing)return 'throw';if(hidden||lying)return 'exit';return kinds[target?.kind]||'examine';
}
export function feedbackIcon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.examine)+'</svg>';}
const patterns=Object.freeze({pickup:[24],key:[35,45,55],arrival:[75,90,75],chase:[90,55,90],capture:[140,75,100],landing:[18],puzzle:[30,40,30,40,55]});
const priority={landing:0,pickup:1,key:2,puzzle:2,arrival:3,chase:4,capture:5};
export function createHaptics({vibrate=()=>false,now=()=>0,enabled=()=>true}={}){
 let last=-Infinity,lastPriority=-1;
 return {pulse(kind){
  if(!enabled()||!patterns[kind])return false;
  const time=now(),p=priority[kind];
  if(time-last<(p>=3?1100:180)&&p<=lastPriority)return false;
  try{if(vibrate([...patterns[kind]])===false)return false;last=time;lastPriority=p;return true;}catch{return false;}
 },stop(){try{vibrate(0);}catch{}last=-Infinity;lastPriority=-1;}};
}
