import {journeyEcho,type JourneyMemory,type PrologueLine} from './prologue-story.js';
import type {EpilogueStage} from './epilogue-progress.js';
export const EPILOGUE_DIALOGUES:Record<Exclude<EpilogueStage,'complete'>,PrologueLine[]>={
 outside:[{speaker:'Louis',tone:'calm',text:'Ya dejamos la casa atrás… Gracias por volver por mí.'},{speaker:'Kitty',tone:'warm',text:'Emy nos acompañó hasta el final. Ahora volvamos con los demás.'}],
 'return-path':[{speaker:'Louis',tone:'warm',text:'El mismo camino parece distinto cuando ya no tenemos miedo.'},{speaker:'Kitty',tone:'warm',text:'Vamos juntos. Nos están esperando.'}],
 reunion:[{speaker:'Vale',tone:'warm',text:'¡Volvieron! Estábamos tan preocupados.'},{speaker:'Luis',tone:'warm',text:'Qué bueno verlos a los tres. Emy también se merece un premio.'},{speaker:'Louis',tone:'warm',text:'No habría llegado sin Kitty y Emy.'},{speaker:'Vale',tone:'warm',text:'Vengan, todavía queda algo bonito por celebrar.'}],
 celebration:[{speaker:'Luis',tone:'warm',text:'Después de tantas aventuras, por fin estamos todos aquí.'},{speaker:'Vale',tone:'warm',text:'¡Qué bonito terminar el día juntos!'},{speaker:'Kitty',tone:'warm',text:'Pidamos un deseo y guardemos este momento. ¡Feliz cumpleaños, Vale!'}]
};
// Draft generic closing text; personal letter remains under user's control.
export const EPILOGUE_LETTER='Que nunca falten los momentos pequeños, las risas, las aventuras y las personas que hacen que el camino valga la pena. Feliz cumpleaños, Vale. ♡';

// Replace existing dialogue beats instead of adding required conversations.
export function epilogueDialogue(stage:Exclude<EpilogueStage,'complete'>,memory?:JourneyMemory):PrologueLine[]{
 const lines=EPILOGUE_DIALOGUES[stage].map(line=>({...line}));
 if(!memory)return lines;
 if(stage==='outside'&&memory.fedEmy)lines[1].text='Desde aquel Churu, Emy no nos ha dejado solos. Ahora volvamos con los demás.';
 if(stage==='return-path')lines[1].text=journeyEcho(memory);
 if(stage==='reunion'&&memory.metCouple)lines[1].text='Recibí tu aviso antes de entrar. Qué alivio verlos a los tres. Emy merece un premio.';
 return lines;
}
