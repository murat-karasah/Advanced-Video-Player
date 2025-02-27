# Advanced-Video-Player React Video Player

A modern and customized video player application built with React, TypeScript, and Material-UI. Provides a Netflix-like user experience.

## Features

### Video Formats and Streaming
- 🎥 HLS and DASH streaming support
- 🔒 DRM integration (Widevine, PlayReady)
- 📱 Responsive design
- 🎨 Custom Material-UI controls

### Core Features
- ▶️ Play/Pause control
- 🔊 Volume control and mute mode
- 🖥️ Fullscreen mode
- ⏱️ Time display and progress bar
- ⚡ Custom playback speed
- 📺 Quality selection
- 💬 Multi-subtitle support

### User Experience
- 🎯 Netflix-style controls
- ✨ Smooth animations
- 📱 Touch screen support
- ⌨️ Keyboard shortcuts
- 🔄 Customizable playback speeds
- 🎚️ Quality options with auto mode

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

```typescript
import VideoPlayer from './components/player/VideoPlayer';

const config = {
  sources: [
    {
      src: 'https://example.com/video.m3u8',
      type: 'application/x-mpegURL',
      label: 'Auto',
    },
  ],
  subtitles: [
    {
      src: 'https://example.com/subtitles.vtt',
      label: 'English',
      srclang: 'en',
      default: true,
    },
  ],
  autoplay: false,
  muted: false,
  poster: 'https://example.com/poster.jpg',
};

const App = () => (
  <VideoPlayer
    config={config}
    onStateChange={(state) => console.log('Player state:', state)}
    onError={(error) => console.error('Player error:', error)}
  />
);
```

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| Space or K | Play/Pause |
| F | Fullscreen |
| M | Mute Toggle |
| ← | 10 seconds backward |
| → | 10 seconds forward |
| ↑ | Volume up |
| ↓ | Volume down |

## Developer

**Murat Karasah**
- GitHub: [@murat-karasah](https://github.com/murat-karasah)

## Technologies

- ⚛️ React 17
- 📝 TypeScript
- 🎨 Material-UI
- 🎥 HLS.js
- 📺 Dash.js
- 📦 Vite

## License

This project is licensed under the MIT License.
