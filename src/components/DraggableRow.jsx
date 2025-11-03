import React, { useRef, useState, useCallback } from 'react';

function DraggableRowComponent({ children }) {
    const containerRef = useRef(null);
    const innerRef = useRef(null);
    const [position, setPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef(0);
    const startX = useRef(0);
    const lastX = useRef(0);
    const lastTime = useRef(0);
    const velocity = useRef(0);
    const animationFrameId = useRef(null);

    const updatePosition = useCallback((newPos) => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        animationFrameId.current = requestAnimationFrame(() => {
            setPosition(newPos);
        });
    }, []);

    const handleDown = (e) => {
        setIsDragging(true);
        const inner = innerRef.current;
        if(inner) inner.style.transition = 'none';
        
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        const pageX = touch.pageX;
        
        startX.current = pageX;
        lastX.current = pageX;
        lastTime.current = Date.now();
        startPos.current = position;
        velocity.current = 0;
        
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        
        // ถ้าเป็น touchpad gesture (deltaX) ให้ข้าม
        if (e.type === 'wheel') return;
        
        e.preventDefault();
        
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        const pageX = touch.pageX;
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime.current;
        
        if (deltaTime > 0) {
            const deltaX = pageX - lastX.current;
            velocity.current = deltaX / deltaTime;
        }
        
        lastX.current = pageX;
        lastTime.current = currentTime;
        
        const walk = (pageX - startX.current) * (e.type === 'touchmove' ? 1 : 1.2);
        let newPos = startPos.current + walk;
        
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const innerWidth = innerRef.current?.scrollWidth || 0;
        if (innerWidth <= containerWidth) return;
        
        const maxPos = 0;
        const minPos = -(innerWidth - containerWidth);
        
        if (newPos > maxPos) {
            const overscroll = newPos - maxPos;
            newPos = maxPos + (overscroll * 0.35);
        } else if (newPos < minPos) {
            const overscroll = minPos - newPos;
            newPos = minPos - (overscroll * 0.35);
        }
        
        updatePosition(newPos);
    };
    
    const handleUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const inner = innerRef.current;
        if (!inner) return;
        
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const innerWidth = innerRef.current?.scrollWidth || 0;
        const cardWidth = inner.children[0]?.offsetWidth || 0;
        const gap = 8;
        
        if (innerWidth <= containerWidth) {
            updatePosition(0);
            return;
        }
        
        const maxPos = 0;
        const minPos = -(innerWidth - containerWidth);
        const cardUnit = cardWidth + gap;
        const currentPos = Math.abs(position);
        
        const totalCards = inner.children.length;
        const lastCardPos = (totalCards - 1) * cardUnit;
        const visibleWidth = containerWidth - cardWidth;
        
        const distanceFromEnd = lastCardPos - currentPos;
        const isNearEnd = distanceFromEnd <= visibleWidth;
        
        let targetPos;
        inner.style.transition = `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`;
        
        if (position > maxPos) {
            targetPos = maxPos;
        } else if (isNearEnd) {
            targetPos = minPos;
        } else {
            const nearestCard = Math.round(currentPos / cardUnit);
            targetPos = -(nearestCard * cardUnit);
            
            // ถ้าเลื่อนเร็ว ให้ไปอีก card นึง
            const currentVelocity = velocity.current;
            if (Math.abs(currentVelocity) > 0.8) {
                const direction = -Math.sign(currentVelocity);
                const nextCard = nearestCard + direction;
                
                if (nextCard >= 0 && nextCard * cardUnit <= Math.abs(minPos)) {
                    targetPos = -(nextCard * cardUnit);
                }
            }
        }
        
        if (position > maxPos) {
            inner.style.transition = `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`;
            updatePosition(maxPos);
            return;
        } else if (position < minPos) {
            inner.style.transition = `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`;
            updatePosition(minPos);
            return;
        }
        
        // ถ้าเลื่อนเร็ว ให้ไปอีก card นึง
        const currentVelocity = velocity.current;
        if (Math.abs(currentVelocity) > 0.8) {
            const direction = -Math.sign(currentVelocity);
            const nextCard = nearestCard + direction;
            
            if (nextCard >= 0 && nextCard * cardUnit <= Math.abs(minPos)) {
                targetPos = -(nextCard * cardUnit);
            }
        }
        
        const distance = Math.abs(position - targetPos);
        const duration = 0.3; // ใช้เวลาคงที่เพื่อให้รู้สึกเสถียร
        
        inner.style.transition = `transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
        updatePosition(targetPos);
    };

    const containerStyle = {
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        padding: '20px 0',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
        zIndex: 1
    };
    
    const innerStyle = {
        display: 'flex',
        flexWrap: 'nowrap',
        transform: `translateX(${position}px)`,
        alignItems: 'flex-start',
        gap: '8px',
        padding: '0 12px',
        margin: '-20px 0',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
    };

    const handleWheel = (e) => {
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const innerWidth = innerRef.current?.scrollWidth || 0;
        
        if (innerWidth <= containerWidth) return;
        
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            e.stopPropagation();
            
            const newPos = position - e.deltaX;
            const maxPos = 0;
            const minPos = -(innerWidth - containerWidth);
            
            let finalPos = newPos;
            
            if (finalPos > maxPos) {
                finalPos = maxPos;
            } else if (finalPos < minPos) {
                finalPos = minPos;
            }
            
            const inner = innerRef.current;
            if (inner) {
                inner.style.transition = 'transform 0.1s ease-out';
                updatePosition(finalPos);
            }
        }
    };

    const preventScroll = (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
        }
    };

    React.useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', preventScroll, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', preventScroll);
            }
        };
    }, []);

    return (
        <div className="draggable-container">
            <div 
                ref={containerRef}
                style={containerStyle}
                onMouseDown={handleDown}
                onMouseLeave={handleUp}
                onMouseUp={handleUp}
                onMouseMove={handleMove}
                onTouchStart={handleDown}
                onTouchEnd={handleUp}
                onTouchMove={handleMove}
                onWheel={handleWheel}
            >
                <div ref={innerRef} style={innerStyle}>
                    {children}
                </div>
            </div>
        </div>
    );
}

const DraggableRow = React.memo(DraggableRowComponent);
export default DraggableRow;

