// Each milestone uses the same durable state as its corresponding puzzle.
const milestones=[
 [6,'Conducto del estudio','M3 6h18v12H3z M6 9h12m-12 3h12m-12 3h12',c=>c.world.studyVent.unlatched||c.puzzle.key],
 [12,'Llave con lazo','M14 10l-9 9H2v-3l9-9 M20 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',c=>c.puzzle.key],
 [24,'Dormitorio','M5 21V3h14v18M15 12h1',c=>c.puzzle.door],
 [36,'Nota del espejo','M6 3h12v18H6z M9 8h6m-6 4h5',c=>c.mirrorSafe.revealed||c.mirrorSafe.opened],
 [48,'Caja fuerte','M3 5h18v14H3z M16 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',c=>c.mirrorSafe.opened],
 [60,'Partitura','M9 17V6l10-2v11 M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M15 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0',c=>c.world.pianoSheet.taken],
 [72,'Piano','M2 6h20v12H2z M7 6v12m5-12v12m5-12v12',c=>c.world.piano.solved],
 [84,'Sótano','M3 5h6v5h5v5h6v5',c=>!c.world.hatch.locked],
 [92,'Llave maestra','M12 10l-8 9m2-2 2 2m1-5 2 2 M20 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',c=>c.s.inventory.masterKey],
 [99,'Louis a salvo tras el mesón','M2 12h20M4 12v9m16-9v9 M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0',c=>['rc-setup','escape','ending','safe'].includes(c.events.phase)],
 [99,'Trampa del auto RC','M2 15v-4l4-1 2-4h8l3 4 3 1v4z M7 16v2m10-2v2',c=>c.rcTrap.closed],
 [100,'Escape al jardín','M4 20V3h10v4M9 13h12m-5-5 5 5-5 5',c=>c.events.phase==='safe'&&c.rcTrap.closed]
];
export const progressStops=milestones.map(([percent,label])=>({percent,label}));
export function rescueProgress(context){
 let percent=0,mask='';
 const rows=milestones.map(([value,label,path,done])=>{
  const complete=!!done(context);
  if(complete)percent=value;
  mask+=Number(complete);
  return '<li class="'+(complete?'complete':'')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>'+label+'<span>'+ (complete?'✓':'')+'</span></li>';
 });
 return {percent,mask,html:'<section class="rescue-progress"><strong>'+percent+'%</strong><progress max="100" value="'+percent+'"></progress><ol>'+rows.join('')+'</ol></section>'};
}
