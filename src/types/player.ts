export interface VideoSource {
  src: string;
  type: 'application/x-mpegURL' | 'application/dash+xml' | 'video/mp4';
  label?: string;
  quality?: string;
}

export interface SubtitleTrack {
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}

export interface AudioTrack {
  id: string;
  language: string;
  label: string;
  default?: boolean;
}

export interface QualityLevel {
  bitrate: number;
  height: number;
  width: number;
  label: string;
  id: string;
}

export interface PlayerConfig {
  sources: VideoSource[];
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
  poster?: string;
  controls?: boolean;
  startTime?: number;
  defaultPlaybackSpeed?: number;
  allowedPlaybackSpeeds?: number[];
  drm?: {
    widevine?: {
      licenseUrl: string;
      certificateUrl?: string;
    };
    playready?: {
      licenseUrl: string;
    };
  };
}

export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
  quality: string;
  qualities: QualityLevel[];
  selectedQuality?: string;
  playbackSpeed: number;
  selectedSubtitle: string | null;
  selectedAudioTrack?: string;
  isFullscreen: boolean;
  error?: Error;
}

export interface PlayerAPI {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
  setSubtitle: (language: string) => void;
  setAudioTrack: (language: string) => void;
  toggleFullscreen: () => void;
} 