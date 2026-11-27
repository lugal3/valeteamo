import type {PrologueLine} from './prologue-story.js';
import type {EpilogueStage} from './epilogue-progress.js';
export const EPILOGUE_DIALOGUES:Record<Exclude<EpilogueStage,'complete'>,PrologueLine[]>={
 outside:[{speaker:'Louis',tone:'calm',text:'Ya estamos fuera… Gracias por volver por mí.'},{speaker:'Kitty',tone:'warm',text:'Emy nos acompañó hasta el final. Ahora volvamos con los demás.'}],
 'return-path':[{speaker:'Louis',tone:'warm',text:'El mismo camino parece distinto cuando ya no tenemos miedo.'},{speaker:'Kitty',tone:'warm',text:'Vamos juntos. Nos están esperando.'}],
 reunion:[{speaker:'Vale',tone:'warm',text:'¡Volvieron! Estábamos tan preocupados.'},{speaker:'Luis',tone:'warm',text:'Qué bueno verlos a los tres. Emy también se merece un premio.'},{speaker:'Louis',tone:'warm',text:'No habría llegado sin Kitty y Emy.'},{speaker:'Vale',tone:'warm',text:'Vengan, todavía queda algo bonito por celebrar.'}],
 celebration:[{speaker:'Luis',tone:'warm',text:'Después de tantas aventuras, por fin estamos todos aquí.'},{speaker:'Vale',tone:'warm',text:'¡Qué bonito terminar el día juntos!'},{speaker:'Kitty',tone:'warm',text:'Pidamos un deseo y guardemos este momento. ¡Feliz cumpleaños, Vale!'}]
};
// Draft generic closing text; personal letter remains under user's control.
export const EPILOGUE_LETTER='Que nunca falten los momentos pequeños, las risas, las aventuras y las personas que hacen que el camino valga la pena. Feliz cumpleaños, Vale. ♡';
