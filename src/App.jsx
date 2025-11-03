import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import './App.css';
import WaveSurfer from 'wavesurfer.js'
import Hls from 'hls.js';

import { portfolioDataCategorized } from './data/portfolioData';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BottomPlayer from './components/BottomPlayer';


const PortfolioSection = lazy(() => import('./components/PortfolioSection'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

// --- 1. สร้าง Cache ไว้ข้างนอก ---
const peaksCache = new Map();
 
function App() {

    const [playerState, setPlayerState] = useState({
        isPlaying: false,
        currentTrack: null,
        activePlaylistId: null,
        activePlaylist: null,
        currentTrackIndex: 0,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
        volumeBeforeMute: 1,
    });
    
    const wavesurferRef = useRef(null);
    const waveformContainerRef = useRef(null);
    const audioRef = useRef(null);
    const hlsRef = useRef(null);

    const handlePlayPause = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    }, []);

    const handleNext = useCallback(() => {
        if (!playerState.activePlaylist) return;
        const newIndex = (playerState.currentTrackIndex + 1) % playerState.activePlaylist.tracks.length;
        setPlayerState(prev => ({
            ...prev,
            currentTrackIndex: newIndex,
            currentTrack: prev.activePlaylist.tracks[newIndex],
        }));
    }, [playerState.currentTrackIndex, playerState.activePlaylist]);

    const handlePrev = useCallback(() => {
        if (!playerState.activePlaylist) return;
        const newIndex = (playerState.currentTrackIndex - 1 + playerState.activePlaylist.tracks.length) % playerState.activePlaylist.tracks.length;
        setPlayerState(prev => ({
            ...prev,
            currentTrackIndex: newIndex,
            currentTrack: prev.activePlaylist.tracks[newIndex],
        }));
    }, [playerState.currentTrackIndex, playerState.activePlaylist]);
    
    const handleTrackSelect = useCallback((item, trackIndex) => {
         const isSameTrack = playerState.currentTrack && playerState.currentTrack.src === item.tracks[trackIndex].src;
         if (isSameTrack) {
            handlePlayPause();
         } else {
            setPlayerState(prev => ({
                ...prev,
                activePlaylist: item,
                activePlaylistId: item.id,
                currentTrackIndex: trackIndex,
                currentTrack: item.tracks[trackIndex],
            }));
         }
    }, [playerState.currentTrack, handlePlayPause]);

    const handleClosePlayer = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.stop();
            wavesurferRef.current.empty();
        }
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setPlayerState(prev => ({
            ...prev,
            isPlaying: false,
            currentTrack: null,
            activePlaylistId: null,
            activePlaylist: null,
            currentTime: 0,
            duration: 0,
        }));
    }, []);
    
    const handleVolumeChange = useCallback((e) => {
        const newVolume = parseFloat(e.target.value);
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(newVolume);
        }
        setPlayerState(prev => ({
            ...prev,
            volume: newVolume,
            isMuted: newVolume === 0,
        }));
    }, []);

    const toggleMute = useCallback(() => {
        setPlayerState(prev => {
            const isCurrentlyMuted = prev.volume === 0;
            let newVolume;
            if (isCurrentlyMuted) {
                newVolume = prev.volumeBeforeMute;
                return { ...prev, volume: newVolume, isMuted: false };
            } else {
                newVolume = 0;
                return { ...prev, volumeBeforeMute: prev.volume, volume: newVolume, isMuted: true };
            }
        });
    }, []);

    useEffect(() => {
        if (!waveformContainerRef.current || !audioRef.current) return;

        const audio = audioRef.current;

        const ws = WaveSurfer.create({
            container: waveformContainerRef.current,
            backend: 'MediaElement',
            media: audio,
            waveColor: '#4d4d4d',
            progressColor: '#c6b185',
            height: 40,
            normalize: false,
            cursorWidth: 0,
            barWidth: 2,
            barGap: 2,
            barRadius: 2,
            dragToSeek: true,
            responsive: true,
            hideScrollbar: true,
            
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            const duration = ws.getDuration();
            setPlayerState(prev => ({ ...prev, duration }));
        });

        ws.on('play', () => setPlayerState(prev => ({ ...prev, isPlaying: true })));
        ws.on('pause', () => setPlayerState(prev => ({ ...prev, isPlaying: false })));
        ws.on('timeupdate', (currentTime) => setPlayerState(prev => ({ ...prev, currentTime })));
        ws.on('finish', handleNext);
        ws.on('interaction', () => {
            const duration = ws.getDuration();
            if (duration) ws.seekTo(ws.getCurrentTime() / duration);
        });

        ws.on('error', (err) => {
            if (err.name !== 'AbortError') {
                console.error('WaveSurfer error:', err);
            }
        });

        return () => {
            if (ws) {
                ws.destroy();
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [handleNext]);

    
    useEffect(() => {
        if (!wavesurferRef.current || !playerState.currentTrack || !audioRef.current) return;

        const track = playerState.currentTrack;
        const trackUrl = track.src;
        const isHLS = trackUrl.endsWith('.m3u8');
        const jsonUrl = trackUrl.replace(/\.(mp3|m3u8)(?=\?|$)/i, '.json');

        // Cleanup
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (wavesurferRef.current) {
            wavesurferRef.current.empty();
            wavesurferRef.current.stop();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }

        const loadTrack = async () => {
            let peaks = null;
            let duration = null;

            // --- 2. โค้ด Cache ที่แก้ไขแล้ว ---
            if (peaksCache.has(jsonUrl)) {
                // 2a. ถ้ามีใน Cache: ดึงจาก Cache เลย
                const cachedData = peaksCache.get(jsonUrl);
                peaks = cachedData.data;
                duration = cachedData.duration;
                console.log('Peaks โหลดจาก Cache สำเร็จ:', { duration, length: peaks?.length });
            
            } else {
                // 2b. ถ้าไม่มีใน Cache: โหลดใหม่
                try {
                    const res = await fetch(jsonUrl);
                    if (res.ok) {
                        const data = await res.json();
                        peaks = data.data;
                        duration = data.duration;
                        
                        // --- 3. เก็บลง Cache! ---
                        peaksCache.set(jsonUrl, data); 
                        
                        console.log('Peaks โหลดใหม่ (และเก็บลง Cache) สำเร็จ:', { duration, length: peaks?.length });
                    }
                } catch (err) {
                    console.warn('โหลด peaks ไม่ได้:', err);
                }
            }
            // --- จบส่วนที่แก้ไข ---

            const audio = audioRef.current;

            //ตั้งค่า HLS (เสียงเล่นผ่าน audio)
            if (isHLS) {
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hlsRef.current = hls;
                    hls.loadSource(trackUrl);
                    hls.attachMedia(audio);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log('HLS โหลดสำเร็จ');
                        audio.play().catch(e => console.warn('Auto-play ถูกบล็อก:', e));
                    });

                    hls.on(Hls.Events.ERROR, (e, data) => console.error('HLS Error:', data));
                } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
                    audio.src = trackUrl;
                    audio.addEventListener('loadedmetadata', () => {
                        console.log('Safari HLS loaded');
                        audio.play().catch(e => console.warn('Auto-play ถูกบล็อก:', e));
                    }, { once: true });
                }
            } else {
                audio.src = trackUrl;
                audio.load();
                audio.play().catch(e => console.warn('Auto-play ถูกบล็อก:', e));
            }

           if (peaks && duration && wavesurferRef.current) {
                try {
                    wavesurferRef.current.load(audio.src, peaks, duration);
                    console.log('Waveform วาดจาก peaks สำเร็จ');
                } catch (e) {
                    console.error('load peaks error:', e);
                }
            }
        };

        loadTrack();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (wavesurferRef.current) {
                wavesurferRef.current.empty();
                wavesurferRef.current.stop();
            }
            if (audioRef.current) {
                audioRef.current.pause();
                //audioRef.current.src = '';
            }
        };
    }, [playerState.currentTrack]);
    
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(playerState.volume);
        }
    }, [playerState.volume]);

    return (
        <React.Fragment>
            <div className="app-content visible">
                <Header />
                <main>
                    <HeroSection />
                    <Suspense>
                        <PortfolioSection 
                            playerState={playerState} 
                            onTrackSelect={handleTrackSelect}
                            portfolioData={portfolioDataCategorized} 
                        />
                        <AboutSection />
                    </Suspense>
                </main>
                <Suspense fallback={null}> 
                    <ContactSection />
                </Suspense>

                {/* เพิ่ม <audio> ซ่อนไว้ */}
                <audio ref={audioRef} style={{ display: 'none' }} />

                <BottomPlayer 
                    playerState={playerState}
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                    waveformContainerRef={waveformContainerRef}
                    onClosePlayer={handleClosePlayer}
                />
            </div>
        </React.Fragment>
    );
}

// --- 4. เพิ่มส่วนที่ขาดหายไป ---
export default App;