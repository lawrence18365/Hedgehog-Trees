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
            currentIndex: 1,
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
        
        this.cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
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
        }
    }

    prevSlide() {
        if (this.sliderState.currentIndex > 0) {
            this.goToSlide(this.sliderState.currentIndex - 1);
        }
    }

    startAutoPlay() {
        setInterval(() => this.nextSlide(), 5000);
    }

    // Touch Event Handlers
    handleTouchStart(event) {
        this.sliderState.startX = this.getPositionX(event);
        this.sliderState.isDragging = true;
        this.track.style.cursor = 'grabbing';
    }

    handleTouchMove(event) {
        if (!this.sliderState.isDragging) return;
        
        const currentX = this.getPositionX(event);
        const diff = this.sliderState.startX - currentX;
        const cardWidth = this.cards[0].offsetWidth;
        
        if (
            (this.sliderState.currentIndex === 0 && diff < 0) || 
            (this.sliderState.currentIndex === this.cards.length - 1 && diff > 0)
        ) {
            return;
        }
        
        this.sliderState.currentTranslate = this.sliderState.previousTranslate - diff;
        this.track.style.transform = `translateX(${this.sliderState.currentTranslate}px)`;
    }

    handleTouchEnd() {
        this.sliderState.isDragging = false;
        this.track.style.cursor = 'grab';
        
        const movedBy = this.sliderState.currentTranslate - this.sliderState.previousTranslate;
        
        if (Math.abs(movedBy) > 100) {
            if (movedBy < 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        } else {
            this.goToSlide(this.sliderState.currentIndex);
        }
    }

    getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
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
        const formInputs = this.contactForm.querySelectorAll('input, textarea');

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
            alert('Please fill out all fields.');
        }
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Event Listeners Setup
    setupEventListeners() {
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
});
