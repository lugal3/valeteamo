const CLIP_URL=new URL('./media/television.mp4',import.meta.url).href;

export class HouseTelevision {
 constructor(){
  this.video=document.createElement('video');
  this.video.preload='none';this.video.muted=true;this.video.loop=true;this.video.playsInline=true;
  this.powered=false;this.playing=false;
 }
 sync(powered,playing){
  if(!powered&&this.powered){
   this.video.pause();
   if(this.video.readyState)this.video.currentTime=0;
  }
  this.powered=powered;
  const shouldPlay=powered&&playing;
  if(shouldPlay===this.playing)return;
  this.playing=shouldPlay;
  if(shouldPlay){
   if(!this.video.hasAttribute('src'))this.video.src=CLIP_URL;
   void this.video.play().catch(()=>{});
  }else this.video.pause();
 }
 destroy(){
  this.sync(false,false);
  this.video.removeAttribute('src');this.video.load();
 }
}
