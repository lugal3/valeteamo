// Exercise Settings through the same phone controls a player uses.
module.exports=async function togglePhoneSettings(page){
 const panel=page.locator('#lab-camera-settings');
 const screen=page.locator('.phone-screen');
 if(await panel.isVisible()){
  await page.locator('.phone-shell [data-app=close]').click();
  await panel.waitFor({state:'hidden'});
  return;
 }
 if(!await screen.isVisible()){
  const phone=page.locator('[data-equip=phone]');
  const use=page.getByRole('button',{name:'Usar teléfono',exact:true});
  await phone.waitFor({state:'visible'});
  if(await phone.getAttribute('aria-pressed')!=='true')await phone.click();
  // Require the actual equipped state, not just a completed pointer event.
  await page.waitForFunction(()=>document.querySelector('[data-equip=phone]')?.getAttribute('aria-pressed')==='true');
  await use.waitFor({state:'visible'});
  await use.click();
  await screen.waitFor({state:'visible'});
 }
 const settings=screen.locator('[data-app=settings]');
 if(!await settings.isVisible())await screen.locator('.phone-home-indicator').click();
 await settings.click();
 await panel.waitFor({state:'visible'});
};
