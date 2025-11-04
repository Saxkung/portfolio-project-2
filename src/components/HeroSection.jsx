import React, { useRef, useEffect } from 'react';
// 1. ลบ "import Hls from 'hls.js';" ออกจากตรงนี้

export default function HeroSection() {
    const videoRef = useRef(null);
    const hlsSrc = "https://hls.saxai.site/Bg/bg_2/bg_2.m3u8";
    const posterSrc = "/assets/Bg/bg_2_frame_0.avif";

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls;
        
        const initHls = async () => {
            console.log("Window is fully loaded. Initializing HLS now...");

            const { default: Hls } = await import('hls.js');

            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(hlsSrc);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.warn('HLS auto-play blocked:', e));
                });
                hls.on(Hls.Events.ERROR, (e, data) => console.error('HLS Video Error:', data));

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                console.log("Native HLS is supported");
                video.src = hlsSrc;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.warn('Native auto-play blocked:', e));
                });
            }
        };

        if (document.readyState === 'complete') {
            initHls();
        } else {
            window.addEventListener('load', initHls);
        }

        
        return () => {
            window.removeEventListener('load', initHls);
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
                poster={posterSrc}
                preload="metadata"
            >
            </video>
            
            <div className="container">
                <h1 className="text-white display-3">Panuwat Sarapat</h1>
                <p className="lead">"Composing a melodic tapestry that narrates a compelling story."</p>
            </div>
        </section>
    );
}