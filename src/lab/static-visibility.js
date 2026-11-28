// Conservative clip-space rejection for immutable, contiguous triangle batches.
 // Bounds are computed from the exact uploaded Float32 vertex positions,
 // not collision boxes. Triangle order and buffers are unchanged.
export function buildStaticBatches(vertices,indices,batchSize=768){
 const step=Math.max(3,Math.floor(batchSize/3)*3),batches=[];
 for(let start=0;start<indices.length;start+=step){
  const end=Math.min(indices.length,start+step),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=start;i<end;i++){const at=indices[i]*16;for(let k=0;k<3;k++){min[k]=Math.min(min[k],vertices[at+k]);max[k]=Math.max(max[k],vertices[at+k]);}}
  batches.push({start,end,center:min.map((v,k)=>(v+max[k])/2),half:min.map((v,k)=>(max[k]-v)/2)});
 }
 return batches;
}
export function clipPlanes(basis,px,py){
 const {right,up,forward}=basis;
 // The shader uses x=dot(delta,right)*px, y=dot(delta,up)*py, w=dot(delta,forward).
 // Deliberately omit near/far rejection and expand each side by a large
 // numerical guard for mediump implementations and boundary stability.
 return [[right,px],[right,-px],[up,py],[up,-py]].map(([v,s])=>forward.map((n,i)=>n+s*v[i]));
}
export function batchOutside(batch,origin,planes){
 const {center:c,half:h}=batch;
 const x=c[0]-origin.x,y=c[1]-origin.y,z=c[2]-origin.z;
 const pad=.15+.015*(Math.abs(x)+Math.abs(y)+Math.abs(z)+h[0]+h[1]+h[2]);
 for(const [a,b,d] of planes){
  const largest=a*x+b*y+d*z+Math.abs(a)*h[0]+Math.abs(b)*h[1]+Math.abs(d)*h[2];
  if(largest < -pad*(Math.abs(a)+Math.abs(b)+Math.abs(d)))return true;
 }
 return false;
}
export function visibleStaticRuns(batches,count,origin,basis,px,py,{maxDraws=8,minSavings=.25}={}){
 const full=count?[[0,count]]:[];
 if(!batches?.length||!Number.isFinite(px)||!Number.isFinite(py)||px<=0||py<=0)return full;
 const planes=clipPlanes(basis,px,py),runs=[];let kept=0;
 for(const batch of batches){
  if(batchOutside(batch,origin,planes))continue;
  kept+=batch.end-batch.start;
  const last=runs.at(-1);if(last&&last[1]===batch.start)last[1]=batch.end;else runs.push([batch.start,batch.end]);
  // More draw calls can cost more than the saved triangles on mobile.
  if(runs.length>maxDraws)return full;
 }
 return count-kept>=count*minSavings?runs:full;
}
