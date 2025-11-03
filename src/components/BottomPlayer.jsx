import React from 'react';

export default function BottomPlayer({ playerState, onPlayPause, onNext, onPrev, waveformContainerRef, onVolumeChange, onToggleMute, onClosePlayer }) {
    const { isPlaying, currentTrack, currentTime, duration, activePlaylist, volume } = playerState;
    
    const formatTime = (time) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const getVolumeIcon = () => {
        if (volume === 0) return 'fa-volume-off';
        if (volume < 0.5) return 'fa-volume-low';
        return 'fa-volume-high';
    };

    if (!activePlaylist) return null;

    return (
        <div className={`bottom-player ${activePlaylist ? 'show' : ''}`}>
            <button
                className="btn-close-player"
                aria-label="Close Player"
                onClick={() => { if (typeof onClosePlayer === 'function') onClosePlayer(); }}
            >
                <i className="fas fa-times"></i>
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
                    <button onClick={onPrev} aria-label="Previous Track"><i className="fas fa-backward-step"></i></button>
                    <button onClick={onPlayPause} className="play-pause-btn" aria-label="Play/Pause">
                        {isPlaying ? <i className="fas fa-circle-pause"></i> : <i className="fas fa-circle-play"></i>}
                    </button>
                    <button onClick={onNext} aria-label="Next Track"><i className="fas fa-forward-step"></i></button>
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
                    <i className={`fas ${getVolumeIcon()}`}></i>
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
