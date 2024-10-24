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
            // Initialize Components
            await this.initializeComponents();
            this.setupEventListeners();
            this.setupIntersectionObservers();
            this.setupScrollEffects();
            
            // Start Loading Sequence
            this.handleInitialLoad();
            
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleInitializationError();
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

        // Testimonial Components
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
                autoPlayInterval: null
            }
        };

        // Form Components
        this.form = {
            element: document.getElementById('contact-form'),
            inputs: document.querySelectorAll('input, textarea'),
            submitButton: document.querySelector('#contact-form button[type="submit"]')
        };

        // Initialize Premium Features
        await this.initializePremiumFeatures();
    }

    async initializePremiumFeatures() {
        // Smooth Scroll Polyfill
        if (!('scrollBehavior' in document.documentElement.style)) {
            await import('smoothscroll-polyfill').then(module => module.polyfill());
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

        // Create Loading Overlay
        this.createLoadingOverlay();
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'premium-loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <svg class="premium-spinner" viewBox="0 0 50 50">
                    <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                <div class="loading-text">
                    <span>L</span><span>o</span><span>a</span><span>d</span><span>i</span><span>n</span><span>g</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
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
            this.smoothScrollTop();
            this.triggerButtonAnimation(this.scrollButton);
        });

        // Form Enhancement
        if (this.form.element) {
            this.setupEnhancedForm();
        }

        // Testimonial Controls
        if (this.testimonials.container) {
            this.setupTestimonialControls();
        }
    }

    setupTouchEvents() {
        const touchElements = [this.testimonials.track, document.body];
        
        touchElements.forEach(element => {
            if (!element) return;

            element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        });
    }

    setupEnhancedForm() {
        // Enhanced Form Validation
        this.form.inputs.forEach(input => {
            input.addEventListener('focus', () => this.handleInputFocus(input));
            input.addEventListener('blur', () => this.handleInputBlur(input));
            input.addEventListener('input', () => this.handleInputValidation(input));
        });

        // Form Submission
        this.form.element.addEventListener('submit', (e) => this.handleEnhancedSubmit(e));
    }

    setupTestimonialControls() {
        const { controls, state } = this.testimonials;

        // Enhanced Controls
        if (controls.prev) controls.prev.addEventListener('click', () => this.previousSlide());
        if (controls.next) controls.next.addEventListener('click', () => this.nextSlide());

        // Auto-play with Pause on Hover
        this.testimonials.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.testimonials.container.addEventListener('mouseleave', () => this.resumeAutoPlay());

        // Initialize Dots
        this.createEnhancedDots();
    }// Premium Animation Methods
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

            // Parallax Effects
            this.updateParallaxElements();
            
            // Header Transformation
            this.updateHeaderOnScroll();
        });
    }

    updateParallaxElements() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const yPos = -(window.scrollY * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
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

    // Enhanced Testimonial Slider
    setupTestimonialSlider() {
        if (!this.testimonials.track) return;

        this.testimonials.state = {
            ...this.testimonials.state,
            slideWidth: this.testimonials.cards[0].offsetWidth,
            totalSlides: this.testimonials.cards.length,
            autoPlayDelay: 5000,
            transitionDuration: 500
        };

        // Initialize Slider Position
        this.updateSliderPosition(true);
        
        // Start Auto-play
        this.startAutoPlay();

        // Add Premium Touch Interactions
        this.setupPremiumTouchInteractions();
    }

    setupPremiumTouchInteractions() {
        const { track } = this.testimonials;
        let touchStartTime;
        let touchEndTime;

        const handleTouchStart = (e) => {
            touchStartTime = Date.now();
            this.testimonials.state.isDragging = true;
            this.testimonials.state.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            track.style.transition = 'none';
            this.pauseAutoPlay();
        };

        const handleTouchMove = (e) => {
            if (!this.testimonials.state.isDragging) return;
            
            e.preventDefault();
            const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const diff = currentPosition - this.testimonials.state.startX;
            
            const translate = this.testimonials.state.currentTranslate + diff;
            this.setSliderPosition(translate);
        };

        const handleTouchEnd = () => {
            touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            this.testimonials.state.isDragging = false;
            track.style.transition = `transform ${this.testimonials.state.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            
            this.snapToNearestSlide(touchDuration);
            this.resumeAutoPlay();
        };

        // Add Event Listeners with Passive Option for Better Performance
        track.addEventListener('touchstart', handleTouchStart, { passive: true });
        track.addEventListener('touchmove', handleTouchMove, { passive: false });
        track.addEventListener('touchend', handleTouchEnd, { passive: true });
        track.addEventListener('mousedown', handleTouchStart, { passive: true });
        track.addEventListener('mousemove', handleTouchMove, { passive: false });
        track.addEventListener('mouseup', handleTouchEnd, { passive: true });
        track.addEventListener('mouseleave', handleTouchEnd, { passive: true });
    }

    snapToNearestSlide(touchDuration) {
        const { currentTranslate, slideWidth } = this.testimonials.state;
        const movePercentage = Math.abs(currentTranslate - this.testimonials.state.previousTranslate) / slideWidth;
        
        let targetIndex = this.testimonials.state.currentIndex;
        
        if (movePercentage > 0.2 || touchDuration < 300) {
            if (currentTranslate < this.testimonials.state.previousTranslate) {
                targetIndex = Math.min(targetIndex + 1, this.testimonials.cards.length - 1);
            } else {
                targetIndex = Math.max(targetIndex - 1, 0);
            }
        }

        this.goToSlide(targetIndex);
    }

    // Premium Form Handling
    setupEnhancedForm() {
        if (!this.form.element) return;

        // Add floating labels
        this.form.inputs.forEach(input => {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-field-wrapper';
            
            const label = document.createElement('label');
            label.textContent = input.placeholder;
            input.placeholder = '';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            wrapper.appendChild(label);
        });

        // Enhanced validation
        this.form.element.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) return;

        this.showLoadingState();
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.showSuccessMessage();
            this.form.element.reset();
        } catch (error) {
            this.showErrorMessage();
        } finally {
            this.hideLoadingState();
        }
    }

    // Premium Loading Sequence
    async handleInitialLoad() {
        document.body.style.overflow = 'hidden';
        
        // Preload critical images
        await this.preloadCriticalImages();

        // Animate loader out
        const loader = document.querySelector('.loader-container');
        const content = document.querySelector('.content-container');

        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                content.style.opacity = '1';
                document.body.style.overflow = '';
                
                // Trigger initial animations
                this.triggerInitialAnimations();
            }, 500);
        }, 1000);
    }

    // Animation Utilities
    triggerInitialAnimations() {
        const elements = document.querySelectorAll('.animate-on-load');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        });
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Error Handling
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        // Implement error tracking/reporting here
    }
}

// Initialize Premium Site
document.addEventListener('DOMContentLoaded', () => {
    // Add Premium Styles
    const style = document.createElement('style');
    style.textContent = `
        .premium-effect {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: 3px;
            background: linear-gradient(to right, var(--primary), var(--primary-dark));
            z-index: 1000;
            transition: width 0.1s ease;
        }

        .premium-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .loading-content {
            text-align: center;
            color: white;
        }

        .premium-spinner {
            width: 50px;
            height: 50px;
            animation: rotate 2s linear infinite;
        }

        .premium-spinner .path {
            stroke: var(--primary);
            stroke-linecap: round;
            animation: dash 1.5s ease-in-out infinite;
        }

        @keyframes rotate {
            100% { transform: rotate(360deg); }
        }

        @keyframes dash {
            0% {
                stroke-dasharray: 1, 150;
                stroke-dashoffset: 0;
            }
            50% {
                stroke-dasharray: 90, 150;
                stroke-dashoffset: -35;
            }
            100% {
                stroke-dasharray: 90, 150;
                stroke-dashoffset: -124;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize Site
    window.premiumSite = new PremiumSiteManager();
});
