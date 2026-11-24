// V2 phase 11: platform-aware short instructions. No gameplay state changes.
export function rcControlHint(touch=false,noise=0,trapReady=false){
 if(trapReady)return touch?'¡Trampa lista! Toca Cerrar escotilla.':'¡Trampa lista! Pulsa T para cerrar la escotilla.';
 if(noise>0)return 'Señuelo activo · el secuestrador puede seguir la bocina.';
 return touch?'Joystick izquierdo: mover y girar · Bocina: atraer · Guardar: salir':
  'W/S: acelerar y retroceder · A/D: girar · Q: bocina · Esc: guardar';
}
export function throwableHint(touch=false){
 return touch?'Apunta moviendo la cámara · Toca Lanzar, Suave o Soltar':
  'Apunta con el ratón · G: lanzar · V: soltar · Suave: botón';
}
export function threatAccessibility(mode='search'){
 if(mode==='chase')return 'Peligro inmediato: busca cobertura y rompe la línea de visión';
 if(mode==='watch')return 'Alerta: el secuestrador está investigando';
 return 'Sin persecución inmediata';
}
