import React from 'react';
import AnimateOnScroll from './AnimateOnScroll';

export default function AboutSection() {
    return (
        <section id="about" className="section">
            <div className="container">
                <AnimateOnScroll><h2 className="section-title fade-up">About</h2></AnimateOnScroll>
                <div className="row align-items-center">
                    <AnimateOnScroll className="col-md-5 text-center mb-4 mb-md-0 fade-up">
                        <img src="assets/Pro.avif" alt="Composer's Photo" loading="lazy" decoding="async" />
                    </AnimateOnScroll>
                    <AnimateOnScroll className="col-md-7 fade-up" style={{transitionDelay: '200ms'}}>
                        <h3>Panuwat Sarapat "Sax"</h3>
                        <p className="text-muted mb-4">Music Composer and Arranger</p>

                        <p>Driven by a deep passion for storytelling through sound, I have dedicated my career to crafting music that resonates with emotion, atmosphere, and narrative depth. With years of experience in the music and film industry, I have worked on a wide range of projects — from feature films and TV series to commercial campaigns and branded content.</p>

                        <p>My work extends across both the Thai and international music scenes, collaborating with directors, producers, and artists to deliver world-class soundtracks and musical experiences. I specialize in blending diverse genres such as Orchestral, R&B, Gospel, Hybrid Orchestral, Electronic, and K-Ballad string arrangements — creating unique sound identities tailored to each project.</p>

                        <p>I am always open to new collaborations and creative challenges. Let’s bring your vision to life through music that inspires and connects.</p>

                    </AnimateOnScroll>
                </div>
            </div>
        </section>
    );
}

