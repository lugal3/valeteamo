// Keep browser tests independent of the date on the machine running them.
module.exports=async function passBirthdayCountdown(page){
 await page.locator('.birthday-countdown,.splash-start').first().waitFor({timeout:20000});
 const gear=page.getByRole('button',{name:'Administración',exact:true});
 if(!await gear.isVisible())return;
 await gear.click();
 await page.getByLabel('Código de acceso').fill('LP');
 await page.getByRole('dialog',{name:'Administración'}).getByRole('button',{name:'Entrar',exact:true}).click();
};
