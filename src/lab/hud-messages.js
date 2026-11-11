// House-only presentation. No gameplay timers, controls or save data are changed.
const intersects=(a,b)=>a.x<b.x+b.w+8&&a.x+a.w+8>b.x&&a.y<b.y+b.h+8&&a.y+a.h+8>b.y;
export function messageLayout(width,height,dock,{phoneOpen=false,left=12,right=52,top=58}={}){
 const span=Math.max(128,width-left-right),w=Math.min(360,Math.max(180,width-176),span);
 let rect={x:Math.max(left,(width-w)/2),y:top,w,h:92};
 if(phoneOpen){const phoneWidth=Math.min(334,Math.max(208,height*.49));return {x:left,y:top,w:Math.max(128,Math.min(280,(width-phoneWidth)/2-left-12)),h:92};}
 if(dock&&intersects(rect,dock)){
  const gaps=[{x:left,w:dock.x-left-12},{x:dock.x+dock.w+12,w:width-right-dock.x-dock.w-12}].sort((a,b)=>b.w-a.w);
  if(gaps[0].w>=128)rect={...rect,...gaps[0],w:Math.min(360,gaps[0].w)};
  else rect.y=Math.max(top,dock.y+dock.h+8);
 }
 return rect;
}

export class HouseMessages{
 constructor(root){
  this.root=root;this.feed=root.querySelector('#house-messages');this.objective=root.querySelector('#lab-objective');this.toast=root.querySelector('#lab-toast');this.danger=root.querySelector('.house-danger');this.notice=root.querySelector('.phone-notice');this.layoutStamp='';this.reset();
 }
 reset(){this.pending=null;this.noticeRemaining=0;this.lastCount=0;this.feed.hidden=true;this.toast.textContent='';this.toast.hidden=true;this.notice.hidden=true;this.danger.hidden=true;}
 say(text,seconds=2.4){if(!text)return;if(this.pending?.text===text)return;this.pending={text,remaining:seconds,age:0};}
 layout(dock,phoneOpen=false){
  const width=this.root.clientWidth,height=this.root.clientHeight;
  if(!this.safe||this.width!==width||this.height!==height){const style=getComputedStyle(this.root);this.width=width;this.height=height;this.safe={left:Math.max(12,parseFloat(style.getPropertyValue('--house-safe-left'))+8||0),right:Math.max(60,parseFloat(style.getPropertyValue('--house-safe-right'))+52||0),top:Math.max(8,parseFloat(style.getPropertyValue('--house-safe-top'))||0)+4};}
  const safe=this.safe,stamp=[width,height,phoneOpen,dock?.x,dock?.y,dock?.w,dock?.h,...Object.values(safe)].join('|');
  if(stamp!==this.layoutStamp){
   this.layoutStamp=stamp;this.rect=messageLayout(width,height,dock,{phoneOpen,...safe});this.feed.style.left=this.rect.x+'px';this.feed.style.top=this.rect.y+'px';this.feed.style.width=this.rect.w+'px';
  }
 }
 update({dt=0,blocked=false,danger='',revelation='',unread=false,messageCount=0,phoneOpen=false,dock=null}={}){
  dt=Math.max(0,Math.min(.1,dt));
  if(messageCount<this.lastCount){this.noticeRemaining=0;this.lastCount=0;}
  if(messageCount>this.lastCount){this.noticeRemaining=unread?5:0;this.lastCount=messageCount;}
  if(!unread)this.noticeRemaining=0;
  if(this.pending&&!blocked){this.pending.age+=dt;if(this.pending.age>8)this.pending=null;}
  const channel=danger?'danger':phoneOpen?'none':revelation?'puzzle':unread&&this.noticeRemaining>0?'phone':this.pending?'toast':'none';
  if(!blocked){
   if(channel==='phone'&&document.activeElement!==this.notice)this.noticeRemaining=Math.max(0,this.noticeRemaining-dt);
   if(channel==='toast'){this.pending.remaining-=dt;if(this.pending.remaining<=0)this.pending=null;}
  }
  this.layout(dock,phoneOpen);
  this.feed.hidden=blocked;this.root.dataset.hudMessage=channel;
  this.objective.hidden=!!danger||!!revelation||phoneOpen||(channel!=='none'&&this.rect.w<220);
  this.danger.hidden=channel!=='danger';this.notice.hidden=channel!=='phone';this.toast.hidden=channel!=='puzzle'&&(channel!=='toast'||!this.pending);
  const text=channel==='puzzle'?revelation:this.pending?.text||'';if(this.toast.textContent!==text)this.toast.textContent=text;
 }
}
