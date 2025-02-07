import { VideoSource } from '@/types/player';

export const initializePlayer = async (videoElement: HTMLVideoElement, source: VideoSource) => {
  return new Promise<void>((resolve, reject) => {
    try {
      videoElement.src = source.src;
      videoElement.addEventListener('loadedmetadata', () => resolve());
      videoElement.addEventListener('error', (e) => reject(e));
    } catch (error) {
      reject(error);
    }
  });
};

export const getVideoQualityLevels = (qualities: string[]): { value: string; label: string }[] => {
  return qualities.map((quality) => ({
    value: quality,
    label: quality.includes('p') ? `${quality} HD` : quality,
  }));
};

export const calculateBufferedPercentage = (videoElement: HTMLVideoElement): number => {
  if (videoElement.buffered.length === 0) return 0;
  
  const currentTime = videoElement.currentTime;
  const duration = videoElement.duration;
  
  for (let i = 0; i < videoElement.buffered.length; i++) {
    const start = videoElement.buffered.start(i);
    const end = videoElement.buffered.end(i);
    
    if (currentTime >= start && currentTime <= end) {
      return (end / duration) * 100;
    }
  }
  
  return 0;
};

export const requestFullscreen = (element: HTMLElement) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    (element as any).mozRequestFullScreen();
  } else if ((element as any).msRequestFullscreen) {
    (element as any).msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    (document as any).msExitFullscreen();
  }
}; 