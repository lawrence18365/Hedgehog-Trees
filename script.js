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

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
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
        // Core Components - with null checks
        const loader = {
            container: document.querySelector('.loader-container'),
            content: document.querySelector('.content-container'),
            logo: document.querySelector('.logo-loader'),
            spinner: document.querySelector('.spinner')
        };

        // Only initialize if loader elements exist
        if (loader.container || loader.content) {
            this.loader = loader;
        } else {
            // Create default loader if none exists
            this.createDefaultLoader();
        }

        // Initialize testimonials only if they exist
        const testimonialContainer = document.querySelector('.testimonial-container');
        if (testimonialContainer) {
            this.testimonials = {
                container: testimonialContainer,
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

            if (this.testimonials.track && this.testimonials.cards.length) {
                this.initializeTestimonials();
            }
        }
    }

    createDefaultLoader() {
        // Create and append loader container
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

        // Create spinner
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

        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Add elements to DOM
        loaderContainer.appendChild(spinner);
        document.body.appendChild(loaderContainer);

        // Store loader elements
        this.loader = {
            container: loaderContainer,
            content: document.querySelector('.content-container'),
            spinner: spinner
        };
    }

    handleInitialLoad() {
        if (!this.loader?.container) return;

        // Ensure content is initially hidden
        if (this.loader.content) {
            this.loader.content.style.opacity = '0';
            this.loader.content.style.transition = 'opacity 0.5s ease';
        }

        // Hide loader and show content
        setTimeout(() => {
            if (this.loader.container) {
                this.loader.container.style.opacity = '0';
                
                setTimeout(() => {
                    if (this.loader.container) {
                        this.loader.container.style.display = 'none';
                    }
                    if (this.loader.content) {
                        this.loader.content.style.opacity = '1';
                    }
                    document.body.style.overflow = '';
                    this.triggerInitialAnimations();
                }, 500);
            }
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

    setupEventListeners() {
        window.addEventListener('scroll', this.handlePremiumScroll.bind(this), { passive: true });
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }
    }

    handlePremiumScroll() {
        // Basic scroll handling
        const scrollPosition = window.pageYOffset;
        this.state.hasScrolled = true;
        this.lastScrollPosition = scrollPosition;
    }

    handleResize() {
        this.state.isMobile = window.innerWidth <= 768;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        // You can add more error handling logic here
    }
}

// Initialize Premium Site
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Premium Site Manager...");
    window.premiumSite = new PremiumSiteManager();
});
