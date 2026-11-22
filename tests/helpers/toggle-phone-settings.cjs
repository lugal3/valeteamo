// Exercise Settings through the same phone controls a player uses.
module.exports=async function togglePhoneSettings(page){
 const panel=page.locator('#lab-camera-settings');
 if(await panel.isVisible()){
  await page.locator('.phone-shell [data-app=close]').click();
  await panel.waitFor({state:'hidden'});
  return;
 }
 if(!await page.locator('.phone-screen').isVisible()){
  const phone=page.locator('[data-equip=phone]');
  if(await phone.getAttribute('aria-pressed')!=='true')await phone.click();
  await page.locator('.phone-expand').click();
 }
 if(!await page.locator('[data-app=settings]').isVisible())await page.locator('.phone-shell header [data-app=home]').click();
 await page.locator('[data-app=settings]').click();
 await panel.waitFor({state:'visible'});
};
