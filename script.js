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
            track: null,
            cards: [],
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

        // Initialize with 5-second maximum loading time
        this.loadingTimeout = setTimeout(() => this.forceRemoveLoader(), 5000);
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.initializeTestimonials();
            this.setupEventListeners();
            await this.preloadImages();
            this.handleInitialLoad();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.forceRemoveLoader();
        }
    }

    preloadImages() {
        return new Promise((resolve) => {
            const images = document.images;
            let loaded = 0;
            const total = images.length;

            if (total === 0) {
                resolve();
                return;
            }

            for (let i = 0; i < total; i++) {
                const img = images[i];
                if (img.complete) {
                    loaded++;
                    if (loaded === total) resolve();
                } else {
                    img.onload = img.onerror = () => {
                        loaded++;
                        if (loaded === total) resolve();
                    };
                }
            }
        });
    }

    async initializeComponents() {
        const loader = {
            container: document.querySelector('.loader-container'),
            content: document.querySelector('.content-container'),
            spinner: document.querySelector('.spinner')
        };

        if (loader.container || loader.content) {
            this.loader = loader;
        } else {
            this.createDefaultLoader();
        }

        if (!document.querySelector('.content-container')) {
            const contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';
            Array.from(document.body.children).forEach(child => {
                if (!child.classList.contains('loader-container') &&
                    !child.classList.contains('content-container')) {
                    contentContainer.appendChild(child);
                }
            });
            document.body.appendChild(contentContainer);
            this.loader.content = contentContainer;
        }
    }

    createDefaultLoader() {
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';
        
        const loaderContent = document.createElement('div');
        loaderContent.className = 'loader-content';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.innerHTML = `
            <svg viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20"></circle>
            </svg>
        `;

        loaderContent.appendChild(spinner);
        loaderContainer.appendChild(loaderContent);
        document.body.appendChild(loaderContainer);

        this.loader = {
            container: loaderContainer,
            content: document.querySelector('.content-container'),
            spinner
        };
    }

    handleInitialLoad() {
        clearTimeout(this.loadingTimeout);
        this.loader.container.style.opacity = '0';
        setTimeout(() => {
            this.loader.container.style.display = 'none';
            this.loader.content.style.opacity = '1';
            this.state.isLoading = false;
        }, 500);
    }

    forceRemoveLoader() {
        if (this.state.isLoading) {
            this.loader.container.style.opacity = '0';
            setTimeout(() => {
                this.loader.container.style.display = 'none';
                this.loader.content.style.opacity = '1';
                this.state.isLoading = false;
            }, 500);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Enhanced Testimonials Methods
    initializeTestimonials() {
        this.testimonials.container = document.querySelector('.testimonial-container');
        this.testimonials.track = document.querySelector('.testimonial-track');
        if (!this.testimonials.track) return;

        this.testimonials.cards = Array.from(this.testimonials.track.children);
        
        // Clone first and last slides for infinite scroll
        if (this.testimonials.cards.length > 1) {
            const firstClone = this.testimonials.cards[0].cloneNode(true);
            const lastClone = this.testimonials.cards[this.testimonials.cards.length - 1].cloneNode(true);
            
            firstClone.setAttribute('aria-hidden', 'true');
            lastClone.setAttribute('aria-hidden', 'true');
            
            this.testimonials.track.appendChild(firstClone);
            this.testimonials.track.insertBefore(lastClone, this.testimonials.cards[0]);
            
            this.testimonials.cards = Array.from(this.testimonials.track.querySelectorAll('.testimonial-card'));
        }

        this.testimonials.totalSlides = this.testimonials.cards.length;
        this.updateCardWidth();
        this.createDots();
        this.goToSlide(0, false);
    }

    createDots() {
        const dotsContainer = document.querySelector('.slider-dots');
        if (!dotsContainer) return;

        const actualSlideCount = this.testimonials.cards.length - 2;
        dotsContainer.innerHTML = '';

        for (let i = 0; i < actualSlideCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    updateCardWidth() {
        if (window.innerWidth <= 768) {
            this.testimonials.cardWidth = this.testimonials.container.offsetWidth - 40;
        } else {
            this.testimonials.cardWidth = (this.testimonials.container.offsetWidth - 60) / 3;
        }

        this.testimonials.cards.forEach(card => {
            card.style.minWidth = `${this.testimonials.cardWidth}px`;
            card.style.width = `${this.testimonials.cardWidth}px`;
        });

        this.updateSlidePosition();
    }

    setupEventListeners() {
        // Testimonial Navigation
        const prevBtn = document.querySelector('.slider-btn.prev');
        const nextBtn = document.querySelector('.slider-btn.next');

        if (prevBtn) prevBtn.addEventListener('click', () => this.moveToPrevSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.moveToNextSlide());

        // Touch Events
        if (this.testimonials.track) {
            this.testimonials.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
            this.testimonials.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
            this.testimonials.track.addEventListener('touchend', () => this.touchEnd());
            this.testimonials.track.addEventListener('transitionend', () => this.handleTransitionEnd());
        }

        // Resize Handler
        window.addEventListener('resize', this.debounce(() => {
            this.updateCardWidth();
            this.state.isMobile = window.innerWidth <= 768;
        }, 250));

        // Header Scroll Effect
        const header = document.querySelector('.site-header');
        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    }

    moveToPrevSlide() {
        if (this.testimonials.isAnimating) return;
        this.testimonials.isAnimating = true;
        this.testimonials.currentIndex--;
        this.updateSlidePosition();
    }

    moveToNextSlide() {
        if (this.testimonials.isAnimating) return;
        this.testimonials.isAnimating = true;
        this.testimonials.currentIndex++;
        this.updateSlidePosition();
    }

    goToSlide(index, animate = true) {
        if (this.testimonials.isAnimating) return;
        
        this.testimonials.isAnimating = animate;
        this.testimonials.currentIndex = index;

        const position = -((index + 1) * (this.testimonials.cardWidth + this.testimonials.gap));
        
        this.testimonials.track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        this.testimonials.track.style.transform = `translateX(${position}px)`;
        this.testimonials.currentTranslate = position;
        
        this.updateActiveDot();
        this.updateActiveCard();
    }

    updateSlidePosition() {
        const position = -(this.testimonials.currentIndex + 1) * (this.testimonials.cardWidth + this.testimonials.gap);
        this.testimonials.track.style.transition = 'transform 0.5s ease-in-out';
        this.testimonials.track.style.transform = `translateX(${position}px)`;
        this.testimonials.currentTranslate = position;
        this.updateActiveDot();
        this.updateActiveCard();
    }

    handleTransitionEnd() {
        this.testimonials.isAnimating = false;
        this.testimonials.track.style.transition = 'none';

        if (this.testimonials.currentIndex === -1) {
            this.testimonials.currentIndex = this.testimonials.totalSlides - 3;
            const position = -(this.testimonials.currentIndex + 1) * (this.testimonials.cardWidth + this.testimonials.gap);
            this.testimonials.track.style.transform = `translateX(${position}px)`;
            this.testimonials.currentTranslate = position;
        }

        if (this.testimonials.currentIndex === this.testimonials.totalSlides - 2) {
            this.testimonials.currentIndex = 0;
            const position = -(this.testimonials.currentIndex + 1) * (this.testimonials.cardWidth + this.testimonials.gap);
            this.testimonials.track.style.transform = `translateX(${position}px)`;
            this.testimonials.currentTranslate = position;
        }

        setTimeout(() => {
            this.testimonials.track.style.transition = 'transform 0.5s ease-in-out';
        }, 10);
    }

    updateActiveDot() {
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.testimonials.currentIndex);
        });
    }

    updateActiveCard() {
        this.testimonials.cards.forEach((card, i) => {
            card.classList.toggle('active', i === this.testimonials.currentIndex + 1);
        });
    }

    touchStart(event) {
        this.testimonials.touchStartX = event.touches[0].clientX;
        this.testimonials.initialTranslate = this.testimonials.currentTranslate;
        this.testimonials.track.style.transition = 'none';
    }

    touchMove(event) {
        if (!this.testimonials.touchStartX) return;
        
        this.testimonials.touchCurrentX = event.touches[0].clientX;
        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const newPosition = this.testimonials.initialTranslate + diff;
        
        this.testimonials.track.style.transform = `translateX(${newPosition}px)`;
        event.preventDefault();
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
            // Reset to current position
            this.testimonials.track.style.transition = 'transform 0.5s ease-in-out';
            this.testimonials.track.style.transform = `translateX(${this.testimonials.initialTranslate}px)`;
        }

        this.testimonials.touchStartX = null;
        this.testimonials.touchCurrentX = null;
    }
}

// Initialize site
window.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
});
