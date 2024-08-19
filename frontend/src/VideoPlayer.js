import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (Hls.isSupported()) {
      // Other Browsers like Chrome etc do not support HLS so need to use hls.js to make it possible
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error('Playback failed:', error);
          });
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari Browsers has inbuilt support for HLS so we directly pass master m3u8 file to the video src.
      videoRef.current.src = videoUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (isPlaying) {
          videoRef.current.play().catch((error) => {
            console.error('Playback failed:', error);
          });
        }
      });
    }
  }, [videoUrl, isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Playback failed:', error);
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
      <video
        ref={videoRef} // videoRef variable stores the reference to the video player tag
        controls
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transform: 'translate(-50%, -50%)',
          objectFit: 'cover'
        }}
      />
      {!isPlaying && (
        <div 
          onClick={handlePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '10px',
            borderRadius: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Click to Play
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
