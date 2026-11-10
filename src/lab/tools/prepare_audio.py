"""Reproducible cuts from analyze_audio.py's mono 22050 Hz arrays. Originals untouched."""
import argparse,json,wave,hashlib
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('analysis');p.add_argument('output');a=p.parse_args();src=Path(a.analysis);out=Path(a.output);out.mkdir(parents=True,exist_ok=True);sr=22050
cuts=[
 ('door-open','open-close-door.wav',0,.88,False),('door-close','open-close-door.wav',1.84,2.87,False),
 ('closet-close','closet-cerrar-2do-piso.wav',1.43,2.14,False),('unlock','desbloqueo-puerta-evento.wav',1.22,3.6,False),
 ('trying-door','trying-open-door-evento.mp3',.22,3.35,False),('notification','740423__anthonyrox__message-notification-4.wav',0,.319,False),
 ('light','flashlight-turn-off.wav',.08,.75,False),
 ('wood-1','foot-steeps-wood.wav',9.18,9.63,False),('wood-2','foot-steeps-wood.wav',10.07,10.48,False),('wood-3','foot-steeps-wood.wav',12.18,12.61,False),
 ('stair-1','climbing-stairs.wav',.65,1.04,False),('stair-2','climbing-stairs.wav',2.02,2.42,False),('stair-3','climbing-stairs.wav',5.05,5.48,False),
 ('ambient','sonido-ambiente-base-suspenso.wav',1,24,True),('tension','sonido-para-evento-esconderse-de-perseguidor.flac',4,24,True),
 ('alert','efecto-tension-quizas-screamer',.85,1.52,False)]
source_info={r['file']:r for r in json.loads((src/'analysis.json').read_text(encoding='utf8'))};rows=[]
for name,file,start,end,loop in cuts:
 x=np.load(src/(file+'.npy'))[int(start*sr):int(end*sr)].copy();x-=x.mean()
 # Equal-power-ish overlap at a musical loop boundary; runtime loops the whole result.
 if loop:
  n=int(.45*sr);t=np.linspace(0,1,n);x[:n]=x[-n:]*(1-t)+x[:n]*t;x=x[:-n]
 else:
  n=min(int(.008*sr),len(x)//4);x[:n]*=np.linspace(0,1,n);n=min(int(.045*sr),len(x)//4);x[-n:]*=np.linspace(1,0,n)
 peak=max(float(np.max(np.abs(x))),1e-6);x*=.78/peak
 pcm=np.round(np.clip(x,-.98,.98)*32767).astype('<i2');target=out/(name+'.wav')
 with wave.open(str(target),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
 rows.append({'id':name,'source':file,'sourceSha256':source_info[file]['sha256'],'start':start,'end':end,'loop':loop,'seconds':round(len(x)/sr,4),'peak':round(float(np.max(np.abs(x))),4),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'provenance':'Aportado por el propietario; descargado de Freesound según su declaración. Autor/enlace/licencia específicos pendientes; no publicar.'})
(out/'manifest.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf8');print(json.dumps({'clips':len(rows),'bytes':sum(r['bytes'] for r in rows)}))
