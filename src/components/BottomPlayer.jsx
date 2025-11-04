import React from 'react';

export default function BottomPlayer({ playerState, onPlayPause, onNext, onPrev, waveformContainerRef, onVolumeChange, onToggleMute, onClosePlayer }) {
    const { isPlaying, currentTrack, currentTime, duration, activePlaylist, volume } = playerState;
    
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

    if (!activePlaylist) return null;

    return (
        <div className={`bottom-player ${activePlaylist ? 'show' : ''}`}>
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
                <img src={activePlaylist.image} alt={currentTrack.title} />
                <div className="details">
                    <span className="title">{currentTrack.title}</span>
                    <span className="artist">{currentTrack.artist}</span>
                </div>
            </div>
            <div className="bottom-player-controls">
                <div className="player-buttons">
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