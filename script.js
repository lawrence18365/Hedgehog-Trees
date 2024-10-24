class PremiumSiteManager {
    constructor() {
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth <= 768,
            hasScrolled: false,
            initialized: false
        };

        // Force remove loader after timeout (failsafe)
        this.loadingTimeout = setTimeout(() => {
            this.forceRemoveLoader();
        }, 5000); // 5 second maximum loading time

        // Initialize immediately
        this.init();
    }

    forceRemoveLoader() {
        const loader = document.querySelector('.loader-container');
        if (loader) {
            loader.style.display = 'none';
        }
        const content = document.querySelector('.content-container');
        if (content) {
            content.style.display = 'block';
            content.style.opacity = '1';
        }
        document.body.style.overflow = '';
        this.state.isLoading = false;
    }

    async init() {
        try {
            await this.initializeComponents();
            this.setupEventListeners();
            this.handleInitialLoad();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.forceRemoveLoader(); // Ensure site loads even if there's an error
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
            this.createDefaultLoader();
        }

        // Ensure content container exists
        if (!document.querySelector('.content-container')) {
            const contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';
            // Move all body content (except loader) into content container
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
            .content-container {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
        `;
        document.head.appendChild(style);

        // Add elements to DOM
        loaderContainer.appendChild(spinner);
        document.body.insertBefore(loaderContainer, document.body.firstChild);

        // Store loader elements
        this.loader = {
            container: loaderContainer,
            spinner: spinner,
            content: document.querySelector('.content-container')
        };
    }

    handleInitialLoad() {
        // Clear the failsafe timeout since we're handling the load properly
        clearTimeout(this.loadingTimeout);

        // Show content immediately if there's no loader
        if (!this.loader?.container) {
            this.forceRemoveLoader();
            return;
        }

        // Ensure content exists and is ready
        if (this.loader.content) {
            this.loader.content.style.transition = 'opacity 0.5s ease';
        }

        // Quick loading transition
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
                    this.triggerInitialAnimations();
                }, 500);
            }
        }, 500); // Reduced initial delay
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
    }

    handlePremiumScroll() {
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
}

// Initialize immediately without waiting for DOMContentLoaded
window.premiumSite = new PremiumSiteManager();
