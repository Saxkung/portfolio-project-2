import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';

export default function HeroSection() {
    const videoRef = useRef(null);
    const hlsSrc = "https://hls.saxai.site/Bg/bg_2/bg_2.m3u8";
    const posterSrc = "/assets/hero-poster.avif"; // (ใช้ poster ของคุณ)

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls; // ประกาศ hls ไว้ข้างนอก
        
        // --- 1. สร้างฟังก์ชันสำหรับเริ่มโหลด HLS ---
        const initHls = () => {
            console.log("Window is fully loaded. Initializing HLS now...");

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

        // --- 2. ตรวจสอบว่าหน้าเว็บโหลดเสร็จหรือยัง ---
        if (document.readyState === 'complete') {
            // ถ้าเสร็จแล้ว (เช่น ผู้ใช้เพิ่งเปลี่ยนหน้าใน SPA) ก็เริ่มเลย
            initHls();
        } else {
            // ถ้ายังไม่เสร็จ (โหลดครั้งแรก) ให้รอ event 'load'
            window.addEventListener('load', initHls);
        }

        // --- 3. Cleanup function (สำคัญมาก) ---
        return () => {
            window.removeEventListener('load', initHls); // ลบ event listener เผื่อไว้
            if (hls) {
                hls.destroy(); // ทำลาย hls instance เมื่อ component หายไป
            }
        };
    }, [hlsSrc]); // ให้ hlsSrc เป็น dependency ถูกต้องแล้ว

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
                preload="metadata" // "metadata" ดีมากครับ (บอกเบราว์เซอร์ว่ามีวิดีโอนะ แต่ยังไม่ต้องโหลด)
            >
            </video>
            
            <div className="container">
                <h1 className="text-white display-3">Panuwat Sarapat</h1>
                <p className="lead">"Composing a melodic tapestry that narrates a compelling story."</p>
            </div>
        </section>
    );
}