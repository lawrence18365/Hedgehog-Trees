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
            await this.preloadImages();
            this.setupEventListeners();
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

        // Clone first and last slides and ensure they have the same classes
        const firstClone = cards[0].cloneNode(true);
        const lastClone = cards[cards.length - 1].cloneNode(true);

        firstClone.classList.add('clone');
        lastClone.classList.add('clone');

        track.appendChild(firstClone);
        track.prepend(lastClone);

        // Update cards array
        this.testimonials.cards = Array.from(track.querySelectorAll('.testimonial-card'));

        // Adjust margins for first and last cards
        this.testimonials.cards.forEach((card, index) => {
            if (index === 0 || index === this.testimonials.cards.length - 1) {
                card.style.marginRight = '0px';
            } else {
                card.style.marginRight = '30px';
            }
        });

        // Calculate the card width based on the actual distance
        const cardStyle = window.getComputedStyle(this.testimonials.cards[1]);
        const cardWidth = this.testimonials.cards[1].getBoundingClientRect().width;
        const marginRight = parseFloat(cardStyle.marginRight) || 0;

        this.testimonials.cardWidth = cardWidth + marginRight;

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

            // Touch and mouse events
            ['touchstart', 'mousedown'].forEach(event => {
                track.addEventListener(event, e => this.handleTouchStart(e));
            });
            ['touchmove', 'mousemove'].forEach(event => {
                track.addEventListener(event, e => this.handleTouchMove(e));
            });
            ['touchend', 'mouseup', 'mouseleave'].forEach(event => {
                track.addEventListener(event, () => this.handleTouchEnd());
            });
        } else {
            console.warn('Testimonial track not found. Event listeners not attached.');
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
        this.testimonials.touchStartX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        this.testimonials.currentTranslate = -this.testimonials.currentIndex * this.testimonials.cardWidth;
        this.testimonials.track.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (this.testimonials.touchStartX === null) return;
        e.preventDefault();

        this.testimonials.touchCurrentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        const translate = this.testimonials.currentTranslate + diff;
        this.testimonials.track.style.transform = `translateX(${translate}px)`;
    }

    handleTouchEnd() {
        if (this.testimonials.touchStartX === null || this.testimonials.touchCurrentX === null) return;

        const diff = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        if (Math.abs(diff) > this.testimonials.cardWidth / 4) {
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
            // Recalculate cardWidth
            const cardStyle = window.getComputedStyle(this.testimonials.cards[1]);
            const cardWidth = this.testimonials.cards[1].getBoundingClientRect().width;
            const marginRight = parseFloat(cardStyle.marginRight) || 0;

            this.testimonials.cardWidth = cardWidth + marginRight;
            this.updateSliderPosition(false);
        }
    }

    createDefaultLoader() {
        // ... existing code ...
    }

    handleInitialLoad() {
        // ... existing code ...
    }

    forceRemoveLoader() {
        // ... existing code ...
    }

    debounce(func, wait) {
        // ... existing code ...
    }
}

// Initialize site
window.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
});
