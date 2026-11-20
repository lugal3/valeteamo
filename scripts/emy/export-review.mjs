// Export the actual runtime mesh, including skin deformation and fur, for review.
import {writeFileSync} from 'node:fs';
import {installUpstairsEmy,poseEmy} from '../../src/lab/emy-cat.js';
import {geometry} from '../../src/lab/renderer.js';
const boxes=[],add=(id,x,y,z,w,h,d,material,solid,extra)=>{const box={id,x,y,z,w,h,d,material,solid,...extra};boxes.push(box);return box;};
const cat=installUpstairsEmy(add,0);cat.x=cat.z=cat.yaw=0;
const modes=['sit','walk','groom','stretch','sleep','purr'];
const meshes=modes.map(mode=>{
 cat.age=.7;poseEmy(cat,{mode,phase:.7,walking:mode==='walk'});
 const mesh=geometry(boxes);
 return {mode,vertices:Array.from(mesh.vertices),indices:Array.from(mesh.indices)};
});
writeFileSync(process.argv[2]||'/tmp/emy-review.json',JSON.stringify(meshes));
