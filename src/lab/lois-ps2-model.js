// Lois / option B: alternate, budgeted PlayStation 2-era body and face.
// Built as ordinary scene primitives for the existing WebGL1 pipeline;
// no glTF loader, no network downloads, no extra scene or animation loop.
import {LOIS_PS2_PROFILE} from './lois-ps2-profile.js';
import {loisBoneForPart} from './lois-ps2-rig.js';

export const LOIS_PS2_VARIANT='ps2-b';

// All lengths are metres. Each piece keeps an identifier understood by the
// existing legacy animation adapter; rigGroup marks attachments for phase 4.
export function buildLoisPs2Model(piece,{quality='mobile',photoMode=false}={}){
 const desktop=quality==='desktop';
 const p=LOIS_PS2_PROFILE.palette,parts=[];
 const add=(id,x,y,z,w,h,d,mat,color,extra={})=>
  parts.push(piece(id,x,y+(photoMode&&loisBoneForPart(id)==='head'?.065:0),z,w,h,d,mat,{color,...extra,
   photoMapped:photoMode&&(id==='face'||id.startsWith('hair-')||id.startsWith('fringe-')||id.startsWith('temple-')||id==='crown'||id.startsWith('ear-')),
   rigBone:loisBoneForPart(id),rigPart:id}));
 const box={shape:'rounded-box',roundness:.35,segments:desktop?8:6,rings:desktop?5:4};
 const limb={shape:'rounded-box',roundness:.38,segments:desktop?8:6,rings:desktop?5:4};
 const oval={shape:'round',segments:desktop?12:8,rings:desktop?7:4};
 const tiny={shape:'round',segments:desktop?8:6,rings:desktop?4:3};
 // The approved Option A bust wears a navy crewneck instead of the old
 // illustrated PS2 model's blazer. This is visual-only: same actor and rig.
 const jacket=photoMode?[.13,.15,.25]:p.blazer,lapel=[.23,.24,.28],liner=[.24,.26,.31],
  stitch=[.38,.39,.44],shirt=photoMode?[.17,.19,.31]:p.tshirt,skin=p.skin,lip=[.66,.46,.44],
  hair=p.hair,hairLight=[.30,.205,.155],hairShadow=[.145,.095,.076],
  iris=p.eyes,eyeWhite=[.91,.91,.90],ink=[.13,.16,.20];

 // Tailored dark blazer with a light grey crewneck, not a bulky hoodie.
 add('torso',0,1.11,-.015,.468,.56,.305,'dark',jacket,{...box,rigGroup:'body'});
 add('shirt',0,1.12,.140,photoMode?.35:.248,.445,.025,'cream',shirt,{...box,rigGroup:'body'});
 if(photoMode){
  // Minimal dark collar silhouette and no suit lapel covering the neck.
  // Keep the collar behind the photo neck. The earlier black raised
  // strip drew a visible gap between the chin and the navy shirt.
 }else{
 add('collar',0,1.379,.116,.228,.070,.082,'cream',[.91,.89,.87],{...box,rigGroup:'body'});
 for(const side of [-1,1]){
  const x=side*.154;
  add('blazer-panel-'+side,x,1.052,.142,.133,.43,.052,'dark',jacket,{...box,rigGroup:'body'});
  add('lapel-'+side,side*.097,1.328,.178,.106,.246,.033,'dark',lapel,
   {...box,roll:-side*.29,pitch:side*.045,rigGroup:'body'});
  add('lapel-line-'+side,side*.131,1.249,.199,.008,.142,.010,'plaster',stitch,
   {...tiny,roll:-side*.30,rigGroup:'body'});
  add('pocket-'+side,side*.155,1.090,.183,.100,.008,.010,'dark',liner,
   {...box,rigGroup:'body'});
 }
 add('jacket-button',.065,.973,.188,.010,.012,.008,'dark',[.43,.44,.48],{...tiny,rigGroup:'body'});
 }
 add('hips',0,.843,-.006,.356,.185,.237,'dark',p.trousers,{...box,rigGroup:'body'});
 add('neck',0,photoMode?1.460:1.449,.011,
  photoMode?.233:.132,photoMode?.228:.158,photoMode?.175:.133,'paper',
  photoMode?[.78,.61,.53]:skin,
  photoMode?{shape:'lois-neck-lowpoly',segments:10,rings:3,rigGroup:'body'}:
   {...oval,rigGroup:'body'});

 // Sculpted head is a single 3D face surface. Cheeks/nose/chin/lips are
 // parametrically deformed in lois-ps2-face.js, *not* stacked colored balls.
 add('face',0,1.610,.006,photoMode?.398:.326,photoMode?.456:.425,photoMode?.276:.318,'paper',skin,
  {shape:'lois-face',segments:desktop?32:24,rings:desktop?18:14,rigGroup:'head'});
 for(const side of [-1,1]){
  add('ear-'+side,side*.171,1.610,-.004,.054,.095,.061,'paper',skin,
   {...oval,rigGroup:'head'});
  if(!photoMode){add('ear-shadow-'+side,side*.197,1.603,.023,.011,.042,.013,'paper',[.69,.46,.40],
   {...tiny,rigGroup:'head'});
  // Facial features are shallow surface overlays only; the head itself is continuous.
  add('brow-'+side,side*.080,1.701,.166,.091,.016,.016,'wood',hairShadow,
   {...tiny,roll:side*.08,rigGroup:'head'});
  add('eye-'+side,side*.078,1.656,.152,.069,.027,.010,'cream',eyeWhite,
   {...oval,rigGroup:'head'});
  add('iris-'+side,side*.079,1.655,.162,.029,.026,.006,'glass',iris,
   {...tiny,rigGroup:'head'});
  add('pupil-'+side,side*.079,1.655,.169,.012,.017,.004,'dark',ink,
   {...tiny,rigGroup:'head'});
  add('glint-'+side,side*.079-.007,1.663,.174,.007,.006,.003,'cream',[1,1,1],
   {...tiny,rigGroup:'head'});
  add('lid-'+side,side*.078,1.673,.158,.073,.012,.013,'paper',skin,
   {...tiny,rigGroup:'head'});
  add('nostril-'+side,side*.026,1.536,.222,.010,.006,.004,'paper',[.52,.33,.31],
   {...tiny,rigGroup:'head'});}
 }
 if(!photoMode){add('upper-lip',0,1.506,.158,.086,.009,.008,'paper',lip,{...tiny,rigGroup:'head'});
 add('lower-lip',0,1.491,.156,.081,.008,.006,'paper',[.74,.54,.49],{...tiny,rigGroup:'head'});
 add('under-lip',0,1.478,.146,.048,.004,.004,'paper',[.74,.57,.51],{...tiny,rigGroup:'head'});}

 // Asymmetric, side-swept chestnut silhouette is the main likeness cue.
 add('hair-back',0,photoMode?1.738:1.725,-.043,
  photoMode?.407:.357,photoMode?.242:.254,photoMode?.310:.306,'wood',hairShadow,
  {shape:'round',segments:desktop?12:10,rings:desktop?6:4,rigGroup:'head'});
 // The actual photo cutouts make the visible tousled crown.
 // Keep this backing volume inset to avoid the bulky spherical helmet.
 add('hair-cap',-.015,photoMode?1.815:1.802,-.027,
  photoMode?.335:.355,photoMode?.132:.153,photoMode?.259:.303,'wood',hair,
  {shape:'round',segments:desktop?12:10,rings:desktop?6:4,rigGroup:'head'});
 if(photoMode){
  // The previous photo variant lost nearly all the tousled hair silhouette:
  // it projected the picture onto small spherical clumps, resembling a helmet.
  // These *real, depth-offset polygon layers* sample the SAME approved source
  // photograph through projectReference() and follow the existing head bone.
  // Points are [source-image x, source-image y], in the original 1408x1056
  // approved "OBJETIVO FINAL" canvas. Only the frontal crop is used; this
  // intentionally does not claim to reconstruct the unseen back of the hair.
  // Preserve the approved image crop while tracing a broken, swept outline
  // instead of the old near-ellipse. Every vertex samples the same photo UV;
  // the small staggered peaks break the helmet silhouette without adding a
  // second cartoon fringe or increasing the number of independent cards.
  const hairLayers=[
   {id:'hair-photo-mass',depth:.139,points:[
    [150,304],[145,257],[153,213],[177,167],[175,145],
    [212,115],[240,93],[267,91],[307,66],[333,60],
    [367,47],[395,43],[425,47],[472,32],[493,39],
    [540,47],[573,60],[597,76],[619,91],
    [654,120],[671,139],[692,177],[710,209],
    [707,238],[713,273],[687,300],[675,310],
    [647,305],[615,311],[578,292],[565,299],
    [489,322],[412,339],[363,355],[315,377],
    [263,389],[238,393],[197,380],[158,371]]},
   {id:'hair-photo-fringe-left',depth:.155,points:[
    [153,307],[160,274],[170,226],[198,215],[242,203],
    [279,221],[310,242],[345,288],[326,324],
    [312,356],[273,383],[233,403],[188,401],[143,394]]},
   {id:'hair-photo-fringe-middle',depth:.168,points:[
    [280,238],[315,218],[365,152],[417,148],[477,143],
    [522,162],[574,199],[562,237],[548,279],
    [496,304],[444,340],[382,350],[331,368],[287,339]]},
   {id:'hair-photo-fringe-right',depth:.152,points:[
    [516,165],[570,168],[617,174],[653,204],
    [688,235],[696,263],[701,288],[677,313],
    [659,334],[612,319],[582,303],[550,255]]}
  ];
  for(const layer of hairLayers)
   add(layer.id,0,0,0,.01,.01,.01,'wood',hair,
    {shape:'lois-photo-hair',photoPolygon:layer.points,photoDepth:layer.depth,rigGroup:'head'});
 }
 // The approved photograph already paints the swept fringe across the
 // forehead. Keep only the two outer hair cards for volume: the old five
 // overlapping rectangles duplicated the hair and created skin-colored seams.
 const fringe=photoMode?[]:[
  [0,-.148,1.754,.098,.116,.122,.40],
  [1,-.106,1.743,.134,.116,.132,.28],
  [2,-.052,1.734,.166,.111,.133,.22],
  [3,.026,1.750,.171,.100,.106,-.12],
  [4,.112,1.775,.117,.114,.094,-.41]
 ];
 for(const [i,x,y,z,w,h,roll] of fringe){
  add('fringe-'+i,x,y,z,w,h,.066,'wood',i%2?hairLight:hair,
   {shape:'rounded-box',roundness:.43,segments:desktop?8:6,rings:desktop?4:4,roll,rigGroup:'head'});
 }
 for(const side of [-1,1]){
  add('temple-'+side,side*(photoMode?.173:.155),1.716,.014,
   photoMode?.104:.088,photoMode?.156:.145,photoMode?.132:.118,'wood',hair,
   {...oval,rigGroup:'head'});
 }
 add('crown',.046,1.871,-.066,.185,.054,.130,'wood',hairShadow,
  {shape:'rounded-box',roundness:.38,segments:desktop?8:6,rings:4,roll:-.15,rigGroup:'head'});

 // Simple articulated silhouette: arm and leg identifiers deliberately remain
 // compatible with louisPartPose until full bone retargeting in phase 4.
 for(const side of [-1,1]){
  add('upper-arm-'+side,side*.285,1.172,-.019,.168,.340,.182,'dark',jacket,
   {...limb,roll:-side*.045,rigGroup:'arm',rigSide:side});
  add('forearm-'+side,side*.308,.940,.021,.145,.258,.154,'dark',jacket,
   {...limb,rigGroup:'arm',rigSide:side});
  add('hand-'+side,side*.315,.764,.078,.095,.132,.107,'paper',skin,
   {...oval,rigGroup:'arm',rigSide:side});
  add('thigh-'+side,side*.123,.647,-.001,.173,.463,.216,'dark',p.trousers,
   {...limb,rigGroup:'leg',rigSide:side});
  add('leg-'+side,side*.123,.291,.014,.148,.445,.184,'dark',p.trousers,
   {...limb,rigGroup:'leg',rigSide:side});
  add('shoe-'+side,side*.123,.083,.108,.192,.142,.277,'dark',p.shoes,
   {...box,rigGroup:'leg',rigSide:side});
  add('sole-'+side,side*.123,.020,.130,.194,.025,.276,'dark',[.19,.19,.21],
   {...box,rigGroup:'leg',rigSide:side});
 }
 return parts;
}
