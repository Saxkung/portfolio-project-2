import React, { useRef, useEffect } from 'react';

const HLS_SOURCE = 'https://hls.saxmusic.site/Bg/bg_2/bg_2.m3u8';
const POSTER = '/assets/Bg/bg_2_frame_0.avif';

function HeroSection() {
    const videoRef = useRef(null);
    const posterRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let disposed = false;
        let inView = true;
        let hls;
        let started = false;
        const isVisible = () => inView && !document.hidden;
        const play = () => video.play().catch(() => {});
        const updateVisibility = () => {
            if (disposed) return;
            if (isVisible()) {
                if (!started) { initVideo(); return; }
                hls?.startLoad();
                if (video.src) play();
            } else {
                video.pause();
                hls?.stopLoad();
            }
        };
        const hidePoster = () => {
            if (posterRef.current) posterRef.current.style.opacity = '0';
        };
        const initVideo = async () => {
            if (disposed || started || !isVisible()) return;
            started = true;
            try {
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = HLS_SOURCE;
                    play();
                    return;
                }
                const { default: Hls } = await import('hls.js/dist/hls.light.js');
                if (disposed || !Hls.isSupported()) return;
                hls = new Hls({
                    enableWorker: true, lowLatencyMode: false,
                    maxBufferLength: 10, maxMaxBufferLength: 20,
                    backBufferLength: 10, autoStartLoad: isVisible(),
                });
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (!disposed && isVisible()) play();
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        hls.destroy();
                        hls = null;
                        if (posterRef.current) posterRef.current.style.opacity = '1';
                    }
                });
                hls.loadSource(HLS_SOURCE);
                hls.attachMedia(video);
            } catch {
                // Keep the poster if this decorative video fails.
            }
        };

        video.addEventListener('playing', hidePoster);
        document.addEventListener('visibilitychange', updateVisibility);
        const observer = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            updateVisibility();
        });
        observer.observe(video);
        initVideo();
        return () => {
            disposed = true;
            observer.disconnect();
            document.removeEventListener('visibilitychange', updateVisibility);
            video.removeEventListener('playing', hidePoster);
            hls?.destroy();
            video.pause();
            video.removeAttribute('src');
            video.load();
        };
    }, []);

    return (
        <section className="hero-section">
            <div ref={posterRef} className="hero-bg-layer hero-bg-poster"
                style={{ backgroundImage: `url(${POSTER})`, zIndex: -1 }} />
            <video ref={videoRef} autoPlay loop muted playsInline aria-hidden="true"
                className="hero-bg-layer hero-bg-video-element"
                style={{ zIndex: -2 }} preload="metadata" crossOrigin="anonymous" />
            <div className="container">
                <h1 className="text-white display-3">Panuwat Sarapat</h1>
                <p className="lead">"Composing a melodic tapestry that narrates a compelling story."</p>
            </div>
        </section>
    );
}

export default React.memo(HeroSection);
