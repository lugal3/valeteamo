// Standalone testing hub. The unchanged 2D React application remains mounted beneath it.
// Remove this module script from index.html to disable the entire 3D test entry point.
import './lab.css';
const choices=[
 ['ground','✿','Planta baja','Entrada, salón, cocina/estudio y escaleras'],
 ['upstairs','⌂','Planta alta','Dormitorio, habitación y zona de descanso'],
 ['sound','☼','Iluminación / sonido','Lámparas, linterna, efectos espaciales y pilas'],
 ['interactions','▣','Interacciones','Cajón, llave, notas, mochila y objetos'],
 ['transition','♡','Transición 2D → 3D','Puente narrativo sin modificar el guardado'],
 ['2d','↗','Juego 2D original','Historia y aventura clásica, sin modificaciones']
];
const menu=document.createElement('section');menu.id='lab-menu';
menu.innerHTML=`<div class="lab-menu-inner"><span class="lab-eyebrow">VALETEAMO · ENTORNO DE PRUEBAS</span>
 <h1>Una casa entre<br/><em>los recuerdos.</em></h1>
 <p class="lab-menu-desc">Explora una casa pixelada de dos plantas. Puedes abrir puertas, leer notas, esconderte y comprobar sonidos. Esta demo no incluye enemigo ni combate; la aventura 2D original permanece disponible.</p>
 <div class="lab-menu-grid">${choices.map(([key,icon,title,description])=>`<button class="lab-menu-card" data-entry="${key}"><span>${icon}</span><strong>${title}</strong><small>${description}</small></button>`).join('')}</div>
 <p class="lab-menu-note">Diseñado para celular horizontal. Toque para activar audio antes de jugar. Los puntos de prueba no cambian el avance 2D.</p>
 <div class="lab-menu-foot">VERSIÓN EXPERIMENTAL · CASA 3D · WEBGL · SIN DESPLIEGUE</div></div>`;
document.body.appendChild(menu);
const originalMenu=menu.innerHTML;
const returning=document.createElement('button');returning.className='lab-return-2d';returning.textContent='✿ Volver a pruebas';returning.style.display='none';
document.body.appendChild(returning);
let cleanup=null;
function showMenu(){cleanup?.();cleanup=null;returning.style.display='none';menu.style.display='block';}
async function enter(entry){
 if(entry==='2d'){menu.style.display='none';returning.style.display='block';return;}
 if(entry==='transition'){
  menu.innerHTML=`<div class="lab-menu-inner"><span class="lab-eyebrow">UNA NUEVA PÁGINA</span><h1>Tras el jardín…<br/><em>una puerta.</em></h1><p class="lab-menu-desc">El sendero acaba en una casa que parece familiar. La música se vuelve lejana y una linterna espera en la entrada. Esta transición es solo una prueba; no altera la historia guardada.</p><div class="lab-menu-grid"><button data-entry="ground" class="lab-menu-card"><span>⌂</span><strong>Entrar en la casa</strong><small>Activar escena de prueba</small></button><button data-entry="back" class="lab-menu-card"><span>←</span><strong>Volver</strong><small>Elegir otra prueba</small></button></div></div>`;
  return;
 }
 if(entry==='back'){menu.innerHTML=originalMenu;return;}
 menu.style.display='none';
 try{const {launchHouse}=await import('./house.js');cleanup=launchHouse(showMenu,entry);}catch(err){menu.style.display='block';alert('No se pudo iniciar la prueba 3D: '+String(err));}
}
menu.addEventListener('click',event=>{const item=event.target.closest('[data-entry]');if(item)void enter(item.dataset.entry);});
returning.addEventListener('click',showMenu);
