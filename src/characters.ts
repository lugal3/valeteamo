export type CharacterId = 'kitty' | 'louis';
export const CHARACTERS:Record<CharacterId,{name:string,description:string,spriteSheet:string|null}> = {
 kitty:{name:'Kitty',description:'Un lazo, mucho amor y una aventura.',spriteSheet:null},
 louis:{name:'Louis',description:'Rayas marineras y un corazón de One Direction.',spriteSheet:null}
};
export const SPRITE = {width:16,height:20,columns:6,rows:8};
