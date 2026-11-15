// Lois / option B: alternate, budgeted PlayStation 2-era body and face.
// Built as ordinary scene primitives for the existing WebGL1 pipeline;
// no glTF loader, no network downloads, no extra scene or animation loop.
import {LOIS_PS2_PROFILE} from './lois-ps2-profile.js';
import {loisBoneForPart} from './lois-ps2-rig.js';

export const LOIS_PS2_VARIANT='ps2-b';

// All lengths are metres. Each piece keeps an identifier understood by the
// existing legacy animation adapter; rigGroup marks attachments for phase 4.
export function buildLoisPs2Model(piece,{quality='mobile'}={}){
 const desktop=quality==='desktop';
 const p=LOIS_PS2_PROFILE.palette,parts=[];
 const add=(id,x,y,z,w,h,d,mat,color,extra={})=>
  parts.push(piece(id,x,y,z,w,h,d,mat,{color,...extra,rigBone:loisBoneForPart(id),rigPart:id}));
 const box={shape:'rounded-box',roundness:.35,segments:desktop?8:6,rings:desktop?5:4};
 const limb={shape:'rounded-box',roundness:.38,segments:desktop?8:6,rings:desktop?5:4};
 const oval={shape:'round',segments:desktop?12:8,rings:desktop?7:4};
 const tiny={shape:'round',segments:desktop?8:6,rings:desktop?4:3};
 const jacket=p.blazer,lapel=[.23,.24,.28],liner=[.24,.26,.31],
  stitch=[.38,.39,.44],shirt=p.tshirt,skin=p.skin,lip=[.66,.46,.44],
  hair=p.hair,hairLight=[.30,.205,.155],hairShadow=[.145,.095,.076],
  iris=p.eyes,eyeWhite=[.91,.91,.90],ink=[.13,.16,.20];

 // Tailored dark blazer with a light grey crewneck, not a bulky hoodie.
 add('torso',0,1.11,-.015,.445,.56,.305,'dark',jacket,{...box,rigGroup:'body'});
 add('shirt',0,1.12,.140,.248,.445,.025,'cream',shirt,{...box,rigGroup:'body'});
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
 add('hips',0,.843,-.006,.356,.185,.237,'dark',p.trousers,{...box,rigGroup:'body'});
 add('neck',0,1.449,.011,.132,.158,.133,'paper',skin,{...oval,rigGroup:'body'});

 // Sculpted head is a single 3D face surface. Cheeks/nose/chin/lips are
 // parametrically deformed in lois-ps2-face.js, *not* stacked colored balls.
 add('face',0,1.610,.006,.326,.425,.318,'paper',skin,
  {shape:'lois-face',segments:desktop?32:24,rings:desktop?18:14,rigGroup:'head'});
 for(const side of [-1,1]){
  add('ear-'+side,side*.171,1.610,-.004,.054,.095,.061,'paper',skin,
   {...oval,rigGroup:'head'});
  add('ear-shadow-'+side,side*.197,1.603,.023,.011,.042,.013,'paper',[.69,.46,.40],
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
   {...tiny,rigGroup:'head'});
 }
 add('upper-lip',0,1.506,.158,.086,.009,.008,'paper',lip,{...tiny,rigGroup:'head'});
 add('lower-lip',0,1.491,.156,.081,.008,.006,'paper',[.74,.54,.49],{...tiny,rigGroup:'head'});
 add('under-lip',0,1.478,.146,.048,.004,.004,'paper',[.74,.57,.51],{...tiny,rigGroup:'head'});

 // Asymmetric, side-swept chestnut silhouette is the main likeness cue.
 add('hair-back',0,1.725,-.043,.357,.254,.306,'wood',hairShadow,
  {shape:'round',segments:desktop?12:10,rings:desktop?6:4,rigGroup:'head'});
 add('hair-cap',-.015,1.802,-.004,.355,.153,.303,'wood',hair,
  {shape:'round',segments:desktop?12:10,rings:desktop?6:4,rigGroup:'head'});
 for(const [i,x,y,z,w,h,roll] of [
  [0,-.148,1.754,.098,.116,.122,.40],
  [1,-.106,1.743,.134,.116,.132,.28],
  [2,-.052,1.734,.166,.111,.133,.22],
  [3,.026,1.750,.171,.100,.106,-.12],
  [4,.112,1.775,.117,.114,.094,-.41]
 ]){
  add('fringe-'+i,x,y,z,w,h,.066,'wood',i%2?hairLight:hair,
   {shape:'rounded-box',roundness:.43,segments:desktop?8:6,rings:desktop?4:4,roll,rigGroup:'head'});
 }
 for(const side of [-1,1]){
  add('temple-'+side,side*.155,1.716,.014,.088,.145,.118,'wood',hair,
   {...oval,rigGroup:'head'});
 }
 add('crown',.046,1.871,-.066,.185,.054,.130,'wood',hairShadow,
  {shape:'rounded-box',roundness:.38,segments:desktop?8:6,rings:4,roll:-.15,rigGroup:'head'});

 // Simple articulated silhouette: arm and leg identifiers deliberately remain
 // compatible with louisPartPose until full bone retargeting in phase 4.
 for(const side of [-1,1]){
  add('upper-arm-'+side,side*.305,1.172,-.019,.150,.330,.175,'dark',jacket,
   {...limb,roll:-side*.045,rigGroup:'arm',rigSide:side});
  add('forearm-'+side,side*.317,.940,.021,.134,.247,.147,'dark',jacket,
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
