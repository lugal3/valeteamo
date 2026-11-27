import {memo,type CSSProperties} from 'react';
import type {DailyTheme} from './birthday-daily.js';

const symbols:Record<string,string[]>={
 blossom:['✿','♡','✧','❀'],constellation:['✦','·','✧','⋆'],letter:['♡','✧','·','❦'],
 garden:['❀','✿','·','✧'],pixel:['♥','✦','■','·'],aurora:['◇','·','✧','⋆'],
 music:['♪','♫','·','♡'],finale:['✦','✧','·','♡']
};
// Deterministic lightweight ornament field, independent of timer rerenders.
export const DailyAtmosphere=memo(function DailyAtmosphere({theme}:{theme:DailyTheme}){
 const marks=symbols[theme.id]??symbols.blossom;
 return <div className="daily-atmosphere" aria-hidden="true">
  <div className="daily-halo daily-halo-a"/><div className="daily-halo daily-halo-b"/>
  <svg className="daily-art" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" fill="none">
   {theme.id==='blossom'&&<g stroke="currentColor" strokeWidth="2">
    <path d="M-30 560Q130 500 150 300T320 40M1030 100Q850 170 870 370T720 640"/>
    {[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${70+i*31} ${470-i*70})`}><path d="M0 0q-28-40-52-18q9 31 52 18M0 0q38-29 54-6q-16 30-54 6" fill="currentColor" opacity=".16"/><circle r="13" strokeWidth="1"/><circle r="4" fill="currentColor"/></g>)}
   </g>}
   {theme.id==='constellation'&&<g stroke="currentColor" strokeWidth="1"><ellipse cx="500" cy="300" rx="420" ry="215" transform="rotate(-18 500 300)"/><ellipse cx="500" cy="300" rx="405" ry="140" transform="rotate(24 500 300)"/><path d="M60 100L170 62 260 150 333 92M732 428L815 500 922 426" strokeDasharray="5 6"/>{[[60,100],[170,62],[260,150],[333,92],[732,428],[815,500],[922,426]].map(([x,y])=><circle key={x} cx={x} cy={y} r="4" fill="currentColor"/>)}</g>}
   {theme.id==='letter'&&<g stroke="currentColor" strokeWidth="1.5"><rect x="36" y="38" width="928" height="524" rx="12" strokeDasharray="4 9"/><path d="M-10 70L500 320 1010 70M0 600L350 300M1000 600L650 300"/><circle cx="500" cy="320" r="54"/><path d="M500 338c-66-40-13-69 0-36 13-33 66-4 0 36Z" fill="currentColor" opacity=".25"/></g>}
   {theme.id==='garden'&&<g stroke="currentColor" strokeWidth="2"><path d="M0 530Q190 455 360 530T730 505T1000 515M0 555Q200 490 380 555T800 530T1000 540"/>{Array.from({length:14},(_,i)=><g key={i} transform={`translate(${25+i*74} ${505+(i%3)*18})`}><path d="M0 0Q-7-25 0-48M0-16q-26-25-20-5M0-24q26-25 20-5"/><circle cy="-49" r="8" fill="currentColor" opacity=".36"/></g>)}</g>}
   {theme.id==='pixel'&&<g stroke="currentColor" strokeWidth="2" shapeRendering="crispEdges"><path d="M35 110V35H150M850 35H965V110M35 490V565H150M850 565H965V490"/><path d="M80 500h80v-25h80v25h100v-50h100M650 95h80v30h80v-25h100"/>{[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={70+i*115} y={80+(i%3)*110} width="9" height="9" fill="currentColor"/>)}</g>}
   {theme.id==='aurora'&&<g stroke="currentColor" strokeWidth="3" opacity=".8">{[0,1,2,3,4].map(i=><path key={i} d={`M-80 ${100+i*22}Q160 ${-90+i*24} 440 ${185+i*16}T1080 ${80+i*31}`}/>)}</g>}
   {theme.id==='music'&&<g stroke="currentColor" strokeWidth="1.5">{[0,1,2,3,4].map(i=><path key={i} d={`M-40 ${70+i*15}Q270 ${180+i*15} 530 ${75+i*15}T1040 ${80+i*15}`}/>)}{[110,880].map(x=><g key={x}><circle cx={x} cy="480" r="95"/><circle cx={x} cy="480" r="75"/><circle cx={x} cy="480" r="22" fill="currentColor" opacity=".3"/></g>)}</g>}
   {theme.id==='finale'&&<g stroke="currentColor" strokeWidth="1.5"><path d="M90 560V210Q500-140 910 210V560M115 560V224Q500-95 885 224V560"/><path d="M500 10l12 28 28 12-28 12-12 28-12-28-28-12 28-12Z" fill="currentColor"/><path d="M40 530H250M750 530H960" strokeDasharray="3 9"/></g>}
  </svg>
  {Array.from({length:32},(_,i)=><span key={i} className="daily-particle" style={{'--x':((i*37+11)%100)+'%','--y':((i*61+7)%100)+'%','--size':(5+i%5*3)+'px','--delay':(-i*.61)+'s','--duration':(7+i%7)+'s','--dx':((i%2?1:-1)*(18+i%4*12))+'px'} as CSSProperties}>{marks[i%marks.length]}</span>)}
 </div>;
});
