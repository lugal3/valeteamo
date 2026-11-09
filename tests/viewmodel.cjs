const assert = require('node:assert/strict');

(async () => {
 const { VIEWMODEL_CONFIG, viewModelPieces, flashlightPieces, dustPieces } = await import('../src/lab/viewmodel.js');
 const { geometry } = await import('../src/lab/renderer.js');

 // 1. Config matches Variant C
 assert.equal(VIEWMODEL_CONFIG.flashlight.x, 0.38, 'Variant C x position');
 assert.equal(VIEWMODEL_CONFIG.flashlight.y, -0.36, 'Variant C y position');
 assert.equal(VIEWMODEL_CONFIG.flashlight.z, 1.10, 'Variant C z position');
 assert.equal(VIEWMODEL_CONFIG.flashlight.scale, 0.72, 'Variant C scale');
 assert.equal(VIEWMODEL_CONFIG.flashlight.tiltY, 0, 'Variant C tiltY');

 // 2. Budget verification: <= 1500 triangles
 const on = geometry(flashlightPieces(true));
 const off = geometry(flashlightPieces(false));
 const trisOn = on.indices.length / 3;
 const trisOff = off.indices.length / 3;
 assert(trisOn <= 1500, `Triangles on (${trisOn}) must be <= 1500`);
 assert(trisOff <= 1500, `Triangles off (${trisOff}) must be <= 1500`);
 assert.equal(trisOn, trisOff, 'Topology must be identical for on and off');
 assert.equal(on.vertices.length, off.vertices.length, 'Vertex buffer length identical');

 // 3. Sinking switch: switch piece y coordinate drops when flashlight is on
 const piecesOn = flashlightPieces(true);
 const piecesOff = flashlightPieces(false);
 const switchOn = piecesOn.find(p => p.id.includes('torch-switch'));
 const switchOff = piecesOff.find(p => p.id.includes('torch-switch'));
 assert(switchOn && switchOff, 'Switch piece exists');
 assert(switchOn.y < switchOff.y, `Switch sinks when on (${switchOn.y} < ${switchOff.y})`);

 // 4. Charm bow exists on torch
 assert(piecesOn.some(p => p.id.includes('charm-knot')), 'Charm knot exists');
 assert(piecesOn.some(p => p.id.includes('charm-left')), 'Charm bow wing exists');

 // 5. Lens highlight and halo exist
 assert(piecesOn.some(p => p.id.includes('torch-lens')), 'Torch lens exists');
 assert(piecesOn.some(p => p.id.includes('torch-lens-highlight')), 'Torch lens highlight exists');
 assert(piecesOn.some(p => p.id.includes('torch-lens-halo')), 'Torch lens halo exists');

 // 6. Hello Kitty mitten paw: palm, thumb, knuckles, cuff, sleeve
 assert(piecesOn.some(p => p.id.includes('hand-palm')), 'Hand palm exists');
 assert(piecesOn.some(p => p.id.includes('hand-thumb')), 'Hand thumb exists');
 assert(piecesOn.some(p => p.id.includes('hand-cuff')), 'Hand pink cuff exists');
 assert(piecesOn.some(p => p.id.includes('hand-sleeve')), 'Hand pink sleeve exists');

 // 7. Dust pieces in beam
 const dust = dustPieces(true);
 assert.equal(dust.length, 4, '4 dust motes in beam');

 console.log(`PASS viewmodel: Variant C config, budget ${trisOn} <= 1500 tris, sinking switch, charm bow, lens halo, Hello Kitty mitten and dust motes`);
})().catch(e => {
 console.error(e);
 process.exitCode = 1;
});

