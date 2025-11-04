import React, { useRef, useEffect } from 'react';

export default function HeroSection() {
    const videoRef = useRef(null);
    const hlsInstanceRef = useRef(null); // เก็บ HLS instance
    const hlsSrc = "https://hls.saxai.site/Bg/bg_2/bg_2.m3u8";
    const posterSrc = "/assets/Bg/bg_2_frame_0.avif";

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls = null;
        let isUnmounted = false; // ป้องกัน setState หลัง unmount

        const initHls = async () => {
            if (isUnmounted) return;

            try {
                const { default: Hls } = await import('hls.js/dist/hls.light.js');

                if (Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                    });
                    hlsInstanceRef.current = hls;

                    hls.loadSource(hlsSrc);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (isUnmounted) return;
                        video.play().catch(e => console.warn('HLS auto-play blocked:', e));
                    });

                    hls.on(Hls.Events.ERROR, (e, data) => {
                        if (isUnmounted) return;
                        console.error('HLS Video Error:', data);
                        if (data.fatal) {
                            // ลองโหลดใหม่ถ้าตาย
                            setTimeout(() => !isUnmounted && hls && hls.loadSource(hlsSrc), 2000);
                        }
                    });

                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Safari native HLS
                    video.src = hlsSrc;
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.warn('Native auto-play blocked:', e));
                    }
                }
            } catch (err) {
                if (!isUnmounted) console.error('HLS init error:', err);
            }
        };

        // รอ DOM พร้อม
        if (document.readyState === 'complete') {
            initHls();
        } else {
            const onLoad = () => {
                window.removeEventListener('load', onLoad);
                initHls();
            };
            window.addEventListener('load', onLoad);
        }

        // Cleanup
        return () => {
            isUnmounted = true;
            window.removeEventListener('load', () => {});
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
        };
    }, [hlsSrc]); // ถ้า hlsSrc เปลี่ยน → reload

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
                crossOrigin="anonymous"
            >
            </video>

            <div className="container">
                <h1 className="text-white display-3">Panuwat Sarapat</h1>
                <p className="lead">"Composing a melodic tapestry that narrates a compelling story."</p>
            </div>
        </section>
    );
}