import React, { FC, useState, useEffect, useRef } from 'react';
import { transformGoogleDriveUrl } from '../App';

interface AutoplayVideoFrameProps {
  videoUrl: string;
  className?: string;
}

// Helper to extract YouTube video ID and build an embed link
export function getYouTubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const cleaned = url.trim();

  // 1. If it's a full iframe tag, extract the src attribute
  if (cleaned.toLowerCase().includes('<iframe')) {
    const srcMatch = cleaned.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return getYouTubeEmbedUrl(srcMatch[1]);
    }
  }

  // 2. Look for patterns in the URL
  try {
    // If it's already an embed link
    if (cleaned.includes('youtube.com/embed/') || cleaned.includes('youtube-nocookie.com/embed/')) {
      const parts = cleaned.split('/embed/');
      if (parts[1]) {
        const videoId = parts[1].split('?')[0].split('&')[0].split('"')[0].split("'")[0];
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return cleaned;
    }

    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (cleaned.includes('youtube.com/watch')) {
      const vMatch = cleaned.match(/[?&]v=([^&#\s"']+)/);
      if (vMatch && vMatch[1]) {
        return `https://www.youtube.com/embed/${vMatch[1]}`;
      }
    }

    // Short watch URL: youtu.be/VIDEO_ID
    if (cleaned.includes('youtu.be/')) {
      const parts = cleaned.split('youtu.be/');
      if (parts[1]) {
        const videoId = parts[1].split('?')[0].split('&')[0].split('#')[0];
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
    }

    // YouTube Shorts: youtube.com/shorts/VIDEO_ID
    if (cleaned.includes('youtube.com/shorts/')) {
      const parts = cleaned.split('/shorts/');
      if (parts[1]) {
        const videoId = parts[1].split('?')[0].split('&')[0].split('#')[0];
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
    }

    // YouTube Live: youtube.com/live/VIDEO_ID
    if (cleaned.includes('youtube.com/live/')) {
      const parts = cleaned.split('/live/');
      if (parts[1]) {
        const videoId = parts[1].split('?')[0].split('&')[0].split('#')[0];
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing YouTube URL:', e);
  }

  // Fallback: If it contains youtube or youtu.be, try to extract any 11-char ID
  if (cleaned.includes('youtube') || cleaned.includes('youtu.be')) {
    const idMatch = cleaned.match(/(?:v=|\/embed\/|\/shorts\/|\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (idMatch && idMatch[1]) {
      return `https://www.youtube.com/embed/${idMatch[1]}`;
    }
  }

  return null;
}

export const AutoplayVideoFrame: FC<AutoplayVideoFrameProps> = ({ videoUrl, className = "" }) => {
  const ytEmbedUrl = getYouTubeEmbedUrl(videoUrl);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Helper to construct fully qualified absolute URL for direct video source if not YouTube
  const getAbsoluteVideoUrl = (urlStr: string) => {
    if (!urlStr) return '';
    const transformed = transformGoogleDriveUrl(urlStr, 'video');
    if (!transformed) return '';
    
    let absolute = transformed;
    if (transformed.startsWith('/')) {
      absolute = window.location.origin + transformed;
    }
    
    // Append a fake ext=.mp4 parameter to help browser's built-in MIME sniffing detection
    if (!absolute.includes('ext=.mp4')) {
      absolute += (absolute.includes('?') ? '&' : '?') + 'ext=.mp4';
    }
    
    return absolute;
  };

  const absoluteVideoUrl = getAbsoluteVideoUrl(videoUrl);

  // Extract video ID to append playlist parameter for robust looping
  const getYTVideoId = (embedUrl: string) => {
    try {
      const parts = embedUrl.split('/embed/');
      if (parts[1]) {
        return parts[1].split('?')[0].split('&')[0];
      }
    } catch (e) {
      console.warn('Error extracting ID from embed URL:', e);
    }
    return '';
  };

  const videoId = ytEmbedUrl ? getYTVideoId(ytEmbedUrl) : '';
  const finalYtUrl = ytEmbedUrl 
    ? `${ytEmbedUrl}${ytEmbedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&controls=1`
    : '';

  // Force HTML5 video element playback once in view
  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was blocked or failed to start programmatically:", err);
      });
    }
  }, [isInView]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-zinc-950/80 transform translate-z-0 isolate ${className}`}
    >
      {ytEmbedUrl ? (
        <iframe
          src={isInView ? finalYtUrl : ''}
          title="Promo Video"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={isInView ? absoluteVideoUrl : undefined}
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          loop
          playsInline
        />
      )}
    </div>
  );
};

