import {useEffect,useRef} from 'react';
import {MEMORIES,type CosmosPalette,type GalaxyMemory,type Quality} from './cosmos-config';
import {galaxyArrivalAt,galaxyPinchZoom,GALAXY_ARRIVAL_SECONDS} from './galaxy-arrival';
import {TUNNEL_STREAMS,tunnelStreamPoint} from './tunnel-perspective';

const TAU=Math.PI*2;
type Star={x:number;y:number;z:number;px:number;py:number;pz:number;size:number;seed:number;color:number};
type HeartDot=Star&{pulse:number};
type Projected={x:number;y:number;scale:number;depth:number};
type Hotspot={id:string;x:number;y:number};
type Props={visible:boolean;interactive:boolean;palette:CosmosPalette;quality:Quality;onSelect?:(memory:GalaxyMemory)=>void;onHeartSelect?:()=>void;onArrivalComplete?:()=>void;replaySignal?:number;skipSignal?:number;startCompleted?:boolean};

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

export function VideoGalaxyCanvas({visible,interactive,palette,quality,onSelect,onHeartSelect,onArrivalComplete,replaySignal=0,skipSignal=0,startCompleted=false}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const callback=useRef(onSelect);callback.current=onSelect;
 const heartCallback=useRef(onHeartSelect);heartCallback.current=onHeartSelect;
 // These refs deliberately DO NOT restart WebGL/Canvas when loading -> galaxy
 // changes interactive from false to true.
 const interaction=useRef(interactive);interaction.current=interactive;
 const onComplete=useRef(onArrivalComplete);onComplete.current=onArrivalComplete;
 const replay=useRef(replaySignal);replay.current=replaySignal;
 const skip=useRef(skipSignal);skip.current=skipSignal;
 const completedOnMount=useRef(startCompleted);completedOnMount.current=startCompleted;
 useEffect(()=>{
  if(!visible)return;
  const el=canvas.current,context=el?.getContext('2d',{alpha:false});
  if(!el||!context)return;
  const ctx=context;
  const element:HTMLCanvasElement=el;
  let w=0,h=0,dpr=1,raf=0,last=0,alive=true;
  let seconds=completedOnMount.current?GALAXY_ARRIVAL_SECONDS:0;
  let completed=completedOnMount.current;
  let previousStage='';
  let seenReplay=replay.current,seenSkip=skip.current;
  let userYaw=0,userPitch=0,userZoom=1,targetZoom=1;
  let camZoom=1,camFocusY=.55;
  let grab:{id:number;lastX:number;lastY:number;startX:number;startY:number}|null=null;
  const pointers=new Map<number,{x:number;y:number}>();
  let pinch:{startDistance:number;startZoom:number}|null=null;
  let hot:Hotspot[]=[];
  let heartBoundary:{x:number;y:number}[]=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)seconds=GALAXY_ARRIVAL_SECONDS;
  const low=quality==='suave'||(quality==='auto'&&(window.innerWidth<620||(navigator.hardwareConcurrency||6)<=4));
  const total=low?3500:quality==='alta'?11500:7700;
  const heartCount=low?1600:quality==='alta'?3400:2500;
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
   const depth=6.3/camZoom+z2*Math.cos(camPitch)+q*Math.sin(camPitch);
   const scale=Math.min(w*(h>w?1.95:.9),h*(h>w?1.1:1.1))/Math.max(1,depth);
   return {x:w*.5+x2*scale,y:h*camFocusY-y2*scale,scale,depth};
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
   const dt=last===0?0:Math.min(65,Math.max(0,now-last));
   last=now;
   if(replay.current!==seenReplay){
    seenReplay=replay.current;
    seconds=0;completed=false;userYaw=0;userPitch=0;userZoom=1;targetZoom=1;
    pointers.clear();pinch=null;grab=null;
   }
   if(skip.current!==seenSkip){
    seenSkip=skip.current;seconds=GALAXY_ARRIVAL_SECONDS;
   }
   seconds+=dt/1000;
   const arrival=galaxyArrivalAt(seconds,reduced);
   const t=seconds;
   if(previousStage!==arrival.stage){
    previousStage=arrival.stage;
    element.dataset.arrivalStage=arrival.stage;
   }
   if(arrival.completed&&!completed){
    completed=true;
    onComplete.current?.();
   }
   const camYaw=arrival.yaw+userYaw+(arrival.completed&&!reduced?.025*Math.sin(t*.17):0);
   const camPitch=clamp(arrival.pitch+userPitch,.16,1.24);
   userZoom+=(targetZoom-userZoom)*Math.min(1,dt/100);
   camZoom=clamp(arrival.zoom*userZoom,.35,3.3);
   camFocusY=arrival.focusY;
   element.dataset.zoom=camZoom.toFixed(3);
   element.dataset.zoomTarget=targetZoom.toFixed(3);
   const progress=arrival.tunnel;
   const hProgress=arrival.heart;
   const ringProgress=arrival.unfold;
   const labelProgress=arrival.phrases;
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
    for(const r of [.41,.67,1.15,1.8,2.56])ring(r*(.10+.90*arrival.unfold),camYaw,camPitch,t,ringProgress*(r<.7?.34:.08),r<.7?3.3:.7);
   }
   // Video-matched fly-through: stars travel in concentrated, directional
   // streams converging on a vanishing point, NOT random independent angles.
   // During the approach the stream aperture contracts; only then do these
   // exact same particles unfold into their already-assigned galaxy positions.
   const count=Math.floor(total*(.17+.83*ease(t/2.2)));
   const discScale=.028+.972*arrival.unfold;
   const blend=arrival.worldBlend;
   const streamPresence=arrival.tunnel*(1-blend);
   const centerX=w*.5,centerY=h*.505;
   if(streamPresence>.02){
    // Extremely soft guide ribbons: their tightly clustered stars form the
    // main lines. The lines themselves must not look like stiff spokes.
    ctx.save();ctx.lineWidth=.75;
    for(let lane=0;lane<TUNNEL_STREAMS;lane++){
     ctx.beginPath();
     for(let j=0;j<=23;j++){
      const d=.025+j/23*.92;
      const p=tunnelStreamPoint(lane,.5,d,arrival.spin,arrival.approach,w,h);
      if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
     }
     const laneGlow=lane%4===0?1:.6;
     ctx.strokeStyle='rgba(255,65,162,'+(streamPresence*.09*laneGlow)+')';
     ctx.stroke();
    }
    ctx.restore();
    // A dim center strengthens the depth illusion without a flat UI spinner.
    const haze=ctx.createRadialGradient(centerX,centerY,1,centerX,centerY,Math.min(w,h)*.27);
    haze.addColorStop(0,'rgba(7,0,10,'+(.35*streamPresence)+')');
    haze.addColorStop(.4,'rgba(226,21,111,'+(.05*streamPresence)+')');
    haze.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
   }
   for(let i=0;i<count;i++){
    const star=spiral[i],lane=i%TUNNEL_STREAMS;
    const projected=project(star.x*discScale,star.y*discScale,star.z*discScale,camYaw,camPitch);
    const flyDepth=(star.seed+t*(.34+.075*arrival.approach))%1;
    const stream=tunnelStreamPoint(lane,star.color,flyDepth,arrival.spin,arrival.approach,w,h);
    const x=stream.x*(1-blend)+projected.x*blend;
    const y=stream.y*(1-blend)+projected.y*blend;
    if(projected.depth<=.5||x<-23||y<-23||x>w+23||y>h+23)continue;
    const twinkle=reduced?1:.82+.18*Math.sin(t*3.1+star.seed*26);
    const laneBoost=lane%4===0?1.06:.87;
    const alpha=Math.min(.99,(.39+.6*arrival.tunnel)*twinkle*laneBoost);
    const rDisc=Math.max(.65,Math.min(2.6,star.size*projected.scale/82));
    const near=Math.pow(flyDepth,2.2);
    const rTunnel=.55+3.6*near*near;
    const radius=rTunnel*(1-blend)+rDisc*blend;
    const col=tinted[Math.floor(star.color*tinted.length)];
    // Forward motion produces aligned streaks following each lane's heading.
    // Their lengths scale with depth, preserving a clear perspective.
    if(blend<.94&&flyDepth>.23&&star.color>.39){
     const trail=(1-blend)*(1.6+24*near)*(.38+.62*arrival.tunnel);
     const dx=Math.cos(stream.angle)*trail,dy=Math.sin(stream.angle)*trail*.9;
     ctx.lineWidth=Math.max(.65,radius*.53);
     ctx.strokeStyle='rgba('+col+','+(alpha*.38)+')';
     ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x,y);ctx.stroke();
    }
    ctx.fillStyle='rgba('+col+','+alpha+')';
    if(star.color>.987)circle(x,y,radius*1.45,'rgba(255,210,240,'+alpha+')',4);
    else ctx.fillRect(x,y,radius,radius);
   }
   // The dark central vanishing point becomes the spiral nucleus. Its
   // rotating halo shrinks away exactly as the galaxy disk unfolds.
   if(blend<.94){
    const k=1-blend;
    const vanishing=ctx.createRadialGradient(centerX,centerY,1,centerX,centerY,Math.min(w,h)*.26);
    vanishing.addColorStop(0,'rgba(0,0,0,'+(.94*k)+')');
    vanishing.addColorStop(.24,'rgba(28,0,18,'+(.48*k)+')');
    vanishing.addColorStop(.6,'rgba(255,22,126,'+(.06*k)+')');
    vanishing.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=vanishing;
    ctx.beginPath();ctx.arc(centerX,centerY,Math.min(w,h)*.26,0,TAU);ctx.fill();
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
     const q=heart[i],k=ease((t-3.02-q.seed*.60)/1.26);
     const s=1+.018*Math.sin(t*2.2+q.pulse);
     // Dots rise from the galactic nucleus, instead of materializing in place.
     const p=project(q.px*.035*(1-k)+q.x*k*s,
      (.12+q.py*.024)*(1-k)+q.y*k*s,
      q.pz*.038*(1-k)+q.z*k,camYaw,camPitch);
     if(p.depth<.4||p.x<-5||p.y<-5||p.x>w+5||p.y>h+5)continue;
     const alpha=hProgress*(.69+.28*(.5+.5*Math.sin(t*2.5+q.seed*15)));
     const radius=Math.max(.9,Math.min(3.0,q.size*p.scale/80));
     const co=q.color>.88?'255,244,252':q.color>.45?'255,156,211':'255,42,156';
     ctx.fillStyle='rgba('+co+','+alpha+')';
     if(q.color>.985)circle(p.x,p.y,radius*2.2,'rgba(255,231,247,'+alpha+')',5);
     else ctx.fillRect(p.x,p.y,radius,radius);
    }
    // A dotted glow contour makes the shape legible on small iPhone screens.
    ctx.save();
    ctx.beginPath();
    for(let j=0;j<=192;j++){
     const pt=heartPoint(j/192*TAU);
     const pp=project(pt.x*1.05,1.50+pt.y*1.16,0,camYaw,camPitch);
     if(j===0)ctx.moveTo(pp.x,pp.y);else ctx.lineTo(pp.x,pp.y);
    }
    ctx.closePath();ctx.lineWidth=1.3;ctx.setLineDash([1.5,3.1]);
    ctx.strokeStyle='rgba(255,139,207,'+(.67*hProgress)+')';
    ctx.shadowColor='#ff48a6';ctx.shadowBlur=12;ctx.stroke();
    ctx.shadowBlur=0;ctx.setLineDash([]);ctx.restore();
    const tip=project(0,.37,0,camYaw,camPitch);
    circle(tip.x,tip.y,2.3*hProgress,'rgba(255,237,250,.8)',9);
   }
   hot=[];
   heartBoundary=[];
   if(hProgress>.9){
    // The tall luminous heart is selectable without adding any visible UI.
    // This polygon follows the rendered heart under drag, pinch and zoom.
    for(let j=0;j<=120;j++){
     const hp=heartPoint(j/120*TAU);
     const p=project(hp.x*1.05,1.50+hp.y*1.16,0,camYaw,camPitch);
     heartBoundary.push({x:p.x,y:p.y});
    }
    const center=project(0,1.48,0,camYaw,camPitch);
    element.dataset.heartX=center.x.toFixed(1);
    element.dataset.heartY=center.y.toFixed(1);
    element.dataset.heartSelectable='true';
   }else{
    element.dataset.heartSelectable='false';
   }
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
  const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  const pointerDown=(e:PointerEvent)=>{
   if(!interaction.current||seconds<GALAXY_ARRIVAL_SECONDS)return;
   if(e.pointerType==='mouse'&&e.button!==0)return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   try{el.setPointerCapture(e.pointerId);}catch{/* synthetic tests need not capture */}
   if(pointers.size>=2){
    const [a,b]=[...pointers.values()];
    pinch={startDistance:Math.max(1,distance(a,b)),startZoom:targetZoom};
    grab=null;return;
   }
   pinch=null;
   grab={id:e.pointerId,lastX:e.clientX,lastY:e.clientY,startX:e.clientX,startY:e.clientY};
  };
  const pointerMove=(e:PointerEvent)=>{
   if(!interaction.current||!pointers.has(e.pointerId))return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size>=2){
    if(!pinch){
     const [a,b]=[...pointers.values()];
     pinch={startDistance:Math.max(1,distance(a,b)),startZoom:targetZoom};
    }
    const [a,b]=[...pointers.values()];
    targetZoom=galaxyPinchZoom(pinch.startZoom,pinch.startDistance,distance(a,b));
    grab=null;return;
   }
   if(!grab||grab.id!==e.pointerId)return;
   userYaw-=(e.clientX-grab.lastX)*.005;
   userPitch=clamp(userPitch+(e.clientY-grab.lastY)*.003,-.40,.54);
   grab.lastX=e.clientX;grab.lastY=e.clientY;
  };
  const pointerUp=(e:PointerEvent)=>{
   if(!interaction.current||!pointers.has(e.pointerId))return;
   const wasPinching=pinch!==null||pointers.size>1;
   pointers.delete(e.pointerId);
   if(wasPinching){
    pinch=null;grab=null;return; // suppress accidental memory taps
   }
   if(!grab||grab.id!==e.pointerId)return;
   const movement=Math.hypot(e.clientX-grab.startX,e.clientY-grab.startY);
   grab=null;
   if(movement>12)return;
   const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
   // Ray-casting inside the actual rendered heart outline, not a fixed
   // invisible rectangular button that would block gestures or memories.
   let inside=false;
   for(let i=0,j=heartBoundary.length-1;i<heartBoundary.length;j=i++){
    const a=heartBoundary[i],b=heartBoundary[j];
    if((a.y>y)!==(b.y>y) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
   }
   if(inside){heartCallback.current?.();return;}
   const closest=hot.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];
   if(closest&&closest.d<48){
    const selected=MEMORIES.find(m=>m.id===closest.id);
    if(selected)callback.current?.(selected);
   }
  };
  const pointerCancel=(e:PointerEvent)=>{
   pointers.delete(e.pointerId);pinch=null;grab=null;
  };
  const wheel=(e:WheelEvent)=>{
   if(!interaction.current||seconds<GALAXY_ARRIVAL_SECONDS)return;
   e.preventDefault();
   const normalized=e.deltaY*(e.deltaMode===1?18:e.deltaMode===2?220:1);
   targetZoom=clamp(targetZoom*Math.exp(-normalized*.00115),.50,2.65);
  };
  const onVisibility=()=>{if(!document.hidden){last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}else cancelAnimationFrame(raf);};
  const resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(el);resize();
  el.addEventListener('pointerdown',pointerDown);
  el.addEventListener('pointermove',pointerMove);
  el.addEventListener('pointerup',pointerUp);
  el.addEventListener('pointercancel',pointerCancel);
  el.addEventListener('wheel',wheel,{passive:false});
  document.addEventListener('visibilitychange',onVisibility);
  raf=requestAnimationFrame(draw);
  return ()=>{
   alive=false;cancelAnimationFrame(raf);resizeObserver.disconnect();
   el.removeEventListener('pointerdown',pointerDown);
   el.removeEventListener('pointermove',pointerMove);
   el.removeEventListener('pointerup',pointerUp);
   el.removeEventListener('pointercancel',pointerCancel);
   el.removeEventListener('wheel',wheel);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[visible,quality,palette]);
 return <canvas ref={canvas} className={'cosmos-video-canvas'+(interactive?' interactive':'')} aria-label="Galaxia espiral rosa con un corazón de partículas y constelaciones interactivas" role="img" style={{display:visible?'block':'none'}}/>;
}
