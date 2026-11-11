// Freestanding cabinet with an actual hollow cavity and a pull-out tray.
export function installCabinet(add,obj,{id,label,x,y=0,z,w=.88,h=.84,d=.54,color=[.49,.32,.30],items=[]}){
 const top=y+h,frontZ=z+d/2,mid=y+h*.48;
 const wooden=(name,px,py,pz,width,height,depth,extra={})=>add(id+'-'+name,px,py,pz,width,height,depth,'wood',true,{color,...extra});
 wooden('back',x,mid,z-d/2+.026,w,.85*h,.052);
 for(const side of [-1,1])wooden('side-'+side,x+side*(w/2-.03),mid,z,.06,.85*h,d);
 wooden('plinth',x,y+.045,z-.018,w-.02,.09,d-.05,{ao:.72});
 wooden('top',x,top-.032,z,w+.026,.064,d+.028,{color:[.58,.41,.36]});
 const box=wooden('front',x,mid,frontZ,w-.09,h*.65,.049,{dynamic:true});
 const parts=[wooden('trim',x,mid,frontZ+.029,w-.17,h*.52,.015,{solid:false,dynamic:true,surface:'paint',color:color.map(c=>c*1.14)}),
  add(id+'-pull',x,mid+.14,frontZ+.057,.18,.035,.044,'brass',false,{dynamic:true,shape:'rounded-box',segments:6,rings:4,roundness:.45}),
  wooden('tray',x,mid-h*.32,z+.018,w-.13,.032,d-.09,{dynamic:true})];
 for(const side of [-1,1])parts.push(wooden('tray-edge-'+side,x+side*(w/2-.083),mid-h*.28,z+.018,.03,.08,d-.09,{dynamic:true}));
 const drawer=obj(id,'drawer',label,x,mid,frontZ+.055,{box,parts:parts.map(box=>({box,origin:{x:box.x,z:box.z}})),
  origin:{x,z:frontZ},slideAxis:'z',slideDistance:d*.83,interactOffset:.055,amount:0,open:false,state:'closed',contents:[]});
 for(const item of items){
  const base=mid-h*.32+.016,px=x+item.dx,pz=z+.12;
  const object=obj(item.id,item.kind,item.label,px,base+(item.kind==='battery'?.13:.052),pz,{text:item.text,dynamic:true,concealed:true,interactable:false});
  drawer.contents.push({object,origin:{x:px,z:pz}});
 }
 return drawer;
}

export function installRefrigerator(add,obj){
 const x=13.29,z=.61,front=1.10,hinge={x:13.70,z:front};
 const shell=(name,px,y,pz,w,h,d)=>add('fridge-'+name,px,y,pz,w,h,d,'cream',true,{surface:'paint'});
 shell('back',x,1,.16,.88,2,.06);
 for(const side of [-1,1])shell('side-'+side,x+side*.412,1,z,.058,2,.92);
 for(const y of [.045,.51,1.205,1.969])shell('shelf-'+y,x,y,z,.84,.043,.92);
 shell('freezer',x,1.605,.61,.86,.73,.93);
 add('freezer-seal',x,1.60,1.075,.86,.71,.034,'dark',false);
 add('freezer-door',x,1.60,1.105,.84,.69,.075,'cream',false,{surface:'paint',shape:'rounded-box',roundness:.14,segments:8,rings:5});
 add('freezer-handle',13.01,1.52,1.159,.04,.22,.044,'torchmetal',false);
 const box=add('fridge-door',x,.64,front,.82,1.12,.058,'cream',true,{dynamic:true,surface:'paint',shape:'rounded-box',roundness:.14,segments:8,rings:5});
 const handle=add('fridge-pull',13.01,.83,1.16,.043,.25,.041,'torchmetal',false,{dynamic:true});
 const seal=add('fridge-seal',x,.64,front-.034,.806,1.08,.014,'dark',false,{dynamic:true});
 add('fridge-grape-dish',x,.548,.79,.24,.027,.19,'cream',false);
 for(const [i,[dx,dz]] of [[-.05,0],[-.01,-.04],[.03,.028],[.06,-.027],[.0,.048]].entries())
  add('fridge-grape-'+i,x+dx,.582,.79+dz,.047,.047,.047,'foliage',false,{shape:'round',segments:7,rings:4,color:[.49,.59,.22]});
 const inside=obj('fridge-list','inspect','Lista en el refrigerador',x+.15,.58,.86,{concealed:true,text:'Quedan unas uvas y un vaso de agua. En el papel dice «no olvides dejarle comida a Louis».'});
 obj('fridge','cupboard','Refrigerador',x,.75,front,{box,origin:{x,z:front},hinge,swingAngle:-Math.PI*.47,slideDistance:.82,
  parts:[handle,seal].map(part=>({box:part,origin:{x:part.x,z:part.z}})),inside,open:false,amount:0,state:'closed'});
}
