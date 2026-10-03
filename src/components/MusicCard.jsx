import React, { useState } from 'react';
import InCardPlaylist from './InCardPlaylist';

function MusicCardComponent({ item, playerState, onTrackSelect, showListenGuide = false }) {
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);
    
    const togglePlayerVisibility = () => {
        setIsPlayerVisible(prev => !prev);
    };

    const handleCardClick = (e) => {
        if (e.target.closest('.audio-player-wrapper')) {
            return;
        }
        togglePlayerVisibility();
    };

    return (
        <div className="card-wrapper">
            <div 
                className={`music-card ${isPlayerVisible ? 'player-visible' : ''}`}
                onClick={handleCardClick}
                role="button"
                aria-expanded={isPlayerVisible}
                aria-label={`${item.title}, ${isPlayerVisible ? 'close' : 'open'} track list to listen`}
                data-project-id={item.id}
                data-listenable={item.tracks?.length > 0}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleCardClick(e);
                    }
                }}
            >
                <img src={item.image} className="music-card-img" alt={item.title} loading="lazy" decoding="async" />
                {showListenGuide && !isPlayerVisible && (
                    <div className="listen-guide" aria-hidden="true">
                        <span className="listen-guide-gesture">
                            <span className="listen-guide-ring" />
                            <svg className="listen-guide-hand" viewBox="0 0 48 56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 29V9a4 4 0 0 1 8 0v16l3-2a4 4 0 0 1 6 3l2-1a4 4 0 0 1 6 4v9c0 7-4 12-10 14H22c-4-2-6-5-9-9L5 32a4 4 0 0 1 6-5l7 7" />
                            </svg>
                        </span>
                        <span className="listen-guide-label listen-guide-pointer">Click to listen</span>
                        <span className="listen-guide-label listen-guide-touch">Tap to listen</span>
                    </div>
                )}
                <div className="music-card-body">
                    <h4 className="mb-2">{item.title}</h4>
                    <p className="text-muted">{item.description}</p>
                    <div className={`audio-player-wrapper ${isPlayerVisible ? 'show' : ''}`} inert={!isPlayerVisible}>
                       <InCardPlaylist 
                            item={item}
                            playerState={playerState}
                            onTrackSelect={onTrackSelect}
                        />
                    </div>
                </div>
                <div className="card-overlay">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="chevron-icon"
                        fill="currentColor"
                        width="1.5em"
                        height="1.5em"
                    >
                        <path d="M297.4 169.4C309.9 156.9 330.2 156.9 342.7 169.4L534.7 361.4C547.2 373.9 547.2 394.2 534.7 406.7C522.2 419.2 501.9 419.2 489.4 406.7L320 237.3L150.6 406.6C138.1 419.1 117.8 419.1 105.3 406.6C92.8 394.1 92.8 373.8 105.3 361.3L297.3 169.3z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

const MusicCard = React.memo(MusicCardComponent);
export default MusicCard;

