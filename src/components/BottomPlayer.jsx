import React from 'react';

export default function BottomPlayer({ playerState, onPlayPause, onNext, onPrev, waveformContainerRef, onVolumeChange, onToggleMute, onClosePlayer, onToggleLoop, onToggleShuffle }) {
    const { isPlaying, currentTrack, currentTime, duration, activePlaylist, volume, loopMode, isShuffled, activePlaylistId } = playerState;
    
    const formatTime = (time) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const getVolumeSVG = () => {
        if (volume === 0) {
            // volume-off
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="1.3em" height="1.3em" fill="currentColor">
                    {/* ใช้ viewBox 640 และใช้ transform="translate(160 0)" 
                      เพื่อจัดกลาง ( (640-320)/2 = 160 ) 
                    */}
                    <g transform="translate(160 0)">
                        <path d="M320 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L131.8 160 64 160c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l67.8 0L266.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S320 460.6 320 448l0-384z"/>
                    </g>
                </svg>
            );
        }
        if (volume < 0.5) {
            // volume-low
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="1.3em" height="1.3em" fill="currentColor">
                    {/* ใช้ viewBox 640 และใช้ transform="translate(96 0)" 
                      เพื่อจัดกลาง ( (640-448)/2 = 96 ) 
                    */}
                    <g transform="translate(96 0)">
                        <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z"/>
                    </g>
                </svg>
            );
        }
        // volume-high (อันนี้กว้างสุด 640 อยู่แล้ว ไม่ต้องแก้)
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="1.3em" height="1.3em" fill="currentColor">
                <path d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/>
            </svg>
        );
    };

    const getLoopButtonClass = () => {
        if (loopMode === 'track') return 'active loop-mode-track';
        if (loopMode === 'playlist') return 'active';
        return '';
    };

    if (!currentTrack) return null;
    let displayImage, displayArtist;

    displayArtist = currentTrack.artist;
    displayImage = activePlaylistId === 'all' 
        ? currentTrack.image 
        : activePlaylist?.image;
    const showClass = (activePlaylist || activePlaylistId === 'all') ? 'show' : '';

    return (
        <div className={`bottom-player ${showClass}`}>
            <button
                className="btn-close-player"
                aria-label="Close Player"
                onClick={() => { if (typeof onClosePlayer === 'function') onClosePlayer(); }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    fill="currentColor"
                    width="1em"
                    height="1em"
                >
                    <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
                </svg>
            </button>
            <div className="bottom-player-track-info">
                <img src={displayImage} alt={currentTrack.title} />
                <div className="details">
                    <span className="title">{currentTrack.title}</span>
                    <span className="artist">{displayArtist}</span>
                </div>
            </div>
            <div className="bottom-player-controls">
                <div className="player-buttons">
                    <button onClick={onToggleShuffle} aria-label="Shuffle" className={isShuffled ? 'active' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1em" height="1em" fill="currentColor">
                            <path d="M467.8 98.4C479.8 93.4 493.5 96.2 502.7 105.3L566.7 169.3C572.7 175.3 576.1 183.4 576.1 191.9C576.1 200.4 572.7 208.5 566.7 214.5L502.7 278.5C493.5 287.7 479.8 290.4 467.8 285.4C455.8 280.4 448 268.9 448 256L448 224L416 224C405.9 224 396.4 228.7 390.4 236.8L358 280L318 226.7L339.2 198.4C357.3 174.2 385.8 160 416 160L448 160L448 128C448 115.1 455.8 103.4 467.8 98.4zM218 360L258 413.3L236.8 441.6C218.7 465.8 190.2 480 160 480L96 480C78.3 480 64 465.7 64 448C64 430.3 78.3 416 96 416L160 416C170.1 416 179.6 411.3 185.6 403.2L218 360zM502.6 534.6C493.4 543.8 479.7 546.5 467.7 541.5C455.7 536.5 448 524.9 448 512L448 480L416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5z"/>
                        </svg>
                    </button>
                    <button onClick={onPrev} aria-label="Previous Track">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="1em" height="1em" fill="currentColor">
                            <path d="M267.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160L64 241 64 96c0-17.7-14.3-32-32-32S0 78.3 0 96L0 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-145 11.5 9.6 192 160z"/>
                        </svg>
                    </button>
                    <button onClick={onPlayPause} className="play-pause-btn" aria-label="Play/Pause">
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
                                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM224 192l0 128c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0l0 128c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32s32 14.3 32 32z"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
                                <path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/>
                            </svg>
                        )}
                    </button>
                    <button onClick={onNext} aria-label="Next Track">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="1em" height="1em" fill="currentColor">
                            <path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4l192 160L256 241l0-145c0-17.7 14.3-32 32-32s32 14.3 32 32l0 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-145-11.5 9.6-192 160z"/>
                        </svg>
                    </button>
                    <button onClick={onToggleLoop} aria-label="Loop" className={getLoopButtonClass()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1em" height="1em" fill="currentColor">
                            <path d="M534.6 182.6C547.1 170.1 547.1 149.8 534.6 137.3L470.6 73.3C461.4 64.1 447.7 61.4 435.7 66.4C423.7 71.4 416 83.1 416 96L416 128L256 128C150 128 64 214 64 320C64 337.7 78.3 352 96 352C113.7 352 128 337.7 128 320C128 249.3 185.3 192 256 192L416 192L416 224C416 236.9 423.8 248.6 435.8 253.6C447.8 258.6 461.5 255.8 470.7 246.7L534.7 182.7zM105.4 457.4C92.9 469.9 92.9 490.2 105.4 502.7L169.4 566.7C178.6 575.9 192.3 578.6 204.3 573.6C216.3 568.6 224 556.9 224 544L224 512L384 512C490 512 576 426 576 320C576 302.3 561.7 288 544 288C526.3 288 512 302.3 512 320C512 390.7 454.7 448 384 448L224 448L224 416C224 403.1 216.2 391.4 204.2 386.4C192.2 381.4 178.5 384.2 169.3 393.3L105.3 457.3z"/>
                        </svg>
                    </button>
                </div>
                <div className="player-progress-container">
                    <span className="time">{formatTime(currentTime)}</span>
                    
                    <div
                        ref={waveformContainerRef}
                        className="waveform-wrapper"
                        style={{
                            width: '100%',
                            height: '40px',
                            position: 'relative'
                        }}
                    />
                    
                    <span className="time">{formatTime(duration)}</span>
                </div>
            </div>
            <div className="bottom-player-volume">
                 <button className="volume-button" onClick={onToggleMute}>
                    {getVolumeSVG()}
                </button>
                <input
                    type="range"
                    className="player-volume-bar"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={onVolumeChange}
                />
            </div>
        </div>
    );
}