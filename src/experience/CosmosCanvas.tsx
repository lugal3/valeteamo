import {useEffect,useRef} from 'react';
import {MEMORIES,type GalaxyMemory,type Quality} from './cosmos-config';

type Star={x:number;y:number;z:number;size:number;twinkle:number;color:number};
type Projected={x:number;y:number;scale:number;visible:boolean};
type Hotspot={id:string;x:number;y:number};
const TAU=Math.PI*2;
function seeded(seed:number){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
const rand=seeded(20261205);
const stars:Star[]=Array.from({length:1450},(_,i)=>{
 const r=Math.sqrt(rand())*2.12+.12;
 const angle=(i%4)*Math.PI/2+r*2.6+(rand()-.5)*1.35;
 return {x:Math.cos(angle)*r,y:(rand()-.5)*.85,z:Math.sin(angle)*r,size:.35+rand()*1.45,twinkle:rand()*TAU,color:rand()};
});
const flecks=Array.from({length:150},()=>({x:rand(),y:rand(),a:.14+rand()*.55,r:.2+rand()*1.5}));
export function CosmosCanvas({onSelect,interactive=false,quality='auto'}:{
 onSelect?:(memory:GalaxyMemory)=>void;interactive?:boolean;quality?:Quality
}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const clickRef=useRef(onSelect);clickRef.current=onSelect;
 useEffect(()=>{
  const canvas=canvasRef.current;
  const ctx=canvas?.getContext('2d',{alpha:false});
  if(!canvas||!ctx)return;
  let width=0,height=0,dpr=1,frame=0,id=0,last=0,visible=!document.hidden;
  let yaw=-.26,pitch=-.56,zoom=1,velocity=.00038;
  let drag:{id:number;x:number;y:number;startX:number;startY:number}|null=null;
  let hotspots:Hotspot[]=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const low=quality==='suave'||(quality==='auto'&&(window.innerWidth<540||navigator.hardwareConcurrency<=4));
  const count=low?620:1450;
  const resize=()=>{
   width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);
   dpr=Math.min(window.devicePixelRatio||1,low?1.25:1.75);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  const project=(x:number,y:number,z:number):Projected=>{
   const co=Math.cos(yaw),si=Math.sin(yaw);
   const rx=x*co-z*si,rz=x*si+z*co;
   const cp=Math.cos(pitch),sp=Math.sin(pitch);
   const ry=y*cp-rz*sp,depth=y*sp+rz*cp+4.5/zoom;
   const scale=Math.min(width*.76,height*1.05)/Math.max(.5,depth);
   return {x:width*.5+rx*scale,y:height*.51+ry*scale,scale,visible:depth>.3};
  };
  const nebula=(x:number,y:number,rx:number,ry:number,color:string,angle:number)=>{
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(rx,ry);
   const g=ctx.createRadialGradient(0,0,0,0,0,1);
   g.addColorStop(0,color);g.addColorStop(.35,color.replace(/,\s*[\d.]+\)$/,' , 0.07)'));
   g.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();ctx.restore();
  };
  const paint=(t:number)=>{
   if(!visible)return;
   if(width===0||height===0)resize();
   const dt=Math.min(60,t-last||16);last=t;
   if(!reduced&&!drag)yaw+=velocity*dt;
   frame++;
   const bg=ctx.createRadialGradient(width*.52,height*.46,4,width*.5,height*.52,Math.max(width,height)*.9);
   bg.addColorStop(0,'#201038');bg.addColorStop(.37,'#100b29');bg.addColorStop(.75,'#08091e');bg.addColorStop(1,'#050612');
   ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
   nebula(width*.46,height*.46,width*.64,height*.38,'rgba(255,100,182,0.19)',-.48);
   nebula(width*.65,height*.52,width*.38,height*.52,'rgba(120,101,244,0.20)',.55);
   nebula(width*.34,height*.67,width*.5,height*.3,'rgba(91,150,245,0.14)',.3);
   for(const f of flecks){ctx.fillStyle='rgba(230,220,255,'+f.a+')';ctx.fillRect(f.x*width,f.y*height,f.r,f.r);}
   ctx.globalCompositeOperation='screen';
   if(interactive){
    // Núcleo galáctico y cuatro brazos espirales, sin texturas externas.
    ctx.save();ctx.translate(width*.5,height*.51);
    const discScale=Math.min(width,height)*.32;
    const glow=ctx.createRadialGradient(0,0,1,0,0,discScale*1.3);
    glow.addColorStop(0,'rgba(255,220,242,.23)');
    glow.addColorStop(.22,'rgba(255,116,205,.16)');
    glow.addColorStop(.58,'rgba(145,91,233,.08)');
    glow.addColorStop(1,'rgba(100,60,185,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,discScale*1.3,0,TAU);ctx.fill();
    ctx.rotate(-.42);ctx.scale(1,.68);
    for(let arm=0;arm<4;arm++){
     ctx.beginPath();
     for(let j=0;j<=155;j++){
      const a=arm*Math.PI/2+j*.041+(reduced?0:t*.000025);
      const r=j/155*discScale*1.23;
      const x=Math.cos(a)*r,y=Math.sin(a)*r;
      if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
     }
     ctx.strokeStyle=arm%2===0?'rgba(253,126,210,.13)':'rgba(138,149,255,.12)';
     ctx.lineWidth=low?8:12;ctx.shadowColor=arm%2===0?'#ff86d0':'#a791ff';
     ctx.shadowBlur=low?8:22;ctx.stroke();
    }
    ctx.restore();
    // Anillos orbitales tridimensionales alrededor del centro.
    for(const [radius,speed,alpha] of [[1.65,.00011,.18],[2.2,-.00007,.12]]){
     ctx.beginPath();
     for(let j=0;j<=128;j++){
      const a=j/128*TAU+t*speed;
      const p=project(Math.cos(a)*radius,Math.sin(a)*radius*.42,Math.sin(a)*radius);
      if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
     }
     ctx.lineWidth=1.1;ctx.strokeStyle='rgba(255,183,230,'+alpha+')';ctx.shadowColor='#ffa4da';ctx.shadowBlur=6;ctx.stroke();
    }
    // Corazón estelar pequeño en el centro: un guiño a la referencia rosa.
    ctx.save();ctx.translate(width*.5,height*.505);ctx.scale(.99,.99);
    ctx.beginPath();
    for(let j=0;j<=100;j++){
     const a=j/100*TAU;
     const hx=16*Math.pow(Math.sin(a),3)*2.3;
     const hy=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*-2.1;
     if(j===0)ctx.moveTo(hx,hy);else ctx.lineTo(hx,hy);
    }
    ctx.closePath();ctx.lineWidth=1;ctx.strokeStyle='rgba(255,185,224,.22)';
    ctx.shadowBlur=14;ctx.shadowColor='#ffa2db';ctx.stroke();ctx.restore();
    ctx.shadowBlur=0;
   }
   for(let i=0;i<count;i++){
    const s=stars[i],p=project(s.x,s.y,s.z);
    if(!p.visible||p.x<-20||p.x>width+20||p.y<-20||p.y>height+20)continue;
    const pulse=reduced?1:(.76+.24*Math.sin(t*.0009+s.twinkle));
    const radius=Math.min(2.7,Math.max(.35,s.size*p.scale/120))*pulse;
    const alpha=Math.min(.95,.27+p.scale/240);
    ctx.fillStyle=s.color>.82?'rgba(255,183,223,'+alpha+')':s.color>.55?'rgba(173,195,255,'+alpha+')':'rgba(255,244,243,'+alpha+')';
    ctx.beginPath();ctx.arc(p.x,p.y,radius,0,TAU);ctx.fill();
   }
   hotspots=[];
   for(let i=0;i<MEMORIES.length;i++){
    const m=MEMORIES[i],p=project(m.x,m.y,m.z);
    if(!p.visible)continue;
    const ring=14+2*Math.sin(t*.0016+i);
    const companion=[[.15,.12],[-.2,.17],[.21,-.2],[-.14,-.16]];
    ctx.lineWidth=1;ctx.strokeStyle='rgba(245,183,243,.35)';
    ctx.beginPath();
    companion.forEach(([xx,yy],j)=>{
     const q=project(m.x+xx,m.y+yy,m.z+j*.05);
     if(j===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
    });
    ctx.closePath();ctx.stroke();
    const halo=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,ring*2.7);
    halo.addColorStop(0,'rgba(255,242,250,.95)');
    halo.addColorStop(.13,m.tint+'d9');
    halo.addColorStop(.32,m.tint+'45');
    halo.addColorStop(1,'rgba(255,100,190,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(p.x,p.y,ring*2.7,0,TAU);ctx.fill();
    ctx.lineWidth=1;ctx.strokeStyle='rgba(255,217,240,.64)';
    ctx.beginPath();ctx.arc(p.x,p.y,ring+(reduced?0:Math.sin(t*.0016+i)*1.3),0,TAU);ctx.stroke();
    ctx.fillStyle='#fff8fc';ctx.beginPath();ctx.arc(p.x,p.y,3.1,0,TAU);ctx.fill();
    if(width>620){ctx.font='500 11px system-ui';ctx.textAlign='center';ctx.fillStyle='rgba(255,231,249,.89)';ctx.fillText(m.title,p.x,p.y+ring+19);}
    hotspots.push({id:m.id,x:p.x,y:p.y});
   }
   ctx.globalCompositeOperation='source-over';
   id=requestAnimationFrame(paint);
  };
  const pointerDown=(e:PointerEvent)=>{
   if(!interactive)return;
   drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};
   canvas.setPointerCapture(e.pointerId);
  };
  const pointerMove=(e:PointerEvent)=>{
   if(!interactive||!drag||drag.id!==e.pointerId)return;
   const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   yaw-=dx*.004;pitch=Math.max(-.62,Math.min(.62,pitch+dy*.0026));
   drag.x=e.clientX;drag.y=e.clientY;
  };
  const pointerUp=(e:PointerEvent)=>{
   if(!interactive||!drag||drag.id!==e.pointerId)return;
   const delta=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
   drag=null;
   if(delta>12)return;
   const rect=canvas.getBoundingClientRect();
   const x=e.clientX-rect.left,y=e.clientY-rect.top;
   const nearest=hotspots.map(h=>({...h,d:Math.hypot(x-h.x,y-h.y)})).sort((a,b)=>a.d-b.d)[0];
   if(nearest&&nearest.d<Math.max(32,Math.min(55,width*.1))){
    const memory=MEMORIES.find(m=>m.id===nearest.id);
    if(memory)clickRef.current?.(memory);
   }
  };
  const wheel=(e:WheelEvent)=>{
   if(!interactive)return;
   e.preventDefault();zoom=Math.max(.72,Math.min(1.65,zoom-e.deltaY*.0005));
  };
  const visibility=()=>{visible=!document.hidden;if(visible){last=performance.now();cancelAnimationFrame(id);id=requestAnimationFrame(paint);}};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('wheel',wheel,{passive:false});
  document.addEventListener('visibilitychange',visibility);
  id=requestAnimationFrame(paint);
  return ()=>{
   cancelAnimationFrame(id);observer.disconnect();
   canvas.removeEventListener('pointerdown',pointerDown);
   canvas.removeEventListener('pointermove',pointerMove);
   canvas.removeEventListener('pointerup',pointerUp);
   canvas.removeEventListener('pointercancel',pointerUp);
   canvas.removeEventListener('wheel',wheel);
   document.removeEventListener('visibilitychange',visibility);
  };
 },[interactive,quality]);
 return <canvas ref={canvasRef} className={'cosmos-canvas'+(interactive?' interactive':'')} aria-hidden="true"/>;
}
