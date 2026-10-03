import React from 'react';

export default function InCardPlaylist({ item, playerState, onTrackSelect }) {
    const { isPlaying, currentTrack, activePlaylistId } = playerState;
    const isThisPlaylistActive = activePlaylistId === item.id;

    return (
        <div className="audio-player-container">
            <ul className="playlist">
                {item.tracks.map((track, index) => (
                    <li 
                        key={index} 
                        className={`playlist-item ${isThisPlaylistActive && currentTrack?.src === track.src ? 'active' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play ${track.title}`}
                        onClick={() => onTrackSelect(item, index)}
                        onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                onTrackSelect(item, index);
                            }
                        }}
                    >
                        <span className="track-name">{track.title}</span>
                        {isThisPlaylistActive && currentTrack?.src === track.src && isPlaying && (
                            <div className="playing-icon-container">
                                <span className="playing-bar bar-1"></span>
                                <span className="playing-bar bar-2"></span>
                                <span className="playing-bar bar-3"></span>
                            </div>
                        )}
                        {isThisPlaylistActive && currentTrack?.src === track.src && !isPlaying && (
                            <div className="paused-icon-container">
                                <span className="paused-bar bar-1"></span>
                                <span className="paused-bar bar-2"></span>
                                <span className="paused-bar bar-3"></span>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

