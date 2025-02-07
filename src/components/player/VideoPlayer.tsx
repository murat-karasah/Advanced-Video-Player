import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import dashjs from 'dashjs';
import { makeStyles } from '@material-ui/core/styles';
import { PlayerConfig, PlayerState, VideoSource, QualityLevel } from '@/types/player';
import { initializePlayer, requestFullscreen, exitFullscreen, calculateBufferedPercentage } from '@/utils/playerUtils';
import Controls from '../controls/Controls';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#000',
    aspectRatio: '16/9',
    '&:fullscreen': {
      width: '100vw',
      height: '100vh',
    },
    '&:-webkit-full-screen': {
      width: '100vw',
      height: '100vh',
    },
    '&:-moz-full-screen': {
      width: '100vw',
      height: '100vh',
    },
    '&:-ms-fullscreen': {
      width: '100vw',
      height: '100vh',
    },
    [theme.breakpoints.down('sm')]: {
      aspectRatio: 'auto',
      height: '56.25vw', // 16:9 aspect ratio
    },
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    '&::-webkit-media-controls': {
      display: 'none !important',
    },
    '&::-webkit-media-controls-enclosure': {
      display: 'none !important',
    },
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    touchAction: 'none',
    background: 'transparent',
  },
}));

const DEFAULT_PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface Props {
  config: PlayerConfig;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: Error) => void;
}

const VideoPlayer: React.FC<Props> = ({ config, onStateChange, onError }) => {
  const classes = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashPlayerRef = useRef<dashjs.MediaPlayerClass | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isMuted: config.muted || false,
    volume: config.volume || 1,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    quality: 'auto',
    qualities: [],
    playbackSpeed: config.defaultPlaybackSpeed || 1,
    selectedSubtitle: null,
    isFullscreen: false,
  });

  const [showControls, setShowControls] = useState(true);
  const [lastTapTime, setLastTapTime] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let timeUpdateInterval: NodeJS.Timeout;

    const handleTimeUpdate = () => {
      if (!video) return;
      
      setPlayerState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        buffered: calculateBufferedPercentage(video),
      }));
    };

    const handleDurationChange = () => {
      if (!video) return;
      setPlayerState(prev => ({ ...prev, duration: video.duration }));
    };

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleVolumeChange = () => {
      if (!video) return;
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === containerRef.current;
      setPlayerState(prev => ({ ...prev, isFullscreen }));
    };

    // Event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Set initial playback speed
    video.playbackRate = playerState.playbackSpeed;

    // Update buffered percentage periodically
    timeUpdateInterval = setInterval(handleTimeUpdate, 1000);

    const initPlayer = async () => {
      try {
        const source = config.sources[0];
        if (source.type === 'application/x-mpegURL' && Hls.isSupported()) {
          await initializeHLS(source);
        } else if (source.type === 'application/dash+xml') {
          initializeDASH(source);
        } else {
          video.src = source.src;
        }

        if (config.drm) {
          configureDRM();
        }

        // Set initial volume and muted state
        video.volume = config.muted ? 0 : (config.volume || 1);
        video.muted = config.muted || false;

        // Set start time if specified
        if (config.startTime) {
          video.currentTime = config.startTime;
        }
      } catch (error) {
        onError?.(error as Error);
      }
    };

    initPlayer();

    return () => {
      clearInterval(timeUpdateInterval);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      hlsRef.current?.destroy();
      dashPlayerRef.current?.destroy();
    };
  }, [config.sources]);

  useEffect(() => {
    // Hide controls after 3 seconds of inactivity
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!playerState.isPlaying) return; // Keep controls visible if paused
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playerState.isPlaying]);

  const handleSubtitleChange = (srclang: string | null) => {
    if (!videoRef.current) return;

    const textTracks = Array.from(videoRef.current.textTracks);
    
    // Önce tüm alt yazıları gizle
    textTracks.forEach(track => {
      track.mode = 'disabled';  // 'hidden' yerine 'disabled' kullanıyoruz
    });

    // Seçilen alt yazıyı aktifleştir
    if (srclang !== null) {
      const selectedTrack = textTracks.find(track => track.language === srclang);
      if (selectedTrack) {
        selectedTrack.mode = 'showing';
      }
    }

    setPlayerState(prev => ({
      ...prev,
      selectedSubtitle: srclang,
    }));
  };

  // Add subtitle tracks when video is loaded
  useEffect(() => {
    if (videoRef.current && config.subtitles) {
      // Remove existing tracks
      const existingTracks = Array.from(videoRef.current.getElementsByTagName('track'));
      existingTracks.forEach(track => track.remove());

      // Add new tracks
      config.subtitles.forEach(subtitle => {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = subtitle.label;
        track.srclang = subtitle.srclang;
        track.src = subtitle.src;
        track.default = subtitle.default || false;
        videoRef.current?.appendChild(track);
      });

      // Varsayılan alt yazıyı ayarla
      const defaultSubtitle = config.subtitles.find(subtitle => subtitle.default);
      if (defaultSubtitle) {
        // Bir süre bekleyerek track'lerin yüklenmesini bekle
        setTimeout(() => {
          handleSubtitleChange(defaultSubtitle.srclang);
        }, 100);
      } else {
        handleSubtitleChange(null);
      }
    }
  }, [config.subtitles]);

  const initializeHLS = async (source: VideoSource) => {
    if (!videoRef.current) return;

    const hls = new Hls({
      debug: process.env.NODE_ENV === 'development',
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.attachMedia(videoRef.current);
    hls.loadSource(source.src);

    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      const qualities: QualityLevel[] = data.levels.map((level: any, index: number) => ({
        bitrate: level.bitrate,
        height: level.height,
        width: level.width,
        label: `${level.height}p`,
        id: `hls-${level.height}-${level.bitrate}`
      }));

      setPlayerState(prev => ({ ...prev, qualities }));

      if (config.autoplay) {
        videoRef.current?.play().catch(error => {
          console.warn('Autoplay failed:', error);
        });
      }
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const qualities = playerState.qualities;
      if (qualities[data.level]) {
        setPlayerState(prev => ({
          ...prev,
          selectedQuality: qualities[data.level].label,
        }));
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        onError?.(new Error(`HLS Error: ${data.type}`));
      }
    });

    hlsRef.current = hls;
  };

  const initializeDASH = (source: VideoSource) => {
    if (!videoRef.current) return;

    const dashPlayer = dashjs.MediaPlayer().create();
    dashPlayer.initialize(videoRef.current, source.src, config.autoplay || false);
    dashPlayer.updateSettings({
      debug: {
        logLevel: 0,
      },
      streaming: {
        abr: {
          initialBitrate: {
            audio: -1,
            video: -1,
          },
          autoSwitchBitrate: {
            audio: true,
            video: true,
          },
        },
        buffer: {
          fastSwitchEnabled: true,
          stableBufferTime: 20,
          bufferTimeAtTopQuality: 30,
        },
      },
    });

    dashPlayer.on('streamInitialized', () => {
      const bitrateInfo = dashPlayer.getBitrateInfoListFor('video');
      const qualities: QualityLevel[] = bitrateInfo.map(info => ({
        bitrate: info.bitrate,
        height: info.height,
        width: info.width,
        label: `${info.height}p`,
        id: `dash-${info.height}-${info.bitrate}`
      }));

      setPlayerState(prev => ({ ...prev, qualities }));
    });

    dashPlayer.on('qualityChangeRendered', () => {
      const currentQuality = dashPlayer.getQualityFor('video');
      const qualities = playerState.qualities;
      if (qualities[currentQuality]) {
        setPlayerState(prev => ({
          ...prev,
          selectedQuality: qualities[currentQuality].label,
        }));
      }
    });

    dashPlayerRef.current = dashPlayer;
  };

  const configureDRM = () => {
    if (!config.drm) return;

    if (dashPlayerRef.current && config.drm.widevine) {
      dashPlayerRef.current.setProtectionData({
        'com.widevine.alpha': {
          serverURL: config.drm.widevine.licenseUrl,
          priority: 1,
        },
      });
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!playerState.isFullscreen) {
      requestFullscreen(containerRef.current);
    } else {
      exitFullscreen();
    }
  };

  const handleSetPlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlayerState(prev => ({ ...prev, playbackSpeed: speed }));
  };

  const handleSetQuality = (qualityLabel: string) => {
    const qualityIndex = playerState.qualities.findIndex(q => q.label === qualityLabel);
    if (qualityIndex === -1) return;

    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityIndex;
    } else if (dashPlayerRef.current) {
      dashPlayerRef.current.setQualityFor('video', qualityIndex);
    }

    setPlayerState(prev => ({ ...prev, selectedQuality: qualityLabel }));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    switch (event.key.toLowerCase()) {
      case ' ':
      case 'k':
        event.preventDefault();
        playerState.isPlaying ? video.pause() : video.play();
        break;
      case 'f':
        event.preventDefault();
        handleToggleFullscreen();
        break;
      case 'm':
        event.preventDefault();
        video.muted = !video.muted;
        break;
      case 'arrowleft':
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'arrowright':
        event.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        break;
      case 'arrowup':
        event.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        break;
      case 'arrowdown':
        event.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        break;
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      event.preventDefault();
      handleToggleFullscreen();
    }
    setLastTapTime(currentTime);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    // Show controls on touch move
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!playerState.isPlaying) return;
      setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      ref={containerRef}
      className={classes.root}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className={classes.video}
        poster={config.poster}
        muted={config.muted}
        playsInline
        crossOrigin="anonymous"
        onClick={() => playerState.isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
      />
      <div
        className={classes.touchOverlay}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
      <Controls
        state={playerState}
        config={config}
        onPlay={() => videoRef.current?.play()}
        onPause={() => videoRef.current?.pause()}
        onSeek={(time: number) => {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        }}
        onVolumeChange={(volume: number) => {
          if (videoRef.current) {
            videoRef.current.volume = volume;
          }
        }}
        onMuteToggle={() => {
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
          }
        }}
        onFullscreenToggle={handleToggleFullscreen}
        onPlaybackSpeedChange={handleSetPlaybackSpeed}
        onQualityChange={handleSetQuality}
        onSubtitleChange={handleSubtitleChange}
        availablePlaybackSpeeds={config.allowedPlaybackSpeeds || DEFAULT_PLAYBACK_SPEEDS}
        visible={showControls}
      />
    </div>
  );
};

export default VideoPlayer; 