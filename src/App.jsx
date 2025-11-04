import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import './App.css';

// (Static imports ของ WaveSurfer และ Hls ถูกลบไปแล้ว ดีมากครับ)

import { portfolioDataCategorized } from './data/portfolioData';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BottomPlayer from './components/BottomPlayer';

const PortfolioSection = lazy(() => import('./components/PortfolioSection'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

const peaksCache = new Map();

const allTracks = portfolioDataCategorized.flatMap(category => 
    category.items.flatMap(item => 
        item.tracks.map(track => ({
            ...track,
            // เพิ่มข้อมูล parent ให้เพลงด้วย
            artist: item.title, 
            image: item.image,
            playlistId: item.id
        }))
    )
);

const allTracksPlaylist = {
    id: 'all',
    title: 'All Tracks',
    image: '/assets/S Logo.ico', // (ใช้ icon ของเว็บแทน)
    tracks: allTracks
};

const portfolioDataMap = new Map();
portfolioDataCategorized.forEach(category => {
    category.items.forEach(item => {
        portfolioDataMap.set(item.id, item);
    });
});
 
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
        loopMode: 'off',
        isShuffled: false,
    });
    
    const playerStateRef = useRef(playerState);
    useEffect(() => { playerStateRef.current = playerState; }, [playerState]);

    const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);

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
        setPlayerState(prev => {
            const { isShuffled, currentTrackIndex, activePlaylist, currentTrack } = prev;

            if (isShuffled) {
                // --- โหมดสุ่ม: สุ่มจาก 'allTracksPlaylist' ทันที ---
                if (allTracksPlaylist.tracks.length <= 1) {
                    return { ...prev, currentTrackIndex: 0, currentTrack: allTracksPlaylist.tracks[0] };
                }
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * allTracksPlaylist.tracks.length);
                } while (allTracksPlaylist.tracks[newIndex].src === currentTrack?.src);
                
                return {
                    ...prev,
                    activePlaylist: allTracksPlaylist, // เปลี่ยน Playlist เป็น 'all'
                    activePlaylistId: 'all',
                    currentTrackIndex: newIndex,
                    currentTrack: allTracksPlaylist.tracks[newIndex],
                };
            }

            // --- โหมดปกติ: เล่นเพลงถัดไปใน Playlist ปัจจุบัน ---
            if (!activePlaylist) return prev;
            const trackCount = activePlaylist.tracks.length;
            if (trackCount === 0) return prev;
            
            const newIndex = (currentTrackIndex + 1) % trackCount;
            return {
                ...prev,
                currentTrackIndex: newIndex,
                currentTrack: activePlaylist.tracks[newIndex],
            };
        });
    }, []);

    const handlePrev = useCallback(() => {
        setPlayerState(prev => {
            const { isShuffled, currentTrackIndex, activePlaylist, currentTrack } = prev;

            if (isShuffled) {
                // --- โหมดสุ่ม: (Prev = สุ่มเพลงใหม่) ---
                if (allTracksPlaylist.tracks.length <= 1) {
                    return { ...prev, currentTrackIndex: 0, currentTrack: allTracksPlaylist.tracks[0] };
                }
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * allTracksPlaylist.tracks.length);
                } while (allTracksPlaylist.tracks[newIndex].src === currentTrack?.src);
                
                return {
                    ...prev,
                    activePlaylist: allTracksPlaylist,
                    activePlaylistId: 'all',
                    currentTrackIndex: newIndex,
                    currentTrack: allTracksPlaylist.tracks[newIndex],
                };
            }

            // --- โหมดปกติ: เล่นเพลงก่อนหน้า ---
            if (!activePlaylist) return prev;
            const trackCount = activePlaylist.tracks.length;
            if (trackCount === 0) return prev;
            
            const newIndex = (currentTrackIndex - 1 + trackCount) % trackCount;
            return {
                ...prev,
                currentTrackIndex: newIndex,
                currentTrack: activePlaylist.tracks[newIndex],
            };
        });
    }, []);
    
    const handleTrackSelect = useCallback((item, trackIndex) => {
         // ใช้ Ref เพื่อป้องกัน Stale State
         const currentTrack = playerStateRef.current.currentTrack; 
         const isSameTrack = currentTrack && currentTrack.src === item.tracks[trackIndex].src;
         
         if (isSameTrack) {
            handlePlayPause();
         } else {
            // --- ⬇️ นี่คือส่วนที่ผมทำตกหล่นไปครับ ⬇️ ---
            setPlayerState(prev => ({
                ...prev,
                activePlaylist: item, // ⬅️ คืนค่าบรรทัดนี้
                activePlaylistId: item.id, // ⬅️ คืนค่าบรรทัดนี้
                currentTrackIndex: trackIndex, // ⬅️ คืนค่าบรรทัดนี้
                currentTrack: item.tracks[trackIndex], // ⬅️ คืนค่าบรรทัดนี้
                isShuffled: false, // (บรรทัดนี้ถูกต้องแล้ว)
            }));
         }
    }, [handlePlayPause]);

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

    const handleToggleLoop = useCallback(() => {
        setPlayerState(prev => {
            const modes = ['off', 'playlist', 'track'];
            const currentModeIndex = modes.indexOf(prev.loopMode);
            const nextMode = modes[(currentModeIndex + 1) % modes.length];
            return { ...prev, loopMode: nextMode };
        });
    }, []);

    const handleToggleShuffle = useCallback(() => {
        setPlayerState(prev => {
            const newShuffleState = !prev.isShuffled;
            
            // ถ้าไม่มีเพลงเล่นอยู่ ก็แค่สลับโหมด
            if (!prev.currentTrack) {
                return { ...prev, isShuffled: newShuffleState };
            }

            // --- กำลังจะ "ปิด" Shuffle ---
            if (newShuffleState === false) { 
                // คืนค่า Playlist กลับไปเป็น Playlist ดั้งเดิม
                const currentSrc = prev.currentTrack.src;
                
                // หา ID ของ Playlist ดั้งเดิม
                const originalPlaylistId = (prev.activePlaylistId === 'all') 
                    ? prev.currentTrack.playlistId 
                    : prev.activePlaylistId;
                
                const originalPlaylist = portfolioDataMap.get(originalPlaylistId);
                if (!originalPlaylist) {
                     return { ...prev, isShuffled: false }; // กันเหนียว
                }
                
                // หา Index ของเพลงใน Playlist ดั้งเดิม
                const originalIndex = originalPlaylist.tracks.findIndex(t => t.src === currentSrc);

                return {
                    ...prev,
                    isShuffled: false,
                    activePlaylist: originalPlaylist,
                    activePlaylistId: originalPlaylist.id,
                    currentTrackIndex: (originalIndex > -1) ? originalIndex : 0,
                    // เพลงยังเล่นต่อ ไม่ถูกขัดจังหวะ
                };
            }

            // --- กำลังจะ "เปิด" Shuffle ---
            // (นี่คือสิ่งที่ user ต้องการ)
            // เราแค่เปิดโหมด แต่ *ไม่* เปลี่ยน ActivePlaylist
            // ปล่อยให้ 'handleNext' หรือ 'on(finish)' เป็นคนจัดการเปลี่ยนเอง
            return {
                ...prev,
                isShuffled: true,
            };
        });
    }, []);
   
    // useEffect (ตัวที่ 1 - สร้าง WaveSurfer)
    useEffect(() => {
        if (!waveformContainerRef.current || !audioRef.current) return;

        const audio = audioRef.current;
        let ws = null;

        const initWaveSurfer = async () => {
            const { default: WaveSurfer } = await import('wavesurfer.js');
            
            ws = WaveSurfer.create({
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

            
            ws.on('play', () => setPlayerState(prev => ({ ...prev, isPlaying: true })));
            ws.on('pause', () => setPlayerState(prev => ({ ...prev, isPlaying: false })));
            ws.on('timeupdate', (currentTime) => setPlayerState(prev => ({ ...prev, currentTime })));
            //ws.on('finish', handleNext);
            ws.on('finish', () => {
                // ใช้ Ref เพื่อเอา State ล่าสุด
                const currentState = playerStateRef.current; 
                const { loopMode, isShuffled, currentTrackIndex, activePlaylist } = currentState;
                
                if (!activePlaylist) return;
                const trackCount = activePlaylist.tracks.length;

                // 1. ถ้าวนซ้ำเพลงเดียว (Loop Track)
                if (loopMode === 'track') {
                    wavesurferRef.current?.play();
                    return;
                }

                // 2. ถ้าสับเพลง (Shuffle)
                if (isShuffled) {
                    handleNext(); // handleNext จะจัดการสุ่มเพลงให้
                    return;
                }

                // 3. ถ้าไม่สับเพลง (No Shuffle)
                const isLastTrack = currentTrackIndex === trackCount - 1;

                if (loopMode === 'playlist') {
                    handleNext(); // วนซ้ำทั้ง Playlist
                    return;
                }

                if (loopMode === 'off' && !isLastTrack) {
                    handleNext(); // เล่นเพลงถัดไป (ยังไม่ถึงเพลงสุดท้าย)
                    return;
                }

                // 4. ถ้า Loop 'off' และเป็นเพลงสุดท้าย: หยุดเล่น
                if (loopMode === 'off' && isLastTrack) {
                    setPlayerState(prev => ({ ...prev, isPlaying: false }));
                }
            });
            ws.on('interaction', () => {
                const duration = ws.getDuration();
                if (duration) ws.seekTo(ws.getCurrentTime() / duration);
            });
            ws.on('error', (err) => {
                if (err.name !== 'AbortError') console.error('WaveSurfer error:', err);
            });
            ws.on('ready', () => {
                const duration = ws.getDuration();
                setPlayerState(prev => ({ ...prev, duration }));
            });

            setIsWaveSurferReady(true);
        };

        initWaveSurfer();

        return () => {
            if (ws) { 
                ws.destroy();
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            setIsWaveSurferReady(false);
        };
    }, [handleNext]);

    
    useEffect(() => {
        
        if (!isWaveSurferReady || !playerState.currentTrack || !audioRef.current) {
            return;
        }

        const track = playerState.currentTrack;
        const trackUrl = track.src;
        const isHLS = trackUrl.endsWith('.m3u8');
        const jsonUrl = trackUrl.replace(/\.(mp3|m3u8)(?=\?|$)/i, '.json');

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (wavesurferRef.current) {
            wavesurferRef.current.stop();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }


        const loadTrack = async () => {
            let peaks = null;
            let duration = null;

            if (peaksCache.has(jsonUrl)) {
                const cachedData = peaksCache.get(jsonUrl);
                peaks = cachedData.data;
                duration = cachedData.duration;
            } else {
                try {
                    const res = await fetch(jsonUrl);
                    if (res.ok) {
                        const data = await res.json();
                        peaks = data.data;
                        duration = data.duration;
                        peaksCache.set(jsonUrl, data); 
                    }
                } catch (err) {
                    console.warn('โหลด peaks ไม่ได้:', err);
                }
            }

            const audio = audioRef.current;

            if (isHLS) {
                const { default: Hls } = await import('hls.js/dist/hls.light.js');
                
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
                
                wavesurferRef.current.stop();
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
        
    
    }, [playerState.currentTrack, isWaveSurferReady]); 
    

    
    useEffect(() => {
        
        if (wavesurferRef.current && isWaveSurferReady) {
            wavesurferRef.current.setVolume(playerState.volume);
        }
    }, [playerState.volume, isWaveSurferReady]);

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
                    onToggleLoop={handleToggleLoop}
                    onToggleShuffle={handleToggleShuffle}
                />
            </div>
        </React.Fragment>
    );
}

export default App;