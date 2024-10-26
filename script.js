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
            currentIndex: 1, // Start from 1 due to cloning for infinite scroll
            isAnimating: false,
            cardWidth: 0,
            totalSlides: 0,
            touchStartX: null,
            touchCurrentX: null,
            currentTranslate: 0
        };

        // Initialize with 5-second maximum loading time
        this.loadingTimeout = setTimeout(() => this.forceRemoveLoader(), 5000);
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.initializeTestimonials(); // Initialize testimonials
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

    createDefaultLoader() {
        // Create loader container
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';

        // Create loader content
        const loaderContent = document.createElement('div');
        loaderContent.className = 'loader-content';

        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.innerHTML = `
            <svg viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20"></circle>
            </svg>
        `;

        // Append elements
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

    // --------------------------
    // Testimonials Methods
    // --------------------------

    initializeTestimonials() {
        // Select testimonial elements
        const testimonialContainer = document.querySelector('.testimonial-container');
        const testimonialTrack = testimonialContainer.querySelector('.testimonial-track');
        const testimonialCards = Array.from(testimonialTrack.children);

        // Clone first and last slides for infinite effect
        const firstClone = testimonialCards[0].cloneNode(true);
        const lastClone = testimonialCards[testimonialCards.length - 1].cloneNode(true);

        testimonialTrack.appendChild(firstClone);
        testimonialTrack.insertBefore(lastClone, testimonialCards[0]);

        // Update testimonial state
        this.testimonials.container = testimonialContainer;
        this.testimonials.track = testimonialTrack;
        this.testimonials.cards = Array.from(testimonialTrack.children);
        this.testimonials.totalSlides = this.testimonials.cards.length;
        this.testimonials.cardWidth = this.testimonials.cards[0].getBoundingClientRect().width;

        // Set initial position
        this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;

        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.updateCardWidth();
        }, 250));
    }

    updateCardWidth() {
        this.testimonials.cardWidth = this.testimonials.cards[0].getBoundingClientRect().width;
        this.testimonials.track.style.transition = 'none';
        this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;
    }

    setupEventListeners() {
        // Existing event listeners...

        // Testimonial Navigation Buttons
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => this.moveToPrevSlide());
            nextBtn.addEventListener('click', () => this.moveToNextSlide());
        }

        // Transition End Event for Infinite Scroll
        if (this.testimonials.track) {
            this.testimonials.track.addEventListener('transitionend', () => this.handleTransitionEnd());
        }

        // Optional: Touch Events for Swipe (Mobile)
        this.testimonials.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
        this.testimonials.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: true });
        this.testimonials.track.addEventListener('touchend', () => this.touchEnd());
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
        this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;
    }

    handleTransitionEnd() {
        this.testimonials.isAnimating = false;
        if (this.testimonials.currentIndex === 0) {
            // Jump to the last real slide
            this.testimonials.track.style.transition = 'none';
            this.testimonials.currentIndex = this.testimonials.totalSlides - 2;
            this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;
        }

        if (this.testimonials.currentIndex === this.testimonials.totalSlides - 1) {
            // Jump to the first real slide
            this.testimonials.track.style.transition = 'none';
            this.testimonials.currentIndex = 1;
            this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;
        }
    }

    // Touch Events for Swipe (Optional)
    touchStart(event) {
        this.testimonials.touchStartX = event.touches[0].clientX;
        this.testimonials.touchCurrentX = this.testimonials.touchStartX;
        this.testimonials.track.style.transition = 'none';
    }

    touchMove(event) {
        if (!this.testimonials.touchStartX) return;
        this.testimonials.touchCurrentX = event.touches[0].clientX;
        const moveX = this.testimonials.touchCurrentX - this.testimonials.touchStartX;
        this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex - moveX}px)`;
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
        this.testimonials.track.style.transform = `translateX(-${this.testimonials.cardWidth * this.testimonials.currentIndex}px)`;
    }
}

// Initialize site
window.addEventListener('DOMContentLoaded', () => {
    window.premiumSite = new PremiumSiteManager();
});
// Add this to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.site-header');
    const scrollThreshold = 50;

    function handleScroll() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
});
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth <= 768) {
        const track = document.querySelector('.testimonial-track');
        const cards = document.querySelectorAll('.testimonial-card');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        let currentIndex = 0;

        function updateSlidePosition() {
            const cardWidth = cards[0].offsetWidth;
            const offset = cardWidth * currentIndex;
            track.style.transform = `translateX(-${offset}px)`;
        }

        function moveToSlide(index) {
            if (index < 0 || index >= cards.length) return;
            currentIndex = index;
            updateSlidePosition();
        }

        prevBtn?.addEventListener('click', () => {
            moveToSlide(currentIndex - 1);
        });

        nextBtn?.addEventListener('click', () => {
            moveToSlide(currentIndex + 1);
        });

        // Ensure proper positioning after resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                updateSlidePosition();
            }
        });

        // Initial position
        updateSlidePosition();
    }
});
