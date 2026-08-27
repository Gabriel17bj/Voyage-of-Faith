import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music, Play, Pause } from 'lucide-react';

interface BgmPlayerProps {
  videoId?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  className?: string;
  autoPlayOnInteract?: boolean;
}

export const BgmPlayer: React.FC<BgmPlayerProps> = ({
  videoId = 'g0MXF-y3xos',
  isMuted,
  onToggleMute,
  className = '',
  autoPlayOnInteract = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Initialize and handle play/pause via postMessage to YouTube Iframe
  const sendIframeCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: func,
          args: args,
        }),
        '*'
      );
    }
  };

  useEffect(() => {
    if (isMuted || !isPlaying) {
      sendIframeCommand('mute');
      sendIframeCommand('pauseVideo');
    } else {
      sendIframeCommand('unMute');
      sendIframeCommand('setVolume', [80]);
      sendIframeCommand('playVideo');
    }
  }, [isMuted, isPlaying]);

  // Handle first user gesture to unlock autoplay
  useEffect(() => {
    const handleFirstGesture = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        sendIframeCommand('unMute');
        sendIframeCommand('setVolume', [80]);
        sendIframeCommand('playVideo');
      }
    };

    if (autoPlayOnInteract) {
      window.addEventListener('click', handleFirstGesture, { once: true });
      window.addEventListener('touchstart', handleFirstGesture, { once: true });
      window.addEventListener('keydown', handleFirstGesture, { once: true });
    }

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [hasInteracted, autoPlayOnInteract]);

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      onToggleMute();
      setIsPlaying(true);
      sendIframeCommand('unMute');
      sendIframeCommand('playVideo');
    } else {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      if (nextPlaying) {
        sendIframeCommand('playVideo');
      } else {
        sendIframeCommand('pauseVideo');
      }
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Hidden YouTube Iframe Audio Player */}
      <div className="absolute -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden pointer-events-none opacity-0">
        <iframe
          ref={iframeRef}
          title="RPG Background Music"
          width="200"
          height="200"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0&iv_load_policy=3&disablekb=1`}
          allow="autoplay; encrypted-media"
          onLoad={() => setIsPlayerReady(true)}
        />
      </div>

      {/* RPG BGM Controller Pill */}
      <button
        type="button"
        onClick={togglePlayback}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 ${
          !isMuted && isPlaying
            ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-amber-900/40'
            : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
        }`}
        title={!isMuted && isPlaying ? '배경음악 끄기' : '배경음악 켜기 (YouTube BGM)'}
      >
        <Music className={`w-3.5 h-3.5 ${!isMuted && isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
        
        {/* Equalizer Visualizer Bars */}
        {!isMuted && isPlaying ? (
          <div className="flex items-end gap-0.5 h-3 w-3">
            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite_0.1s] h-full" />
            <span className="w-0.5 bg-amber-300 rounded-full animate-[bounce_0.6s_infinite_0.3s] h-2/3" />
            <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite_0.2s] h-4/5" />
          </div>
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
        )}

        <span className="text-[10px] hidden sm:inline-block font-mono tracking-tight">
          {!isMuted && isPlaying ? 'BGM ON' : 'BGM OFF'}
        </span>
      </button>
    </div>
  );
};
