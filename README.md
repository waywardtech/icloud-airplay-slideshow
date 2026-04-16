# iCloud AirPlay Slideshow

A Raspberry Pi Apache-hosted slideshow web app that lets a user select a folder of media, then plays images, audio, video, and HTML content fullscreen.

## Current goals

- Single-page web app
- Black fullscreen background
- Preserve media aspect ratio
- Timed slideshow playback
- Keyboard controls
- Folder-based media selection
- AirPlay-friendly playback for AV media

## Supported media

- Images: jpg, jpeg, png, gif, webp, bmp, svg
- Audio: mp3, m4a, aac, wav, ogg
- Video: mp4, m4v, mov, webm
- HTML: html, htm

## Controls

- Space: play/pause
- Left arrow: previous
- Right arrow: next
- Escape: end slideshow

## Project direction

This repo starts with a browser-based prototype and is intended to evolve into a proper TV-style slideshow app / receiver architecture.

## Raspberry Pi deployment

Suggested Apache path:

```bash
/var/www/html/icloud-airplay-slideshow/
```

To deploy manually:

```bash
sudo mkdir -p /var/www/html/icloud-airplay-slideshow
sudo cp -r public/* /var/www/html/icloud-airplay-slideshow/
```

Then browse to:

```
http://<raspberry-pi-ip>/icloud-airplay-slideshow/
```

## Notes

Browsers cannot force AirPlay device connection for arbitrary non-AV content. Native AirPlay is available only for audio/video, while non-AV content requires screen mirroring or a different receiver architecture.

## Next milestones

- Refactor slideshow engine
- Better playlist handling
- Session persistence
- Receiver / TV-style playback architecture
- Metadata and transitions
- Remote control support
