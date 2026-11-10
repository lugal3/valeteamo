"""Local-only inspection; never modifies source recordings. Requires numpy/matplotlib/imageio-ffmpeg."""
import argparse, subprocess, json, hashlib
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import imageio_ffmpeg

p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True);report=[]
for f in sorted(Path(a.source).iterdir()):
 if not f.is_file(): continue
 r=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','22050','pipe:1'],capture_output=True)
 if r.returncode: report.append({'file':f.name,'error':r.stderr.decode(errors='replace')});continue
 x=np.frombuffer(r.stdout,dtype='<f4');sr=22050;hop=2205;n=len(x)//hop
 rms=np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2,axis=1));db=20*np.log10(np.maximum(rms,1e-7))
 active=db>max(float(db.max())-32,-58);spans=[];start=None
 for i,v in enumerate(np.r_[active,False]):
  if v and start is None:start=i*.1
  if not v and start is not None:spans.append([round(start,2),round(i*.1,2)]);start=None
 fig,ax=plt.subplots(2,1,figsize=(14,4),sharex=True);stride=max(1,len(x)//10000)
 ax[0].plot(np.arange(0,len(x),stride)/sr,x[::stride],lw=.5);ax[1].plot(np.arange(n)*.1,db);ax[1].set_ylim(-80,0);ax[1].set_xlabel('Seconds');ax[0].set_title(f.name);ax[1].grid();fig.tight_layout();fig.savefig(out/(f.name+'.png'));plt.close(fig)
 np.save(out/(f.name+'.npy'),x)
 info={'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'seconds':round(len(x)/sr,3),'peak':round(float(np.abs(x).max()),5),'activeSpans':spans};report.append(info)
(out/'analysis.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
