import React from 'react';
import AnimateOnScroll from './AnimateOnScroll';

export default function ContactSection() {
    return (
        <footer id="contact">
            <div className="container">
                <AnimateOnScroll>
                     <div className="fade-up">
                         <h2 className="section-title">Contact</h2>
                         <p className="text-center mb-4">"Interested in working with us? Please contact us via the channels below."</p>
                         <p className="text-center h4" style={{color: 'var(--accent-color)'}}><a href="mailto:music@saxai.site" style={{color: 'inherit', textDecoration: 'none'}}>music@saxai.site</a></p>
                         <div className="social-links mt-4">
                            <a href="https://www.tiktok.com/@skmyti" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
                            <a href="https://line.me/ti/p/DOH88WhzMi" aria-label="Line"><i className="fab fa-line"></i></a>
                            <a href="https://www.facebook.com/PanuwatSax" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                            <a href="https://www.instagram.com/skmyti" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                         </div>
                         <p className="text-muted mt-5 mb-0">Copyright &copy; {new Date().getFullYear()} Sax Music. All Rights Reserved / Legal notices / Data privacy policy</p>
                     </div>
                </AnimateOnScroll>
            </div>
        </footer>
    );
}