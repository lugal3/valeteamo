export function mountEmyPreview(canvas,onPhase,onPet,appearance='original'){
 let stopped=false,raf=0,dispose=()=>{};
 void Promise.all([import('./renderer.js'),import('./world.js'),import('./emy-cat.js')]).then(async([{HouseRenderer,pickupGeometry},{createHouse,blocked},{updateUpstairsEmy,petEmy}])=>{
  if(stopped)return;
  const world=createHouse(),cat=world.emy;
  if(appearance!=='original'){
   const {applyReviewAppearance}=await import('./review/face-review-model.js');
   if(stopped)return;applyReviewAppearance(cat,appearance);
  }
  const renderer=new HouseRenderer(canvas);
  dispose=()=>renderer.destroy();
  renderer.rebuild([...world.boxes,...pickupGeometry(world.objects)]);renderer.quality='medium';
  const labels={walk:'Paseando por el piso de arriba',sit:'Descansando',groom:'Limpiando su patita',stretch:'Estirándose',sleep:'Durmiendo',purr:'Ronroneando ♡'};
  onPet(()=>{petEmy(cat);cat.yaw=Math.atan2(.65,1.0);});
  let last=0;
  const frame=now=>{
   raf=requestAnimationFrame(frame);if(document.hidden){last=now;return;}if(now-last<32)return;
   const dt=Math.min(.1,(now-last)/1000||0);last=now;
   updateUpstairsEmy(cat,dt,{blocked:(...args)=>blocked(world.boxes,...args),reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches});
   onPhase(labels[cat.phase]);
   const camera={x:cat.x+.65,y:cat.y+.78,z:cat.z+1.0,yaw:Math.atan2(-.65,-1),pitch:-.29};
   renderer.render(camera,true,cat.age,false,{reduced:true,shotLight:.25});
  };raf=requestAnimationFrame(frame);
 }).catch(error=>{console.error('Emy preview:',error);dispose();onPhase('No se pudo iniciar la vista previa 3D.');});
 return()=>{stopped=true;cancelAnimationFrame(raf);dispose();};
}
