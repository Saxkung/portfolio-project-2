import React from 'react';

export default function Header() {
    
    // ฟังก์ชันสำหรับลิงก์ส่วนต่างๆ (Works, About, Contact)
    const handleNavClick = (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
        }
        // ลบเงื่อนไข else if (targetId === '#') ออกจากฟังก์ชันนี้
    };
    
    // ฟังก์ชันสำหรับโลโก้โดยเฉพาะ (SAX MUSIC)
    const handleLogoClick = (e) => {
        e.preventDefault(); // ป้องกันการเปลี่ยนแปลง URL
        window.scrollTo({ top: 0, behavior: 'smooth' }); // สั่งให้เลื่อนไปบนสุด
    };

    return (
         <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
            <div className="container">
                {/* ใช้ handleLogoClick และ href="#" (ค่ามาตรฐานสำหรับลิงก์ JS) */}
                <a className="navbar-brand" href="#" onClick={handleLogoClick}>SAX MUSIC</a>
                
                {/* ใช้ data-bs- attributes ดั้งเดิมของ Bootstrap
                  (ไม่ต้องใช้ onClick หรือ className แบบไดนามิก)
                */}
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <a className="nav-link" href="#portfolio" onClick={handleNavClick}>Works</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#about" onClick={handleNavClick}>About</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#contact" onClick={handleNavClick}>Contact</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}