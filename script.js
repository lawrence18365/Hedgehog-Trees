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
            this.setupScrollEffects();

            // Start Loading Sequence
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
            inputs: document.querySelectorAll('#contact-form input, #contact-form textarea'),
            submitButton: document.querySelector('#contact-form button[type="submit"]')
        };

        // Initialize Premium Features
        await this.initializePremiumFeatures();
    }

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

        // Create Loading Overlay (if needed)
        // You can implement a loading overlay if required
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
        if (this.form.element) {
            this.setupEnhancedForm();
        }

        // Testimonial Controls
        if (this.testimonials.container) {
            this.setupTestimonialControls();
        }
    }

    setupTouchEvents() {
        const { track } = this.testimonials;
        if (!track) return;

        // Add Event Listeners for Touch Events
        track.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        track.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        track.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        track.addEventListener('mousedown', this.handleTouchStart.bind(this));
        track.addEventListener('mousemove', this.handleTouchMove.bind(this));
        track.addEventListener('mouseup', this.handleTouchEnd.bind(this));
        track.addEventListener('mouseleave', this.handleTouchEnd.bind(this));
    }

    setupEnhancedForm() {
        // Enhanced Form Validation
        this.form.inputs.forEach(input => {
            input.addEventListener('focus', () => this.handleInputFocus(input));
            input.addEventListener('blur', () => this.handleInputBlur(input));
            input.addEventListener('input', () => this.handleInputValidation(input));
        });

        // Form Submission
        this.form.element.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    setupTestimonialControls() {
        const { controls } = this.testimonials;

        // Controls Event Listeners
        if (controls.prev) controls.prev.addEventListener('click', () => this.previousSlide());
        if (controls.next) controls.next.addEventListener('click', () => this.nextSlide());

        // Auto-play with Pause on Hover
        this.testimonials.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.testimonials.container.addEventListener('mouseleave', () => this.resumeAutoPlay());

        // Initialize Dots
        this.createEnhancedDots();

        // Initialize Slider
        this.setupTestimonialSlider();
    }

    // Scroll Handling Methods
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

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Form Handling Methods
    handleInputFocus(input) {
        input.parentNode.classList.add('focused');
    }

    handleInputBlur(input) {
        if (!input.value.trim()) {
            input.parentNode.classList.remove('focused');
        }
        this.handleInputValidation(input);
    }

    handleInputValidation(input) {
        if (input.validity.valid) {
            input.classList.remove('invalid');
        } else {
            input.classList.add('invalid');
        }
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
            this.form.inputs.forEach(input => input.parentNode.classList.remove('focused'));
        } catch (error) {
            this.showErrorMessage();
        } finally {
            this.hideLoadingState();
        }
    }

    validateForm() {
        let isValid = true;

        this.form.inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('invalid');
                isValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        return isValid;
    }

    showLoadingState() {
        this.form.submitButton.disabled = true;
        this.form.submitButton.classList.add('loading');
    }

    hideLoadingState() {
        this.form.submitButton.disabled = false;
        this.form.submitButton.classList.remove('loading');
    }

    showSuccessMessage() {
        alert('Form submitted successfully!');
    }

    showErrorMessage() {
        alert('An error occurred. Please try again later.');
    }

    // Testimonial Slider Methods
    setupTestimonialSlider() {
        const { state } = this.testimonials;
        state.slideWidth = this.testimonials.cards[0].offsetWidth;
        state.totalSlides = this.testimonials.cards.length;
        state.autoPlayDelay = 5000;
        state.transitionDuration = 500;

        // Initialize Slider Position
        this.updateSliderPosition();

        // Start Auto-play
        this.startAutoPlay();
    }

    updateSliderPosition() {
        const { state } = this.testimonials;
        const translateX = -state.currentIndex * state.slideWidth;
        this.testimonials.track.style.transform = `translateX(${translateX}px)`;
        this.testimonials.track.style.transition = `transform ${state.transitionDuration}ms ease`;

        this.updateDots();
    }

    nextSlide() {
        const { state } = this.testimonials;
        state.currentIndex = (state.currentIndex + 1) % state.totalSlides;
        this.updateSliderPosition();
    }

    previousSlide() {
        const { state } = this.testimonials;
        state.currentIndex = (state.currentIndex - 1 + state.totalSlides) % state.totalSlides;
        this.updateSliderPosition();
    }

    startAutoPlay() {
        const { state } = this.testimonials;
        state.autoPlayInterval = setInterval(() => this.nextSlide(), state.autoPlayDelay);
    }

    pauseAutoPlay() {
        const { state } = this.testimonials;
        clearInterval(state.autoPlayInterval);
    }

    resumeAutoPlay() {
        this.startAutoPlay();
    }

    createEnhancedDots() {
        const { controls, cards } = this.testimonials;
        if (!controls.dots) return;

        controls.dots.innerHTML = '';

        this.dots = [];

        cards.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.addEventListener('click', () => {
                this.testimonials.state.currentIndex = index;
                this.updateSliderPosition();
            });
            controls.dots.appendChild(dot);
            this.dots.push(dot);
        });

        this.updateDots();
    }

    updateDots() {
        if (!this.dots) return;

        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.testimonials.state.currentIndex);
        });
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

        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentPosition - state.startX;
        state.currentTranslate = state.previousTranslate + diff;
        track.style.transform = `translateX(${state.currentTranslate}px)`;
    }

    handleTouchEnd() {
        const { state } = this.testimonials;
        state.isDragging = false;

        const movedBy = state.currentTranslate - state.previousTranslate;
        if (movedBy < -100 && state.currentIndex < state.totalSlides - 1) {
            state.currentIndex += 1;
        } else if (movedBy > 100 && state.currentIndex > 0) {
            state.currentIndex -= 1;
        }

        this.updateSliderPosition();
        this.resumeAutoPlay();
    }

    // Loading Sequence
    handleInitialLoad() {
        const { container, content } = this.loader;
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                container.style.display = 'none';
                content.style.opacity = '1';
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

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    handleResize() {
        this.state.isMobile = window.innerWidth <= 768;
        // Update any responsive components here
        this.updateSliderPosition();
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
            background: linear-gradient(to right, #27ae60, #2ecc71);
            z-index: 1000;
            transition: width 0.1s ease;
        }

        .scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #27ae60;
            color: #fff;
            border: none;
            padding: 10px 15px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0;
            visibility: hidden;
            z-index: 1000;
        }

        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
        }

        .scroll-to-top:hover {
            background-color: #2ecc71;
            transform: scale(1.1);
        }

        .header-scrolled {
            background: rgba(0, 0, 0, 0.8);
            transition: background 0.3s ease;
        }

        .header-hidden {
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        }

        .animate-in {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .animate-on-load {
            opacity: 0;
            transform: translateY(20px);
        }

        .form-field-wrapper {
            position: relative;
            margin-bottom: 20px;
        }

        .form-field-wrapper input,
        .form-field-wrapper textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
        }

        .form-field-wrapper label {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #999;
            transition: all 0.3s ease;
            pointer-events: none;
        }

        .form-field-wrapper.focused label,
        .form-field-wrapper input:not(:placeholder-shown) + label,
        .form-field-wrapper textarea:not(:placeholder-shown) + label {
            top: -15px;
            font-size: 12px;
            color: #27ae60;
        }

        .invalid {
            border-color: #e74c3c;
        }

        .submit-button.loading::after {
            content: '';
            position: absolute;
            right: 20px;
            top: 50%;
            width: 20px;
            height: 20px;
            margin-top: -10px;
            border: 2px solid #fff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Initialize Site Manager
    new PremiumSiteManager();
});
