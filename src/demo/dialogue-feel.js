// Presentation-only timing. Story events and save state remain untouched.
export const DIALOGUE_TONES=Object.freeze({
 warm:{interval:34,pause:1,pitch:1,volume:.026},
 calm:{interval:38,pause:1.1,pitch:.94,volume:.023},
 suspense:{interval:58,pause:1.65,pitch:.78,volume:.020},
 alarm:{interval:26,pause:1.35,pitch:1.14,volume:.030},
 whisper:{interval:52,pause:1.5,pitch:.82,volume:.014}
});
const voices={Kitty:740,Vale:620,Louis:420,Luis:330};
export function dialogueGlyphs(text){
 // Spanish accents, composed characters and emoji are each one visible glyph.
 return typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('es',{granularity:'grapheme'}).segment(text),s=>s.segment):Array.from(text.normalize('NFC'));
}
export function dialogueDelay(glyphs,index,tone='calm'){
 const p=DIALOGUE_TONES[tone]||DIALOGUE_TONES.calm;
 if(index<=0)return 65;
 const previous=glyphs[index-1];
 // Consecutive dots are a single dramatic pause, not three long waits.
 if(previous==='.'&&glyphs[index]==='.')return p.interval;
 const pause=/[.!?…]/u.test(previous)?230:/[,;:]/u.test(previous)?115:/\s/u.test(previous)?12:0;
 return p.interval+pause*p.pause;
}
export function dialogueVoice(glyphs,index,speaker,tone='calm'){
 const g=glyphs[index]||'',p=DIALOGUE_TONES[tone]||DIALOGUE_TONES.calm;
 if(!/\p{L}|\p{N}/u.test(g))return null;
 // One soft chirp per vowel group / word onset, not one oscillator per space.
 const prev=glyphs[index-1]||'',vowel=/[aeiouáéíóúü]/iu;
 if(index>0&&/\p{L}|\p{N}/u.test(prev)&&(!vowel.test(g)||vowel.test(prev)))return null;
 const jitter=1+((g.codePointAt(0)%7)-3)*.028;
 return {frequency:Math.round((voices[speaker]||480)*p.pitch*jitter),duration:tone==='whisper'?.027:.042,volume:p.volume};
}
export function dialogueWords(glyphs){
 const words=[];let word=[];
 for(const [index,glyph] of glyphs.entries()){
  if(/\s/u.test(glyph)){if(word.length)words.push(word);words.push([{glyph,index}]);word=[];}
  else word.push({glyph,index});
 }
 if(word.length)words.push(word);
 return words;
}
