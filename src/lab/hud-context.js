// V2 phase 11: platform-aware short instructions. No gameplay state changes.
export function rcControlHint(touch=false,noise=0,trapReady=false){
 if(trapReady)return touch?'¡Trampa lista! Toca Cerrar escotilla.':'¡Trampa lista! Pulsa T para cerrar la escotilla.';
 if(noise>0)return 'Señuelo activo · el secuestrador puede seguir la bocina.';
 return touch?'Joystick izquierdo: mover y girar · Bocina: atraer · Guardar: salir':
  'W/S: acelerar y retroceder · A/D: girar · Q: bocina · Esc: guardar';
}
export function throwableHint(touch=false){
 return touch?'Apunta moviendo la cámara · Toca Lanzar':
  'Apunta con el ratón · E o G: lanzar';
}
export function threatAccessibility(mode='search'){
 if(mode==='chase')return 'Peligro inmediato: busca cobertura y rompe la línea de visión';
 if(mode==='watch')return 'Alerta: el secuestrador está investigando';
 return 'Sin persecución inmediata';
}

// V3: purely visual, bounded hop with a refractory period.
export const HOP_DURATION=.36,HOP_COOLDOWN=.62;
export function hopOffset(age,reduced=false){
 if(!Number.isFinite(age)||age<=0||age>=HOP_DURATION)return 0;
 return (reduced?.025:.12)*Math.sin(Math.PI*age/HOP_DURATION)**2;
}
