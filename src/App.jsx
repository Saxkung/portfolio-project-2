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
            artist: item.title, 
            image: item.image,
            playlistId: item.id
        }))
    )
);

const portfolioDataMap = new Map();
portfolioDataCategorized.forEach(category => {
    category.items.forEach(item => {
        portfolioDataMap.set(item.id, item);
    });
});

const allPlaylists = portfolioDataCategorized.flatMap(category => category.items);
 
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
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);
    const [playHistory, setPlayHistory] = useState([]);

    const playerStateRef = useRef(playerState);
    const playHistoryRef = useRef(playHistory);
    
    useEffect(() => { playerStateRef.current = playerState; }, [playerState]);
    useEffect(() => { playHistoryRef.current = playHistory; }, [playHistory]);

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

    //NEW: Helper Function สำหรับบันทึกประวัติ
    const pushToHistory = useCallback(() => {
        // บันทึกสถานะ *ปัจจุบัน* ก่อนที่จะเปลี่ยน
        const currentState = playerStateRef.current;
        if (!currentState.currentTrack) return; // ไม่ต้องบันทึกถ้าไม่มีเพลง

        if (!currentState.activePlaylist && currentState.activePlaylistId !== 'all') {
            return; // ไม่ต้องบันทึกสถานะ "กำลังปิด" ลงประวัติ
        }

        setPlayHistory(prev => {
            const newHistory = [...prev, currentState];
            // จำกัดประวัติไว้ 50 เพลง
            if (newHistory.length > 50) {
                return newHistory.slice(newHistory.length - 50);
            }
            return newHistory;
        });
    }, []);

    const handleNext = useCallback(() => {
        // บันทึกประวัติก่อนเล่นเพลงถัดไป
        pushToHistory();

        setPlayerState(prev => {
            const { isShuffled, currentTrackIndex, activePlaylist, currentTrack } = prev;

            if (isShuffled) {
                // โหมดสุ่ม (ใช้ allTracks Array) ---
                if (allTracks.length <= 1) {
                    return { 
                        ...prev, 
                        currentTrackIndex: 0, 
                        currentTrack: allTracks[0] 
                    };
                }
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * allTracks.length);
                } while (allTracks[newIndex].src === currentTrack?.src); // กันเพลงซ้ำ
                
                return {
                    ...prev,
                    activePlaylist: null,
                    activePlaylistId: 'all',
                    currentTrackIndex: newIndex,
                    currentTrack: allTracks[newIndex],
                };
            }

            // : โหมดปกติ (ข้าม Playlist) ---
            if (!activePlaylist) return prev;
            const trackCount = activePlaylist.tracks.length;
            if (trackCount === 0) return prev;
            
            const isLastTrack = currentTrackIndex === trackCount - 1;

            if (isLastTrack) {
                // ถ้าเป็นเพลงสุดท้าย -> ไป Playlist ถัดไป
                const currentPlaylistIndex = allPlaylists.findIndex(p => p.id === activePlaylist.id);

                // ถ้าหาไม่เจอ (เช่น อยู่ใน 'all' ตอนกดปิด shuffle) หรือเป็น Playlist สุดท้าย
                if (currentPlaylistIndex === -1) {
                    // วนใน Playlist เดิม (พฤติกรรมสำรอง)
                    return { ...prev, currentTrackIndex: 0, currentTrack: activePlaylist.tracks[0] };
                }

                // ไป Playlist ถัดไป (วนลูป)
                const nextPlaylistIndex = (currentPlaylistIndex + 1) % allPlaylists.length;
                const nextPlaylist = allPlaylists[nextPlaylistIndex];

                if (!nextPlaylist || nextPlaylist.tracks.length === 0) {
                    // ถ้า Playlist ถัดไปว่าง ก็วน Playlist เดิม
                    return { ...prev, currentTrackIndex: 0, currentTrack: activePlaylist.tracks[0] };
                }

                return {
                    ...prev,
                    activePlaylist: nextPlaylist,
                    activePlaylistId: nextPlaylist.id,
                    currentTrackIndex: 0,
                    currentTrack: nextPlaylist.tracks[0],
                };

            } else {
                // ถ้าไม่ใช่เพลงสุดท้าย -> ไปเพลงถัดไปใน Playlist เดิม
                const newIndex = currentTrackIndex + 1;
                return {
                    ...prev,
                    currentTrackIndex: newIndex,
                    currentTrack: activePlaylist.tracks[newIndex],
                };
            }
        });
    }, [pushToHistory]);

    const handlePrev = useCallback(() => {
        const history = playHistoryRef.current;

        if (history.length === 0) {
            if (wavesurferRef.current) {
                wavesurferRef.current.seekTo(0);
            }
            return;
        }

        const lastState = history[history.length - 1];  
        setPlayHistory(prev => prev.slice(0, -1));
        setPlayerState(lastState);

    }, []);
    
    const handleTrackSelect = useCallback((item, trackIndex) => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(e => {
            });
            audioRef.current.pause();
        }

        const currentTrack = playerStateRef.current.currentTrack; 
        const isSameTrack = currentTrack && currentTrack.src === item.tracks[trackIndex].src;
        
        if (isSameTrack) {
            handlePlayPause();
            if (!playerStateRef.current.isPlaying) {
                setIsPlayerVisible(true);
            }

        } else {
            pushToHistory();

            setPlayerState(prev => ({
                ...prev,
                activePlaylist: item,
                activePlaylistId: item.id,
                currentTrackIndex: trackIndex,
                currentTrack: item.tracks[trackIndex],
                isShuffled: false,
                isPlaying: true,
            }));
        setTimeout(() => {
                setIsPlayerVisible(true);
            }, 10);
        }
    }, [handlePlayPause, pushToHistory]);

    const handleClosePlayer = useCallback(() => {
        if (wavesurferRef.current) { wavesurferRef.current.stop(); }
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        
        setIsPlayerVisible(false);
        setPlayHistory([]);
        setTimeout(() => {
            //"หลังจาก" 300ms ค่อย "ล้างค่าทุกอย่าง"
            setPlayerState(prev => ({
                ...prev,
                isPlaying: false,
                activePlaylistId: null, 
                activePlaylist: null,  
                currentTrack: null,    
                currentTime: 0,
                duration: 0,
            }));
        }, 300); // (ต้องตรงกับเวลา transition ใน App.css)

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
                const currentSrc = prev.currentTrack.src;
                
                // หา ID ของ Playlist ดั้งเดิม
                const originalPlaylistId = (prev.activePlaylistId === 'all') 
                    ? prev.currentTrack.playlistId 
                    : prev.activePlaylistId;
                
                const originalPlaylist = portfolioDataMap.get(originalPlaylistId);
                if (!originalPlaylist) {
                     return { ...prev, isShuffled: false };
                }
                
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
        if (!isPlayerVisible) {
            return;
        }
        
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
            ws.on('finish', () => {
                const currentState = playerStateRef.current; 
                
                if (!currentState.activePlaylist && !currentState.isShuffled) return;

                // (Priority 1) เช็ค Loop Track (🔂)
                if (currentState.loopMode === 'track') {
                    wavesurferRef.current?.play();
                    return;
                }

                // (Priority 2) ถ้า Loop Track ปิด
                // ให้เรียก handleNext เสมอ (ซึ่ง handleNext จะจัดการเองว่า
                // จะสุ่ม, ไปเพลงถัดไป, หรือไป Playlist ถัดไป)
                handleNext();
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
    }, [handleNext, waveformContainerRef.current, audioRef.current, isPlayerVisible]);

    
    // useEffect (ตัวที่ 2 - Track Loader)
    useEffect(() => {
        if (!isPlayerVisible) {
            return;
        }
        
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
        
    
    }, [playerState.currentTrack, isWaveSurferReady, isPlayerVisible]);
    

    
    useEffect(() => {
        
        if (wavesurferRef.current && isWaveSurferReady) {
            wavesurferRef.current.setVolume(playerState.volume);
        }
    }, [playerState.volume, isWaveSurferReady]);

    return (
        <React.Fragment>
            <div className={`app-content visible ${isPlayerVisible ? 'player-is-active' : ''}`}>
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
                    isPlayerVisible={isPlayerVisible}
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