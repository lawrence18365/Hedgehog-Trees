// Premium Site Core Functionality
class PremiumSiteManager {
    constructor() {
        // Core State
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth <= 768,
            hasScrolled: false,
            initialized: false
        };

        // Performance Optimization
        this.frameRequest = null;
        this.lastScrollPosition = 0;
        this.scrollThreshold = 50;
        this.scrollTimeout = null;

        // Initialize Site
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.setupEventListeners();
            this.handleInitialLoad();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error, 'Initialization');
        }
    }

    async initializeComponents() {
        // Core Components
        this.loader = {
            container: document.querySelector('.loader-container'),
            content: document.querySelector('.content-container'),
            logo: document.querySelector('.logo-loader'),
            spinner: document.querySelector('.spinner')
        };

        // Enhanced Testimonial Components
        this.testimonials = {
            container: document.querySelector('.testimonial-container'),
            track: document.querySelector('.testimonial-track'),
            cards: Array.from(document.querySelectorAll('.testimonial-card')),
            controls: {
                prev: document.querySelector('.prev-btn'),
                next: document.querySelector('.next-btn'),
                dots: document.querySelector('.slider-dots')
            },
            state: {
                currentIndex: 0,
                isAnimating: false,
                isDragging: false,
                startX: 0,
                currentTranslate: 0,
                previousTranslate: 0,
                autoPlayInterval: null,
                slideWidth: 0,
                totalSlides: 0,
                autoPlayDelay: 5000,
                transitionDuration: 500
            }
        };

        // Initialize Premium Features
        await this.initializePremiumFeatures();

        // Initialize Enhanced Testimonials
        if (this.testimonials.container) {
            this.initializeTestimonials();
        }
    }

    initializeTestimonials() {
        const { track, cards } = this.testimonials;
        if (!track || !cards.length) return;

        // Clone first and last slides for infinite effect
        const firstClone = cards[0].cloneNode(true);
        const lastClone = cards[cards.length - 1].cloneNode(true);
        
        // Add clones to track
        track.appendChild(firstClone);
        track.prepend(lastClone);

        // Update cards array with clones
        this.testimonials.cards = Array.from(track.querySelectorAll('.testimonial-card'));
        
        // Set initial state
        this.testimonials.state.slideWidth = cards[0].offsetWidth + 30; // Including gap
        this.testimonials.state.totalSlides = cards.length;

        // Set initial position
        track.style.transform = `translateX(-${this.testimonials.state.slideWidth}px)`;
    }

    setupTestimonialControls() {
        const { controls, container } = this.testimonials;

        if (controls.prev) controls.prev.addEventListener('click', () => this.previousSlide());
        if (controls.next) controls.next.addEventListener('click', () => this.nextSlide());

        // Enhanced hover behavior
        container.addEventListener('mouseenter', () => {
            this.pauseAutoPlay();
            controls.prev.classList.add('visible');
            controls.next.classList.add('visible');
        });

        container.addEventListener('mouseleave', () => {
            this.resumeAutoPlay();
            controls.prev.classList.remove('visible');
            controls.next.classList.remove('visible');
        });

        this.createEnhancedDots();
        this.startAutoPlay();
    }

    nextSlide() {
        const { state, track } = this.testimonials;
        if (state.isAnimating) return;

        state.isAnimating = true;
        state.currentIndex++;

        this.updateSliderPosition();

        // Handle infinite scroll
        if (state.currentIndex === state.totalSlides + 1) {
            setTimeout(() => {
                track.style.transition = 'none';
                state.currentIndex = 1;
                track.style.transform = `translateX(-${state.currentIndex * state.slideWidth}px)`;
                state.isAnimating = false;
            }, state.transitionDuration);
        } else {
            setTimeout(() => {
                state.isAnimating = false;
            }, state.transitionDuration);
        }
    }

    previousSlide() {
        const { state, track } = this.testimonials;
        if (state.isAnimating) return;

        state.isAnimating = true;
        state.currentIndex--;

        this.updateSliderPosition();

        // Handle infinite scroll
        if (state.currentIndex === 0) {
            setTimeout(() => {
                track.style.transition = 'none';
                state.currentIndex = state.totalSlides;
                track.style.transform = `translateX(-${state.currentIndex * state.slideWidth}px)`;
                state.isAnimating = false;
            }, state.transitionDuration);
        } else {
            setTimeout(() => {
                state.isAnimating = false;
            }, state.transitionDuration);
        }
    }

    updateSliderPosition() {
        const { state, track } = this.testimonials;
        track.style.transition = `transform ${state.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        track.style.transform = `translateX(-${state.currentIndex * state.slideWidth}px)`;
        this.updateDots();
    }

    createEnhancedDots() {
        const { controls, state } = this.testimonials;
        if (!controls.dots) return;

        controls.dots.innerHTML = '';
        this.dots = [];

        // Create dots only for original slides (not clones)
        for (let i = 0; i < state.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => {
                this.goToSlide(i + 1); // Add 1 to account for first clone
            });
            controls.dots.appendChild(dot);
            this.dots.push(dot);
        }

        this.updateDots();
    }

    updateDots() {
        if (!this.dots) return;

        const { state } = this.testimonials;
        const actualIndex = state.currentIndex === 0 
            ? this.dots.length - 1 
            : state.currentIndex === this.dots.length + 1 
                ? 0 
                : state.currentIndex - 1;

        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === actualIndex);
        });
    }

    goToSlide(index) {
        const { state } = this.testimonials;
        if (state.isAnimating) return;

        state.isAnimating = true;
        state.currentIndex = index;
        this.updateSliderPosition();

        setTimeout(() => {
            state.isAnimating = false;
        }, state.transitionDuration);
    }

    startAutoPlay() {
        const { state } = this.testimonials;
        this.pauseAutoPlay(); // Clear any existing interval
        state.autoPlayInterval = setInterval(() => this.nextSlide(), state.autoPlayDelay);
    }

    pauseAutoPlay() {
        const { state } = this.testimonials;
        if (state.autoPlayInterval) {
            clearInterval(state.autoPlayInterval);
            state.autoPlayInterval = null;
        }
    }

    resumeAutoPlay() {
        this.startAutoPlay();
    }

    handleTouchStart(e) {
        const { state, track } = this.testimonials;
        state.isDragging = true;
        state.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        state.previousTranslate = -state.currentIndex * state.slideWidth;
        track.style.transition = 'none';
        this.pauseAutoPlay();
    }

    handleTouchMove(e) {
        const { state, track } = this.testimonials;
        if (!state.isDragging) return;
        e.preventDefault();

        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentPosition - state.startX;
        state.currentTranslate = state.previousTranslate + diff;
        track.style.transform = `translateX(${state.currentTranslate}px)`;
    }

    handleTouchEnd() {
        const { state, track } = this.testimonials;
        if (!state.isDragging) return;

        state.isDragging = false;
        const movedBy = state.currentTranslate - state.previousTranslate;
        
        if (Math.abs(movedBy) > state.slideWidth / 3) {
            if (movedBy < 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        } else {
            // Return to original position
            track.style.transition = `transform ${state.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            track.style.transform = `translateX(${state.previousTranslate}px)`;
        }

        this.resumeAutoPlay();
    }

    // ... [Rest of the original PremiumSiteManager methods remain unchanged]
}

// Initialize Premium Site
console.log("Initializing Premium Site Manager...");
new PremiumSiteManager();
async initializePremiumFeatures() {
        // Smooth Scroll Polyfill
        if (!('scrollBehavior' in document.documentElement.style)) {
            await import('https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js').then(module => module.polyfill());
        }

        // Create Premium UI Elements
        this.createPremiumUIElements();

        // Initialize Animations
        this.initializeAnimations();
    }

    createPremiumUIElements() {
        // Create Scroll Progress Indicator
        this.scrollProgress = document.createElement('div');
        this.scrollProgress.className = 'scroll-progress';
        document.body.appendChild(this.scrollProgress);

        // Create Premium Scroll Button
        this.scrollButton = document.createElement('button');
        this.scrollButton.className = 'scroll-to-top premium-effect';
        this.scrollButton.innerHTML = `
            <div class="scroll-button-background"></div>
            <i class="fas fa-arrow-up"></i>
        `;
        document.body.appendChild(this.scrollButton);
    }

    initializeAnimations() {
        // Intersection Observer for Animation on Scroll
        this.animationObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        if (entry.target.dataset.animationSequence) {
                            this.triggerSequenceAnimation(entry.target);
                        }
                    }
                });
            },
            {
                threshold: 0.2,
                rootMargin: '0px'
            }
        );

        // Setup Animation Elements
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            this.animationObserver.observe(element);
        });
    }

    setupEventListeners() {
        // Premium Scroll Handling
        window.addEventListener('scroll', this.handlePremiumScroll.bind(this), { passive: true });

        // Responsive Design Handling
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        // Touch Events for Mobile
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }

        // Premium Button Events
        this.scrollButton.addEventListener('click', () => {
            this.scrollToTop();
            this.triggerButtonAnimation(this.scrollButton);
        });

        // Form Enhancement
        if (this.form?.element) {
            this.setupEnhancedForm();
        }

        // Testimonial Controls
        if (this.testimonials.container) {
            this.setupTestimonialControls();
        }
    }

    handlePremiumScroll() {
        if (this.scrollTimeout) {
            window.cancelAnimationFrame(this.scrollTimeout);
        }

        this.scrollTimeout = window.requestAnimationFrame(() => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            this.scrollProgress.style.width = `${scrollPercent}%`;

            // Show/Hide Scroll Button with Premium Animation
            if (window.scrollY > window.innerHeight / 2) {
                this.scrollButton.classList.add('visible', 'premium-effect');
            } else {
                this.scrollButton.classList.remove('visible');
            }

            // Header Transformation
            this.updateHeaderOnScroll();
        });
    }

    updateHeaderOnScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const currentScroll = window.scrollY;
        const scrollDelta = currentScroll - this.lastScrollPosition;

        if (currentScroll > 100) {
            if (scrollDelta > 0 && !this.state.isMobile) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled', 'header-hidden');
        }

        this.lastScrollPosition = currentScroll;
    }

    handleInitialLoad() {
        const { container, content } = this.loader;
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (container) container.style.opacity = '0';
            setTimeout(() => {
                if (container) container.style.display = 'none';
                if (content) content.style.opacity = '1';
                document.body.style.overflow = '';

                // Trigger initial animations
                this.triggerInitialAnimations();
            }, 500);
        }, 1000);
    }

    triggerInitialAnimations() {
        const elements = document.querySelectorAll('.animate-on-load');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        });
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    handleResize() {
        this.state.isMobile = window.innerWidth <= 768;
        
        // Update slider dimensions and position
        if (this.testimonials.container) {
            const { state } = this.testimonials;
            state.slideWidth = this.testimonials.cards[0].offsetWidth + 30;
            this.updateSliderPosition();
        }
    }

    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        // Implement additional error tracking or user notifications if needed
    }

    triggerButtonAnimation(button) {
        button.classList.add('clicked');
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 300);
    }

    triggerSequenceAnimation(element) {
        const children = element.querySelectorAll('[data-animation-sequence-item]');
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('animate-in');
            }, index * 100);
        });
    }
}

// Initialize Premium Site
console.log("Initializing Premium Site Manager...");
new PremiumSiteManager();

// Console logs for development feedback
console.log("DOM content loaded event simulated.");
console.log("Simulating mousemove event for parallax effect...");
console.log("Simulating scroll event...");
console.log("Simulating resize event...");
console.log("Premium Site Manager initialization complete.");
