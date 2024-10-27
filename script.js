class PremiumSiteManager {
    constructor() {
        // Core State
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth <= 768,
            initialized: false
        };

        // Testimonial State
        this.testimonials = {
            container: null,
            viewport: null,
            track: null,
            cards: [],
            dots: [],
            prevButton: null,
            nextButton: null,
            currentIndex: 0,
            isAnimating: false,
            cardWidth: 0,
            totalSlides: 0,
            touchStartX: null,
            touchCurrentX: null,
            currentTranslate: 0,
            gap: 20,
            initialTranslate: 0
        };

        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.initializeComponents();
            
            // Initialize testimonials after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeTestimonials());
            } else {
                this.initializeTestimonials();
            }

            // Setup events
            this.setupEventListeners();
            await this.preloadImages();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    initializeComponents() {
        // Select all required testimonial elements
        this.testimonials.container = document.querySelector('.testimonial-container');
        this.testimonials.viewport = document.querySelector('.testimonial-viewport');
        this.testimonials.track = document.querySelector('.testimonial-track');
        this.testimonials.prevButton = document.querySelector('.slider-btn.prev, .prev-btn');
        this.testimonials.nextButton = document.querySelector('.slider-btn.next, .next-btn');
        this.testimonials.dotsContainer = document.querySelector('.slider-dots');

        if (!this.testimonials.track) return;

        // Get initial cards
        this.testimonials.cards = Array.from(this.testimonials.track.children);
        
        // Only proceed if we have cards
        if (this.testimonials.cards.length === 0) return;

        // Clone first and last cards for infinite effect
        const firstClone = this.testimonials.cards[0].cloneNode(true);
        const lastClone = this.testimonials.cards[this.testimonials.cards.length - 1].cloneNode(true);

        firstClone.setAttribute('aria-hidden', 'true');
        lastClone.setAttribute('aria-hidden', 'true');

        // Add clones to track
        this.testimonials.track.appendChild(firstClone);
        this.testimonials.track.insertBefore(lastClone, this.testimonials.cards[0]);

        // Update cards array with clones
        this.testimonials.cards = Array.from(this.testimonials.track.children);
        this.testimonials.totalSlides = this.testimonials.cards.length;

        // Initialize sizes and position
        this.updateCardWidth();
        this.createDots();
        
        // Set initial position after a brief delay to ensure proper rendering
        setTimeout(() => {
            this.goToSlide(0, false);
        }, 100);
    }

    createDots() {
        if (!this.testimonials.dotsContainer) return;

        const actualSlideCount = this.testimonials.cards.length - 2; // Subtract clones
        this.testimonials.dotsContainer.innerHTML = '';

        for (let i = 0; i < actualSlideCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.testimonials.dotsContainer.appendChild(dot);
        }

        this.testimonials.dots = Array.from(this.testimonials.dotsContainer.children);
    }

    setupEventListeners() {
        // Button click handlers
        if (this.testimonials.prevButton) {
            this.testimonials.prevButton.addEventListener('click', () => this.moveToPrevSlide());
        }
        if (this.testimonials.nextButton) {
            this.testimonials.nextButton.addEventListener('click', () => this.moveToNextSlide());
        }

        // Touch events
        if (this.testimonials.track) {
            this.testimonials.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
            this.testimonials.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
            this.testimonials.track.addEventListener('touchend', () => this.touchEnd());
            this.testimonials.track.addEventListener('transitionend', () => this.handleTransitionEnd());
        }

        // Resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.updateCardWidth();
            this.state.isMobile = window.innerWidth <= 768;
            this.goToSlide(this.testimonials.currentIndex, false);
        }, 250));

        // Header scroll effect
        const header = document.querySelector('.site-header');
        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    }

    updateCardWidth() {
        const viewportWidth = this.testimonials.viewport.offsetWidth;
        
        if (window.innerWidth <= 768) {
            this.testimonials.cardWidth = viewportWidth - 40; // Account for padding
        } else {
            this.testimonials.cardWidth = (viewportWidth - (this.testimonials.gap * 2)) / 3;
        }

        // Update each card's width
        this.testimonials.cards.forEach(card => {
            card.style.width = `${this.testimonials.cardWidth}px`;
            card.style.minWidth = `${this.testimonials.cardWidth}px`;
        });

        // Update track width to accommodate all cards
        const totalWidth = (this.testimonials.cardWidth + this.testimonials.gap) * this.testimonials.cards.length;
        this.testimonials.track.style.width = `${totalWidth}px`;
    }

    goToSlide(index, animate = true) {
        if (this.testimonials.isAnimating) return;

        this.testimonials.isAnimating = animate;
        this.testimonials.currentIndex = index;

        // Calculate new position including gap
        const position = -((index + 1) * (this.testimonials.cardWidth + this.testimonials.gap));
        
        // Apply transform with or without animation
        this.testimonials.track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        this.testimonials.track.style.transform = `translateX(${position}px)`;
        this.testimonials.currentTranslate = position;

        // Update UI
        this.updateActiveDot();
        this.updateActiveCard();

        // Reset animation flag if no animation
        if (!animate) {
            this.testimonials.isAnimating = false;
        }
    }

    moveToPrevSlide() {
        if (this.testimonials.isAnimating) return;
        this.testimonials.currentIndex--;
        this.goToSlide(this.testimonials.currentIndex);
    }

    moveToNextSlide() {
        if (this.testimonials.isAnimating) return;
        this.testimonials.currentIndex++;
        this.goToSlide(this.testimonials.currentIndex);
    }

    handleTransitionEnd() {
        this.testimonials.isAnimating = false;

        // Handle infinite scroll wraparound
        const lastIndex = this.testimonials.cards.length - 3;
        
        if (this.testimonials.currentIndex < 0) {
            this.goToSlide(lastIndex, false);
        } else if (this.testimonials.currentIndex > lastIndex) {
            this.goToSlide(0, false);
        }
    }

    updateActiveDot() {
        if (!this.testimonials.dots.length) return;

        this.testimonials.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.testimonials.currentIndex);
        });
    }

    updateActiveCard() {
        this.testimonials.cards.forEach((card, i) => {
            const isActive = i === this.testimonials.currentIndex + 1;
            card.classList.toggle('active', isActive);
            if (isActive) {
                card.setAttribute('aria-hidden', 'false');
            } else {
                card.setAttribute('aria-hidden', 'true');
            }
        });
    }

    touchStart(e) {
        this.testimonials.touchStartX = e.touches[0].clientX;
        this.testimonials.touchCurrentX = this.testimonials.touchStartX;
        this.testimonials.initialTranslate = this.testimonials.currentTranslate;
        this.testimonials.track.style.transition = 'none';
    }

    touchMove(e) {
        if (!this.testimonials.touchStartX) return;

        this.testimonials.touchCurrentX = e.touches[0].clientX;
        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const newPosition = this.testimonials.initialTranslate + diff;
        
        this.testimonials.track.style.transform = `translateX(${newPosition}px)`;
        e.preventDefault();
    }

    touchEnd() {
        if (!this.testimonials.touchStartX || !this.testimonials.touchCurrentX) return;

        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const threshold = this.testimonials.cardWidth * 0.2;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.moveToPrevSlide();
            } else {
                this.moveToNextSlide();
            }
        } else {
            this.goToSlide(this.testimonials.currentIndex);
        }

        this.testimonials.touchStartX = null;
        this.testimonials.touchCurrentX = null;
    }

    // Utility methods
    preloadImages() {
        return new Promise((resolve) => {
            const images = document.images;
            const total = images.length;
            if (total === 0) resolve();

            let loaded = 0;
            Array.from(images).forEach(img => {
                if (img.complete) {
                    loaded++;
                    if (loaded === total) resolve();
                } else {
                    img.addEventListener('load', () => {
                        loaded++;
                        if (loaded === total) resolve();
                    });
                    img.addEventListener('error', () => {
                        loaded++;
                        if (loaded === total) resolve();
                    });
                }
            });
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
});
