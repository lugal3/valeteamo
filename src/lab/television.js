const VIDEO_ID='jyCmnvBbm8Q';
const CLIP={videoId:VIDEO_ID,startSeconds:0,endSeconds:15};
const WATCH_URL='https://www.youtube.com/watch?v='+VIDEO_ID;
let apiPending;

function playerAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 apiPending??=new Promise((resolve,reject)=>{
  const script=document.createElement('script'),previous=window.onYouTubeIframeAPIReady;
  const finish=error=>{
   clearTimeout(timeout);
   if(window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;
   if(error){script.remove();reject(error);}else resolve(window.YT);
  };
  const ready=()=>{finish();previous?.();};
  const timeout=setTimeout(()=>finish(Error('Tiempo de espera de YouTube agotado')),12000);
  window.onYouTubeIframeAPIReady=ready;
  script.src='https://www.youtube.com/iframe_api';
  script.onerror=()=>finish(Error('No se pudo cargar YouTube'));
  document.head.append(script);
 }).catch(error=>{apiPending=null;throw error;});
 return apiPending;
}

export function turnOnTelevision(container,{muted=false}={}){
 const frame=document.createElement('iframe'),status=document.createElement('span'),link=document.createElement('a');
 const query=new URLSearchParams({enablejsapi:'1',origin:location.origin,playsinline:'1',rel:'0',start:String(CLIP.startSeconds),end:String(CLIP.endSeconds)});
 frame.src=`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?${query}`;
 frame.title='Televisor de la casa · video de YouTube';
 frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;
 frame.referrerPolicy='strict-origin-when-cross-origin';
 status.className='house-tv-status';status.setAttribute('role','status');status.textContent='Sintonizando…';
 link.href=WATCH_URL;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir en YouTube';link.hidden=true;
 container.append(frame,status,link);
 let active=true,player=null,resume=false,hasPlayed=false,failed=false;
 const playbackFailed=message=>{
  if(!active)return;
  failed=true;status.textContent=message;status.hidden=false;link.hidden=false;
 };
 function visibility(){
  if(document.hidden){resume=player?.getPlayerState?.()===1;player?.pauseVideo?.();}
  else if(resume){resume=false;player?.playVideo?.();}
 }
 document.addEventListener('visibilitychange',visibility);
 const startup=setTimeout(()=>{
  if(!hasPlayed&&!failed){status.textContent='Si la señal tarda, pulsa ▶ en el reproductor.';link.hidden=false;}
 },8500);
 void playerAPI().then(YT=>{
  if(!active)return;
  player=new YT.Player(frame,{events:{
   onReady:({target})=>{
    if(!active)return;
    if(muted)target.mute();
    if(document.hidden){target.cueVideoById(CLIP);resume=true;}else target.loadVideoById(CLIP);
   },
   onStateChange:({data,target})=>{
    if(!active)return;
    if(data===YT.PlayerState.PLAYING){
     hasPlayed=true;failed=false;status.hidden=link.hidden=true;
     if(document.hidden){resume=true;target.pauseVideo();}
    }else if(data===YT.PlayerState.ENDED&&hasPlayed&&!failed){
     if(document.hidden){target.cueVideoById(CLIP);resume=true;}else target.loadVideoById(CLIP);
    }
   },
   onAutoplayBlocked:()=>{if(active){status.textContent='Pulsa ▶ para reproducir el canal.';status.hidden=false;}},
   onError:()=>playbackFailed('YouTube no pudo reproducir este video dentro de la tele.')
  }});
 }).catch(()=>playbackFailed('No se pudo conectar con YouTube.'));
 return ()=>{
  active=false;clearTimeout(startup);document.removeEventListener('visibilitychange',visibility);
  player?.destroy();frame.remove();
 };
}
