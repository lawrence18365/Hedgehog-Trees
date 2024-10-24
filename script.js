// Site Functionality Manager
class SiteManager {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();
    }

    initializeComponents() {
        // Loader Setup
        this.loader = document.querySelector('.loader-container');
        this.content = document.querySelector('.content-container');
        this.setupLoader();

        // Testimonial Slider Setup
        this.track = document.querySelector('.testimonial-track');
        this.cards = Array.from(document.querySelectorAll('.testimonial-card'));
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.dotsContainer = document.querySelector('.slider-dots');
        this.setupSlider();

        // Form Setup
        this.contactForm = document.getElementById('contact-form');
        
        // Scroll Button Setup
        this.createScrollButton();
    }

    // Loader Methods
    setupLoader() {
        if (!this.loader || !this.content) return;
        
        this.content.style.opacity = '0';
        
        const handleLoading = () => {
            this.loader.style.opacity = '0';
            setTimeout(() => {
                this.loader.style.display = 'none';
                this.content.style.opacity = '1';
            }, 800);
        };

        // Simulate loading time
        setTimeout(handleLoading, 2000);
    }

    // Slider Methods
    setupSlider() {
        if (!this.track || !this.cards.length) return;

        this.sliderState = {
            currentIndex: 0,
            startX: 0,
            isDragging: false,
            currentTranslate: 0,
            previousTranslate: 0
        };

        this.createDots();
        this.initSlider();
        this.setupSliderEvents();
        this.startAutoPlay();
    }

    createDots() {
        if (!this.dotsContainer) return;
        
        this.dots = [];

        this.cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });

        this.updateDots();
    }

    updateDots() {
        if (!this.dots) return;

        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.sliderState.currentIndex);
        });
    }

    updateButtons() {
        if (!this.prevBtn || !this.nextBtn) return;
        
        this.prevBtn.disabled = this.sliderState.currentIndex === 0;
        this.nextBtn.disabled = this.sliderState.currentIndex === this.cards.length - 1;
    }

    initSlider() {
        const cardWidth = this.cards[0].offsetWidth;
        this.track.style.transform = `translateX(-${cardWidth * this.sliderState.currentIndex}px)`;
        this.updateDots();
        this.updateButtons();
    }

    goToSlide(index) {
        this.sliderState.currentIndex = index;
        const cardWidth = this.cards[0].offsetWidth;
        this.track.style.transition = 'transform 0.5s ease';
        this.track.style.transform = `translateX(-${cardWidth * this.sliderState.currentIndex}px)`;
        this.updateDots();
        this.updateButtons();
    }

    nextSlide() {
        if (this.sliderState.currentIndex < this.cards.length - 1) {
            this.goToSlide(this.sliderState.currentIndex + 1);
        } else {
            // Loop back to first slide
            this.goToSlide(0);
        }
    }

    prevSlide() {
        if (this.sliderState.currentIndex > 0) {
            this.goToSlide(this.sliderState.currentIndex - 1);
        } else {
            // Loop to last slide
            this.goToSlide(this.cards.length - 1);
        }
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
    }

    setupSliderEvents() {
        // Slider Events
        if (this.track && this.cards.length) {
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSlide());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSlide());

            // Touch Events
            this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            this.track.addEventListener('touchend', () => this.handleTouchEnd());

            // Mouse Events
            this.track.addEventListener('mousedown', (e) => this.handleTouchStart(e));
            this.track.addEventListener('mousemove', (e) => this.handleTouchMove(e));
            this.track.addEventListener('mouseup', () => this.handleTouchEnd());
            this.track.addEventListener('mouseleave', () => this.handleTouchEnd());
        }
    }

    // Touch Event Handlers
    handleTouchStart(event) {
        this.sliderState.startX = this.getPositionX(event);
        this.sliderState.isDragging = true;
        this.track.style.cursor = 'grabbing';
        this.sliderState.animationID = requestAnimationFrame(this.animate.bind(this));
    }

    handleTouchMove(event) {
        if (!this.sliderState.isDragging) return;
        
        const currentX = this.getPositionX(event);
        const diff = currentX - this.sliderState.startX;
        this.sliderState.currentTranslate = this.sliderState.previousTranslate + diff;
        this.setSliderPosition();
    }

    handleTouchEnd() {
        cancelAnimationFrame(this.sliderState.animationID);
        this.sliderState.isDragging = false;
        const movedBy = this.sliderState.currentTranslate - this.sliderState.previousTranslate;
        const cardWidth = this.cards[0].offsetWidth;
        
        if (movedBy < -50 && this.sliderState.currentIndex < this.cards.length - 1) {
            this.sliderState.currentIndex += 1;
        }

        if (movedBy > 50 && this.sliderState.currentIndex > 0) {
            this.sliderState.currentIndex -= 1;
        }

        this.setPositionByIndex();
        this.track.style.cursor = 'grab';
    }

    getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    animate() {
        this.setSliderPosition();
        if (this.sliderState.isDragging) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    setSliderPosition() {
        this.track.style.transform = `translateX(${this.sliderState.currentTranslate}px)`;
    }

    setPositionByIndex() {
        this.sliderState.currentTranslate = -this.sliderState.currentIndex * this.cards[0].offsetWidth;
        this.sliderState.previousTranslate = this.sliderState.currentTranslate;
        this.track.style.transition = 'transform 0.5s ease-out';
        this.setSliderPosition();
        this.updateDots();
        this.updateButtons();
    }

    // Scroll Button Methods
    createScrollButton() {
        this.scrollTopButton = document.createElement('button');
        this.scrollTopButton.className = 'scroll-to-top';
        this.scrollTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(this.scrollTopButton);
    }

    handleScroll() {
        if (window.scrollY > 300) {
            this.scrollTopButton.classList.add('visible');
        } else {
            this.scrollTopButton.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Form Methods
    handleFormSubmit(e) {
        e.preventDefault();

        let isValid = true;
        const formInputs = this.contactForm.querySelectorAll('input[required], textarea[required]');

        formInputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });

        if (isValid) {
            alert('Form submitted successfully!');
            this.contactForm.reset();
        } else {
            alert('Please fill out all required fields.');
        }
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#' || href === '') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerOffset = document.querySelector('.site-header').offsetHeight;
                    const elementPosition = target.offsetTop - headerOffset;

                    window.scrollTo({
                        top: elementPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Form Events
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Scroll Events
        window.addEventListener('scroll', () => this.handleScroll());
        this.scrollTopButton.addEventListener('click', () => this.scrollToTop());

        // Window Resize
        window.addEventListener('resize', () => this.initSlider());

        // Smooth Scrolling
        this.setupSmoothScrolling();
    }
}

// Initialize Site
document.addEventListener('DOMContentLoaded', () => {
    // Add Interactive Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .error {
            border: 2px solid #e74c3c;
            animation: shake 0.3s ease;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
        }

        .scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #000000;
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
            background-color: #333333;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);

    // Initialize Site Manager
    new SiteManager();

    // Initialize Header Controller
    new HeaderController();
});

// Header Controller Class
class HeaderController {
    constructor() {
        this.header = document.querySelector('.site-header');
        this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        this.navContainer = document.querySelector('.nav-container');
        this.headerHeight = this.header.offsetHeight;
        this.lastScroll = 0;
        this.isMenuOpen = false;
        this.isScrolling = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupScrollThrottle();
    }

    setupEventListeners() {
        // Mobile Menu Toggle
        this.mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());

        // Close menu when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Smooth scroll navigation
        document.querySelectorAll('.nav-links a, .cta-button').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e, link));
        });

        // Handle resize events
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));

        // Handle escape key
        document.addEventListener('keydown', (e) => this.handleEscapeKey(e));
    }

    setupIntersectionObserver() {
        const options = {
            rootMargin: '-100px 0px 0px 0px',
            threshold: [0]
        };

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    this.header.classList.add('sticky');
                } else {
                    this.header.classList.remove('sticky');
                }
            });
        }, options);

        // Observe a sentinel element at the top of the page
        const sentinel = document.createElement('div');
        sentinel.classList.add('scroll-sentinel');
        document.body.prepend(sentinel);
        observer.observe(sentinel);
    }

    setupScrollThrottle() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > this.headerHeight) {
            if (currentScroll > this.lastScroll && currentScroll > this.headerHeight) {
                // Scrolling down
                this.header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                this.header.style.transform = 'translateY(0)';
            }
        } else {
            this.header.classList.remove('sticky');
            this.header.style.transform = 'translateY(0)';
        }
        
        this.lastScroll = currentScroll;
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.navContainer.classList.toggle('active');
        this.mobileMenuToggle.classList.toggle('active');
        document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }

    handleOutsideClick(e) {
        if (this.isMenuOpen && !this.navContainer.contains(e.target) && !this.mobileMenuToggle.contains(e.target)) {
            this.toggleMobileMenu();
        }
    }

    handleNavClick(e, link) {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const headerOffset = this.header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            if (this.isMenuOpen) {
                this.toggleMobileMenu();
            }
        }
    }

    handleResize() {
        if (window.innerWidth > 768 && this.isMenuOpen) {
            this.toggleMobileMenu();
        }
        this.headerHeight = this.header.offsetHeight;
    }

    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.isMenuOpen) {
            this.toggleMobileMenu();
        }
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
