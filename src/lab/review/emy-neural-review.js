import {HouseRenderer} from '../renderer.js';
import {loadEmyNeural} from './emy-neural-glb.js';

const canvas = document.querySelector('canvas');
const status = document.querySelector('[role=status]');
const views = {
 face:{angle:1.51, height:.10, distance:.55, center:[.055,.454,.345]},
 three:{angle:.91, height:.15, distance:.99, center:[0,.29,0]},
 side:{angle:Math.PI/2, height:.07, distance:1.02, center:[0,.29,0]},
};

function useCoat(renderer, bitmap) {
 const gl = renderer.gl;
 renderer.emyCoatTexture.destroy();
 const texture = gl.createTexture();
 renderer.emyCoatTexture = {texture, enable() {}, destroy:() => gl.deleteTexture(texture)};
 gl.activeTexture(gl.TEXTURE7);
 gl.bindTexture(gl.TEXTURE_2D, texture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
 bitmap.close();
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
 gl.generateMipmap(gl.TEXTURE_2D);
 gl.activeTexture(gl.TEXTURE0);
}

async function start() {
 const {vertices, indices, bitmap, count} = await loadEmyNeural();
 const renderer = new HouseRenderer(canvas);
 useCoat(renderer, bitmap);
 renderer.rebuild([
  {id:'floor-preview',x:0,y:-.057,z:0,w:12,h:.10,d:12,mat:'plaster',solid:true,color:[.33,.37,.44]},
  {id:'emy-neural',x:0,y:0,z:0,w:.32,h:.59,d:.95,mat:'plaster',solid:false,dynamic:true,chibi:true,
   emySpec:{},emyPose:{pos:[0,0,0],rot:[0,0,0],scale:[1,1,1]},emyMesh:{vertices,indices}},
 ]);
 let camera = {...views.face};
 function draw() {
  const [x,y,z] = camera.center;
  const horizontal = camera.distance * Math.cos(camera.height);
  renderer.render({
   x:x+Math.sin(camera.angle)*horizontal,
   y:y+Math.sin(camera.height)*camera.distance,
   z:z+Math.cos(camera.angle)*horizontal,
   yaw:camera.angle+Math.PI,pitch:-camera.height,
  },.27,0,false,{reduced:true,shotLight:.75,
   captureProjection:Math.min(1.64,1.23*canvas.clientWidth/canvas.clientHeight),weather:{sky:[.16,.19,.24]}});
  if (renderer.gl.getError() !== renderer.gl.NO_ERROR) throw new Error('Error de WebGL al dibujar la malla.');
 }
 const buttons = document.querySelectorAll('[data-view]');
 for (const button of buttons) {
  button.addEventListener('click', () => {
   for (const option of buttons) option.setAttribute('aria-pressed', String(option === button));
   camera = {...views[button.dataset.view]};
   draw();
  });
 }
 function turn(yaw, pitch) {
  camera.angle += yaw;
  camera.height = Math.max(-.15, Math.min(1.40, camera.height + pitch));
  draw();
 }
 let drag;
 canvas.addEventListener('pointerdown',e => {
  drag = [e.clientX,e.clientY];
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e => {
  if (!drag) return;
  turn((drag[0]-e.clientX)*.008,(e.clientY-drag[1])*.008);
  drag = [e.clientX,e.clientY];
 });
 canvas.addEventListener('lostpointercapture',() => { drag = null; });
 canvas.addEventListener('keydown',e => {
  const step = {ArrowLeft:[-.14,0],ArrowRight:[.14,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]}[e.key];
  if (!step) return;
  e.preventDefault();
  turn(...step);
 });
 const observer = new ResizeObserver(draw);
 observer.observe(canvas);
 window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  observer.disconnect();
  renderer.destroy();
 });
 draw();
 status.textContent = `${new Intl.NumberFormat('es-CL').format(indices.length/3)} triángulos · ${new Intl.NumberFormat('es-CL').format(count)} vértices · WebGL1`;
}

start().catch(error => {
 status.textContent = error.message;
 console.error(error);
});
