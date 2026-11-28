// Phase 3: isolated eye meshes; original anchors/pose controller unchanged.
export const EYE_PART=/^(iris|socket|lid|closed-eye)(-1|1)$/;
export function refineEye(part,mesh){
 const match=part.id.match(EYE_PART);if(!match)return mesh;
 const [,kind,sideText]=match,side=+sideText;
 const v=new Float32Array(mesh.vertices);
 // Shared affine aperture deformation keeps iris, socket and eyelid aligned.
 // Slightly fuller almond shape, gentler upward outer corner.
 const sx=1.035,sy=1.045,shear=side*.038;
 const closed=kind==='closed-eye',iris=kind==='iris';
 for(let i=0;i<v.length;i+=16){
  const x=v[i],y=v[i+1],nx=v[i+6],ny=v[i+7],nz=v[i+8];
  v[i]=x*sx;v[i+1]=y*(closed?1:sy)+(closed?0:shear*x);
  const N=[nx/sx-(closed?0:shear*ny/(sx*sy)),ny/(closed?1:sy),nz],len=Math.hypot(...N)||1;
  for(let k=0;k<3;k++)v[i+6+k]=N[k]/len;
  if(kind==='lid'){
   v[i+9]=((v[i]+part.base[0])/.36+.5)*.5;
   v[i+10]=.5+((v[i+1]+part.base[1])/.36+.5)*.5;
  }
  if(iris){
   // Olive-gold rather than saturated green; retain original iris UV.
   v[i+3]=.76;v[i+4]=.76;v[i+5]=.46;
   v[i+11]=21.25; // within the existing game's iris material interval.
  }else if(kind==='socket'){
   v[i+3]=.21;v[i+4]=.22;v[i+5]=.21;
  }else if(closed){
   v[i+3]=.23;v[i+4]=.24;v[i+5]=.23;
  }
 }
 return {...mesh,vertices:v};
}
