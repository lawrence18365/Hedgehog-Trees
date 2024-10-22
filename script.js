// Main Site Functionality
document.addEventListener("DOMContentLoaded", function() {
    // Testimonial Slider Variables
    const track = document.querySelector('.testimonial-track');
    const cards = Array.from(document.querySelectorAll('.testimonial-card'));
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.slider-dots');
    
    let currentIndex = 1; // Start at second card
    let startX;
    let isDragging = false;
    let currentTranslate = 0;
    let previousTranslate = 0;

    // Slider Functions
    function initSlider() {
        if (!track || !cards.length) return;
        const cardWidth = cards[0].offsetWidth;
        track.style.transform = `translateX(-${cardWidth * currentIndex}px)`;
        updateDots();
        updateButtons();
    }

    // Create Navigation Dots
    function createDots() {
        if (!dotsContainer) return;
        cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    // Update Navigation Dots
    function updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Update Navigation Buttons
    function updateButtons() {
        if (!prevBtn || !nextBtn) return;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === cards.length - 1;
    }

    // Go to Specific Slide
    function goToSlide(index) {
        currentIndex = index;
        const cardWidth = cards[0].offsetWidth;
        track.style.transition = 'transform 0.5s ease';
        track.style.transform = `translateX(-${cardWidth * currentIndex}px)`;
        updateDots();
        updateButtons();
    }

    // Next Slide
    function nextSlide() {
        if (currentIndex < cards.length - 1) {
            goToSlide(currentIndex + 1);
        }
    }

    // Previous Slide
    function prevSlide() {
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
        }
    }

    // Touch Event Handlers
    function touchStart(event) {
        startX = getPositionX(event);
        isDragging = true;
        track.style.cursor = 'grabbing';
    }

    function touchMove(event) {
        if (!isDragging) return;
        
        const currentX = getPositionX(event);
        const diff = startX - currentX;
        const cardWidth = cards[0].offsetWidth;
        
        if (
            (currentIndex === 0 && diff < 0) || // First slide
            (currentIndex === cards.length - 1 && diff > 0) // Last slide
        ) {
            return;
        }
        
        currentTranslate = previousTranslate - diff;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function touchEnd() {
        isDragging = false;
        track.style.cursor = 'grab';
        
        const movedBy = currentTranslate - previousTranslate;
        
        if (Math.abs(movedBy) > 100) {
            if (movedBy < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            goToSlide(currentIndex);
        }
    }

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    // Initialize Slider
    if (track && cards.length) {
        createDots();
        initSlider();

        // Event Listeners for Slider
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);

        // Touch Events
        track.addEventListener('touchstart', touchStart);
        track.addEventListener('touchmove', touchMove);
        track.addEventListener('touchend', touchEnd);

        // Mouse Events
        track.addEventListener('mousedown', touchStart);
        track.addEventListener('mousemove', touchMove);
        track.addEventListener('mouseup', touchEnd);
        track.addEventListener('mouseleave', touchEnd);

        // Auto-play (optional)
        setInterval(nextSlide, 5000);

        // Handle Window Resize
        window.addEventListener('resize', initSlider);
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form Validation
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;
            const formInputs = contactForm.querySelectorAll('input, textarea');

            formInputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('error');
                    isValid = false;
                } else {
                    input.classList.remove('error');
                }
            });

            if (isValid) {
                alert('Form submitted successfully!');
                contactForm.reset();
            } else {
                alert('Please fill out all fields.');
            }
        });
    }

    // Scroll-to-Top Button
    const scrollTopButton = document.createElement('button');
    scrollTopButton.className = 'scroll-to-top';
    scrollTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopButton.classList.add('visible');
        } else {
            scrollTopButton.classList.remove('visible');
        }
    });

    scrollTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

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
