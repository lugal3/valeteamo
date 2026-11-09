const assert=require('node:assert/strict');
(async()=>{
 const {geometry}=await import('../src/lab/renderer.js'),{kittyMirrorPieces}=await import('../src/lab/mirror.js'),{flashlightPieces,climbingHandPieces}=await import('../src/lab/first-person.js');
 const budgets={kitty:14000,hand:5000,climb:2200};
 for(const [name,pieces]of [['kitty',kittyMirrorPieces()],['hand',flashlightPieces(true)],['climb',climbingHandPieces(1)]]){
  const mesh=geometry(pieces),count=mesh.vertices.length/16;assert(count<budgets[name],name+' vertex budget');assert(new Set(pieces.map(p=>p.id)).size===pieces.length);
  for(let i=0;i<mesh.vertices.length;i+=16){assert([...mesh.vertices.slice(i,i+16)].every(Number.isFinite),name+' finite geometry');assert(Math.abs(Math.hypot(...mesh.vertices.slice(i+6,i+9))-1)<.001,name+' unit normals');assert(mesh.vertices[i+12]>=64,'Chibi material shading is opt-in');}
  assert([...mesh.indices].every(i=>i<count));
  // For smooth outward-facing surfaces, winding matches the renderer's established convention.
  let tested=0;
  for(let i=0;i<mesh.indices.length;i+=3){
   const [a,b,c]=[0,1,2].map(j=>mesh.indices[i+j]*16),v=mesh.vertices;
   const ab=[0,1,2].map(k=>v[b+k]-v[a+k]),ac=[0,1,2].map(k=>v[c+k]-v[a+k]);
   const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],length=Math.hypot(...cross);
   if(length<1e-8)continue;
   const average=[0,1,2].map(k=>(v[a+6+k]+v[b+6+k]+v[c+6+k])/3);
   assert(cross.reduce((sum,n,k)=>sum+n*average[k],0)<1e-7,name+' outward normals match triangle order');tested++;
  }
  assert(tested>500);console.log(name,JSON.stringify({vertices:count,triangles:mesh.indices.length/3}));
 }
 const on=geometry(flashlightPieces(true)),off=geometry(flashlightPieces(false));assert.equal(on.vertices.length,off.vertices.length);assert.deepEqual(on.indices,off.indices,'On/off uses the same reusable GPU topology');
 assert.strictEqual(flashlightPieces(true),flashlightPieces(true),'Model is cached');
 console.log('PASS chibi: finite meshes, smooth unit normals, consistent winding, cached geometry, material isolation and mobile vertex budgets');
})().catch(e=>{console.error(e);process.exitCode=1;});
