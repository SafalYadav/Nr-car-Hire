'use client';

import { useEffect, useRef, useState } from 'react';

// Exact Australian coastal cliff scenery requested by user
const VIDEO_SRC = '/videos/hero-drive.webm';

export function CinematicHeroVideo() {
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const isCrossfadingRef = useRef(false);

  // Initialize playback on mount
  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;

    if (vA) {
      vA.currentTime = 0.5;
      vA.play().catch(() => {});
    }

    if (vB) {
      vB.currentTime = 0.5;
      vB.load();
    }
  }, []);

  // Time update listener for Layer A: trigger seamless crossfade before the end black frames
  const handleTimeUpdateA = () => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || isCrossfadingRef.current || activeLayer !== 'A') return;

    // Crossfade 3.5 seconds before the file ends (completely cuts out the black end transition frames)
    if (vA.duration > 0 && vA.currentTime >= vA.duration - 3.5) {
      isCrossfadingRef.current = true;

      if (vB) {
        vB.currentTime = 0.5;
        vB.play()
          .then(() => {
            setActiveLayer('B');
            setTimeout(() => {
              isCrossfadingRef.current = false;
              if (vA) {
                vA.pause();
                vA.currentTime = 0.5;
              }
            }, 1200);
          })
          .catch(() => {
            vA.currentTime = 0.5;
            isCrossfadingRef.current = false;
          });
      }
    }
  };

  // Time update listener for Layer B: trigger seamless crossfade before the end black frames
  const handleTimeUpdateB = () => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vB || isCrossfadingRef.current || activeLayer !== 'B') return;

    if (vB.duration > 0 && vB.currentTime >= vB.duration - 3.5) {
      isCrossfadingRef.current = true;

      if (vA) {
        vA.currentTime = 0.5;
        vA.play()
          .then(() => {
            setActiveLayer('A');
            setTimeout(() => {
              isCrossfadingRef.current = false;
              if (vB) {
                vB.pause();
                vB.currentTime = 0.5;
              }
            }, 1200);
          })
          .catch(() => {
            vB.currentTime = 0.5;
            isCrossfadingRef.current = false;
          });
      }
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Underlying 4K Photorealistic Poster: prevents any black flash on initial load */}
      <div
        className="absolute inset-0 bg-cover bg-center transform scale-[1.35]"
        style={{ backgroundImage: 'url(/images/hero-poster.jpg)' }}
      />

      {/* Layer A Video - Scale 1.35x crops out raw letterbox black borders */}
      <video
        ref={videoRefA}
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdateA}
        onEnded={() => {
          if (videoRefA.current) {
            videoRefA.current.currentTime = 0.5;
            videoRefA.current.play().catch(() => {});
          }
        }}
        className={`absolute inset-0 h-full w-full object-cover object-center transform scale-[1.35] transition-opacity duration-1000 ease-in-out ${
          activeLayer === 'A' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Layer B Video - Scale 1.35x crops out raw letterbox black borders */}
      <video
        ref={videoRefB}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdateB}
        onEnded={() => {
          if (videoRefB.current) {
            videoRefB.current.currentTime = 0.5;
            videoRefB.current.play().catch(() => {});
          }
        }}
        className={`absolute inset-0 h-full w-full object-cover object-center transform scale-[1.35] transition-opacity duration-1000 ease-in-out ${
          activeLayer === 'B' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Clean subtle readability overlay: zero black borders, zero blur */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />
    </div>
  );
}
