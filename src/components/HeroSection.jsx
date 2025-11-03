import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';

export default function HeroSection() {
    const videoRef = useRef(null);
    
    const hlsSrc = "https://hls.saxai.site/Bg/bg_2/bg_2.m3u8";
    
    // (สมมติว่าคุณใช้ poster จากคำตอบที่แล้ว)
    const posterSrc = "/assets/hero-poster.avif"; 

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // --- 1. เพิ่มส่วนนี้เข้าไป ---
        // พยายามสั่ง .play() ทันที
        // เนื่องจาก tag <video> ของเรามี 'muted' และ 'autoPlay' อยู่แล้ว
        // การสั่ง .play() ซ้ำจะช่วย "กระตุ้น" เบราว์เซอร์ที่อาจจะยังลังเล
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // การ Autoplay ถูกบล็อกในตอนแรก (เป็นเรื่องปกติ)
                // เดี๋ยว hls.js จะพยายามเล่นอีกครั้งเมื่อพร้อม
                console.warn("Autoplay was blocked initially (this is often normal):", error);
            });
        }
        // --- จบส่วนที่เพิ่ม ---


        let hls;

        if (Hls.isSupported()) {
            console.log("HLS.js is supported, loading video...");
            hls = new Hls();
            hls.loadSource(hlsSrc);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // HLS พร้อมแล้ว, สั่ง .play() (อีกครั้ง) เพื่อความชัวร์
                video.play().catch(e => console.warn('HLS.js: Video auto-play was blocked:', e));
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