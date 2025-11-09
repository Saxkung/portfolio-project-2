import React, { useState, useRef, useEffect, useCallback, Suspense, lazy, useMemo } from 'react'; // NEW: เพิ่ม useMemo
import './App.css';
// DELETED: import { portfolioDataCategorized } from './data/portfolioData'; // ลบบรรทัดนี้
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import BottomPlayer from './components/BottomPlayer';

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
    
    // NEW: ดึงข้อมูลจาก API ด้วย useEffect
    useEffect(() => {
        const fetchData = async () => {
            try {
                // !!สำคัญ!!: นี่คือ URL จริงของ API ที่คุณ Deploy
                const response = await fetch('/api/v1/portfolio');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setPortfolioData(data); // เก็บข้อมูลที่ได้ใน State

            } catch (error) {
                console.error("Failed to fetch portfolio data:", error);
                // คุณอาจจะตั้งค่า state error ที่นี่ เพื่อแสดงผลว่า "โหลดข้อมูลไม่สำเร็จ"
            } finally {
                setIsLoading(false); // สิ้นสุดการโหลด (ไม่ว่าจะสำเร็จหรือล้มเหลว)
            }
        };

        fetchData();
    }, []); // [] หมายถึงให้รันครั้งเดียวตอน App โหลด

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
            wavesurferRef.current.playPause();
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
                if (allTracks.length <= 1) {
                    return { ...prev, currentTrackIndex: 0, currentTrack: allTracks[0] };
                }
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * allTracks.length);
                } while (allTracks[newIndex].src === currentTrack?.src); 
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
            audioRef.current.play().catch(e => {});
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
   
    // --- (useEffect เดิมทั้งหมด) ---
    useEffect(() => {
        if (!isPlayerVisible) { return; }
        if (!waveformContainerRef.current || !audioRef.current) {return;}
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
                if (currentState.loopMode === 'track') {
                    wavesurferRef.current?.play();
                    return;
                }
                handleNext();
            });
            ws.on('interaction', () => {
                const duration = ws.getDuration();
                if (duration) ws.seekTo(ws.getCurrentTime() / duration);
            });
            ws.on('error', (err) => { if (err.name !== 'AbortError') {} });
            ws.on('ready', () => {
                const duration = ws.getDuration();
                setPlayerState(prev => ({ ...prev, duration }));
            });
            setIsWaveSurferReady(true);
        };
        initWaveSurfer();
        return () => {
            if (ws) { ws.destroy(); }
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
            setIsWaveSurferReady(false);
        };
    }, [handleNext, waveformContainerRef.current, audioRef.current, isPlayerVisible]);

    useEffect(() => {
        if (!isPlayerVisible) { return; }
        if (!isWaveSurferReady || !playerState.currentTrack || !audioRef.current) { return; }
        const track = playerState.currentTrack;
        const trackUrl = track.src;
        const jsonUrl = trackUrl.replace(/\.m3u8(?=\?|$)/i, '.json');
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (wavesurferRef.current) { wavesurferRef.current.stop(); }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
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
                            ws.once('ready', () => { audio.play().catch(e => {}); });
                        } catch (e) { audio.play().catch(e => {}); }
                    } else { audio.play().catch(e => {}); }
                });
                hls.on(Hls.Events.ERROR, (e, data) => {});
            } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
                audio.src = trackUrl;
                audio.addEventListener('loadedmetadata', () => {
                    if (peaks && duration && ws) {
                        try {
                            ws.load(audio.src, peaks, duration);
                            ws.once('ready', () => { audio.play().catch(e => audio.play().catch(e => {})); });
                        } catch (e) { audio.play().catch(e => audio.play().catch(e => {})); }
                    } else { audio.play().catch(e => audio.play().catch(e => {})); }
                }, { once: true });
            }
        };
        loadTrack();
        return () => {
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
            if (wavesurferRef.current) { wavesurferRef.current.stop(); }
            if (audioRef.current) { audioRef.current.pause(); }
        };
    }, [playerState.currentTrack, isWaveSurferReady, isPlayerVisible]);
    
    useEffect(() => {
        if (wavesurferRef.current && isWaveSurferReady) {
            wavesurferRef.current.setVolume(playerState.volume);
        }
    }, [playerState.volume, isWaveSurferReady]);

    
    // NEW: แสดงผล Loading...
    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                fontSize: '1.5rem', 
                color: 'var(--accent-color)',
                backgroundColor: 'var(--primary-color)'
            }}>
                Loading...
            </div>
        );
    }

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
                            portfolioData={portfolioData} // CHANGED: ใช้ portfolioData จาก State
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