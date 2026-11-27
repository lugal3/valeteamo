import {dialogueGlyphs,dialogueDelay,dialogueVoice} from '../demo/dialogue-feel.js';
import {startLoisReaction} from './lois-ps2-reactions.js';
const line=(speaker,text,tone)=>({speaker,text,tone});
const scripts={
 captive:[[line('Kitty','Louis… soy yo. Voy a sacarte de aquí.','whisper'),line('Louis','Kitty… sabía que vendrías. Ten cuidado, por favor.','whisper')],[line('Louis','La llave está junto a mí. No quiero que vuelvas por ella.','whisper')]],
 hidden:[[line('Kitty','Quédate detrás de la barra. Yo prepararé la salida.','whisper'),line('Louis','De acuerdo. Si escucho algo, no me moveré.','whisper')],[line('Louis','Estoy bien aquí. Confío en ti, Kitty.','calm')]],
 follow:[[line('Louis','Gracias por volver por mí. ¿Nos vamos juntos?','warm'),line('Kitty','Sí. Emy nos ayudará a salir.','warm')],[line('Louis','No quiero quedarme atrás. Vamos hacia la salida.','calm')]],
 garden:[[line('Louis','¡Lo conseguimos! Gracias, Kitty… y gracias, Emy.','warm'),line('Kitty','Ya casi estamos a salvo. Vamos juntos.','warm')]]
};
export function loisDialogueContext(actor,phase,finalePlayable=false){
 if(!actor||actor.taken)return null;
 if(finalePlayable&&actor.phase==='follow')return 'garden';
 if(actor.phase==='hidden'&&phase==='rc-setup'&&actor.age>=1.6)return 'hidden';
 if(actor.phase==='follow'&&phase==='escape'&&!actor.exitRouteActive)return 'follow';
 if(actor.id==='captive-louis'&&actor.phase==='untying'&&['evaded','explore'].includes(phase))return 'captive';
 return null;
}
export function canTalkToLois(actor,player,context,clearRay){
 return !!(actor&&player&&context&&!player.hidden&&!player.lying&&Math.abs(actor.y-player.y)<.75&&Math.hypot(actor.x-player.x,actor.z-player.z)<=1.85&&clearRay({x:actor.x,y:actor.y+(context==='hidden'?.70:context==='captive'?1.24:1.55),z:actor.z}));
}
export function createLoisDialogue(){
 let session=null;const visits={};
 const quiet=()=>{if(session){session.actor.dialogueSpeaking=false;if(session.actor.visualReaction?.type==='speak')session.actor.visualReaction=null;}};
 const load=()=>{const line=session.lines[session.index];Object.assign(session,{line,glyphs:dialogueGlyphs(line.text),shown:0,remaining:0});session.remaining=dialogueDelay(session.glyphs,0,line.tone);session.actor.dialogueSpeaking=line.speaker==='Louis';if(session.actor.dialogueSpeaking)startLoisReaction(session.actor,'speak',Math.min(8,Math.max(.5,session.glyphs.length*.065)));};
 const close=()=>{quiet();session=null;};
 return {get active(){return session;},
 open(actor,context){if(!scripts[context]||session)return false;const groups=scripts[context],i=Math.min(visits[context]||0,groups.length-1);visits[context]=(visits[context]||0)+1;session={actor,context,lines:groups[i],index:0};load();return true;},
 tick(ms,voice=()=>{}){if(!session||!Number.isFinite(ms)||ms<=0)return;session.remaining-=Math.min(ms,150);let chirps=0;while(session.shown<session.glyphs.length&&session.remaining<=0){const i=session.shown++,v=dialogueVoice(session.glyphs,i,session.line.speaker,session.line.tone);if(v&&chirps++<2)voice(v);session.remaining+=dialogueDelay(session.glyphs,session.shown,session.line.tone);}if(session.shown===session.glyphs.length)quiet();},
 next(){if(!session)return false;if(session.shown<session.glyphs.length){session.shown=session.glyphs.length;quiet();return true;}quiet();if(++session.index>=session.lines.length){close();return false;}load();return true;},close,reset(){close();for(const k of Object.keys(visits))delete visits[k];}};
}
