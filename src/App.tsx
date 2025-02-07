import React from 'react';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { CssBaseline, Container } from '@material-ui/core';
import VideoPlayer from './components/player/VideoPlayer';
import { PlayerConfig } from './types/player';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#E50914', // Netflix red
    },
  },
});

const sampleConfig: PlayerConfig = {
  sources: [
    {
      src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      type: 'application/x-mpegURL',
      label: 'Auto',
    },
  ],
  subtitles: [
    {
      src: 'https://raw.githubusercontent.com/andreyvit/subtitle-tools/master/sample.srt',
      label: 'English',
      srclang: 'en',
      default: true,
    },
  ],
  autoplay: false,
  muted: false,
  poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Sintel_poster.jpg/800px-Sintel_poster.jpg',
  controls: true,
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
        <VideoPlayer
          config={sampleConfig}
          onStateChange={(state) => {
            console.log('Player state changed:', state);
          }}
          onError={(error) => {
            console.error('Player error:', error);
          }}
        />
      </Container>
    </ThemeProvider>
  );
};

export default App; 