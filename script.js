// Site Manager - handles loader, smooth scroll, and testimonials
class SiteManager {
    constructor() {
        // Core elements
        this.loader = document.querySelector('.loader-container');
        this.content = document.querySelector('.content-container');
        this.isLoading = true;

        // Initialize components
        this.initLoader();
        this.initSmoothScroll();
        this.testimonials = new TestimonialsSlider();
    }

    initLoader() {
        if (!this.loader || !this.content) {
            console.warn('Loader elements not found');
            return;
        }

        // Hide content initially
        this.content.style.opacity = '0';
        
        // Set a maximum loading time of 5 seconds
        setTimeout(() => this.hideLoader(), 5000);

        // Wait for all resources to load
        window.addEventListener('load', () => this.hideLoader());
    }

    hideLoader() {
        if (!this.isLoading) return;
        this.isLoading = false;

        // Fade out loader
        this.loader.style.opacity = '0';
        
        // Show content after loader fades
        setTimeout(() => {
            this.loader.style.display = 'none';
            this.content.style.opacity = '1';
            this.testimonials.calculateSizes(); // Recalculate testimonials after content is visible
        }, 500);
    }

    initSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (!target) return;

                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });

        // Smooth scroll to top button
        const scrollTopBtn = document.querySelector('.scroll-to-top');
        if (scrollTopBtn) {
            window.addEventListener('scroll', () => {
                scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
            });

            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
}

// Testimonials Slider Component
class TestimonialsSlider {
    constructor() {
        // Core elements
        this.track = document.querySelector('.testimonial-track');
        this.cards = Array.from(document.querySelectorAll('.testimonial-card'));
        this.nextBtn = document.querySelector('.slider-btn.next');
        this.prevBtn = document.querySelector('.slider-btn.prev');
        this.dotsContainer = document.querySelector('.slider-dots');

        // State
        this.currentIndex = 0;
        this.isAnimating = false;
        this.cardWidth = 0;
        this.gapSize = 20;

        if (!this.track || this.cards.length === 0) return;
        this.init();
    }

    init() {
        // Clone first and last slides for infinite scroll
        const firstClone = this.cards[0].cloneNode(true);
        const lastClone = this.cards[this.cards.length - 1].cloneNode(true);
        
        this.track.appendChild(firstClone);
        this.track.insertBefore(lastClone, this.cards[0]);
        
        // Update cards array with clones
        this.cards = Array.from(document.querySelectorAll('.testimonial-card'));
        
        // Setup
        this.createDots();
        this.setupButtons();
        this.setupResizeObserver();
        
        // Initial positioning
        setTimeout(() => {
            this.calculateSizes();
            this.goToSlide(0, false);
        }, 100);
    }

    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(this.debounce(() => {
            this.calculateSizes();
            this.goToSlide(this.currentIndex, false);
        }, 250));

        resizeObserver.observe(document.body);
    }

    calculateSizes() {
        const container = document.querySelector('.testimonial-container');
        if (!container) return;

        if (window.innerWidth <= 768) {
            this.cardWidth = container.offsetWidth - 40;
        } else {
            this.cardWidth = (container.offsetWidth - (this.gapSize * 2)) / 3;
        }

        this.cards.forEach(card => {
            card.style.width = `${this.cardWidth}px`;
            card.style.minWidth = `${this.cardWidth}px`;
        });

        // Update track width
        this.track.style.width = `${this.cardWidth * this.cards.length + (this.gapSize * (this.cards.length - 1))}px`;
    }

    createDots() {
        if (!this.dotsContainer) return;
        
        this.dotsContainer.innerHTML = '';
        const actualSlideCount = this.cards.length - 2; // Subtract clones
        
        for (let i = 0; i < actualSlideCount; i++) {
            const dot = document.createElement('button');
            dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.onclick = () => this.goToSlide(i);
            this.dotsContainer.appendChild(dot);
        }
    }

    setupButtons() {
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextSlide();
            });
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevSlide();
            });
        }
    }

    nextSlide() {
        if (this.isAnimating) return;
        this.goToSlide(this.currentIndex + 1);
    }

    prevSlide() {
        if (this.isAnimating) return;
        this.goToSlide(this.currentIndex - 1);
    }

    goToSlide(index, animate = true) {
        if (this.isAnimating) return;
        
        this.isAnimating = animate;
        this.currentIndex = index;

        const position = -((index + 1) * (this.cardWidth + this.gapSize));
        
        this.track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        this.track.style.transform = `translateX(${position}px)`;

        // Update UI
        this.updateDots();
        this.updateActiveCard();

        // Handle infinite scroll
        if (animate) {
            this.track.addEventListener('transitionend', () => this.handleTransitionEnd(), { once: true });
        } else {
            this.isAnimating = false;
        }
    }

    handleTransitionEnd() {
        this.isAnimating = false;
        
        // Reset to first/last slide for infinite scroll
        if (this.currentIndex === -1) {
            this.goToSlide(this.cards.length - 3, false);
        } else if (this.currentIndex === this.cards.length - 2) {
            this.goToSlide(0, false);
        }
    }

    updateDots() {
        if (!this.dotsContainer) return;
        
        const dots = Array.from(this.dotsContainer.children);
        const actualIndex = (this.currentIndex + this.cards.length) % (this.cards.length - 2);
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === actualIndex);
        });
    }

    updateActiveCard() {
        this.cards.forEach((card, i) => {
            const isActive = i === this.currentIndex + 1;
            card.classList.toggle('active', isActive);
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.siteManager = new SiteManager();
});
