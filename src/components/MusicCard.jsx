import React, { useState, useRef } from 'react';
import InCardPlaylist from './InCardPlaylist';

function MusicCardComponent({ item, playerState, onTrackSelect }) {
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
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(e);
                    }
                }}
            >
                <img src={item.image} className="music-card-img" alt={item.title} loading="lazy" decoding="async" />
                <div className="music-card-body">
                    <h4 className="mb-2">{item.title}</h4>
                    <p className="text-muted">{item.description}</p>
                    <div className={`audio-player-wrapper ${isPlayerVisible ? 'show' : ''}`}>
                       <InCardPlaylist 
                            item={item}
                            playerState={playerState}
                            onTrackSelect={onTrackSelect}
                        />
                    </div>
                </div>
                <div className="card-overlay">
                    <i className="fas fa-chevron-up"></i>
                </div>
            </div>
        </div>
    );
}

const MusicCard = React.memo(MusicCardComponent);
export default MusicCard;

