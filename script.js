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
            currentIndex: 1,
            isAnimating: false,
            cardWidth: 0,
            totalSlides: 0,
            touchStartX: null,
            touchCurrentX: null,
            currentTranslate: 0
        };

        // Initialize with 5 second maximum loading time
        this.loadingTimeout = setTimeout(() => this.forceRemoveLoader(), 5000);
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.initializeTestimonials();
            this.setupEventListeners();
            this.handleInitialLoad();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.forceRemoveLoader();
        }
    }

    async initializeComponents() {
        // Initialize loader
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

        // Ensure content container exists
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

    initializeTestimonials() {
        // Get testimonial elements
        const container = document.querySelector('.testimonial-container');
        if (!container) return;

        this.testimonials = {
            ...this.testimonials,
            container,
            track: container.querySelector('.testimonial-track'),
            cards: Array.from(container.querySelectorAll('.testimonial-card')),
            prevBtn: container.querySelector('.prev-btn'),
            nextBtn: container.querySelector('.next-btn'),
            dotsContainer: container.querySelector('.slider-dots')
        };

        const { track, cards } = this.testimonials;
        if (!track || !cards.length) return;

        // Clone first and last slides
        const firstClone = cards[0].cloneNode(true);
        const lastClone = cards[cards.length - 1].cloneNode(true);

        track.appendChild(firstClone);
        track.prepend(lastClone);

        // Update cards array and set initial state
        this.testimonials.cards = Array.from(track.querySelectorAll('.testimonial-card'));

        // Get the gap between cards from CSS
        const trackStyle = window.getComputedStyle(track);
        const gap = parseFloat(trackStyle.gap) || 0;

        // Calculate the card width including the gap
        this.testimonials.cardWidth = this.testimonials.cards[0].offsetWidth + gap;

        // Set totalSlides to the original number of slides
        this.testimonials.totalSlides = cards.length;

        // Set initial position
        this.updateSliderPosition(false);
        this.createDots();
    }

    createDots() {
        const { dotsContainer, totalSlides } = this.testimonials;
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i + 1));
            dotsContainer.appendChild(dot);
        }
        this.updateDots();
    }

    updateSliderPosition(withTransition = true) {
        const { track, currentIndex, cardWidth } = this.testimonials;
        if (!track) return;

        track.style.transition = withTransition ? 'transform 0.5s ease-in-out' : 'none';
        track.style.transform = `translateX(${-currentIndex * cardWidth}px)`;

        if (withTransition) {
            this.updateDots();
        }
    }

    updateDots() {
        const { dotsContainer, currentIndex, totalSlides } = this.testimonials;
        if (!dotsContainer) return;

        const actualIndex = currentIndex === 0 
            ? totalSlides - 1 
            : currentIndex === totalSlides + 1 
                ? 0 
                : currentIndex - 1;

        Array.from(dotsContainer.children).forEach((dot, index) => {
            dot.classList.toggle('active', index === actualIndex);
        });
    }

    goToSlide(index) {
        if (this.testimonials.isAnimating) return;
        this.testimonials.isAnimating = true;
        this.testimonials.currentIndex = index;
        this.updateSliderPosition();
    }

    setupEventListeners() {
        // Core event listeners
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        // Testimonial event listeners
        const { prevBtn, nextBtn, track } = this.testimonials;
        if (prevBtn) prevBtn.addEventListener('click', () => this.slide('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.slide('next'));
        if (track) {
            track.addEventListener('transitionend', () => this.handleTransitionEnd());

            // Touch events
            track.addEventListener('touchstart', e => this.handleTouchStart(e));
            track.addEventListener('touchmove', e => this.handleTouchMove(e));
            track.addEventListener('touchend', () => this.handleTouchEnd());

            // Mouse events
            track.addEventListener('mousedown', e => this.handleTouchStart(e));
            track.addEventListener('mousemove', e => this.handleTouchMove(e));
            track.addEventListener('mouseup', () => this.handleTouchEnd());
            track.addEventListener('mouseleave', () => this.handleTouchEnd());
        }
    }

    slide(direction) {
        if (this.testimonials.isAnimating) return;
        this.testimonials.isAnimating = true;

        this.testimonials.currentIndex += direction === 'next' ? 1 : -1;
        this.updateSliderPosition();
    }

    handleTransitionEnd() {
        const { currentIndex, totalSlides } = this.testimonials;
        this.testimonials.isAnimating = false;

        if (currentIndex === 0) {
            this.testimonials.currentIndex = totalSlides;
            this.updateSliderPosition(false);
        } else if (currentIndex === totalSlides + 1) {
            this.testimonials.currentIndex = 1;
            this.updateSliderPosition(false);
        }
    }

    handleTouchStart(e) {
        this.testimonials.touchStartX = e.type === 'mousedown' ? e.pageX : e.touches[0].clientX;
        this.testimonials.currentTranslate = -this.testimonials.currentIndex * this.testimonials.cardWidth;
        this.testimonials.track.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.testimonials.touchStartX) return;
        e.preventDefault();

        this.testimonials.touchCurrentX = e.type === 'mousemove' ? e.pageX : e.touches[0].clientX;
        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const translate = this.testimonials.currentTranslate + diff;
        this.testimonials.track.style.transform = `translateX(${translate}px)`;
    }

    handleTouchEnd() {
        if (this.testimonials.touchStartX === null || this.testimonials.touchCurrentX === null) return;

        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        if (Math.abs(diff) > this.testimonials.cardWidth / 3) {
            this.slide(diff > 0 ? 'prev' : 'next');
        } else {
            this.updateSliderPosition();
        }

        this.testimonials.touchStartX = null;
        this.testimonials.touchCurrentX = null;
    }

    handleResize() {
        this.state.isMobile = window.innerWidth <= 768;
        if (this.testimonials.cards.length) {
            const trackStyle = window.getComputedStyle(this.testimonials.track);
            const gap = parseFloat(trackStyle.gap) || 0;
            this.testimonials.cardWidth = this.testimonials.cards[0].offsetWidth + gap;
            this.updateSliderPosition(false);
        }
    }

    createDefaultLoader() {
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';
        loaderContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s ease;
        `;

        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        loaderContainer.appendChild(spinner);
        document.body.insertBefore(loaderContainer, document.body.firstChild);

        this.loader = {
            container: loaderContainer,
            spinner,
            content: document.querySelector('.content-container')
        };
    }

    handleInitialLoad() {
        clearTimeout(this.loadingTimeout);

        if (!this.loader?.container) {
            this.forceRemoveLoader();
            return;
        }

        if (this.loader.content) {
            this.loader.content.style.transition = 'opacity 0.5s ease';
        }

        setTimeout(() => {
            if (this.loader.container) {
                this.loader.container.style.opacity = '0';

                setTimeout(() => {
                    if (this.loader.container) {
                        this.loader.container.style.display = 'none';
                    }
                    if (this.loader.content) {
                        this.loader.content.style.opacity = '1';
                        this.loader.content.style.display = 'block';
                    }
                    document.body.style.overflow = '';
                    this.state.isLoading = false;
                }, 500);
            }
        }, 500);
    }

    forceRemoveLoader() {
        const loader = document.querySelector('.loader-container');
        if (loader) loader.style.display = 'none';

        const content = document.querySelector('.content-container');
        if (content) {
            content.style.display = 'block';
            content.style.opacity = '1';
        }

        document.body.style.overflow = '';
        this.state.isLoading = false;
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Initialize site
window.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
});
