// Exercise the same visible numbered slot that a keyboard player selects.
module.exports=async(page,item)=>{
 const entries=page.locator('.house-hotbar [data-equip]:not([hidden])');
 const names=await entries.evaluateAll(buttons=>buttons.map(button=>button.dataset.equip));
 const index=names.indexOf(item);
 if(index<0)throw Error('Missing hotbar item: '+item);
 const slot=String(index+1);
 if(await entries.nth(index).locator('small').textContent()!==slot)throw Error('Incorrect hotbar number');
 await page.keyboard.press(slot);
};
