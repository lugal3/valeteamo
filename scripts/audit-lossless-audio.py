#!/usr/bin/env python3
"""Read-only lossless WAV candidate audit; originals are never overwritten."""
import hashlib,json,pathlib,subprocess,sys
source=pathlib.Path(sys.argv[1])
out=pathlib.Path(sys.argv[2])
out.mkdir(parents=True,exist_ok=True)
def run(*args):
    return subprocess.check_output(args,stderr=subprocess.PIPE)
def meta(path):
    return json.loads(run("ffprobe","-v","error","-select_streams","a:0","-show_streams","-of","json",str(path)))["streams"][0]
def pcm(path):
    return run("ffmpeg","-v","error","-i",str(path),"-map","0:a:0","-f","s32le","-acodec","pcm_s32le","-")
rows=[]
for wav in sorted(source.rglob("*.wav")):
    m=meta(wav)
    row={"source":str(wav),"bytes":wav.stat().st_size,"codec":m["codec_name"],"rate":int(m["sample_rate"]),"channels":m["channels"]}
    # FLAC supports integer PCM; reject any source requiring quantization.
    if m["codec_name"] not in ("pcm_s16le","pcm_s24le","pcm_u8"):
        row["status"]="unsupported-source-format";rows.append(row);continue
    candidate=out/(str(wav.relative_to(source)).replace("/","__")+".flac")
    try:
        run("ffmpeg","-v","error","-y","-i",str(wav),"-map","0:a:0","-c:a","flac","-compression_level","8",str(candidate))
        original=pcm(wav);decoded=pcm(candidate);cm=meta(candidate)
        exact=original==decoded and cm["channels"]==m["channels"] and cm["sample_rate"]==m["sample_rate"]
        row.update(candidate=candidate.name,candidateBytes=candidate.stat().st_size,pcmSha256=hashlib.sha256(original).hexdigest(),samples=len(original)//(4*m["channels"]),exact=exact,status="candidate" if exact and candidate.stat().st_size<wav.stat().st_size else "keep-original")
        if row["status"]!="candidate":candidate.unlink()
    except subprocess.CalledProcessError as e:
        row["status"]="conversion-failed";row["error"]=e.stderr.decode(errors="replace")[-500:]
        candidate.unlink(missing_ok=True)
    rows.append(row)
eligible=[r for r in rows if r["status"]=="candidate"]
report={"files":rows,"originalBytes":sum(r["bytes"] for r in rows),"eligibleOriginalBytes":sum(r["bytes"] for r in eligible),"candidateBytes":sum(r["candidateBytes"] for r in eligible),"potentialSavedBytes":sum(r["bytes"]-r["candidateBytes"] for r in eligible),"note":"PCM-exact candidates only; browser decoding must also pass before integration."}
(out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
