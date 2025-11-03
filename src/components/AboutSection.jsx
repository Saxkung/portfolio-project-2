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
                        <p className="text-muted mb-4"> Music Composer and Arranger</p>
                        <p> Driven by a deep passion for music, I have dedicated myself to creating scores that profoundly convey emotion and story. I have extensive experience in composing music for films, and various advertising media.</p>
                        <p> I specialize in composing across a wide range of genres, including Orchestral, Electronic, Ambient, and various blended styles. I am ready to collaborate with you to create exceptional work.</p>
                    </AnimateOnScroll>
                </div>
            </div>
        </section>
    );
}

