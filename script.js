// Particles Animation with performance optimization
class ParticleSystem {
    constructor(canvas) {
        try {
            this.canvas = canvas;
            this.ctx = canvas?.getContext('2d');
            this.particles = [];
            this.particleCount = this.getParticleCount();
            this.animationId = null;
            this.isVisible = true;
            this.frameCount = 0;
            this.lastFrame = 0;
            
            // Early exit conditions
            if (!this.canvas || !this.ctx) {
                console.warn('ParticleSystem: Canvas context not available');
                return;
            }
            
            // Performance optimization: Check for reduced motion preference
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                console.info('ParticleSystem: Animations disabled due to reduced motion preference');
                return;
            }
            
            // Check if device supports hardware acceleration
            if (!this.checkWebGLSupport()) {
                console.warn('ParticleSystem: Hardware acceleration not available, using reduced particles');
                this.particleCount = Math.min(this.particleCount, 15);
            }
            
            this.resize();
            this.init();
            this.animate();
            
            // Error-safe event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('ParticleSystem initialization failed:', error);
        }
    }
    
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    setupEventListeners() {
        // Throttled resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                try {
                    this.resize();
                } catch (error) {
                    console.error('Resize error:', error);
                }
            }, 150);
        });
        
        // Pause animation when tab is not visible
        document.addEventListener('visibilitychange', () => {
            try {
                this.isVisible = !document.hidden;
                if (this.isVisible && !this.animationId) {
                    this.animate();
                }
            } catch (error) {
                console.error('Visibility change error:', error);
            }
        });
    }
    
    getParticleCount() {
        // Aggressive reduction for better performance
        const isLowPerformanceDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isLowPerformanceDevice || window.innerWidth < 768) return 15;
        if (window.innerWidth < 1200) return 25;
        
        // Check for hardware acceleration
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        return gl ? 40 : 30;
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    animate() {
        try {
            if (!this.isVisible || !this.ctx || !this.canvas) {
                this.animationId = null;
                return;
            }
            
            // Use efficient clear method
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = 'rgba(247, 250, 252, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const now = Date.now();
            const frameTime = now - (this.lastFrame || now);
            this.lastFrame = now;
            
            // Batch similar operations
            this.ctx.globalCompositeOperation = 'lighter';
            
            this.particles.forEach((particle, index) => {
                if (!particle) return;
                
                // Update position with frame-rate independence
                const deltaTime = Math.min(frameTime * 0.016, 1); // Cap delta time to prevent jumps
                particle.x += (particle.vx || 0) * deltaTime;
                particle.y += (particle.vy || 0) * deltaTime;
                
                // Simplified pulse effect
                particle.opacity = 0.3 + 0.2 * Math.sin(now * (particle.pulseSpeed || 0.01));
                
                // Wrap around edges
                if (particle.x < -particle.radius) particle.x = this.canvas.width + particle.radius;
                else if (particle.x > this.canvas.width + particle.radius) particle.x = -particle.radius;
                if (particle.y < -particle.radius) particle.y = this.canvas.height + particle.radius;
                else if (particle.y > this.canvas.height + particle.radius) particle.y = -particle.radius;
                
                // Simple circle drawing (no gradient for better performance)
                try {
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.radius || 1, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(70, 130, 234, ${particle.opacity || 0.5})`;
                    this.ctx.fill();
                } catch (drawError) {
                    // Skip this particle if drawing fails
                    console.warn('Particle drawing failed:', drawError);
                }
            });
            
            // Draw connections less frequently
            if (this.frameCount % 2 === 0) {
                this.drawConnections();
            }
            this.frameCount = (this.frameCount || 0) + 1;
            
            this.animationId = requestAnimationFrame(() => this.animate());
            
        } catch (error) {
            console.error('Animation error:', error);
            this.animationId = null;
        }
    }
    
    drawConnections() {
        const maxDistance = 80;
        const maxDistanceSquared = maxDistance * maxDistance;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const otherParticle = this.particles[j];
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distanceSquared = dx * dx + dy * dy;
                
                if (distanceSquared < maxDistanceSquared) {
                    const distance = Math.sqrt(distanceSquared);
                    const opacity = (1 - distance / maxDistance) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = `rgba(70, 130, 234, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    let particleSystem = null;
    
    // Initialize particles with error handling
    try {
        const particlesCanvas = document.getElementById('particles-canvas');
        if (particlesCanvas && particlesCanvas.getContext) {
            particleSystem = new ParticleSystem(particlesCanvas);
        }
    } catch (error) {
        console.warn('Particles animation failed to initialize:', error);
    }
    
    // Mobile navigation
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isActive = navToggle.classList.contains('active');
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', !isActive);
        });
        
        // Close menu when clicking on links
        navMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', false);
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', false);
            }
        });
    }
    
    // Image error handling
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.opacity = '0';
            this.setAttribute('aria-hidden', 'true');
            console.warn('Failed to load image:', this.src);
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu toggle (if needed in the future)
    const createMobileMenu = () => {
        const navbar = document.querySelector('.navbar .container');
        const navMenu = document.querySelector('.nav-menu');
        
        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '☰';
        hamburger.style.display = 'none';
        hamburger.style.background = 'none';
        hamburger.style.border = 'none';
        hamburger.style.fontSize = '1.5rem';
        hamburger.style.color = 'var(--primary-color)';
        hamburger.style.cursor = 'pointer';
        
        navbar.appendChild(hamburger);
        
        // Toggle mobile menu
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('mobile-active');
        });
        
        // Handle responsive behavior
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                hamburger.style.display = 'block';
                navMenu.style.display = navMenu.classList.contains('mobile-active') ? 'flex' : 'none';
            } else {
                hamburger.style.display = 'none';
                navMenu.style.display = 'flex';
                navMenu.classList.remove('mobile-active');
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    };

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });

    // Advanced scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered animation delay
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.research-item, .publication-item, .award-item, .experience-item, .education-item'
    );
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Observe section titles
    const sectionTitles = document.querySelectorAll('section h2');
    sectionTitles.forEach(title => {
        observer.observe(title);
    });

    // Parallax effect for research section
    const researchSection = document.querySelector('.research');
    if (researchSection) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            const researchBg = researchSection.querySelector('::before');
            if (researchBg) {
                researchSection.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // Add hover effects to publication items
    const publicationItems = document.querySelectorAll('.publication-item');
    publicationItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });

    // Enhanced typing effect with cursor animation
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.position = 'relative';
        
        // Create cursor element
        const cursor = document.createElement('span');
        cursor.textContent = '|';
        cursor.style.display = 'inline-block';
        cursor.style.animation = 'blink 1s infinite';
        cursor.style.color = 'var(--primary-color)';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 150);
            } else {
                // Remove cursor animation after typing
                setTimeout(() => {
                    cursor.style.animation = 'none';
                    cursor.style.opacity = '0';
                }, 1000);
            }
        };
        
        heroTitle.appendChild(cursor);
        
        // Add cursor blink animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Start typing effect after hero animations
        setTimeout(typeWriter, 1500);
    }

    // Mouse follow effect for AI elements
    const aiElements = document.querySelectorAll('.profile-placeholder, .btn-primary');
    
    aiElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            element.style.setProperty('--mouse-x', x + 'px');
            element.style.setProperty('--mouse-y', y + 'px');
        });
    });

    // Cleanup function for performance
    const cleanup = () => {
        if (particleSystem) {
            particleSystem.destroy();
        }
    };
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Performance monitoring
    if (window.performance && window.performance.measure) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.info('Page load time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
                }
            }, 0);
        });
    }
});