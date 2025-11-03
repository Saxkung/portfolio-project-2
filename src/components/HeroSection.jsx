import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';

export default function HeroSection() {
    const videoRef = useRef(null);
    
    const hlsSrc = "https://hls.saxai.site/Bg/bg_2/bg_2.m3u8";

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls;

        if (Hls.isSupported()) {
            console.log("HLS.js is supported, loading video...");
            hls = new Hls();
            hls.loadSource(hlsSrc);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.warn('Video auto-play was blocked:', e));
            });
            hls.on(Hls.Events.ERROR, (e, data) => console.error('HLS Video Error:', data));

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log("Native HLS is supported (e.g., Safari)");
            video.src = hlsSrc;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.warn('Video auto-play was blocked:', e));
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [hlsSrc]);

    return (
        <section className="hero-section">
            <video 
                ref={videoRef}
                autoPlay 
                loop 
                muted 
                playsInline 
                className="hero-bg-video"
            >
            </video>
            
            <div className="container">
                <h1 className="text-white display-3">Panuwat Sarapat</h1>
                <p className="lead">"Composing a melodic tapestry that narrates a compelling story."</p>
            </div>
        </section>
    );
}