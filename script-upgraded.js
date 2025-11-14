// Editorial Portfolio - Interactive JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeNavigation();
    initializeScrollAnimations();
    initializeProjectShowcase();
    initializeTypeWriter();
    initializeMagneticButtons();
    initializeParallax();
    initializeCustomCursor();
});

// Custom Cursor with Editorial Feel
function initializeCustomCursor() {
    const cursor = document.createElement('div');
    const cursorDot = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursor);
    document.body.appendChild(cursorDot);

    const style = document.createElement('style');
    style.textContent = `
        .custom-cursor {
            width: 40px;
            height: 40px;
            border: 2px solid var(--gold);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transition: all 0.1s ease-out;
            mix-blend-mode: difference;
            opacity: 0;
        }

        .cursor-dot {
            width: 8px;
            height: 8px;
            background: var(--gold);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            opacity: 0;
        }

        body.cursor-active .custom-cursor,
        body.cursor-active .cursor-dot {
            opacity: 1;
        }

        .cursor-hover {
            transform: scale(1.5);
            border-color: var(--ink-black);
        }
    `;
    document.head.appendChild(style);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.body.classList.add('cursor-active');
    });

    function animateCursor() {
        // Smooth following for outer cursor
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        cursor.style.left = cursorX - 20 + 'px';
        cursor.style.top = cursorY - 20 + 'px';

        // Immediate following for dot
        dotX += (mouseX - dotX) * 0.9;
        dotY += (mouseY - dotY) * 0.9;
        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, .btn-primary, .btn-secondary, .publication-item, .award-item');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
}

// Enhanced Particle System
function initializeParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;
    const connectionDistance = 150;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(201, 169, 97, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(201, 169, 97, ${0.1 * (1 - distance / connectionDistance)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Smooth Navigation
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded',
                navToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
        });
    }

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = navbar.offsetHeight + 20;
                    const targetPosition = target.offsetTop - offset;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 254, 248, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        } else {
            navbar.style.background = 'linear-gradient(to bottom, var(--ivory) 0%, rgba(255,254,248,0.95) 100%)';
            navbar.style.boxShadow = 'none';
        }

        // Hide/show on scroll
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });
}

// Scroll-triggered Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 100);
            }
        });
    }, observerOptions);

    // Add scroll-reveal class to elements
    const elementsToReveal = [
        '.about-content',
        '.research-item',
        '.publication-item',
        '.award-item',
        '.experience-item',
        '.contact-content'
    ];

    elementsToReveal.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        });
    });

    // Number counter animation
    const stats = document.querySelectorAll('[data-count]');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;

                const counter = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(counter);
                    }
                    entry.target.textContent = Math.floor(current);
                }, 16);

                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);

    stats.forEach(stat => statsObserver.observe(stat));
}

// Interactive Project Showcase
function initializeProjectShowcase() {
    const publicationItems = document.querySelectorAll('.publication-item');

    publicationItems.forEach((item, index) => {
        // Add stagger animation
        item.style.animationDelay = `${index * 0.1}s`;

        // Add hover interaction
        item.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
                width: 500px;
                height: 500px;
                left: ${x}px;
                top: ${y}px;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0.3;
                transition: transform 0.8s ease-out, opacity 0.8s ease-out;
                pointer-events: none;
                border-radius: 50%;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(1)';
                ripple.style.opacity = '0';
            }, 10);

            setTimeout(() => {
                ripple.remove();
            }, 800);
        });
    });
}

// Typewriter Effect for Hero
function initializeTypeWriter() {
    const subtitles = [
        'AI Researcher at KAIST',
        'Machine Learning Engineer',
        'Computer Science Student',
        'Innovation Through Research'
    ];

    const subtitleElement = document.querySelector('.hero-subtitle');
    if (!subtitleElement) return;

    let subtitleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentSubtitle = subtitles[subtitleIndex];

        if (isDeleting) {
            subtitleElement.textContent = currentSubtitle.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            subtitleElement.textContent = currentSubtitle.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentSubtitle.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            subtitleIndex = (subtitleIndex + 1) % subtitles.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    // Start after a delay
    setTimeout(type, 1500);
}

// Magnetic Button Effect
function initializeMagneticButtons() {
    const magneticElements = document.querySelectorAll('.btn-primary, .btn-secondary');

    magneticElements.forEach(elem => {
        elem.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            this.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        elem.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0, 0)';
        });
    });
}

// Parallax Scrolling Effects
function initializeParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            const yPos = -(scrolled * speed);

            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Performance optimization
let ticking = false;
function requestTick(callback) {
    if (!ticking) {
        requestAnimationFrame(callback);
        ticking = true;
    }
}

function performanceOptimizedScroll() {
    window.addEventListener('scroll', () => {
        requestTick(() => {
            // Scroll-based operations here
            ticking = false;
        });
    });
}

// Initialize performance optimizations
performanceOptimizedScroll();