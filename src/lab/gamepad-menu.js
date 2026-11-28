// House-only spatial navigation; the original 2D pad bindings remain intact.
const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export function menuDirection(pad,previous=null){
 const digital=[[12,'up'],[13,'down'],[14,'left'],[15,'right']];
 const edge=digital.find(([i])=>pad.pressed?.[i]);
 if(edge)return edge[1];
 const held=digital.find(([i])=>pad.buttons?.[i]);
 if(held)return held[1];
 const x=pad.moveX||0,y=pad.moveY||0;
 if(Math.max(Math.abs(x),Math.abs(y))<(previous?.source==='stick'?.35:.55))return null;
 return Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
}
export function spatialNext(rects,index,dir){
 const a=rects[index],vector=directions[dir];if(!a||!vector)return index;
 const [x,y]=vector;let best=index,score=Infinity;
 for(let i=0;i<rects.length;i++){
  if(i===index)continue;
  const b=rects[i],dx=b.x-a.x,dy=b.y-a.y,along=dx*x+dy*y,cross=Math.abs(dx*y-dy*x);
  if(along<2)continue;
  const rank=along+cross*2.8+cross*cross/Math.max(12,along);
  if(rank<score){score=rank;best=i;}
 }
 return best;
}
export function createMenuRepeat(){
 let direction=null,next=0,source=null;
 return {reset(){direction=null;next=0;source=null;},step(pad,now){
  const d=menuDirection(pad,{source});
  if(!d){this.reset();return null;}
  const edge=[12,13,14,15].some(i=>pad.pressed?.[i]);
  if(edge||d!==direction){direction=d;source=[12,13,14,15].some(i=>pad.buttons?.[i]||pad.pressed?.[i])?'digital':'stick';next=now+320;return d;}
  if(now>=next){next=now+125;return d;}
  return null;
 }};
}
const selector='button,summary,input:not([type=hidden]),select,[role=button],[role=tab]';
function available(scope){
 return Array.from(scope.querySelectorAll(selector)).filter(el=>{
  if(el.disabled||el.getAttribute('aria-disabled')==='true'||el.closest('[hidden],[inert],[aria-hidden=true]')||!el.getClientRects().length)return false;
  if(el.closest('details:not([open])')&&!el.matches('summary'))return false;
  const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none';
 });
}
const identity=el=>el.id?'id:'+el.id:[el.tagName,...['data-act','data-id','data-inspect','data-manual','data-app','data-photo','data-photo-index','data-home-page','data-setting','data-hud','data-layout','data-dir','aria-label'].map(a=>el.getAttribute(a)||'')].join('|');
function adjust(el,dir){
 if(dir!=='left'&&dir!=='right')return false;
 const n=dir==='right'?1:-1;
 if(el.matches('input[type=range]')){const old=el.value;try{n>0?el.stepUp():el.stepDown();}catch{return false;}if(old!==el.value){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}return true;}
 if(el.matches('select')){let i=el.selectedIndex+n;while(i>=0&&i<el.options.length&&el.options[i].disabled)i+=n;if(i>=0&&i<el.options.length){el.selectedIndex=i;el.dispatchEvent(new Event('change',{bubbles:true}));}return true;}
 return false;
}
export function createHouseMenu(){
 const repeat=createMenuRepeat();let previousScope=null,previousPage=null,selected=null,key=null;
 const clear=()=>{selected?.removeAttribute('data-pad-selected');selected=null;key=null;previousScope=null;previousPage=null;repeat.reset();};
 function focus(el){
  if(selected!==el){selected?.removeAttribute('data-pad-selected');selected=el;key=identity(el);el.setAttribute('data-pad-selected','true');}
  if(document.activeElement!==el){el.focus({preventScroll:true});el.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});}
 }
 return {clear,step(scope,pad,{page='',preferred='',now=performance.now(),confirm=true}={}){
  if(!scope){clear();return false;}
  const changed=scope!==previousScope||page!==previousPage;
  if(changed){clear();previousScope=scope;previousPage=page;}
  const items=available(scope);if(!items.length)return false;
  const existing=items.includes(document.activeElement)?document.activeElement:null;
  const preferredItem=preferred?items.find(el=>el.matches(preferred)):null;
  const current=(changed&&preferredItem)||existing||items.find(el=>identity(el)===key)||preferredItem||items[0];
  focus(current);
  const dir=repeat.step(pad,now);
  if(dir&&!adjust(current,dir)){
   const rects=items.map(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
   focus(items[spatialNext(rects,items.indexOf(current),dir)]);
  }
  if(confirm&&pad.pressed?.[0]){
   const el=selected;
   if(el.matches('input[type=range],select'))return true;
   el.click();return true;
  }
  return false;
 }};
}
