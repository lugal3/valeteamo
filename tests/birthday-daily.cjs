const assert=require('node:assert/strict');
(async()=>{
 const {DAILY_THEMES,dailyThemeIndex,previewSeconds}=await import('../src/birthday-daily.js');
 assert.equal(DAILY_THEMES.length,8);
 assert.equal(new Set(DAILY_THEMES.map(t=>t.id)).size,8);
 assert.equal(new Set(DAILY_THEMES.map(t=>t.message)).size,8);
 for(let i=0;i<8;i++){
  const midnight=Date.UTC(2026,10,27+i,3);
  assert.equal(dailyThemeIndex(midnight),i);
  assert.equal(dailyThemeIndex(midnight+86399999),i);
  assert.equal(dailyThemeIndex(midnight-1),Math.max(0,i-1));
  assert.equal(previewSeconds(i),(8-i)*86400-43200);
 }
 assert.equal(dailyThemeIndex(Date.parse('2026-12-05T03:00:00Z')),7);
 assert.equal(dailyThemeIndex(Date.parse('2026-11-01T03:00:00Z')),0);
 console.log('PASS daily countdown: 8 unique themes, Chilean midnight boundaries, preview independent of real clock');
})().catch(e=>{console.error(e);process.exitCode=1;});
