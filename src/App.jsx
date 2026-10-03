import React, { useState, useRef, useEffect, useCallback, Suspense, lazy, useMemo } from 'react'; // NEW: เพิ่ม useMemo
import './App.css';
// DELETED: import { portfolioDataCategorized } from './data/portfolioData'; // ลบบรรทัดนี้
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BottomPlayer from './components/BottomPlayer';
import { validatePortfolio, getWaveformUrl, parseWaveform } from './lib/portfolio';

const PortfolioSection = lazy(() => import('./components/PortfolioSection'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

const peaksCache = new Map();

// DELETED: ย้าย 3 ตัวแปรนี้เข้าไปใน Component
// const allTracks = ...
// const portfolioDataMap = ...
// const allPlaylists = ...
 
function App() {
    // NEW: สร้าง State สำหรับเก็บข้อมูลที่ดึงมา และสถานะ Loading
    const [portfolioData, setPortfolioData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [portfolioError, setPortfolioError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // --- (โค้ด State เดิมของคุณ) ---
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
    const nextRef = useRef(null);
    const playerOpenTimerRef = useRef(null);
    const playerCloseTimerRef = useRef(null);

    useEffect(() => () => {
        clearTimeout(playerOpenTimerRef.current);
        clearTimeout(playerCloseTimerRef.current);
    }, []);
    
    // NEW: ดึงข้อมูลจาก API ด้วย useEffect
    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            setIsLoading(true);
            setPortfolioError(false);
            try {
                // !!สำคัญ!!: นี่คือ URL จริงของ API ที่คุณ Deploy
                const response = await fetch('/api/v1/portfolio', { signal: controller.signal });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!controller.signal.aborted) setPortfolioData(validatePortfolio(data));

            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Failed to fetch portfolio data:", error);
                    setPortfolioError(true);
                }
                // คุณอาจจะตั้งค่า state error ที่นี่ เพื่อแสดงผลว่า "โหลดข้อมูลไม่สำเร็จ"
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [retryCount]);

    // NEW: ใช้ useMemo เพื่อคำนวณค่าต่างๆ หลังจาก portfolioData พร้อมใช้งาน
    // (โค้ดข้างในเหมือนเดิมเป๊ะๆ แค่ย้ายมาไว้ใน useMemo)
    const allTracks = useMemo(() => {
        if (!portfolioData.length) return [];
        return portfolioData.flatMap(category => 
            category.items.flatMap(item => 
                item.tracks.map(track => ({
                    ...track,
                    artist: item.title, 
                    image: item.image,
                    playlistId: item.id
                }))
            )
        );
    }, [portfolioData]); // คำนวณใหม่เมื่อ portfolioData เปลี่ยน

    const portfolioDataMap = useMemo(() => {
        const map = new Map();
        portfolioData.forEach(category => {
            category.items.forEach(item => {
                map.set(item.id, item);
            });
        });
        return map;
    }, [portfolioData]); // คำนวณใหม่เมื่อ portfolioData เปลี่ยน

    const allPlaylists = useMemo(() => {
         if (!portfolioData.length) return [];
        return portfolioData.flatMap(category => category.items);
    }, [portfolioData]); // คำนวณใหม่เมื่อ portfolioData เปลี่ยน


    // --- (โค้ด Logic เดิมทั้งหมดของคุณ) ---
    // (เราแค่ต้องเพิ่ม allTracks, allPlaylists, portfolioDataMap เข้าไปใน dependencies ของ useCallback)

    const handlePlayPause = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause().catch(() => {});
        }
    }, []);

    const pushToHistory = useCallback(() => {
        const currentState = playerStateRef.current;
        if (!currentState.currentTrack) return; 
        if (!currentState.activePlaylist && currentState.activePlaylistId !== 'all') {
            return; 
        }
        setPlayHistory(prev => {
            const newHistory = [...prev, currentState];
            if (newHistory.length > 50) {
                return newHistory.slice(newHistory.length - 50);
            }
            return newHistory;
        });
    }, []);

    const handleNext = useCallback(() => {
        pushToHistory();
        setPlayerState(prev => {
            const { isShuffled, currentTrackIndex, activePlaylist, currentTrack } = prev;
            if (isShuffled) {
                if (!allTracks.length) return prev;
                if (allTracks.length <= 1) {
                    return { ...prev, currentTrackIndex: 0, currentTrack: allTracks[0] };
                }
                const alternatives = allTracks.map((track, index) => ({ track, index }))
                    .filter(({ track }) => track.src !== currentTrack?.src);
                if (!alternatives.length) return prev;
                const newIndex = alternatives[Math.floor(Math.random() * alternatives.length)].index;
                return {
                    ...prev,
                    activePlaylist: null,
                    activePlaylistId: 'all',
                    currentTrackIndex: newIndex,
                    currentTrack: allTracks[newIndex],
                };
            }
            if (!activePlaylist) return prev;
            const trackCount = activePlaylist.tracks.length;
            if (trackCount === 0) return prev;
            const isLastTrack = currentTrackIndex === trackCount - 1;
            if (isLastTrack) {
                const currentPlaylistIndex = allPlaylists.findIndex(p => p.id === activePlaylist.id);
                if (currentPlaylistIndex === -1) {
                    return { ...prev, currentTrackIndex: 0, currentTrack: activePlaylist.tracks[0] };
                }
                const nextPlaylistIndex = (currentPlaylistIndex + 1) % allPlaylists.length;
                const nextPlaylist = allPlaylists[nextPlaylistIndex];
                if (!nextPlaylist || nextPlaylist.tracks.length === 0) {
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
                const newIndex = currentTrackIndex + 1;
                return {
                    ...prev,
                    currentTrackIndex: newIndex,
                    currentTrack: activePlaylist.tracks[newIndex],
                };
            }
        });
    }, [pushToHistory, allTracks, allPlaylists]); // NEW: เพิ่ม allTracks, allPlaylists
    useEffect(() => { nextRef.current = handleNext; }, [handleNext]);

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
        const wasClosing = playerCloseTimerRef.current !== null;
        clearTimeout(playerCloseTimerRef.current);
        clearTimeout(playerOpenTimerRef.current);
        playerCloseTimerRef.current = null;
        playerOpenTimerRef.current = null;
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
            audioRef.current.pause();
        }
        const currentTrack = playerStateRef.current.currentTrack; 
        const isSameTrack = !wasClosing && currentTrack && currentTrack.src === item.tracks[trackIndex].src;
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
            // Mount the hidden player first so its original slide-in transition runs.
            playerOpenTimerRef.current = setTimeout(() => {
                playerOpenTimerRef.current = null;
                setIsPlayerVisible(true);
            }, 10);
        }
    }, [handlePlayPause, pushToHistory]);

    const handleClosePlayer = useCallback(() => {
        clearTimeout(playerOpenTimerRef.current);
        clearTimeout(playerCloseTimerRef.current);
        playerOpenTimerRef.current = null;
        if (wavesurferRef.current) { wavesurferRef.current.stop(); }
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); }
        setIsPlayerVisible(false);
        setPlayHistory([]);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        // Keep the player mounted until its original 300 ms slide-out completes.
        playerCloseTimerRef.current = setTimeout(() => {
            playerCloseTimerRef.current = null;
            setPlayerState(prev => ({
                ...prev,
                isPlaying: false,
                activePlaylistId: null, 
                activePlaylist: null,  
                currentTrack: null,    
                currentTime: 0,
                duration: 0,
            }));
        }, 300);
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
                const originalPlaylistId = (prev.activePlaylistId === 'all') 
                    ? prev.currentTrack.playlistId 
                    : prev.activePlaylistId;
                const originalPlaylist = portfolioDataMap.get(originalPlaylistId); // CHANGED
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
    }, [portfolioDataMap]); // NEW: เพิ่ม portfolioDataMap
   

    useEffect(() => {
        if (!isPlayerVisible || !waveformContainerRef.current || !audioRef.current) return;
        const audio = audioRef.current;
        const container = waveformContainerRef.current;
        let disposed = false;
        let ws;
        const initWaveSurfer = async () => {
            try {
                const { default: WaveSurfer } = await import('wavesurfer.js');
                if (disposed) return;
                ws = WaveSurfer.create({
                    container, media: audio, waveColor: '#4d4d4d',
                    progressColor: '#c6b185', height: 40, normalize: false,
                    cursorWidth: 0, barWidth: 2, barGap: 2, barRadius: 2,
                    dragToSeek: true, hideScrollbar: true,
                });
                wavesurferRef.current = ws;
                ws.on('play', () => setPlayerState(prev => ({ ...prev, isPlaying: true })));
                ws.on('pause', () => setPlayerState(prev => ({ ...prev, isPlaying: false })));
                ws.on('timeupdate', currentTime => setPlayerState(prev =>
                    Math.floor(prev.currentTime) === Math.floor(currentTime)
                        ? prev : { ...prev, currentTime }));
                ws.on('finish', () => {
                    const current = playerStateRef.current;
                    if (current.loopMode === 'track') {
                        audio.currentTime = 0;
                        audio.play().catch(() => {});
                    } else if (current.activePlaylist || current.isShuffled) {
                        nextRef.current?.();
                    }
                });
                ws.on('ready', duration => {
                    if (!disposed && Number.isFinite(duration)) {
                        setPlayerState(prev => ({ ...prev, duration }));
                    }
                });
                ws.on('error', error => {
                    if (!disposed && error.name !== 'AbortError') console.warn('Waveform unavailable', error);
                });
                setIsWaveSurferReady(true);
            } catch (error) {
                if (!disposed) console.warn('Player initialization failed', error);
            }
        };
        initWaveSurfer();
        return () => {
            disposed = true;
            ws?.destroy();
            if (wavesurferRef.current === ws) wavesurferRef.current = null;
            setIsWaveSurferReady(false);
        };
    }, [isPlayerVisible]);

    useEffect(() => {
        if (!isPlayerVisible || !isWaveSurferReady || !playerState.currentTrack ||
            !audioRef.current || !wavesurferRef.current) return;
        const audio = audioRef.current;
        const ws = wavesurferRef.current;
        const trackUrl = playerState.currentTrack.src;
        const jsonUrl = getWaveformUrl(trackUrl);
        const controller = new AbortController();
        let disposed = false;
        let hls;
        let waveform = peaksCache.get(jsonUrl);
        let renderedWaveform = null;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setPlayerState(prev => ({ ...prev, currentTime: 0, duration: 0 }));

        const play = () => {
            if (!disposed) audio.play().catch(() => {
                if (!disposed) setPlayerState(prev => ({ ...prev, isPlaying: false }));
            });
        };
        const renderWaveform = () => {
            if (disposed || !audio.src) return;
            const duration = waveform?.duration || audio.duration;
            if (!Number.isFinite(duration) || duration <= 0) return;
            const version = waveform || duration;
            if (renderedWaveform === version) return;
            renderedWaveform = version;
            ws.load(audio.src, waveform?.peaks || [[0, 0]], duration).catch(error => {
                if (!disposed && error.name !== 'AbortError') console.warn('Waveform unavailable', error);
            });
            setPlayerState(prev => ({ ...prev, duration }));
        };
        const onMetadata = () => { renderWaveform(); play(); };
        audio.addEventListener('loadedmetadata', onMetadata);

        if (jsonUrl && !waveform) {
            fetch(jsonUrl, { signal: controller.signal })
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                    if (disposed) return;
                    waveform = parseWaveform(data);
                    if (waveform) {
                        if (peaksCache.size >= 32) peaksCache.delete(peaksCache.keys().next().value);
                        peaksCache.set(jsonUrl, waveform);
                        renderWaveform();
                    }
                }).catch(error => {
                    if (!disposed && error.name !== 'AbortError') console.warn('Waveform request failed');
                });
        }

        const loadTrack = async () => {
            if (!jsonUrl || audio.canPlayType('application/vnd.apple.mpegurl')) {
                audio.src = trackUrl;
                play();
                return;
            }
            try {
                const { default: Hls } = await import('hls.js/dist/hls.light.js');
                if (disposed || !Hls.isSupported()) return;
                hls = new Hls({ backBufferLength: 30, maxBufferLength: 30 });
                hlsRef.current = hls;
                hls.on(Hls.Events.MANIFEST_PARSED, () => { renderWaveform(); play(); });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (!disposed && data.fatal) {
                        hls.destroy();
                        if (hlsRef.current === hls) hlsRef.current = null;
                        setPlayerState(prev => ({ ...prev, isPlaying: false }));
                    }
                });
                hls.loadSource(trackUrl);
                hls.attachMedia(audio);
            } catch (error) {
                if (!disposed) console.warn('Track initialization failed', error);
            }
        };
        loadTrack();
        return () => {
            disposed = true;
            controller.abort();
            audio.removeEventListener('loadedmetadata', onMetadata);
            hls?.destroy();
            if (hlsRef.current === hls) hlsRef.current = null;
            audio.pause();
        };
    }, [playerState.currentTrack, isWaveSurferReady, isPlayerVisible]);

    useEffect(() => {
        if (wavesurferRef.current && isWaveSurferReady) {
            wavesurferRef.current.setVolume(playerState.volume);
        }
    }, [playerState.volume, isWaveSurferReady]);

    const portfolioPlayerState = useMemo(() => ({
        isPlaying: playerState.isPlaying,
        currentTrack: playerState.currentTrack,
        activePlaylistId: playerState.activePlaylistId,
    }), [playerState.isPlaying, playerState.currentTrack, playerState.activePlaylistId]);

    return (
        <React.Fragment>
            <div className={`app-content visible ${isPlayerVisible ? 'player-is-active' : ''}`}>
                <Header />
                <main>
                    <HeroSection />
                    {isLoading && <section id="portfolio" className="section container" role="status">Loading works…</section>}
                    {portfolioError && <section id="portfolio" className="section container" role="alert">
                        <p>Unable to load works right now.</p>
                        <button className="btn btn-outline-light" onClick={() => setRetryCount(count => count + 1)}>Retry</button>
                    </section>}
                    <Suspense fallback={null}>
                        {!isLoading && !portfolioError && <PortfolioSection
                            playerState={portfolioPlayerState}
                            onTrackSelect={handleTrackSelect}
                            portfolioData={portfolioData}
                        />}
                        <AboutSection />
                    </Suspense>
                </main>
                <Suspense fallback={null}> 
                    <ContactSection />
                </Suspense>

                <audio ref={audioRef} preload="none" crossOrigin="anonymous" style={{ display: 'none' }} />

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
