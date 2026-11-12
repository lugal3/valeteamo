// Short original rhythms for the two dances, aligned with their pose accents.
const rhythms={
 'six-seven':{beat:.36,notes:[48,48,55,50,53,53,57,50]},
 gangnam:{beat:.48,notes:[43,55,46,55,48,58,46,53]},
 'what-is-love':{beat:.44,notes:[65,69,72,69,62,67,70,74]}
};

export function playEmoteRhythm(context,output,id,duration){
 const rhythm=rhythms[id];if(!rhythm)return null;
 const voices=new Set(),start=context.currentTime+.025;
 function note(at,length,frequency,volume,type,endFrequency=frequency){
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(endFrequency,at+length);
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
  osc.connect(gain);gain.connect(output);voices.add(osc);
  osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
  osc.start(at);osc.stop(at+length);
 }
 for(let i=0;i*rhythm.beat+.18<duration;i++){
  const at=start+i*rhythm.beat,pitch=440*2**((rhythm.notes[i%rhythm.notes.length]-69)/12);
  note(at,.13,130,.34,'sine',46);
  note(at+.04,.12,pitch,.17,'triangle');
  note(at+rhythm.beat*.5,.045,i%2?2750:1870,.042,'square',900);
 }
 return {stop(){for(const osc of voices)osc.stop();}};
}
