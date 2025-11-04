import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import './App.css';

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
    image: '/assets/S Logo.ico',
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

         const currentTrack = playerStateRef.current.currentTrack; 
         const isSameTrack = currentTrack && currentTrack.src === item.tracks[trackIndex].src;
         
         if (isSameTrack) {
            handlePlayPause();
         } else {
            
            setPlayerState(prev => ({
                ...prev,
                activePlaylist: item,
                activePlaylistId: item.id,
                currentTrackIndex: trackIndex,
                currentTrack: item.tracks[trackIndex],
                isShuffled: false,
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
            const nextMode = prev.loopMode === 'off' ? 'track' : 'off';
            return { ...prev, loopMode: nextMode };
        });
    }, []);

    const handleToggleShuffle = useCallback(() => {
        setPlayerState(prev => {
            const newShuffleState = !prev.isShuffled;
            
            if (!prev.currentTrack) {
                return { ...prev, isShuffled: newShuffleState };
            }

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
                };
            }

            return {
                ...prev,
                isShuffled: true,
            };
        });
    }, []);
   
    // useEffect (ตัวที่ 1 - สร้าง WaveSurfer)
    useEffect(() => {
        
        if (!waveformContainerRef.current || !audioRef.current) 
            {return;}

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
                const currentState = playerStateRef.current; 
                const { loopMode, isShuffled, currentTrackIndex, activePlaylist } = currentState;
                
                if (!activePlaylist) return;

                // 2. (Priority 1) เช็ค Loop Track (🔂)
                // ถ้าเปิด Loop Track ให้เล่นซ้ำทันที (Shuffle จะไม่มีผล)
                if (loopMode === 'track') {
                    wavesurferRef.current?.play();
                    return;
                }

                // 3. (Priority 2) เช็ค Shuffle (🔀)
                // ถ้า Loop Track ปิด และ Shuffle เปิด ให้สุ่มเพลงใหม่ (เล่นตลอดไป)
                if (isShuffled) {
                    handleNext(); // handleNext ของคุณจะจัดการสุ่มเพลงให้
                    return;
                }

                // 4. (Priority 3) ถ้ามาถึงนี่ แปลว่า Loop 'off' และ Shuffle 'off'
                // (โหมดเล่นตามลำดับปกติ)
                const trackCount = activePlaylist.tracks.length;
                const isLastTrack = currentTrackIndex === trackCount - 1;

                if (!isLastTrack) {
                    handleNext();
                } else {
                    // จบ Playlist และ Loop 'off' -> หยุดเล่น
                    setPlayerState(prev => ({ ...prev, isPlaying: false }));
                }
            });
            ws.on('interaction', () => {
                const duration = ws.getDuration();
                if (duration) ws.seekTo(ws.getCurrentTime() / duration);
            });
            ws.on('error', (err) => {
                if (err.name !== 'AbortError') {}
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
    }, [handleNext, waveformContainerRef.current, audioRef.current]);

    
    // useEffect (ตัวที่ 2 - Track Loader)
    useEffect(() => {
        
        if (!isWaveSurferReady || !playerState.currentTrack || !audioRef.current) {
            return;
        }

        const track = playerState.currentTrack;
        const trackUrl = track.src;
        const jsonUrl = trackUrl.replace(/\.m3u8(?=\?|$)/i, '.json');

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
                } catch (err) {}
            }

            const audio = audioRef.current;
            const ws = wavesurferRef.current; 

            const { default: Hls } = await import('hls.js/dist/hls.light.js');
            
            if (Hls.isSupported()) {
                const hls = new Hls();
                hlsRef.current = hls;
                hls.loadSource(trackUrl);
                hls.attachMedia(audio);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    
                    if (peaks && duration && ws) {
                        try {
                            ws.load(audio.src, peaks, duration);
                            ws.once('ready', () => {
                                audio.play().catch(e => {});
                            });

                        } catch (e) {
                            audio.play().catch(e => {});
                        }
                    } else {
                        audio.play().catch(e => {});
                    }
                });

                hls.on(Hls.Events.ERROR, (e, data) => {});

            } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
                audio.src = trackUrl;
                audio.addEventListener('loadedmetadata', () => {

                    if (peaks && duration && ws) {
                        try {
                            ws.load(audio.src, peaks, duration);
                            ws.once('ready', () => {
                                audio.play().catch(e => audio.play().catch(e => {}));
                            });
                        } catch (e) {
                            console.error('load peaks error (Safari):', e);
                            audio.play().catch(e => audio.play().catch(e => {}));
                        }
                    } else {
                         audio.play().catch(e => audio.play().catch(e => {}));
                    }
                }, { once: true });
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