// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.testimonial-carousel');
    const cards = carousel.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.prev-testimonial');
    const nextBtn = document.querySelector('.next-testimonial');
    const indicators = document.querySelector('.testimonial-indicators');

    let currentIndex = 0;

    // Create indicators
    cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('indicator');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        indicators.appendChild(dot);
    });

    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateIndicators();
    }

    function updateIndicators() {
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto-play
    setInterval(nextSlide, 5000);
});
document.addEventListener("DOMContentLoaded", () => {
    // Enhanced Carousel Functionality
    class Carousel {
        constructor(element) {
            this.element = element;
            this.testimonials = Array.from(this.element.querySelectorAll('.testimonial'));
            this.currentIndex = 0;
            this.init();
        }

        init() {
            this.showTestimonial(this.currentIndex);
            setInterval(() => this.nextTestimonial(), 5000); // Auto-scroll every 5 seconds
        }

        showTestimonial(index) {
            this.testimonials.forEach((testimonial, idx) => {
                testimonial.style.display = idx === index ? "block" : "none";
            });
        }

        nextTestimonial() {
            this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
            this.showTestimonial(this.currentIndex);
        }
    }

    // Initialize Carousel
    const testimonialCarousel = document.querySelector('.testimonial-carousel');
    if (testimonialCarousel) {
        new Carousel(testimonialCarousel);
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
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
                // Placeholder for form submission logic
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

// CSS Styles for Interactive Features
const style = document.createElement('style');
style.innerHTML = `
    .error {
        border: 2px solid #e74c3c;
        animation: shake 0.3s ease;
    }

    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        50% {
            transform: translateX(5px);
        }
        75% {
            transform: translateX(-5px);
        }
    }

    .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: #1abc9c;
        color: #fff;
        border: none;
        padding: 10px 15px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.3s;
        opacity: 0;
        visibility: hidden;
    }

    .scroll-to-top.visible {
        opacity: 1;
        visibility: visible;
    }

    .scroll-to-top:hover {
        background-color: #16a085;
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);
