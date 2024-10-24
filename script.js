class PremiumSiteManager {
    constructor() {
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth <= 768,
            initialized: false,
            resourcesLoaded: false
        };

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

        this.resourcesToLoad = 0;
        this.resourcesLoaded = 0;
        this.loadingTimeout = setTimeout(() => this.forceRemoveLoader(), 10000);
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.setupEventListeners();
            await this.waitForResources();
            this.initializeTestimonials();
            this.state.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            this.forceRemoveLoader();
        }
    }

    async waitForResources() {
        return new Promise((resolve) => {
            const images = Array.from(document.getElementsByTagName('img'));
            const scripts = Array.from(document.getElementsByTagName('script'));
            const links = Array.from(document.getElementsByTagName('link')).filter(
                link => link.rel === 'stylesheet'
            );

            this.resourcesToLoad = images.length + scripts.length + links.length;

            if (this.resourcesToLoad === 0) {
                this.state.resourcesLoaded = true;
                resolve();
                return;
            }

            const resourceLoaded = () => {
                this.resourcesLoaded++;
                if (this.resourcesLoaded >= this.resourcesToLoad) {
                    this.state.resourcesLoaded = true;
                    resolve();
                }
            };

            images.forEach(img => {
                if (img.complete) resourceLoaded();
                else {
                    img.addEventListener('load', resourceLoaded);
                    img.addEventListener('error', resourceLoaded);
                }
            });

            scripts.forEach(script => {
                if (script.readyState) {
                    if (script.readyState === 'complete' || script.readyState === 'loaded') {
                        resourceLoaded();
                    } else {
                        script.onreadystatechange = resourceLoaded;
                    }
                } else {
                    if (script.hasAttribute('src')) {
                        script.addEventListener('load', resourceLoaded);
                        script.addEventListener('error', resourceLoaded);
                    } else {
                        resourceLoaded();
                    }
                }
            });

            links.forEach(link => {
                if (link.sheet) resourceLoaded();
                else {
                    link.addEventListener('load', resourceLoaded);
                    link.addEventListener('error', resourceLoaded);
                }
            });
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
            contentContainer.style.opacity = '0';
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

        const firstClone = cards[0].cloneNode(true);
        const lastClone = cards[cards.length - 1].cloneNode(true);
        
        track.appendChild(firstClone);
        track.prepend(lastClone);

        this.testimonials.cards = Array.from(track.querySelectorAll('.testimonial-card'));
        this.testimonials.cardWidth = cards[0].offsetWidth + 30;
        this.testimonials.totalSlides = cards.length;

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
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        const { prevBtn, nextBtn, track } = this.testimonials;
        if (prevBtn) prevBtn.addEventListener('click', () => this.slide('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.slide('next'));
        if (track) {
            track.addEventListener('transitionend', () => this.handleTransitionEnd());
            track.addEventListener('touchstart', e => this.handleTouchStart(e));
            track.addEventListener('touchmove', e => this.handleTouchMove(e));
            track.addEventListener('touchend', () => this.handleTouchEnd());
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
        if (!this.testimonials.touchStartX || !this.testimonials.touchCurrentX) return;

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
            this.testimonials.cardWidth = this.testimonials.cards[0].offsetWidth + 30;
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
            .content-container {
                transition: opacity 0.5s ease;
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
        if (!this.state.resourcesLoaded || !this.state.initialized) return;
        
        clearTimeout(this.loadingTimeout);
        
        if (!this.loader?.container) {
            this.forceRemoveLoader();
            return;
        }

        if (this.loader.content) {
            this.loader.content.style.transition = 'opacity 0.5s ease';
        }

        window.requestAnimationFrame(() => {
            if (this.loader.container) {
                this.loader.container.style.opacity = '0';
                
                setTimeout(() => {
                    if (this.loader.container) {
                        this.loader.container.style.display = 'none';
                    }
                    if (this.loader.content) {
                        this.loader.content.style.display = 'block';
                        void this.loader.content.offsetWidth;
                        this.loader.content.style.opacity = '1';
                    }
                    document.body.style.overflow = '';
                    this.state.isLoading = false;
                }, 500);
            }
        });
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

    static initialize() {
        const siteManager = new PremiumSiteManager();
        
        const domReady = new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });

        const windowReady = new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });

        Promise.all([domReady, windowReady]).then(() => {
            setTimeout(() => {
                if (siteManager.state.resourcesLoaded) {
                    siteManager.handleInitialLoad();
                }
            }, 500);
        });

        return siteManager;
    }
}

window.premiumSite = PremiumSiteManager.initialize();
