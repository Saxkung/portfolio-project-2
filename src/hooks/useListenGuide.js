import { useEffect, useRef, useState } from 'react';

// One introduction per page visit, shared by every category and card.
export default function useListenGuide(sectionRef, portfolioData) {
    const [guideId, setGuideId] = useState(null);
    const seen = useRef(false);
    const timers = useRef([]);
    const observer = useRef(null);

    const dismiss = () => {
        seen.current = true;
        observer.current?.disconnect();
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setGuideId(null);
    };

    useEffect(() => {
        if (seen.current || !sectionRef.current || !('IntersectionObserver' in window)) return;
        let pending = false;
        const visibility = new IntersectionObserver((entries) => {
            const card = entries.find(entry => entry.isIntersecting && entry.intersectionRatio >= 0.55);
            if (!card || pending || seen.current || document.visibilityState !== 'visible') return;
            pending = true;
            visibility.disconnect();
            // Wait for the visible entrance, including smooth anchor navigation.
            const introduce = () => {
                const rect = card.target.getBoundingClientRect();
                if (seen.current) return;
                if (rect.bottom < 100 || rect.top > window.innerHeight - 100 || document.hidden) {
                    pending = false;
                    sectionRef.current?.querySelectorAll('[data-listenable="true"]').forEach(element => visibility.observe(element));
                    return;
                }
                let opacity = 1;
                for (let element = card.target; element; element = element.parentElement) {
                    opacity *= Number(getComputedStyle(element).opacity);
                }
                if (opacity < 0.98) {
                    timers.current.push(setTimeout(introduce, 120));
                    return;
                }
                seen.current = true;
                setGuideId(card.target.dataset.projectId);
                timers.current.push(setTimeout(() => setGuideId(null), 4600));
            };
            timers.current.push(setTimeout(introduce, 650));
        }, { threshold: 0.55, rootMargin: '-80px 0px -30px 0px' });
        observer.current = visibility;
        const observeCards = () => sectionRef.current?.querySelectorAll('[data-listenable="true"]').forEach(card => visibility.observe(card));
        const resume = () => {
            if (!seen.current && !pending && !document.hidden) {
                visibility.disconnect();
                observeCards();
            }
        };
        observeCards();
        document.addEventListener('visibilitychange', resume);
        return () => {
            visibility.disconnect();
            document.removeEventListener('visibilitychange', resume);
            timers.current.forEach(clearTimeout);
            timers.current = [];
        };
    }, [portfolioData, sectionRef]);

    return { guideId, dismiss };
}
