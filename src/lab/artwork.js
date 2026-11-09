// Original fan-themed posters. No photographs, album art or song recordings.
export const ART_COUNT=10,ART_SIZE=128;
export const ART_TITLES=[
 'ONE DIRECTION · LIVE','1D · HEARTBEAT','ONE DIRECTION · VINYL','1D · ON THE ROAD',
 'ONE DIRECTION · STARS','1D · MUSIC ROOM','1D · NIGHT CHANGES','ONE DIRECTION · ACOUSTIC',
 '1D · MIDNIGHT MEMORIES','ONE DIRECTION · GOLDEN'
];

export function createArtworkCanvas(){
 const canvas=document.createElement('canvas');canvas.width=ART_COUNT*ART_SIZE;canvas.height=ART_SIZE;
 const g=canvas.getContext('2d'),palettes=[
  ['#19243a','#f3b8bd'],['#e6cec8','#842e4c'],['#304b54','#f1d69b'],
  ['#d0c0d6','#382c4e'],['#202c48','#e8b873'],['#b95f78','#fff1cf'],
  ['#1e3238','#c8e3d4'],['#42283b','#f5d2b3'],['#2a2d48','#fce4ec'],['#3a382c','#eed88b']
 ];
 for(let i=0;i<ART_COUNT;i++){
  g.save();g.translate(i*ART_SIZE,0);const [base,ink]=palettes[i];
  g.fillStyle=base;g.fillRect(0,0,128,128);
  // Outer decorative frame molding
  g.strokeStyle='#c29b53';g.lineWidth=4;g.strokeRect(2,2,124,124);
  g.strokeStyle=ink;g.lineWidth=1.5;g.strokeRect(6,6,116,116);
  g.fillStyle=ink;
  g.font='bold 15px system-ui';g.textAlign='center';
  g.fillText(i%2?'1D':'ONE',64,25);
  g.fillText(i%2?['','HEARTBEAT','','ON THE ROAD','','MUSIC ROOM','','NIGHT CHANGES','','MIDNIGHT'][i]:(i===6?'CHANGES':i===8?'MEMORIES':i===9?'GOLDEN':'DIRECTION'),64,43);

  if(i===0){
   for(let n=0;n<5;n++){g.beginPath();g.arc(30+n*17,68,5,0,Math.PI*2);g.fill();g.fillRect(26+n*17,75,8,25);}
   g.font='bold 12px system-ui';g.fillText('LIVE · FIVE VOICES',64,113);
  }
  if(i===1){
   // Legible heart with high-contrast outline for rescue puzzle clue
   g.fillStyle='#e0284f';g.beginPath();g.moveTo(64,105);g.bezierCurveTo(9,74,38,49,64,71);g.bezierCurveTo(90,49,119,74,64,105);g.fill();
   g.strokeStyle='#ffffff';g.lineWidth=2.5;g.stroke();
   g.fillStyle=ink;g.font='bold 10px system-ui';g.fillText('A LITTLE HEART TO REMEMBER',64,117);
  }
  if(i===2){
   g.beginPath();g.arc(64,82,30,0,Math.PI*2);g.fill();g.fillStyle=base;g.beginPath();g.arc(64,82,10,0,Math.PI*2);g.fill();
   g.fillStyle=ink;g.fillRect(98,65,3,32);g.fillRect(89,94,10,4);
  }
  if(i===3){
   g.lineWidth=5;g.beginPath();g.moveTo(45,116);g.bezierCurveTo(17,81,109,84,73,55);g.stroke();
   g.fillStyle=base;for(let n=0;n<4;n++)g.fillRect(60,63+n*13,3,7);
   g.fillStyle=ink;g.font='9px system-ui';g.fillText('MUSIC · FRIENDS · MEMORIES',64,116);
  }
  if(i===4){
   for(let n=0;n<9;n++){
    const x=22+(n*31)%86,y=58+(n*19)%45;
    g.beginPath();g.moveTo(x,y-4);g.lineTo(x+2,y-1);g.lineTo(x+5,y);g.lineTo(x+1,y+2);g.lineTo(x,y+5);g.lineTo(x-2,y+1);g.lineTo(x-5,y);g.lineTo(x-1,y-2);g.closePath();g.fill();
   }
   g.font='bold 11px system-ui';g.fillText('UNDER THE SAME SKY',64,115);
  }
  if(i===5){
   g.fillStyle=ink;g.beginPath();g.ellipse(64,88,21,27,0,0,Math.PI*2);g.fill();g.fillRect(60,48,8,39);
   g.fillStyle=base;g.beginPath();g.arc(64,84,7,0,Math.PI*2);g.fill();
   g.fillStyle=ink;g.fillRect(57,47,14,9);g.font='10px system-ui';g.fillText('ONE DIRECTION',64,116);
  }
  if(i===6){
   // Crescent moon & starry sky
   g.beginPath();g.arc(64,80,24,0,Math.PI*2);g.fill();
   g.fillStyle=base;g.beginPath();g.arc(72,76,20,0,Math.PI*2);g.fill();
   g.fillStyle=ink;for(let n=0;n<5;n++)g.fillRect(35+n*15,62+(n*7)%18,3,3);
   g.font='bold 10px system-ui';g.fillText('NIGHT CHANGES',64,116);
  }
  if(i===7){
   // Acoustic guitar & musical notes
   g.beginPath();g.arc(64,88,18,0,Math.PI*2);g.fill();
   g.fillStyle=base;g.beginPath();g.arc(64,88,7,0,Math.PI*2);g.fill();
   g.fillStyle=ink;g.fillRect(62,50,4,30);
   g.font='10px system-ui';g.fillText('ACOUSTIC SESSIONS',64,116);
  }
  if(i===8){
   // Skyline silhouette
   for(let n=0;n<6;n++)g.fillRect(28+n*13,95-(n%3)*16,11,(n%3)*16+15);
   g.font='10px system-ui';g.fillText('MIDNIGHT MEMORIES',64,116);
  }
  if(i===9){
   // Vintage cassette tape
   g.fillRect(36,66,56,36);g.fillStyle=base;g.fillRect(42,72,44,22);
   g.fillStyle=ink;g.beginPath();g.arc(52,83,5,0,Math.PI*2);g.fill();g.beginPath();g.arc(76,83,5,0,Math.PI*2);g.fill();
   g.font='bold 10px system-ui';g.fillText('GOLDEN ERA',64,116);
  }
  g.restore();
 }
 return canvas;
}
