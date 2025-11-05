import React from 'react';
import MusicCard from './MusicCard';
import AnimateOnScroll from './AnimateOnScroll';

import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';  // ถ้าต้องการ free mode (เลื่อนอิสระ) และ mousewheel

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/mousewheel';

export default function PortfolioSection({ playerState, onTrackSelect, portfolioData }) {
    return (
        <section id="portfolio" className="section">
            <div className="container">
                <AnimateOnScroll><h2 className="section-title fade-up">Works</h2></AnimateOnScroll>
                {portfolioData.map((categoryData, index) => (
                    <div key={index} className="mb-5">
                        <AnimateOnScroll>
                            <h3 className="category-title fade-up" style={{transitionDelay: `${index * 100}ms`}}>{categoryData.category}</h3>
                        </AnimateOnScroll>
                        <AnimateOnScroll className="stagger-in">
                            <Swiper
                                modules={[FreeMode, Mousewheel]}
                                spaceBetween={0.2}  // ช่องว่างระหว่างการ์ด
                                
                                freeMode={{
                                    enabled: true,
                                    momentum: true,
                                    momentumRatio: 0.9,
                                    momentumBounce: true,
                                    momentumBounceRatio: 0.20,
                                    momentumVelocityRatio: 0.8,
                                    sticky: true,
                                }}
                                    mousewheel={{
                                    enabled: true,
                                    forceToAxis: true, 
                                }}
                                grabCursor={true}
                                touchRatio={1.2}
                                breakpoints={{
                                    0: { slidesPerView: 1.3 },  // มือถือ: แสดง 1.3 การ์ด
                                    768: { slidesPerView: 3.3 },   // Tablet: 3.3 การ์ด
                                    1200: { slidesPerView: 4.3 },  // Desktop: 4.3 การ์ด
                                }}
                                onSlideChange={() => {}}
                            >
                                {categoryData.items.map(item => (
                                    <SwiperSlide key={item.id}>
                                        <MusicCard 
                                            item={item} 
                                            playerState={playerState}
                                            onTrackSelect={onTrackSelect}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </AnimateOnScroll>
                    </div>
                ))}
            </div>
        </section>
    );
}

