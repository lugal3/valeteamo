// Opt-in, bounded frame interval sampler. Uses actual painted frame cadence,
// not the clamped gameplay dt. CPU time is submission time, not GPU time.
export function createFrameSampler(capacity=600){
 const size=Math.max(2,Math.min(1800,Math.floor(capacity)||600));
 const intervals=new Float64Array(size),cpu=new Float64Array(size);
 let cursor=0,count=0,last=null;
 return {
  reset(){cursor=0;count=0;last=null;},
  pause(){last=null;},
  record(now,cost){
   if(!Number.isFinite(now)||!Number.isFinite(cost)||cost<0)return;
   if(last!==null&&now>last){
    intervals[cursor]=now-last;cpu[cursor]=cost;
    cursor=(cursor+1)%size;count=Math.min(size,count+1);
   }
   last=now;
  },
  report(){
   if(!count)return {samples:0,fps:0,p95:0,p99:0,low1:0,hitches:0,cpuP95:0};
   const frames=Array.from(intervals.subarray(0,count)).sort((a,b)=>a-b);
   const work=Array.from(cpu.subarray(0,count)).sort((a,b)=>a-b);
   const pct=(values,p)=>values[Math.max(0,Math.ceil(values.length*p)-1)];
   const sum=frames.reduce((a,b)=>a+b,0);
   const slow=frames.slice(-Math.max(1,Math.ceil(count*.01)));
   return {samples:count,fps:1000*count/sum,p95:pct(frames,.95),p99:pct(frames,.99),
    low1:1000*slow.length/slow.reduce((a,b)=>a+b,0),
    hitches:frames.filter(ms=>ms>50).length,cpuP95:pct(work,.95)};
  }
 };
}
