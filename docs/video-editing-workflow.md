# Project video editing workflow

Reusable recipe for turning a screen-recording clip into a project-card demo:

- choose source ranges and concatenate them;
- crop unwanted taskbar/UI from the bottom;
- place clip over a blurred background image;
- scale clip to 90% of the canvas;
- apply 6 px rounded corners;
- add a soft dark shadow offset 10 px downward;
- export a 1920×1080 H.264/AAC video.

## Inputs

```bash
SRC="/absolute/path/source.mp4"
BG="/absolute/path/background.png"
OUT_DIR="public/projects/<slug>"
NAME="<ProjectName>"
```

Check source properties first:

```bash
ffprobe -v error \
  -show_entries stream=index,codec_type,width,height,r_frame_rate:format=duration \
  -of json "$SRC"
```

Use source timestamps as `start` inclusive / `end` exclusive. Example: `01–15s` then `23–58s` produces 49 seconds.

## Preview one frame

Render a frame before spending time on the full encode. Change `FRAME_AT`, scale, crop percentage, corner radius, blur, and shadow values here.

```bash
FRAME_AT=5

ffmpeg -y -loop 1 -i "$BG" -ss "00:00:$FRAME_AT" -i "$SRC" \
  -filter_complex "
    [0:v]scale=1920:1080:force_original_aspect_ratio=increase,
      crop=1920:1080,gblur=sigma=30:steps=2[bg];
    [1:v]crop=iw:floor(ih*0.95):0:0,scale=1728:-2:flags=lanczos,format=rgba[fg];
    nullsrc=s=1728x924,format=gray,
      geq=lum='if(lte(hypot(max(0,6-min(X,W-1-X)),max(0,6-min(Y,H-1-Y))),6),255,0)',
      split=2[fgmask][shadowmask];
    [fg][fgmask]alphamerge[rounded];
    [shadowmask]pad=1840:1036:56:56:color=black,
      gblur=sigma=24:steps=2,lut=y='val*0.45'[shadowalpha];
    color=c=black:s=1840x1036,format=rgba[shadowbase];
    [shadowbase][shadowalpha]alphamerge[shadow];
    [bg][shadow]overlay=(W-w)/2:(H-h)/2+10:format=auto[withshadow];
    [withshadow][rounded]overlay=(W-w)/2:(H-h)/2:format=auto,format=rgb24[out]
  " \
  -map '[out]' -frames:v 1 -update 1 "$OUT_DIR/${NAME}-preview.png"
```

### Current visual constants

| Setting | Value | Effect |
| --- | ---: | --- |
| Canvas | `1920×1080` | project video output |
| Background | `gblur sigma=30` | recognizable but defocused |
| Bottom crop | `5%` | hides taskbar in screen recordings |
| Clip size | `1728×972` | 90% of 1920×1080 |
| Corner radius | `6 px` | subtle rounding |
| Shadow | `sigma=24`, opacity `.45` | visible soft separation |
| Shadow Y offset | `+10 px` | slight downward depth |

If the frame is wrong, adjust these constants and render again. Do not encode the whole video until the frame is approved.

## Final encode

This version concatenates two video/audio ranges before applying the composite filter. Keep `concat=n=2` in sync with the number of ranges.

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
    [clipv]crop=iw:floor(ih*0.95):0:0,
      scale=1728:-2:flags=lanczos,setsar=1,format=rgba[fg];
    nullsrc=s=1728x924:r=60,format=gray,
      geq=lum='if(lte(hypot(max(0,6-min(X,W-1-X)),max(0,6-min(Y,H-1-Y))),6),255,0)',
      split=2[fgmask][shadowmask];
    [fg][fgmask]alphamerge[rounded];
    [shadowmask]pad=1840:1036:56:56:color=black,
      gblur=sigma=24:steps=2,lut=y='val*0.45'[shadowalpha];
    color=c=black:s=1840x1036:r=60,format=rgba[shadowbase];
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

### Filter graph notes

- `crop=iw:floor(ih*0.95):0:0` removes bottom 5% without stretching.
- `scale=1728:-2` preserves the clip aspect ratio while making it 90% wide.
- The gray `geq` mask creates rounded alpha corners.
- The shadow is made from the same mask, padded, blurred, darkened, and shifted down.
- Keep audio ranges paired with video ranges; otherwise `concat` can desync or fail.

## Project-card assets

The card component rewrites an MP4 thumbnail path from `Name.mp4` to `Name-sm.mp4`. It also derives the poster path from that name. Keep all three files together:

```text
public/projects/<slug>/
├── <Name>.mp4        # full-quality project demo
├── <Name>-sm.mp4     # card-sized demo, 854×480 is current convention
└── <Name>-poster.jpg # poster shown while card video loads
```

Create card variant and poster:

```bash
mkdir -p "$OUT_DIR"

ffmpeg -y -i "$OUT_DIR/${NAME}.mp4" \
  -vf 'scale=854:480:flags=lanczos' \
  -c:v libx264 -preset medium -crf 24 \
  -c:a aac -b:a 96k -movflags +faststart \
  "$OUT_DIR/${NAME}-sm.mp4"

ffmpeg -y -ss 5 -i "$OUT_DIR/${NAME}.mp4" \
  -frames:v 1 -q:v 2 "$OUT_DIR/${NAME}-poster.jpg"
```

Set MDX metadata:

```ts
thumbnail: "/projects/<slug>/<Name>.mp4",
```

Use unique lowercase slugs. Do not leave old placeholder names in `content/projects/`.

## Verification checklist

```bash
ffprobe -v error \
  -count_frames \
  -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,nb_read_frames \
  -of json "$OUT_DIR/${NAME}.mp4"

ffmpeg -v error -i "$OUT_DIR/${NAME}.mp4" -f null -
npm test
npx next build
```

Expected final video: 1920×1080, 60 fps, H.264 + AAC, correct duration, and zero decode errors. Inspect frames around every cut boundary, not only the first frame.
