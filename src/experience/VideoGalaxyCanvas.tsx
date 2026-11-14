import {useEffect,useRef} from 'react';
import {MEMORIES,PALETTES,type CosmosPalette,type GalaxyMemory,type Quality} from './cosmos-config';

const TAU=Math.PI*2;
type Star={x:number;y:number;z:number;px:number;py:number;pz:number;size:number;seed:number;color:number};
type HeartDot=Star&{pulse:number};
type Projected={x:number;y:number;scale:number;depth:number};
type Hotspot={id:string;x:number;y:number};
type Props={visible:boolean;interactive:boolean;palette:CosmosPalette;quality:Quality;onSelect?:(memory:GalaxyMemory)=>void};

function rand(seed=12052026){let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
const random=rand();
const spiral:Star[]=Array.from({length:11500},(_,i)=>{
 const arm=i%4,r=Math.sqrt(random())*2.75;
 const theta=arm*Math.PI/2+r*2.38+(random()-.5)*(.26+r*.29);
 const n=(random()-.5)*.19;
 return {x:Math.cos(theta)*r,y:n,z:Math.sin(theta)*r,
  px:(random()-.5)*12,py:(random()-.5)*8,pz:(random()-.5)*10,
  size:random()*.95+.35,seed:random(),color:random()};
});
function heartPoint(t:number){
 const s=Math.sin(t),c=Math.cos(t);
 return {x:16*s*s*s/15.8,y:(13*c-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17};
}
const heart:HeartDot[]=Array.from({length:3400},(_,i)=>{
 const u=random(),angle=random()*TAU;
 const h=heartPoint(angle);
 const thickness=(random()-.5)*(.055+(.24*u*u));
 const interior=random()<.17;
 const fill=interior?Math.sqrt(random()):1;
 return {x:(h.x+thickness)*fill*1.05,y:1.50+(h.y+thickness)*fill*1.16,
  z:(random()-.5)*.3,px:(random()-.5)*7,py:(random()-.5)*5,pz:(random()-.5)*5,
  size:.6+random()*.95,seed:random(),pulse:random()*TAU,color:random()};
});
const far=Array.from({length:300},()=>({x:random(),y:random(),size:random()*.9+.35,alpha:random()*.65+.13,phase:random()*TAU}));
const orbitPhrases=[
 'MI AMOR ETERNO ∞','TE ADORO','HAPPY BIRTHDAY','HOY CELEBRAMOS','ERES MAGIA','SIEMPRE JUNTOS','CUMPLE FELIZ','TÚ Y YO ♡'
];
const roseColors=['255,199,226','255,125,189','255,42,150','255,225,238','234,84,154'];
function clamp(v:number,min=0,max=1){return Math.max(min,Math.min(max,v));}
function ease(v:number){const x=clamp(v);return x*x*(3-2*x);}
function colorCss(hex:string,alpha:number){const h=hex.replace('#','');const x=parseInt(h,16);return 'rgba('+((x>>16)&255)+','+((x>>8)&255)+','+(x&255)+','+alpha+')';}

export function VideoGalaxyCanvas({visible,interactive,palette,quality,onSelect}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const whenStarted=useRef(0);
 const callback=useRef(onSelect);callback.current=onSelect;
 useEffect(()=>{
  if(!visible)return;
  const el=canvas.current,context=el?.getContext('2d',{alpha:false});
  if(!el||!context)return;
  const ctx=context;
  let w=0,h=0,dpr=1,raf=0,last=0,alive=true;
  let yaw=-.08,pitch=.53,zoom=1;
  let grab:{id:number;lastX:number;lastY:number;startX:number;startY:number}|null=null;
  let hot:Hotspot[]=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const low=quality==='suave'||(quality==='auto'&&(window.innerWidth<620||(navigator.hardwareConcurrency||6)<=4));
  const total=low?3500:quality==='alta'?11500:7700;
  const heartCount=low?1600:quality==='alta'?3400:2500;
  const paletteData=PALETTES[palette];
  const tinted=palette==='rosado'?roseColors:palette==='aurora'?['255,212,241','206,146,235','249,112,188','255,247,236','180,197,255']:['255,163,207','180,117,235','255,76,166','255,233,248','145,122,210'];

  const resize=()=>{
   w=Math.max(1,el.clientWidth);h=Math.max(1,el.clientHeight);
   dpr=Math.min(window.devicePixelRatio||1,low?1.15:1.6);
   el.width=Math.max(1,Math.round(w*dpr));el.height=Math.max(1,Math.round(h*dpr));
   ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  function project(x:number,y:number,z:number,camYaw:number,camPitch:number):Projected{
   const s=Math.sin(camYaw),c=Math.cos(camYaw);
   const x2=x*c-z*s,z2=x*s+z*c;
   const q=y-.58;
   const y2=q*Math.cos(camPitch)-z2*Math.sin(camPitch);
   const depth=6.3/zoom+z2*Math.cos(camPitch)+q*Math.sin(camPitch);
   const scale=Math.min(w*(h>w?1.95:.9),h*(h>w?1.1:1.1))/Math.max(1,depth);
   return {x:w*.5+x2*scale,y:h*(h>w?.55:.56)-y2*scale,scale,depth};
  }
  function circle(x:number,y:number,r:number,col:string,shadow=0){
   if(r<=0)return;
   ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=col;
   if(shadow){ctx.shadowBlur=shadow;ctx.shadowColor=col;}
   ctx.fill();
   if(shadow)ctx.shadowBlur=0;
  }
  function drawHeart(x:number,y:number,r:number,col:string){
   ctx.save();ctx.translate(x,y);ctx.scale(r/16,r/16);ctx.beginPath();
   for(let j=0;j<=56;j++){
    const a=j/56*TAU,b=heartPoint(a);
    if(j===0)ctx.moveTo(b.x*16,b.y*16);else ctx.lineTo(b.x*16,b.y*16);
   }
   ctx.closePath();ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.fill();ctx.restore();
  }
  function drawMiniCharacter(x:number,y:number,scale:number,index:number){
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
   ctx.shadowColor='#fe77ba';ctx.shadowBlur=6;
   circle(0,-9,10,'#f9f1ed');circle(-5,-18,4,index%2?'#fff7fa':'#fdc6dc');circle(6,-18,4,index%2?'#fff7fa':'#fdc6dc');
   ctx.fillStyle='#fff6f5';ctx.fillRect(-8,0,16,11);
   circle(-4,-11,1.6,'#2c1e29');circle(4,-11,1.6,'#2c1e29');circle(0,-6,1.5,'#ff98b9');
   ctx.shadowBlur=0;ctx.restore();
  }
  function ring(radius:number,camYaw:number,camPitch:number,t:number,alpha:number,linewidth=1){
   ctx.beginPath();
   for(let j=0;j<=160;j++){
    const a=j/160*TAU+t*.05;
    const p=project(Math.cos(a)*radius,0,Math.sin(a)*radius,camYaw,camPitch);
    if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.strokeStyle='rgba(255,57,151,'+alpha+')';
   ctx.lineWidth=linewidth;ctx.shadowColor='#ff2d91';ctx.shadowBlur=4;ctx.stroke();ctx.shadowBlur=0;
  }
  function draw(now:number){
   if(!alive)return;
   if(!whenStarted.current)whenStarted.current=now;
   const t=reduced?5:(now-whenStarted.current)/1000;
   const dt=Math.min(50,now-last||16);last=now;
   if(!grab&&!reduced)yaw+=dt*.000028;
   const camYaw=yaw+.07*Math.sin(t*.14);
   const camPitch=pitch+.018*Math.sin(t*.36);
   const progress=ease((t-.25)/2.3);
   const hProgress=ease((t-1.10)/2.15);
   const ringProgress=ease((t-1.6)/1.5);
   const labelProgress=ease((t-2.4)/1.05);
   const rose=paletteData.pink;
   // Almost black stage, just as in the video. No navy-purple nebula backdrop.
   ctx.fillStyle='#050104';ctx.fillRect(0,0,w,h);
   const soft=ctx.createRadialGradient(w*.5,h*.59,1,w*.5,h*.60,Math.min(w,h)*.71);
   soft.addColorStop(0,'rgba(114,3,55,.20)');soft.addColorStop(.37,'rgba(70,2,36,.10)');soft.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=soft;ctx.fillRect(0,0,w,h);
   for(let i=0;i<far.length;i++){
    const f=far[i];ctx.fillStyle='rgba(255,200,228,'+(f.alpha*(.7+.3*Math.sin(t*.7+f.phase)))+')';
    ctx.fillRect(f.x*w,f.y*h,f.size,f.size);
   }
   ctx.globalCompositeOperation='screen';
   if(ringProgress>0){
    const center=project(0,0,0,camYaw,camPitch);
    const neb=ctx.createRadialGradient(center.x,center.y,2,center.x,center.y,Math.min(w,h)*.32);
    neb.addColorStop(0,'rgba(255,49,157,'+(.26*ringProgress)+')');neb.addColorStop(.5,'rgba(255,22,118,'+(.1*ringProgress)+')');neb.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=neb;ctx.fillRect(0,0,w,h);
    for(const r of [.41,.67,1.15,1.8,2.56])ring(r,camYaw,camPitch,t,ringProgress*(r<.7?.34:.08),r<.7?3.3:.7);
   }
   // Pink particle vortex condenses from a starfield and reveals a spiral disc.
   const count=Math.floor(total*(.12+.88*ease(t/1.8)));
   for(let i=0;i<count;i++){
    const s=spiral[i],k=ease((t-s.seed*.78)/1.9);
    const x=s.px*(1-k)+s.x*k,z=s.pz*(1-k)+s.z*k,y=s.py*(1-k)+s.y*k;
    const p=project(x,y,z,camYaw,camPitch);
    if(p.depth<=.5||p.x<-5||p.y<-5||p.x>w+5||p.y>h+5)continue;
    const twinkle=reduced?1:.77+.23*Math.sin(t*2.6+s.seed*25);
    const alpha=(.21+.62*progress)*twinkle*(s.color>.94?1:.63);
    const radius=Math.max(.35,Math.min(2.3,s.size*p.scale/110));
    const col=tinted[Math.floor(s.color*tinted.length)];
    ctx.fillStyle='rgba('+col+','+alpha+')';
    if(s.color>.986){circle(p.x,p.y,radius*2.2,'rgba(255,174,220,'+alpha+')',4);}
    else ctx.fillRect(p.x,p.y,radius,radius);
   }
   // Central compact ring / black hole, bright fuchsia lens and white pink core.
   if(ringProgress>0){
    const core=project(0,.04,0,camYaw,camPitch);
    const x=core.x,y=core.y;
    const b=ctx.createRadialGradient(x,y,2,x,y,32);
    b.addColorStop(0,'rgba(255,245,249,'+(.8*ringProgress)+')');
    b.addColorStop(.14,'rgba(255,32,153,'+(.9*ringProgress)+')');
    b.addColorStop(.37,'rgba(255,4,132,'+(.5*ringProgress)+')');
    b.addColorStop(1,'rgba(255,4,132,0)');
    ctx.fillStyle=b;ctx.beginPath();ctx.arc(x,y,32,0,TAU);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(-.3);ctx.scale(1,.52);
    circle(0,0,14*ringProgress,'rgba(10,0,14,.95)');
    ctx.strokeStyle='rgba(255,71,174,'+(.95*ringProgress)+')';ctx.lineWidth=4;ctx.shadowBlur=18;ctx.shadowColor='#ff0088';
    ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.stroke();ctx.shadowBlur=0;
    ctx.restore();
    circle(x+5,y-4,3.5*ringProgress,'rgba(255,235,249,.98)',10);
   }
   // Tall heart made of thousands of pink, shining dots (not a flat SVG outline).
   if(hProgress>0){
    for(let i=0;i<heartCount;i++){
     const q=heart[i],k=ease((t-1.08-q.seed*.68)/1.6);
     const s=1+.018*Math.sin(t*2.2+q.pulse);
     const p=project(q.px*(1-k)+q.x*k*s,q.py*(1-k)+q.y*k*s,q.pz*(1-k)+q.z*k,camYaw,camPitch);
     if(p.depth<.4||p.x<-5||p.y<-5||p.x>w+5||p.y>h+5)continue;
     const alpha=hProgress*(.35+.58*(.5+.5*Math.sin(t*2.5+q.seed*15)));
     const radius=Math.max(.4,Math.min(2.7,q.size*p.scale/116));
     const co=q.color>.88?'255,244,252':q.color>.45?'255,156,211':'255,42,156';
     ctx.fillStyle='rgba('+co+','+alpha+')';
     if(q.color>.985)circle(p.x,p.y,radius*2.2,'rgba(255,231,247,'+alpha+')',5);
     else ctx.fillRect(p.x,p.y,radius,radius);
    }
    const tip=project(0,.37,0,camYaw,camPitch);
    circle(tip.x,tip.y,2.3*hProgress,'rgba(255,237,250,.8)',9);
   }
   hot=[];
   if(labelProgress>0){
    // Circular orbit of luminous phrases from the video. They move with perspective.
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<orbitPhrases.length;i++){
     const a=i/orbitPhrases.length*TAU-.75+t*.024;
     const radius=2.40+(i%3)*.21;
     const p=project(Math.cos(a)*radius,.06+Math.sin(t*.6+i)*.025,Math.sin(a)*radius,camYaw,camPitch);
     if(p.depth<.5||p.x<-100||p.x>w+100||p.y<-20||p.y>h+40)continue;
     const fontsize=Math.max(9,Math.min(17,p.scale*.116));
     ctx.font='700 '+fontsize+'px ui-monospace,Consolas,monospace';
     ctx.fillStyle='rgba(255,153,198,'+(.9*labelProgress)+')';
     ctx.shadowBlur=7;ctx.shadowColor='#ff2e9a';
     ctx.fillText(orbitPhrases[i],p.x,p.y);
     ctx.shadowBlur=0;
     const hp=project(Math.cos(a+.14)*(radius+.22),.16,Math.sin(a+.14)*(radius+.22),camYaw,camPitch);
     if(i%2===0)drawHeart(hp.x,hp.y,Math.min(14,p.scale*.12),'rgba(255,73,143,'+(.72*labelProgress)+')');
    }
    ctx.restore();
    for(let i=0;i<MEMORIES.length;i++){
     const m=MEMORIES[i];
     const a=i/MEMORIES.length*TAU+t*.035+.8;
     const rad=1.94+(i%2)*.46;
     const p=project(Math.cos(a)*rad,.12+Math.sin(t*.5+i)*.04,Math.sin(a)*rad,camYaw,camPitch);
     if(p.depth<=.6)continue;
     const b=10+Math.sin(t*2+i)*1.4;
     const alpha=.78*labelProgress;
     const glow=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,b*3);
     glow.addColorStop(0,'rgba(255,233,251,'+alpha+')');
     glow.addColorStop(.15,'rgba(255,56,149,'+alpha+')');
     glow.addColorStop(1,'rgba(255,18,120,0)');
     ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,b*3,0,TAU);ctx.fill();
     drawHeart(p.x,p.y,b,'rgba(255,105,177,'+alpha+')');
     if(i%2===0)drawMiniCharacter(p.x+14,p.y-12,.65,i);
     ctx.textAlign='center';ctx.font='600 10px system-ui';ctx.fillStyle='rgba(255,235,246,'+alpha+')';
     ctx.shadowColor='#ee4393';ctx.shadowBlur=5;ctx.fillText(m.title,p.x,p.y+29);
     ctx.shadowBlur=0;
     hot.push({id:m.id,x:p.x,y:p.y});
    }
   }
   ctx.globalCompositeOperation='source-over';
   raf=requestAnimationFrame(draw);
  }
  const pointerDown=(e:PointerEvent)=>{
   if(!interactive)return;
   grab={id:e.pointerId,lastX:e.clientX,lastY:e.clientY,startX:e.clientX,startY:e.clientY};
   el.setPointerCapture(e.pointerId);
  };
  const pointerMove=(e:PointerEvent)=>{
   if(!interactive||!grab||grab.id!==e.pointerId)return;
   yaw-=(e.clientX-grab.lastX)*.005;
   pitch=clamp(pitch+(e.clientY-grab.lastY)*.003,.2,1.12);
   grab.lastX=e.clientX;grab.lastY=e.clientY;
  };
  const pointerUp=(e:PointerEvent)=>{
   if(!interactive||!grab||grab.id!==e.pointerId)return;
   const movement=Math.hypot(e.clientX-grab.startX,e.clientY-grab.startY);
   grab=null;
   if(movement>12)return;
   const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
   const closest=hot.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];
   if(closest&&closest.d<48){
    const selected=MEMORIES.find(m=>m.id===closest.id);
    if(selected)callback.current?.(selected);
   }
  };
  const wheel=(e:WheelEvent)=>{if(!interactive)return;e.preventDefault();zoom=clamp(zoom-e.deltaY*.0005,.71,1.48);};
  const onVisibility=()=>{if(!document.hidden){last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}else cancelAnimationFrame(raf);};
  const resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(el);resize();
  el.addEventListener('pointerdown',pointerDown);
  el.addEventListener('pointermove',pointerMove);
  el.addEventListener('pointerup',pointerUp);
  el.addEventListener('pointercancel',pointerUp);
  el.addEventListener('wheel',wheel,{passive:false});
  document.addEventListener('visibilitychange',onVisibility);
  raf=requestAnimationFrame(draw);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);resizeObserver.disconnect();
   el.removeEventListener('pointerdown',pointerDown);
   el.removeEventListener('pointermove',pointerMove);
   el.removeEventListener('pointerup',pointerUp);
   el.removeEventListener('pointercancel',pointerUp);
   el.removeEventListener('wheel',wheel);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[visible,interactive,quality,palette]);
 return <canvas ref={canvas} className={'cosmos-video-canvas'+(interactive?' interactive':'')} aria-label="Galaxia espiral rosa con un corazón de partículas y constelaciones interactivas" role="img" style={{display:visible?'block':'none'}}/>;
}
