import type {CSSProperties} from 'react';

/** Mascotas originales de sustitución. Los sprites definitivos se configuran después. */
export function GalaxyCouple({size='normal',className=''}:{size?:'normal'|'small';className?:string}){
 const small=size==='small';
 return <svg className={'video-galaxy-couple '+className} viewBox="0 0 250 185" width={small?68:206} height={small?52:153} role="img" aria-label="Dos pequeñas mascotas blancas abrazadas y rodeadas de corazones" xmlns="http://www.w3.org/2000/svg">
  <defs>
   <radialGradient id="vgal-couple-shadow"><stop stopColor="#ffbdd9" stopOpacity=".65"/><stop offset="1" stopColor="#ffbdd9" stopOpacity="0"/></radialGradient>
  </defs>
  <ellipse cx="130" cy="169" rx="83" ry="12" fill="url(#vgal-couple-shadow)"/>
  <g className="video-couple-bunny" stroke="#3c2631" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
   <path d="M150 75 C145 48 144 18 150 13 C162 5 174 34 175 54 C186 23 202 14 206 22 C213 32 196 61 190 80" fill="#fffaf8"/>
   <path d="M158 69 Q176 64 193 75 Q210 87 205 113 Q200 128 180 134 Q160 140 148 125 Q131 105 144 86 Q148 77 158 69Z" fill="#fffaf8"/>
   <path d="M151 89 Q134 93 129 110 Q120 134 139 143 L177 142 Q190 137 186 126 Q181 121 173 123 L161 121" fill="#fff8f5"/>
   <path d="M160 38 Q164 31 169 48 M186 57 Q196 33 201 30" stroke="#f4b5ce" strokeWidth="3" fill="none"/>
   <ellipse cx="164" cy="99" rx="3.5" ry="5" fill="#33232a"/><ellipse cx="191" cy="98" rx="3.5" ry="5" fill="#33232a"/>
   <path d="M177 110 q3 6 7 0" fill="none"/><ellipse cx="151" cy="111" rx="9" ry="4" fill="#ffbdd1" stroke="none"/><ellipse cx="199" cy="110" rx="7" ry="4" fill="#ffbdd1" stroke="none"/>
   <path d="M143 139 q10 -6 15 6 M180 140 q12 -2 17 -9" strokeWidth="3" fill="none"/>
  </g>
  <g className="video-couple-kitty" stroke="#3c2631" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
   <path d="M55 115 C47 88 46 65 55 59 L74 70 Q94 57 119 66 L136 55 Q145 80 139 104 Q136 129 110 137 L77 137 Q60 132 55 115Z" fill="#fffdf8"/>
   <ellipse cx="98" cy="148" rx="36" ry="29" fill="#fff9f5"/>
   <path d="M73 126 q-23 0 -24 15 Q50 151 72 154 M119 130 q21 -6 28 6 Q152 145 133 151" fill="#fff9f5"/>
   <ellipse cx="76" cy="104" rx="4" ry="5" fill="#30212a" stroke="none"/><ellipse cx="117" cy="102" rx="4" ry="5" fill="#30212a" stroke="none"/>
   <path d="M92 108 Q96 104 101 108 Q97 114 92 108" fill="#f4afc1" strokeWidth="1.2"/>
   <path d="M57 111 L40 105 M59 118 L38 117 M130 110 L146 103 M129 118 L148 119" strokeWidth="1.5" fill="none"/>
   <ellipse cx="67" cy="115" rx="8" ry="4" fill="#ffc0cc" stroke="none"/><ellipse cx="125" cy="113" rx="7" ry="4" fill="#ffc0cc" stroke="none"/>
   <path d="M73 132 Q96 146 118 132 M94 134 v28" fill="none"/>
   <path d="M111 78 Q119 64 129 72 Q139 79 126 91 Q118 87 111 78Z" fill="#fb8db5" stroke="#bc537e" strokeWidth="2"/>
   <circle cx="124" cy="79" r="4" fill="#fff4ee" stroke="none"/>
  </g>
  <g fill="#ff90bf" stroke="#ffb6d5" strokeWidth="1.7">
   <path d="M35 48 C26 38 19 43 20 52 C22 61 36 68 36 68 C36 68 51 57 50 47 C49 38 40 39 35 48Z"/>
   <path d="M123 30 C117 23 111 26 112 33 C113 40 123 45 123 45 C123 45 134 38 134 31 C134 24 128 24 123 30Z"/>
   <path d="M220 93 C216 88 210 92 211 97 C213 102 221 108 221 108 C221 108 230 100 229 95 C228 90 224 89 220 93Z"/>
  </g>
  <g fill="#ffe6f3"><circle cx="34" cy="78" r="2.3"/><circle cx="220" cy="62" r="2.5"/><circle cx="110" cy="25" r="1.4"/></g>
 </svg>;
}
export function PixelMascot({className='',style}:{className?:string;style?:CSSProperties}){
 return <svg className={'video-pixel-mascot '+className} style={style} viewBox="0 0 48 48" aria-hidden="true" shapeRendering="crispEdges">
  <g fill="#ffb7d6"><path d="M8 13h5V7h8v5h7V7h8v8h4v20h-5v6H13v-6H8z"/></g>
  <g fill="#fff5f5"><path d="M13 15h22v22H13z"/><path d="M16 9h3v10h-3zM30 9h3v10h-3z"/></g>
  <g fill="#402336"><path d="M17 24h4v5h-4zM28 24h4v5h-4z"/></g>
  <g fill="#f395b7"><path d="M22 31h5v3h-5zM12 30h4v3h-4zM33 30h4v3h-4z"/></g>
  <path d="M35 12h6v5h-6zM39 9h5v4h-5z" fill="#e9559a"/>
 </svg>;
}
