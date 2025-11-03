import React, { useState, useRef, useEffect } from 'react';

const AnimateOnScroll = ({ children, className, style }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: "-50px" }
        );

        const currentRef = ref.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const combinedClassName = `animate-on-scroll ${isVisible ? 'is-visible' : ''} ${className || ''}`;

    return (
        <div ref={ref} className={combinedClassName.trim()} style={style}>
            {children}
        </div>
    );
};

export default AnimateOnScroll;

