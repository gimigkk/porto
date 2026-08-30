---
name: video-editing
description: "Reusable FFmpeg workflow for generating project demo videos, card variants, and poster frames with rounded corners and drop shadows."
---

# Video Editing Workflow Skill

Reusable recipe for turning screen recordings into standard project demo videos:
- 4% bottom crop (removes taskbar).
- Scaled to 90% canvas (1728x932).
- Placed over blurred background (1920x1080).
- 6px rounded corners + soft drop shadow (+10px Y offset).
- Generates `<Name>.mp4`, `<Name>-sm.mp4` (854x480), and `<Name>-poster.jpg`.

## 1. Inputs

```bash
SRC="/absolute/path/source.mp4"
BG="/absolute/path/background.png"
OUT_DIR="public/projects/<slug>"
NAME="<ProjectName>"
```

Check source info:
```bash
ffprobe -v error \
  -show_entries stream=index,codec_type,width,height,r_frame_rate:format=duration \
  -of json "$SRC"
```

## 2. Preview One Frame

```bash
FRAME_AT=5

ffmpeg -y -loop 1 -i "$BG" -ss "00:00:$FRAME_AT" -i "$SRC" \
  -filter_complex "
    [0:v]scale=1920:1080:force_original_aspect_ratio=increase,
      crop=1920:1080,gblur=sigma=30:steps=2[bg];
    [1:v]crop=iw:floor(ih*0.96):0:0,scale=1728:-2:flags=lanczos,format=rgba[fg];
    nullsrc=s=1728x932,format=gray,
      geq=lum='if(lte(hypot(max(0,6-min(X,W-1-X)),max(0,6-min(Y,H-1-Y))),6),255,0)',
      split=2[fgmask][shadowmask];
    [fg][fgmask]alphamerge[rounded];
    [shadowmask]pad=1840:1044:56:56:color=black,
      gblur=sigma=24:steps=2,lut=y='val*0.45'[shadowalpha];
    color=c=black:s=1840x1044,format=rgba[shadowbase];
    [shadowbase][shadowalpha]alphamerge[shadow];
    [bg][shadow]overlay=(W-w)/2:(H-h)/2+10:format=auto[withshadow];
    [withshadow][rounded]overlay=(W-w)/2:(H-h)/2:format=auto,format=rgb24[out]
  " \
  -map '[out]' -frames:v 1 -update 1 "$OUT_DIR/${NAME}-preview.png"
```

## 3. Final Encode

```bash
ffmpeg -y -hide_banner \
  -loop 1 -framerate 60 -i "$BG" \
  -i "$SRC" \
  -filter_complex "
    [1:v]trim=start=1:end=15,setpts=PTS-STARTPTS[v1];
    [1:a]atrim=start=1:end=15,asetpts=PTS-STARTPTS[a1];
    [1:v]trim=start=23:end=58,setpts=PTS-STARTPTS[v2];
    [1:a]atrim=start=23:end=58,asetpts=PTS-STARTPTS[a2];
    [v1][a1][v2][a2]concat=n=2:v=1:a=1[clipv][outa];
    [0:v]scale=1920:1080:force_original_aspect_ratio=increase,
      crop=1920:1080,gblur=sigma=30:steps=2,fps=60[bg];
    [clipv]crop=iw:floor(ih*0.96):0:0,
      scale=1728:-2:flags=lanczos,setsar=1,format=rgba[fg];
    nullsrc=s=1728x932:r=60,format=gray,
      geq=lum='if(lte(hypot(max(0,6-min(X,W-1-X)),max(0,6-min(Y,H-1-Y))),6),255,0)',
      split=2[fgmask][shadowmask];
    [fg][fgmask]alphamerge[rounded];
    [shadowmask]pad=1840:1044:56:56:color=black,
      gblur=sigma=24:steps=2,lut=y='val*0.45'[shadowalpha];
    color=c=black:s=1840x1044,format=rgba[shadowbase];
    [shadowbase][shadowalpha]alphamerge[shadow];
    [bg][shadow]overlay=(W-w)/2:(H-h)/2+10:format=auto[withshadow];
    [withshadow][rounded]overlay=(W-w)/2:(H-h)/2:format=auto:shortest=1,
      format=yuv420p[outv]
  " \
  -map '[outv]' -map '[outa]' \
  -c:v libx264 -preset medium -crf 18 -profile:v high -level 4.2 \
  -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$OUT_DIR/${NAME}.mp4"
```

## 4. Card Variants & Poster

```bash
mkdir -p "$OUT_DIR"

# Card demo (854x480)
ffmpeg -y -i "$OUT_DIR/${NAME}.mp4" \
  -vf 'scale=854:480:flags=lanczos' \
  -c:v libx264 -preset medium -crf 24 \
  -c:a aac -b:a 96k -movflags +faststart \
  "$OUT_DIR/${NAME}-sm.mp4"

# Poster image
ffmpeg -y -ss 5 -i "$OUT_DIR/${NAME}.mp4" \
  -frames:v 1 -q:v 2 "$OUT_DIR/${NAME}-poster.jpg"
```
