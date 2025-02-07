import React, { useState, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { IconButton, Slider, Typography, Menu, MenuItem, Tooltip, ListItemIcon, ListItemText, Fade } from '@material-ui/core';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings,
  SubtitlesOutlined,
  Speed,
  VolumeDown,
  Check,
  HighQuality,
} from '@material-ui/icons';
import { PlayerConfig, PlayerState } from '@/types/player';
import { formatTime } from '@/utils/timeUtils';
import clsx from 'clsx';
import { PopoverOrigin } from '@material-ui/core/Popover';
import ReactDOM from 'react-dom';

const useStyles = makeStyles((theme) => ({
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
    '&:hover': {
      opacity: 1,
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    zIndex: 1,
  },
  controlsVisible: {
    opacity: 1,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5),
    },
  },
  slider: {
    color: theme.palette.primary.main,
    height: 4,
    padding: '15px 0',
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
      marginTop: -4,
      marginLeft: -6,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}33`,
      },
      [theme.breakpoints.down('sm')]: {
        width: 8,
        height: 8,
        marginTop: -2,
        marginLeft: -4,
      },
    },
    '& .MuiSlider-rail': {
      opacity: 0.3,
    },
    '& .MuiSlider-track': {
      transition: 'width 0.1s linear',
    },
  },
  volumeSlider: {
    width: 100,
    marginLeft: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      width: 60,
      marginLeft: theme.spacing(0.5),
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  timeText: {
    color: theme.palette.common.white,
    fontSize: '0.875rem',
    minWidth: 100,
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      minWidth: 80,
    },
    [theme.breakpoints.down('xs')]: {
      minWidth: 60,
    },
  },
  button: {
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    [theme.breakpoints.down('sm')]: {
      padding: 6,
      '& .MuiSvgIcon-root': {
        fontSize: '1.25rem',
      },
    },
  },
  menuRoot: {
    zIndex: theme.zIndex.modal + 100,
    '& .MuiPopover-paper': {
      backgroundColor: 'rgba(28, 28, 28, 0.95)',
      color: theme.palette.common.white,
      position: 'fixed',
      maxHeight: '300px',
      overflowY: 'auto',
      minWidth: 250,
      borderRadius: 4,
      boxShadow: '0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12), 0 8px 10px -5px rgba(0, 0, 0, 0.4)',
      [theme.breakpoints.down('sm')]: {
        maxWidth: '90vw',
        minWidth: 200,
      },
    },
    '& .MuiMenuItem-root': {
      minHeight: 40,
      padding: theme.spacing(1, 2),
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&.selected': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
    },
    '& .MuiListItemIcon-root': {
      minWidth: 36,
      color: theme.palette.common.white,
    },
    '& .MuiListItemText-primary': {
      fontSize: '0.9rem',
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.8rem',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .menuItemCheck': {
      marginLeft: 'auto',
      marginRight: -8,
      color: theme.palette.primary.main,
    },
  },
  controlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginLeft: 'auto',
    position: 'relative',
  },
  mobileHidden: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  fullscreenMenu: {
    '& .MuiPopover-paper': {
      position: 'fixed !important',
      bottom: '80px !important',
      right: '16px !important',
      left: 'auto !important',
      top: 'auto !important',
      transform: 'none !important',
    },
  },
  customMenu: {
    position: 'fixed',
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    color: theme.palette.common.white,
    minWidth: 250,
    maxHeight: 300,
    overflowY: 'auto',
    borderRadius: 4,
    boxShadow: '0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12), 0 8px 10px -5px rgba(0, 0, 0, 0.4)',
    zIndex: theme.zIndex.modal + 100,
    [theme.breakpoints.down('sm')]: {
      maxWidth: '90vw',
      minWidth: 200,
    },
  },
  customMenuItem: {
    padding: theme.spacing(1, 2),
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&.selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  customMenuIcon: {
    minWidth: 36,
    color: theme.palette.common.white,
  },
  customMenuText: {
    flex: 1,
  },
  customMenuPrimary: {
    fontSize: '0.9rem',
  },
  customMenuSecondary: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  customMenuCheck: {
    marginLeft: 'auto',
    marginRight: -8,
    color: theme.palette.primary.main,
  },
  menuPaper: {
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    color: theme.palette.common.white,
    minWidth: 250,
    maxWidth: 300,
    maxHeight: 400,
    position: 'fixed',
    zIndex: theme.zIndex.modal + 9999,
    '&.fullscreen': {
      position: 'fixed',
      bottom: '80px',
      right: '16px',
      left: 'auto !important',
      top: 'auto !important',
    }
  },
  submenuPaper: {
    backgroundColor: 'rgba(28, 28, 28, 0.95)',
    color: theme.palette.common.white,
    minWidth: 200,
    maxWidth: 250,
    maxHeight: 400,
    position: 'fixed',
    zIndex: theme.zIndex.modal + 9999,
    '&.fullscreen': {
      position: 'fixed',
      bottom: '80px',
      right: '200px',
      left: 'auto !important',
      top: 'auto !important',
    }
  },
  menuItem: {
    minHeight: 40,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&.selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
}));

const styles = `
  .custom-popover-root {
    pointer-events: none;
  }
  .custom-popover-root .MuiPopover-paper {
    pointer-events: auto;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

interface Props {
  state: PlayerState;
  config: PlayerConfig;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onQualityChange: (quality: string) => void;
  onSubtitleChange: (srclang: string | null) => void;
  availablePlaybackSpeeds: number[];
  visible: boolean;
}

const Controls: React.FC<Props> = ({
  state,
  config,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPlaybackSpeedChange,
  onQualityChange,
  onSubtitleChange,
  availablePlaybackSpeeds,
  visible,
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [subtitlesAnchorEl, setSubtitlesAnchorEl] = useState<null | HTMLElement>(null);
  const [speedMenuAnchorEl, setSpeedMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [qualityMenuAnchorEl, setQualityMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [speedButtonEl, setSpeedButtonEl] = useState<HTMLElement | null>(null);
  const [qualityButtonEl, setQualityButtonEl] = useState<HTMLElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const buttonRefs = {
    subtitles: React.useRef<HTMLButtonElement>(null),
    settings: React.useRef<HTMLButtonElement>(null),
    speed: React.useRef<HTMLDivElement>(null),
    quality: React.useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        handleCloseAllMenus();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.MuiPopover-root') && !target.closest('button')) {
        handleCloseAllMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCloseAllMenus = () => {
    setSettingsAnchorEl(null);
    setSubtitlesAnchorEl(null);
    setSpeedMenuAnchorEl(null);
    setQualityMenuAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (settingsAnchorEl) {
      setSettingsAnchorEl(null);
      setMenuPosition(null);
    } else {
      setSettingsAnchorEl(event.currentTarget);
      if (state.isFullscreen) {
        setMenuPosition({
          top: window.innerHeight - 200,
          left: window.innerWidth - 300,
        });
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }
  };

  const handleSubtitlesClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (subtitlesAnchorEl) {
      setSubtitlesAnchorEl(null);
      setMenuPosition(null);
    } else {
      setSubtitlesAnchorEl(event.currentTarget);
      if (state.isFullscreen) {
        setMenuPosition({
          top: window.innerHeight - 200,
          left: window.innerWidth - 300,
        });
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
      setSettingsAnchorEl(null);
      setSpeedMenuAnchorEl(null);
      setQualityMenuAnchorEl(null);
    }
  };

  const handleSpeedMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (speedMenuAnchorEl) {
      setSpeedMenuAnchorEl(null);
      setMenuPosition(null);
    } else {
      setSpeedMenuAnchorEl(event.currentTarget);
      if (state.isFullscreen) {
        setMenuPosition({
          top: window.innerHeight - 200,
          left: window.innerWidth - 500,
        });
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.right + 8,
        });
      }
      setSettingsAnchorEl(null);
    }
  };

  const handleQualityMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (qualityMenuAnchorEl) {
      setQualityMenuAnchorEl(null);
      setMenuPosition(null);
    } else {
      setQualityMenuAnchorEl(event.currentTarget);
      if (state.isFullscreen) {
        setMenuPosition({
          top: window.innerHeight - 200,
          left: window.innerWidth - 500,
        });
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          top: rect.top,
          left: rect.right + 8,
        });
      }
      setSettingsAnchorEl(null);
    }
  };

  const handleSeekChange = (_: any, newValue: number | number[]) => {
    onSeek(newValue as number);
  };

  const handleVolumeChange = (_: any, newValue: number | number[]) => {
    onVolumeChange(newValue as number);
  };

  const getVolumeIcon = () => {
    if (state.isMuted || state.volume === 0) return <VolumeOff />;
    if (state.volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  const formatPlaybackSpeed = (speed: number) => {
    return speed === 1 ? 'Normal' : `${speed}x`;
  };

  const handleSubtitleSelect = (srclang: string | null) => {
    onSubtitleChange(srclang);
    handleSubtitlesClose();
  };

  const handleMenuClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const calculateMenuPosition = (anchorEl: HTMLElement | null) => {
    if (!anchorEl) return {};

    const rect = anchorEl.getBoundingClientRect();

    return {
      anchorEl,
      anchorOrigin: {
        vertical: 'top' as const,
        horizontal: 'left' as const,
      },
      transformOrigin: {
        vertical: 'bottom' as const,
        horizontal: 'left' as const,
      },
    };
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleSubtitlesClose = () => {
    setSubtitlesAnchorEl(null);
  };

  const handleSpeedMenuClose = () => {
    setSpeedMenuAnchorEl(null);
  };

  const handleQualityMenuClose = () => {
    setQualityMenuAnchorEl(null);
  };

  return (
    <div
      className={clsx(
        classes.controls,
        (isHovered || isDragging || visible) && classes.controlsVisible
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMenuClick}
      role="group"
      aria-label="Video controls"
      style={{ zIndex: theme.zIndex.modal }}
    >
      <div className={classes.row}>
        <Slider
          className={classes.slider}
          value={state.currentTime}
          min={0}
          max={state.duration || 100}
          onChange={handleSeekChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className={classes.row}>
        <Tooltip title={state.isPlaying ? 'Duraklat (k)' : 'Oynat (k)'}>
          <IconButton className={classes.button} onClick={state.isPlaying ? onPause : onPlay}>
            {state.isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Tooltip>

        <Tooltip title={state.isMuted ? 'Sesi Aç (m)' : 'Sesi Kapat (m)'}>
          <IconButton className={classes.button} onClick={onMuteToggle}>
            {getVolumeIcon()}
          </IconButton>
        </Tooltip>

        <Slider
          className={`${classes.slider} ${classes.volumeSlider}`}
          value={state.isMuted ? 0 : state.volume}
          min={0}
          max={1}
          step={0.1}
          onChange={handleVolumeChange}
        />

        <Typography className={classes.timeText}>
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </Typography>

        <div style={{ flexGrow: 1 }} />

        <div className={classes.controlsRight}>
          {config.subtitles && config.subtitles.length > 0 && (
            <>
              <Tooltip title="Altyazılar">
                <IconButton
                  className={classes.button}
                  onClick={handleSubtitlesClick}
                  ref={buttonRefs.subtitles}
                  aria-label="Altyazılar"
                >
                  <SubtitlesOutlined />
                </IconButton>
              </Tooltip>
              <Menu
                open={Boolean(subtitlesAnchorEl)}
                onClose={handleSubtitlesClose}
                anchorReference="anchorPosition"
                anchorPosition={menuPosition || undefined}
                getContentAnchorEl={null}
                keepMounted
                disablePortal
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  style: {
                    backgroundColor: 'rgba(28, 28, 28, 0.95)',
                    minWidth: 250,
                    maxWidth: 300,
                    position: 'fixed',
                    zIndex: theme.zIndex.modal + 9999,
                  },
                }}
              >
                <MenuItem
                  className={clsx(classes.menuItem, !state.selectedSubtitle && 'selected')}
                  onClick={() => handleSubtitleSelect(null)}
                >
                  <ListItemText primary="Kapalı" />
                  {!state.selectedSubtitle && <Check />}
                </MenuItem>
                {config.subtitles.map((subtitle) => (
                  <MenuItem
                    key={subtitle.srclang}
                    className={clsx(classes.menuItem, state.selectedSubtitle === subtitle.srclang && 'selected')}
                    onClick={() => handleSubtitleSelect(subtitle.srclang)}
                  >
                    <ListItemText primary={subtitle.label} />
                    {state.selectedSubtitle === subtitle.srclang && <Check />}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          <Tooltip title="Ayarlar">
            <IconButton
              className={classes.button}
              onClick={handleSettingsClick}
              aria-label="Ayarlar"
            >
              <Settings />
            </IconButton>
          </Tooltip>

          <Menu
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsClose}
            anchorReference="anchorPosition"
            anchorPosition={menuPosition || undefined}
            getContentAnchorEl={null}
            keepMounted
            disablePortal
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              style: {
                backgroundColor: 'rgba(28, 28, 28, 0.95)',
                minWidth: 250,
                maxWidth: 300,
                position: 'fixed',
                zIndex: theme.zIndex.modal + 9999,
              },
            }}
          >
            <MenuItem className={classes.menuItem} onClick={handleSpeedMenuOpen}>
              <ListItemIcon>
                <Speed />
              </ListItemIcon>
              <ListItemText primary="Oynatma Hızı" secondary={formatPlaybackSpeed(state.playbackSpeed)} />
            </MenuItem>
            {state.qualities.length > 0 && (
              <MenuItem className={classes.menuItem} onClick={handleQualityMenuOpen}>
                <ListItemIcon>
                  <HighQuality />
                </ListItemIcon>
                <ListItemText primary="Kalite" secondary={state.selectedQuality || 'Otomatik'} />
              </MenuItem>
            )}
          </Menu>

          <Menu
            open={Boolean(speedMenuAnchorEl)}
            onClose={handleSpeedMenuClose}
            anchorReference="anchorPosition"
            anchorPosition={menuPosition || undefined}
            getContentAnchorEl={null}
            keepMounted
            disablePortal
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              style: {
                backgroundColor: 'rgba(28, 28, 28, 0.95)',
                minWidth: 200,
                maxWidth: 250,
                position: 'fixed',
                zIndex: theme.zIndex.modal + 9999,
              },
            }}
          >
            {availablePlaybackSpeeds.map((speed) => (
              <MenuItem
                key={speed}
                className={clsx(classes.menuItem, state.playbackSpeed === speed && 'selected')}
                onClick={() => {
                  onPlaybackSpeedChange(speed);
                  handleSpeedMenuClose();
                }}
              >
                <ListItemText primary={formatPlaybackSpeed(speed)} />
                {state.playbackSpeed === speed && <Check />}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            open={Boolean(qualityMenuAnchorEl)}
            onClose={handleQualityMenuClose}
            anchorReference="anchorPosition"
            anchorPosition={menuPosition || undefined}
            getContentAnchorEl={null}
            keepMounted
            disablePortal
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              style: {
                backgroundColor: 'rgba(28, 28, 28, 0.95)',
                minWidth: 200,
                maxWidth: 250,
                position: 'fixed',
                zIndex: theme.zIndex.modal + 9999,
              },
            }}
          >
            <MenuItem
              className={clsx(classes.menuItem, !state.selectedQuality && 'selected')}
              onClick={() => {
                onQualityChange('auto');
                handleQualityMenuClose();
              }}
            >
              <ListItemText primary="Otomatik" />
              {!state.selectedQuality && <Check />}
            </MenuItem>
            {state.qualities.map((quality) => (
              <MenuItem
                key={quality.id}
                className={clsx(classes.menuItem, state.selectedQuality === quality.label && 'selected')}
                onClick={() => {
                  onQualityChange(quality.label);
                  handleQualityMenuClose();
                }}
              >
                <ListItemText primary={quality.label} />
                {state.selectedQuality === quality.label && <Check />}
              </MenuItem>
            ))}
          </Menu>

          <Tooltip 
            title={state.isFullscreen ? 'Tam Ekrandan Çık (f)' : 'Tam Ekran (f)'}
            PopperProps={{
              disablePortal: true,
            }}
            enterDelay={700}
            leaveDelay={0}
            TransitionComponent={Fade}
          >
            <IconButton 
              className={classes.button} 
              onClick={(e) => {
                e.stopPropagation();
                onFullscreenToggle();
              }}
              aria-label={state.isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            >
              {state.isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

interface CustomMenuProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const CustomMenu: React.FC<CustomMenuProps> = ({
  open,
  onClose,
  anchorEl,
  children,
  className,
  style
}) => {
  const classes = useStyles();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (open && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const isSubmenu = style?.right !== undefined;
      const isFullscreen = document.fullscreenElement !== null;

      if (isFullscreen) {
        if (isSubmenu) {
          setMenuPosition({
            top: rect.top,
            left: window.innerWidth - 300,
          });
        } else {
          setMenuPosition({
            top: window.innerHeight - 200,
            left: window.innerWidth - 300,
          });
        }
      } else {
        if (isSubmenu) {
          setMenuPosition({
            top: rect.top,
            left: rect.right + 8,
          });
        } else {
          setMenuPosition({
            top: rect.bottom + 8,
            left: rect.left,
          });
        }
      }
    }
  }, [open, anchorEl, style]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !anchorEl?.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, anchorEl]);

  if (!open || !anchorEl) return null;

  const finalStyle: React.CSSProperties = {
    ...style,
    top: `${menuPosition?.top}px`,
    left: style?.right ? 'auto' : `${menuPosition?.left}px`,
    position: 'fixed',
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className={clsx(classes.customMenu, className)}
      style={finalStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

const CustomMenuItem: React.FC<{
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  icon?: React.ReactNode;
  primary: string;
  secondary?: string;
  showCheck?: boolean;
}> = ({ onClick, selected, icon, primary, secondary, showCheck }) => {
  const classes = useStyles();

  return (
    <div
      className={clsx(classes.customMenuItem, selected && 'selected')}
      onClick={onClick}
    >
      {icon && <div className={classes.customMenuIcon}>{icon}</div>}
      <div className={classes.customMenuText}>
        <div className={classes.customMenuPrimary}>{primary}</div>
        {secondary && <div className={classes.customMenuSecondary}>{secondary}</div>}
      </div>
      {showCheck && selected && <Check className={classes.customMenuCheck} />}
    </div>
  );
};

export default Controls; 