class PremiumSiteManager {
    constructor() {
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth <= 768,
            initialized: false
        };

        this.testimonials = {
            container: null,
            viewport: null,
            track: null,
            cards: [],
            currentIndex: 1,
            isAnimating: false,
            cardWidth: 0,
            totalSlides: 0,
            touchStartX: null,
            touchCurrentX: null,
            currentTranslate: 0,
            gap: 30,
            padding: 20
        };

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

    initializeTestimonials() {
        const testimonialContainer = document.querySelector('.testimonial-container');
        const testimonialTrack = testimonialContainer.querySelector('.testimonial-track');
        const testimonialCards = Array.from(testimonialTrack.children);

        const firstClone = testimonialCards[0].cloneNode(true);
        const lastClone = testimonialCards[testimonialCards.length - 1].cloneNode(true);

        testimonialTrack.appendChild(firstClone);
        testimonialTrack.insertBefore(lastClone, testimonialCards[0]);

        this.testimonials.container = testimonialContainer;
        this.testimonials.track = testimonialTrack;
        this.testimonials.cards = Array.from(testimonialTrack.children);
        this.testimonials.totalSlides = this.testimonials.cards.length;

        // Set initial styles
        testimonialContainer.style.boxSizing = 'border-box';
        testimonialContainer.style.overflow = 'hidden';
        testimonialContainer.style.width = '100%';
        testimonialTrack.style.display = 'flex';
        testimonialTrack.style.gap = `${this.testimonials.gap}px`;

        this.testimonials.cards.forEach(card => {
            card.style.flexShrink = '0';
        });
        
        this.updateCardWidth();
        window.addEventListener('resize', this.debounce(() => {
            this.updateCardWidth();
        }, 250));
    }

    updateCardWidth() {
        const containerWidth = this.testimonials.container.offsetWidth - (this.testimonials.padding * 2);
        
        if (window.innerWidth <= 768) {
            this.testimonials.cardWidth = containerWidth;
        } else {
            const totalGaps = 2;
            const availableWidth = containerWidth - (this.testimonials.gap * totalGaps);
            this.testimonials.cardWidth = availableWidth / 3;
        }

        this.testimonials.cards.forEach(card => {
            card.style.width = `${this.testimonials.cardWidth}px`;
            card.style.minWidth = `${this.testimonials.cardWidth}px`;
        });

        const trackWidth = (this.testimonials.cardWidth * this.testimonials.cards.length) + 
                          (this.testimonials.gap * (this.testimonials.cards.length - 1));
        this.testimonials.track.style.width = `${trackWidth}px`;

        const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap));
        this.testimonials.track.style.transition = 'none';
        this.testimonials.track.style.transform = `translateX(${position}px)`;

        // Force reflow
        this.testimonials.track.getBoundingClientRect();

        this.testimonials.container.style.paddingLeft = `${this.testimonials.padding}px`;
        this.testimonials.container.style.paddingRight = `${this.testimonials.padding}px`;
    }

    setupEventListeners() {
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => this.moveToPrevSlide());
            nextBtn.addEventListener('click', () => this.moveToNextSlide());
        }

        if (this.testimonials.track) {
            this.testimonials.track.addEventListener('transitionend', () => this.handleTransitionEnd());
            this.testimonials.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
            this.testimonials.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: true });
            this.testimonials.track.addEventListener('touchend', () => this.touchEnd());
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

    updateSlidePosition() {
        this.testimonials.track.style.transition = 'transform 0.5s ease-in-out';
        const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap));
        this.testimonials.track.style.transform = `translateX(${position}px)`;
    }

    handleTransitionEnd() {
        this.testimonials.isAnimating = false;
        
        if (this.testimonials.currentIndex === 0) {
            this.testimonials.track.style.transition = 'none';
            this.testimonials.currentIndex = this.testimonials.totalSlides - 2;
            const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap));
            this.testimonials.track.style.transform = `translateX(${position}px)`;
        }

        if (this.testimonials.currentIndex === this.testimonials.totalSlides - 1) {
            this.testimonials.track.style.transition = 'none';
            this.testimonials.currentIndex = 1;
            const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap));
            this.testimonials.track.style.transform = `translateX(${position}px)`;
        }
    }

    touchStart(event) {
        this.testimonials.touchStartX = event.touches[0].clientX;
        this.testimonials.touchCurrentX = this.testimonials.touchStartX;
        this.testimonials.track.style.transition = 'none';
    }

    touchMove(event) {
        if (!this.testimonials.touchStartX) return;
        this.testimonials.touchCurrentX = event.touches[0].clientX;
        const moveX = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap)) + moveX;
        this.testimonials.track.style.transform = `translateX(${position}px)`;
    }

    touchEnd() {
        if (!this.testimonials.touchStartX || !this.testimonials.touchCurrentX) {
            this.resetPosition();
            return;
        }

        const moveX = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        if (Math.abs(moveX) > this.testimonials.cardWidth * 0.2) {
            if (moveX < 0) {
                this.moveToNextSlide();
            } else {
                this.moveToPrevSlide();
            }
        } else {
            this.resetPosition();
        }

        this.testimonials.touchStartX = null;
        this.testimonials.touchCurrentX = null;
    }

    resetPosition() {
        this.testimonials.track.style.transition = 'transform 0.5s ease-in-out';
        const position = -(this.testimonials.currentIndex * (this.testimonials.cardWidth + this.testimonials.gap));
        this.testimonials.track.style.transform = `translateX(${position}px)`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
    
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        header?.classList.toggle('scrolled', window.scrollY > 50);
    });
});
