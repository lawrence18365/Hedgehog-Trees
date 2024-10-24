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
            // Removed the undefined setupScrollEffects() call
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
        state.slideWidth = this.testimonials.cards[0]?.offsetWidth || 0;
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
        /* [Your CSS styles here] */
    `;
    document.head.appendChild(style);

    // Initialize Site Manager
    new PremiumSiteManager();
});

// Parallax effect for background circles
    document.addEventListener('mousemove', (e) => {
      const circles = document.querySelectorAll('.circle');
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;

      circles.forEach((circle) => {
        const rect = circle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const moveX = (mouseX - 0.5) * 20;
        const moveY = (mouseY - 0.5) * 20;

        circle.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.visibility = 'visible';
        }
      });
    }, observerOptions);

    // Observe benefit cards for scroll animations
    document.querySelectorAll('.benefit-card').forEach(card => {
      observer.observe(card);
    });

    // Add hover effect sound for benefit cards
    document.querySelectorAll('.benefit-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (window.AudioContext || window.webkitAudioContext) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.stop(audioContext.currentTime + 0.1);
        }
      });
    });
