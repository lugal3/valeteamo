// V3 tactical dollhouse. Geometry is projected from world-space XYZ into SVG.
// Orthographic, depth-sorted faces keep the house readable without a second GL context.
import {roomChoices,EMY_ROOM_COLORS} from './emy-abilities.js';
import {HEIGHT,HOUSE,STAIR} from './world.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const defaultMiniatureView=()=>({yaw:-.52,pitch:.78,zoom:1});
export function changeMiniatureView(view,{yaw=0,pitch=0,zoom=1}={}){
 return {yaw:((view.yaw+yaw)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),pitch:clamp(view.pitch+pitch,.28,1.48),zoom:clamp(view.zoom*zoom,.72,1.65)};
}
export function miniatureProject(p,view,floor=-1){
 const x=p[0]-HOUSE.width/2,z=p[2]-HOUSE.depth/2,y=p[1]-(floor<0?HEIGHT:floor*HEIGHT);
 const c=Math.cos(view.yaw),s=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
 const u=x*c-z*s,v=x*s+z*c,k=(floor<0?14:16)*view.zoom;
 return {x:260+u*k,y:171+(v*sp-y*cp)*k,depth:v*cp+y*sp};
}
const quad=(x0,x1,z0,z1,y)=>[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]];
function cuboid(x,y,z,w,h,d,colors,faces,klass=''){
 const a=quad(x-w/2,x+w/2,z-d/2,z+d/2,y-h/2),b=quad(x-w/2,x+w/2,z-d/2,z+d/2,y+h/2);
 faces.push({p:b,fill:colors[0],klass});
 for(let i=0;i<4;i++)faces.push({p:[a[i],a[(i+1)%4],b[(i+1)%4],b[i]],fill:colors[1+i%2]||colors[1],klass});
}
function polygon(face,project){
 const pts=face.p.map(project),attrs=face.id?' data-zone="'+esc(face.id)+'" data-act="emy:room:'+esc(face.id)+'" aria-label="'+esc(face.label)+'"':'';
 return {points:pts,depth:pts.reduce((sum,p)=>sum+p.depth,0)/pts.length,html:'<polygon points="'+pts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')+'" fill="'+face.fill+'" stroke="'+(face.stroke||'#30253e')+'" stroke-width="'+(face.width||.85)+'"'+attrs+(face.klass?' class="'+face.klass+'"':'')+' />'};
}
// Keep real positions as anchor dots. Nearby actors receive compact, separated
// symbols connected to those anchors; the legend carries their full names.
export function layoutMiniaturePins(markers,project,level){
 const placed=[];
 for(const m of markers){
  const anchor=project([m.x,level+.12,m.z]);
  let badge=anchor;
  if(placed.some(p=>Math.hypot(p.badge.x-anchor.x,p.badge.y-anchor.y)<23)){
   outer:for(const r of [24,36,48,60]){
    for(const angle of [-Math.PI/2,0,Math.PI,Math.PI/2,-Math.PI/4,Math.PI/4,Math.PI*3/4,-Math.PI*3/4]){
     const candidate={x:anchor.x+Math.cos(angle)*r,y:anchor.y+Math.sin(angle)*r};
     if(placed.every(p=>Math.hypot(p.badge.x-candidate.x,p.badge.y-candidate.y)>=23)){badge=candidate;break outer;}
    }
   }
  }
  placed.push({marker:m,anchor,badge});
 }
 return placed;
}
// The actual world, including real stair opening and walls, is the sole layout source.
export function miniatureSVG(world,view,{floor=-1,selectedId='',lockedIds=[],markers=[]}={}){
 const faces=[],labels=[],locked=new Set(lockedIds),project=p=>miniatureProject(p,view,floor);
 const level=Math.max(0,floor)*HEIGHT;
 if(floor<0){
  cuboid(HOUSE.width/2,-.2,HOUSE.depth/2,HOUSE.width+.35,.4,HOUSE.depth+.35,['#b9c1b2','#788b85','#899c90'],faces);
  for(const b of world.boxes.filter(b=>/^(west|east|north|south)-(0|3\.15)-/.test(b.id)&&!b.id.includes('nail')&&!b.id.includes('board')&&!b.id.includes('frame')&&!b.id.includes('rail')&&b.h>.4)){
   cuboid(b.x,b.y,b.z,b.w,b.h,b.d,['#edd8df','#ad91a5','#c8adbc'],faces);
  }
  // Show the actual boarded openings and front door; no invented facade.
  for(const b of world.boxes){
   if(/^(west|east|north|south)-(0|3\.15)-(frame|rail|board)/.test(b.id)){
    cuboid(b.x,b.y,b.z,b.w,b.h,b.d,['#b99b83','#826757','#a07d6c'],faces);
   }else if(b.id==='door-entrada'||b.id==='entry-window-sash'){
    cuboid(b.x,b.y,b.z,b.w,b.h,b.d,b.id==='door-entrada'?['#bb937f','#805d53','#a27a68']:['#bbd8df','#7793a4','#91afbc'],faces);
   }
  }
  // Roof dimensions are read from the real gable mesh.
  const roof=world.boxes.find(b=>b.id==='roof');
  if(roof){
   const x0=roof.x-roof.w/2,x1=roof.x+roof.w/2,z0=roof.z-roof.d/2,z1=roof.z+roof.d/2,y=roof.y-roof.h/2,top=roof.y+roof.h/2;
   faces.push({p:[[x0,y,z0],[roof.x,top,z0],[roof.x,top,z1],[x0,y,z1]],fill:'#827399'});
   faces.push({p:[[x1,y,z0],[roof.x,top,z0],[roof.x,top,z1],[x1,y,z1]],fill:'#ab91b5'});
   for(const z of [z0,z1])faces.push({p:[[x0,y,z],[roof.x,top,z],[x1,y,z]],fill:'#e3c5d1'});
  }
 }else{
  const choices=roomChoices(world.rooms).filter(r=>r.floor===floor);
  for(const room of choices){
   for(const r of room.segments){
    const isLocked=locked.has(room.id),selected=room.id===selectedId;
    faces.push({p:quad(r.x0,r.x1,r.z0,r.z1,level+.035),fill:isLocked?'#65576d':selected?'#8de7c2':EMY_ROOM_COLORS[room.id]||'#c2bacb',stroke:selected?'#ecfff4':'#544761',width:selected?2:1,id:isLocked?null:room.id,label:room.label,klass:'mini-room'+(isLocked?' is-locked':'')});
   }
   const r=room.segments[0];
   labels.push({p:[(r.x0+r.x1)/2,level+.07,(r.z0+r.z1)/2],label:room.short,id:room.id,locked:locked.has(room.id)});
  }
  // Low cutaway walls follow the actual partition box positions and real door gaps.
  const prefix=/^(west-|east-|north-|south-|music-west|music-south|kitchen-divider|bath-divider|stairwell-side)/;
  for(const b of world.boxes){
   if(!prefix.test(b.id)||!b.solid||b.y-b.h/2>level+.15||b.y+b.h/2<level+.35||b.h<1.8)continue;
   cuboid(b.x,level+.24,b.z,b.w,.48,b.d,['#eee1ed','#97859f','#b9a7bd'],faces,'mini-wall');
  }
  if(floor===0){
   for(let i=0;i<10;i++){
    const z=STAIR.zBottom-(i+.5)*(STAIR.zBottom-STAIR.zTop)/10;
    cuboid(STAIR.centerX,level+.10+i*.025,z,STAIR.xMax-STAIR.xMin,.17,(STAIR.zBottom-STAIR.zTop)/10-.025,['#bca07e','#92785f','#a58a6c'],faces,'mini-wall');
   }
  }else faces.push({p:quad(STAIR.wellX,HOUSE.width,STAIR.zTop,STAIR.wellZ,level+.01),fill:'#242336',stroke:'#a58ba6',klass:'house-emy-stair-void'});
 }
 const sorted=faces.map(f=>polygon(f,project)).sort((a,b)=>a.depth-b.depth);
 // Fit the unzoomed geometry, not a fixed oversized SVG canvas. The user
 // zoom is deliberately excluded from the fit so zoom still changes scale.
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const face of sorted)for(const p of face.points){
  const x=260+(p.x-260)/view.zoom,y=171+(p.y-171)/view.zoom;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 const margin=23,viewBox=Number.isFinite(left)?[left-margin,top-margin,right-left+2*margin,bottom-top+2*margin].map(v=>v.toFixed(2)).join(' '):'0 0 520 342';
 const text=labels.map(o=>{const p=project(o.p);return '<text x="'+p.x.toFixed(1)+'" y="'+p.y.toFixed(1)+'" class="mini-label'+(o.locked?' is-locked':'')+'"'+(!o.locked?' data-act="emy:room:'+esc(o.id)+'"':'')+'>'+esc(o.label)+(o.locked?' 🔒':'')+'</text>';}).join('');
 const visibleMarkers=floor<0?[]:markers.filter(m=>Number.isFinite(m.x)&&Number.isFinite(m.y)&&Number.isFinite(m.z)&&m.x>=0&&m.x<=HOUSE.width&&m.z>=0&&m.z<=HOUSE.depth&&m.y>=-.18&&m.y<=HEIGHT+.6&&(m.y>=HEIGHT*.5?1:0)===floor);
 const n=v=>v.toFixed(1);
 const pins=layoutMiniaturePins(visibleMarkers,project,level).map(({marker:m,anchor,badge})=>{
  const moved=anchor!==badge,symbol=m.id==='kitty'?'K':m.id==='emy'?'E':'!';
  return '<g class="mini-pin" data-marker="'+esc(m.id)+'" aria-label="'+esc(m.label)+'"><title>'+esc(m.label)+'</title>'+
   (moved?'<line x1="'+n(anchor.x)+'" y1="'+n(anchor.y)+'" x2="'+n(badge.x)+'" y2="'+n(badge.y)+'" stroke="#fff3e9" stroke-width="1.5"/><circle cx="'+n(anchor.x)+'" cy="'+n(anchor.y)+'" r="3" fill="'+esc(m.color)+'"/>':'')+
   '<g transform="translate('+n(badge.x)+' '+n(badge.y)+')"><circle r="10" fill="'+esc(m.color)+'" stroke="#fff" stroke-width="1.5"/><text class="mini-symbol" y="0">'+symbol+'</text></g></g>';
 }).join('');
 return '<svg viewBox="'+viewBox+'" role="img" aria-label="'+(floor<0?'Exterior tridimensional de la casa':'Casa en corte, planta '+(floor?'alta':'baja'))+'" xmlns="http://www.w3.org/2000/svg">'+sorted.map(o=>o.html).join('')+text+pins+'</svg>';
}
export function miniatureMarkers(player,cat,threat,scanVisible){
 const out=[{id:'kitty',label:'Kitty',color:'#f3a2c6',...player}];
 if(cat&&!cat.hidden)out.push({id:'emy',label:'Emy',color:'#c6a5ff',...cat});
 // Never emit even an invisible marker or coordinate for an unscanned threat.
 if(scanVisible&&threat?.active)out.push({id:'threat',label:'Amenaza',color:'#f08079',x:threat.x,y:threat.y,z:threat.z});
 return out;
}
