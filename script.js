class PremiumTestimonials {
    constructor() {
        this.state = {
            currentIndex: 0,
            isAnimating: false,
            cardWidth: 0,
            gap: 20, // Gap between cards
            touchStartX: null,
            touchEndX: null,
            initialTranslate: 0,
            currentTranslate: 0
        };

        this.elements = {
            container: document.querySelector('.testimonial-container'),
            viewport: document.querySelector('.testimonial-viewport'),
            track: document.querySelector('.testimonial-track'),
            cards: Array.from(document.querySelectorAll('.testimonial-card')),
            prevBtn: document.querySelector('.slider-btn.prev'),
            nextBtn: document.querySelector('.slider-btn.next'),
            dots: document.querySelector('.slider-dots')
        };

        if (!this.elements.track) return;
        
        this.init();
    }

    init() {
        this.setupCards();
        this.createDots();
        this.setupEventListeners();
        this.updateCardWidth();
        this.goToSlide(0, false);

        // Re-initialize on resize
        window.addEventListener('resize', () => {
            this.updateCardWidth();
            this.goToSlide(this.state.currentIndex, false);
        });
    }

    setupCards() {
        // Clone first and last cards for infinite effect
        if (this.elements.cards.length > 1) {
            const firstClone = this.elements.cards[0].cloneNode(true);
            const lastClone = this.elements.cards[this.elements.cards.length - 1].cloneNode(true);
            
            firstClone.setAttribute('aria-hidden', 'true');
            lastClone.setAttribute('aria-hidden', 'true');
            
            this.elements.track.appendChild(firstClone);
            this.elements.track.insertBefore(lastClone, this.elements.cards[0]);
            
            this.elements.cards = Array.from(this.elements.track.querySelectorAll('.testimonial-card'));
        }
    }

    createDots() {
        if (!this.elements.dots) return;
        
        const actualSlideCount = this.elements.cards.length - 2; // Subtract clones
        this.elements.dots.innerHTML = '';
        
        for (let i = 0; i < actualSlideCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.elements.dots.appendChild(dot);
        }
    }

    updateCardWidth() {
        if (window.innerWidth <= 768) {
            this.state.cardWidth = this.elements.viewport.offsetWidth - 40; // Account for padding
        } else {
            this.state.cardWidth = (this.elements.viewport.offsetWidth - 60) / 3; // 3 cards visible
        }
        
        this.elements.cards.forEach(card => {
            card.style.minWidth = `${this.state.cardWidth}px`;
            card.style.width = `${this.state.cardWidth}px`;
        });
    }

    setupEventListeners() {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Touch events
        this.elements.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.elements.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.elements.track.addEventListener('touchend', () => this.handleTouchEnd());

        // Transition end
        this.elements.track.addEventListener('transitionend', () => {
            this.state.isAnimating = false;
            this.handleInfiniteScroll();
        });
    }

    handleTouchStart(e) {
        if (this.state.isAnimating) return;
        
        this.state.touchStartX = e.touches[0].clientX;
        this.state.initialTranslate = this.state.currentTranslate;
        this.elements.track.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.state.touchStartX) return;
        
        const currentTouch = e.touches[0].clientX;
        const diff = currentTouch - this.state.touchStartX;
        this.state.currentTranslate = this.state.initialTranslate + diff;
        
        this.setTrackPosition(this.state.currentTranslate);
        e.preventDefault();
    }

    handleTouchEnd() {
        if (!this.state.touchStartX) return;

        const diff = this.state.currentTranslate - this.state.initialTranslate;
        const threshold = this.state.cardWidth * 0.2;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.prevSlide();
            } else {
                this.nextSlide();
            }
        } else {
            this.goToSlide(this.state.currentIndex);
        }

        this.state.touchStartX = null;
    }

    setTrackPosition(position) {
        this.state.currentTranslate = position;
        this.elements.track.style.transform = `translateX(${position}px)`;
    }

    goToSlide(index, animate = true) {
        if (this.state.isAnimating) return;
        
        this.state.isAnimating = animate;
        this.state.currentIndex = index;

        // Calculate the position including the first clone offset
        const position = -((index + 1) * (this.state.cardWidth + this.state.gap));
        
        this.elements.track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        this.setTrackPosition(position);
        
        this.updateActiveDot();
        this.updateActiveCard();
    }

    handleInfiniteScroll() {
        const totalSlides = this.elements.cards.length - 2;
        
        if (this.state.currentIndex === -1) {
            this.goToSlide(totalSlides - 1, false);
        } else if (this.state.currentIndex === totalSlides) {
            this.goToSlide(0, false);
        }
    }

    prevSlide() {
        this.goToSlide(this.state.currentIndex - 1);
    }

    nextSlide() {
        this.goToSlide(this.state.currentIndex + 1);
    }

    updateActiveDot() {
        const dots = this.elements.dots?.children;
        if (!dots) return;

        Array.from(dots).forEach((dot, i) => {
            dot.classList.toggle('active', i === this.state.currentIndex);
        });
    }

    updateActiveCard() {
        this.elements.cards.forEach((card, i) => {
            const isActive = i === this.state.currentIndex + 1; // +1 for clone offset
            card.classList.toggle('active', isActive);
        });
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const testimonials = new PremiumTestimonials();
    
    // Handle header scroll effect
    const header = document.querySelector('.site-header');
    if (header) {
        const handleScroll = () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }
});
