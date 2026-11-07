import {useEffect,useRef,useState} from 'react';
import type Phaser from 'phaser';
import {installReferenceCharacter} from '../reference-characters';
import {START,advanceRescue,loadRescue,saveRescue,resetRescue,type RescueState} from './progression.js';
import '../lab/lab.css';
import './rescue.css';

type Entry='garden'|'abduction'|'trail'|'house'|'drawer'|'lock'|'rescue';
const initial=(entry:Entry,test:boolean):RescueState=>{
 if(!test)return loadRescue();
 let s={...START};
 if(entry!=='garden')s=advanceRescue(s,'heart');
 if(entry!=='garden'&&entry!=='abduction')s=advanceRescue(s,'abduction');
 if(entry==='trail'||['house','drawer','lock','rescue'].includes(entry))s=advanceRescue(s,'trail');
 if(['house','drawer','lock','rescue'].includes(entry))s=advanceRescue(s,'house');
 return s;
};
const descriptions:Record<string,string>={
 garden:'Usa WASD o el joystick para acercarte al corazón brillante.',
 heart:'¡Algo se mueve entre los árboles…!',
 abduction:'¡Louis ha desaparecido! Sigue las flores luminosas.',
 trail:'La última pista apunta a la casa. Entra para buscar a Louis.',
 house:'Lee la nota del pasillo, abre el cajón del estudio y descubre la pista del cuadro.',
 end:'¡Has encontrado a Louis! Los dos vuelven juntos al jardín.'
};
export function RescueDemo({onExit,entry='garden',test=false}:{onExit:()=>void,entry?:Entry,test?:boolean}){
 const [state,setState]=useState<RescueState>(()=>initial(entry,test));
 const [mode,setMode]=useState<'garden'|'threshold'|'house'|'end'>(()=>{
  const v=initial(entry,test);return v.rescued?'end':v.house?'house':'garden';
 });
 const [near,setNear]=useState('');const [error,setError]=useState('');
 const stage=useRef<HTMLDivElement>(null),phaseRef=useRef(state),actionRef=useRef<()=>void>(()=>{}),stick=useRef({x:0,y:0}),stickId=useRef<number|null>(null);
 const emit=(event:'heart'|'abduction'|'trail'|'house'|'rescue')=>{
  const next=advanceRescue(phaseRef.current,event);phaseRef.current=next;setState(next);if(!test)saveRescue(next);
 };
 const openHouse=()=>{emit('house');setMode('house');};
 useEffect(()=>{
  if(mode!=='garden'||!stage.current)return;
  let disposed=false;let game:Phaser.Game|undefined;
  const boot=async()=>{
   try{
    const {default:Engine}=await import('phaser');if(disposed)return;
    class GardenScene extends Engine.Scene{
     kitty!:Phaser.GameObjects.Image;louis!:Phaser.GameObjects.Image;shadow!:Phaser.GameObjects.Arc; 
     flowers!:Phaser.GameObjects.Arc;heart!:Phaser.GameObjects.Text;door!:Phaser.GameObjects.Rectangle;
     abducting=false;interactHeld=false;lastNear='';keysMap!:Record<string,Phaser.Input.Keyboard.Key>;
     constructor(){super('rescue-garden');}
     preload(){
      this.load.image('kitty-reference-source',new URL('./sprites/kitty-reference-sheet.png',document.baseURI).href);
      this.load.image('louis-reference-source',new URL('./sprites/louis-reference-sheet.png',document.baseURI).href);
     }
     create(){
      this.cameras.main.setBackgroundColor('#a6d0b1');
      this.keysMap=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string,Phaser.Input.Keyboard.Key>;
      const g=this.add.graphics();
      g.fillStyle(0x91bc9f).fillRect(0,0,960,540);
      g.fillStyle(0xcce5bd).fillRoundedRect(25,38,910,464,45);
      g.fillStyle(0xeed8b3).fillRoundedRect(96,275,765,100,45);
      for(let n=0;n<24;n++){
       const x=45+(n*157)%850,y=50+(n*109)%410;
       if(y>260&&y<380)continue;
       g.fillStyle(n%3===0?0xf1abc4:0xfaf1ac).fillCircle(x,y,5);
       g.fillStyle(0x648c65).fillEllipse(x+8,y+8,11,6);
      }
      const trees=[[72,90],[150,115],[254,83],[375,95],[665,85],[775,78],[905,94],[80,446],[885,432]];
      for(const [x,y] of trees){
       g.fillStyle(0x8e694b).fillRoundedRect(x-8,y-18,16,52,4);
       g.fillStyle(0x3e785e).fillCircle(x,y-30,43);
       g.fillStyle(0x76aa77).fillCircle(x-13,y-44,27);
       g.fillStyle(0xb6d28e).fillCircle(x+18,y-43,21);
      }
      this.add.rectangle(842,306,92,125,0x8c6870).setStrokeStyle(8,0xfce3d2);
      this.door=this.add.rectangle(842,312,59,108,0x4b4253);
      this.add.text(842,220,'CASA',{fontFamily:'Georgia',fontSize:'20px',color:'#fff6e9'}).setOrigin(.5);
      installReferenceCharacter(this,'kitty');installReferenceCharacter(this,'louis');
      this.kitty=this.add.image(145,320,'chibi-kitty-down-0').setScale(3.4);
      this.louis=this.add.image(355,320,'chibi-louis-down-0').setScale(3.4);
      this.heart=this.add.text(277,282,'♥',{fontFamily:'Georgia',fontSize:'52px',color:'#ec7794'}).setOrigin(.5);
      this.flowers=this.add.circle(598,326,17,0xf7d781);
      this.add.text(598,326,'✿',{fontSize:'24px',color:'#a24d7c'}).setOrigin(.5);
      this.shadow=this.add.circle(460,300,34,0x685778,.72).setVisible(false);
      this.tweens.add({targets:[this.heart,this.flowers],scale:1.15,duration:1100,yoyo:true,repeat:-1});
      if(phaseRef.current.abducted)this.louis.setVisible(false);
     }
     update(_time:number,delta:number){
      const dt=Math.min(delta,60)/1000;
      const keys=this.keysMap;
      const left=Boolean(keys.A.isDown||keys.LEFT.isDown);
      const right=Boolean(keys.D.isDown||keys.RIGHT.isDown);
      const up=Boolean(keys.W.isDown||keys.UP.isDown);
      const down=Boolean(keys.S.isDown||keys.DOWN.isDown);
      let dx=Number(right)-Number(left)+stick.current.x,dy=Number(down)-Number(up)+stick.current.y;
      const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
      this.kitty.x=Math.max(35,Math.min(915,this.kitty.x+dx*225*dt));
      this.kitty.y=Math.max(120,Math.min(460,this.kitty.y+dy*225*dt));
      const p=phaseRef.current.phase;
      if(p==='heart'&&!this.abducting){
       this.abducting=true;this.shadow.setVisible(true);
       this.tweens.add({targets:this.shadow,x:this.louis.x,duration:1150,onComplete:()=>{
        this.tweens.add({targets:[this.shadow,this.louis],alpha:0,scale:.15,duration:850,onComplete:()=>{this.shadow.setVisible(false);this.louis.setVisible(false);emit('abduction');}});
       }});
      }
      this.heart.setVisible(p==='garden');
      this.flowers.setVisible(p==='abduction'||p==='trail');
      if(!this.abducting&&!phaseRef.current.abducted)this.louis.setVisible(true);
      let prompt='';
      if(p==='garden'&&Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,277,282)<85)prompt='Recoger corazón';
      if(p==='abduction'&&Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,598,326)<85)prompt='Seguir pétalos';
      if(p==='trail'&&Engine.Math.Distance.Between(this.kitty.x,this.kitty.y,842,312)<105)prompt='Abrir puerta';
      if(prompt!==this.lastNear){this.lastNear=prompt;setNear(prompt);}
      actionRef.current=()=>{
       if(!this.lastNear||this.abducting)return;
       if(p==='garden')emit('heart');
       if(p==='abduction')emit('trail');
       if(p==='trail')setMode('threshold');
      };
      if(keys.E.isDown&&!this.interactHeld)actionRef.current();
      this.interactHeld=keys.E.isDown;
     }
    }
    game=new Engine.Game({type:Engine.AUTO,parent:stage.current!,width:960,height:540,transparent:false,
      pixelArt:true,render:{antialias:false,roundPixels:true},audio:{noAudio:true},
      scale:{mode:Engine.Scale.FIT,autoCenter:Engine.Scale.CENTER_BOTH},scene:GardenScene});
   }catch(e){if(!disposed)setError(String(e));}
  };
  void boot();
  return()=>{disposed=true;game?.destroy(true);actionRef.current=()=>{};};
 },[mode]);
 useEffect(()=>{
  if(mode!=='house')return;
  let cancelled=false;let teardown:undefined|(()=>void);
  const boot=async()=>{
   try{
    const {launchHouse}=await import('../lab/house.js');if(cancelled)return;
    const checkpoint: string=entry==='drawer'?'interactions':entry==='lock'||entry==='rescue'?'upstairs':entry==='house'?'ground':'ground';
    teardown=launchHouse(()=>onExit(),checkpoint,{demo:true,onRescue:()=>{emit('rescue');setMode('end');},trial:test,entry});
   }catch(e){if(!cancelled)setError(String(e));}
  };
  void boot();return()=>{cancelled=true;teardown?.();};
 },[mode]);
 const reset=()=>{resetRescue();const fresh={...START};phaseRef.current=fresh;setState(fresh);setNear('');setMode('garden');};
 return <div className="rescue-demo" aria-label="Demo jugable de rescate">
  {mode==='garden'&&<><header className="rescue-head"><b>VALETEAMO · LA BÚSQUEDA DE LOUIS</b><button onClick={onExit}>Salir a cumpleaños</button></header>
   <div className="rescue-stage" ref={stage}/>
   <div className="rescue-story" role="status">{descriptions[state.phase]}</div>
   <div className="rescue-stick" aria-label="Joystick para moverse" onPointerDown={e=>{stickId.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(e.pointerId!==stickId.current)return;const r=e.currentTarget.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const n=Math.max(1,Math.hypot(x,y));stick.current={x:x/n,y:y/n};}} onPointerUp={e=>{if(e.pointerId===stickId.current){stickId.current=null;stick.current={x:0,y:0};}}} onPointerCancel={()=>{stickId.current=null;stick.current={x:0,y:0};}}>✿<small>MOVER</small></div>
   {near&&<button className="rescue-act" onClick={()=>actionRef.current?.()}>{near} · E</button>}
   <span className="rescue-help">WASD / flechas · E para interactuar</span>
  </>}
  {mode==='threshold'&&<div className="rescue-transition"><span>✿ ♡ ✿</span><h1>La puerta entre<br/><em>dos mundos</em></h1><p>Las flores conducen a una casa silenciosa. Allí dentro se escuchan pasos…</p><button onClick={openHouse}>Entrar a buscar a Louis →</button><button className="secondary" onClick={onExit}>Volver a cumpleaños</button></div>}
  {mode==='end'&&<div className="rescue-transition"><span>♥ ✿ ♥</span><h1>¡Louis está a salvo!</h1><p>Has seguido las pistas, abierto la habitación y completado la demo. El jardín vuelve a brillar.</p><button onClick={reset}>Volver a jugar</button><button className="secondary" onClick={onExit}>Regresar a Feliz cumpleaños</button></div>}
  {mode==='house'&&<div className="rescue-under-house" aria-live="polite">Exploración en primera persona</div>}
  {error&&<div className="rescue-error" role="alert">{error}<button onClick={onExit}>Volver</button></div>}
 </div>;
}