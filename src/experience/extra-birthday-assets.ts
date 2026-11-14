/**
 * Fase 3 — recortes del collage rosa aportado por el usuario.
 * Reservados: no se insertan en ninguna pantalla hasta decidir dónde usarlos.
 * Coordenadas y procedencia: docs/EXTRA-BIRTHDAY-ICON-ASSETS.md
 */
export type ExtraBirthdayIconId='cat-birthday-cake'|'cat-on-gift'|'cat-portrait-party';

export type ExtraBirthdayIcon={
 id:ExtraBirthdayIconId;
 title:string;
 src:string;
 alt:string;
 suggestedPlacement:string;
 status:'reserved';
};

export const EXTRA_BIRTHDAY_ICONS:readonly ExtraBirthdayIcon[]=[
 {
  id:'cat-birthday-cake',
  title:'Gato con torta',
  src:'/experience/icons/cat-birthday-cake.webp',
  alt:'Gato gris detrás de una torta de cumpleaños con corazones y una vela',
  suggestedPlacement:'Pantalla o recompensa de cumpleaños; todavía sin asignar',
  status:'reserved'
 },
 {
  id:'cat-on-gift',
  title:'Gato sobre regalo',
  src:'/experience/icons/cat-on-gift.webp',
  alt:'Gato gris con gorrito de fiesta sentado sobre una caja de regalo turquesa',
  suggestedPlacement:'Icono para una sorpresa desbloqueable o regalo interactivo',
  status:'reserved'
 },
 {
  id:'cat-portrait-party',
  title:'Retrato del gato',
  src:'/experience/icons/cat-portrait-party.webp',
  alt:'Retrato cercano de un gato gris con ojos verdes, gorrito de fiesta y moño rojo',
  suggestedPlacement:'Avatar o guía para recuerdos y pequeñas ayudas',
  status:'reserved'
 }
] as const;

export function getExtraBirthdayIcon(id:ExtraBirthdayIconId):ExtraBirthdayIcon{
 const icon=EXTRA_BIRTHDAY_ICONS.find(item=>item.id===id);
 if(!icon)throw new Error('Recurso de cumpleaños desconocido: '+id);
 return icon;
}
