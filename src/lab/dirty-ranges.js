// Ranges are float offsets in a shared interleaved vertex buffer.
// Merge overlaps and nearby writes without changing any vertex. Memory stays
// bounded even if the mirror is out of sight for an entire play session.
export function createDirtyRanges(maxRanges=32,gap=0){
 const ranges=[];
 return {
  add(start,end){
   if(end<=start)return;
   let i=0;while(i<ranges.length&&ranges[i][1]+gap<start)i++;
   let j=i;
   while(j<ranges.length&&ranges[j][0]<=end+gap){
    start=Math.min(start,ranges[j][0]);end=Math.max(end,ranges[j][1]);j++;
   }
   ranges.splice(i,j-i,[start,end]);
   if(ranges.length>maxRanges)ranges.splice(0,ranges.length,[ranges[0][0],ranges[ranges.length-1][1]]);
  },
  drain(){return ranges.splice(0);},
  clear(){ranges.length=0;}
 };
}
export function reflectVertexRange(source,target,start,end,reflect){
 const view=target.subarray(start,end);view.set(source.subarray(start,end));reflect(view);return view;
}
