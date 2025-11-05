// Enhanced Particles Animation with interactive features
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
            this.mouse = { x: 0, y: 0, radius: 150 };
            this.interactionEnabled = true;

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
                this.interactionEnabled = false;
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

        // Mouse interaction for particles
        if (this.interactionEnabled) {
            window.addEventListener('mousemove', (e) => {
                try {
                    const rect = this.canvas.getBoundingClientRect();
                    this.mouse.x = e.clientX - rect.left;
                    this.mouse.y = e.clientY - rect.top;
                } catch (error) {
                    console.error('Mouse move error:', error);
                }
            });

            window.addEventListener('mouseleave', () => {
                this.mouse.x = -1000;
                this.mouse.y = -1000;
            });
        }
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
                baseVx: (Math.random() - 0.5) * 0.5,
                baseVy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                hue: Math.random() * 60 + 190
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

                // Mouse interaction
                if (this.interactionEnabled) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.mouse.radius) {
                        const force = (this.mouse.radius - distance) / this.mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        particle.vx -= Math.cos(angle) * force * 0.2;
                        particle.vy -= Math.sin(angle) * force * 0.2;
                    } else {
                        // Return to base velocity
                        particle.vx += (particle.baseVx - particle.vx) * 0.05;
                        particle.vy += (particle.baseVy - particle.vy) * 0.05;
                    }
                }

                // Update position with frame-rate independence
                const deltaTime = Math.min(frameTime * 0.016, 1);
                particle.x += (particle.vx || 0) * deltaTime;
                particle.y += (particle.vy || 0) * deltaTime;

                // Enhanced pulse effect with color
                const pulseValue = Math.sin(now * (particle.pulseSpeed || 0.01));
                particle.opacity = 0.3 + 0.3 * pulseValue;
                const colorVariation = 20 * pulseValue;

                // Wrap around edges
                if (particle.x < -particle.radius) particle.x = this.canvas.width + particle.radius;
                else if (particle.x > this.canvas.width + particle.radius) particle.x = -particle.radius;
                if (particle.y < -particle.radius) particle.y = this.canvas.height + particle.radius;
                else if (particle.y > this.canvas.height + particle.radius) particle.y = -particle.radius;

                // Enhanced circle drawing with gradient
                try {
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.radius || 1, 0, Math.PI * 2);

                    const gradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.radius * 2
                    );
                    gradient.addColorStop(0, `hsla(${particle.hue + colorVariation}, 70%, 60%, ${particle.opacity})`);
                    gradient.addColorStop(1, `hsla(${particle.hue + colorVariation}, 70%, 60%, 0)`);

                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                } catch (drawError) {
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

// ========================================
//  ADVANCED VISUAL EFFECTS INITIALIZATION
// ========================================

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

    // ========================================
    // Custom Cursor Implementation
    // ========================================
    const initCustomCursor = () => {
        if (window.innerWidth <= 768) return; // Disable on mobile

        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        const cursorFollower = document.createElement('div');
        cursorFollower.className = 'custom-cursor-follower';

        document.body.appendChild(cursor);
        document.body.appendChild(cursorFollower);

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Smooth follower animation
        const animateFollower = () => {
            const dx = mouseX - followerX;
            const dy = mouseY - followerY;

            followerX += dx * 0.1;
            followerY += dy * 0.1;

            cursorFollower.style.left = followerX + 'px';
            cursorFollower.style.top = followerY + 'px';

            requestAnimationFrame(animateFollower);
        };
        animateFollower();

        // Hover effect on interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .btn-primary, .btn-secondary, .award-item, .publication-item, .research-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    };

    // ========================================
    // Scroll Progress Bar
    // ========================================
    const initScrollProgress = () => {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });
    };

    // ========================================
    // Loading Screen
    // ========================================
    const initLoadingScreen = () => {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loadingScreen);

        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }, 1000);
        });
    };

    // ========================================
    // 3D Card Tilt Effect
    // ========================================
    const init3DCards = () => {
        const cards = document.querySelectorAll('.research-item, .publication-item, .award-item, .education-item');

        cards.forEach(card => {
            card.classList.add('card-3d');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                card.style.setProperty('--rotate-x', rotateX + 'deg');
                card.style.setProperty('--rotate-y', rotateY + 'deg');
                card.style.setProperty('--mouse-x', (x / rect.width) * 100 + '%');
                card.style.setProperty('--mouse-y', (y / rect.height) * 100 + '%');
            });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--rotate-x', '0deg');
                card.style.setProperty('--rotate-y', '0deg');
            });
        });
    };

    // ========================================
    // Floating Background Elements
    // ========================================
    const initFloatingElements = () => {
        const sections = document.querySelectorAll('section');
        sections.forEach((section, index) => {
            if (index % 2 === 0) {
                const circle = document.createElement('div');
                circle.className = 'floating-shape floating-circle';
                circle.style.top = Math.random() * 80 + 10 + '%';
                circle.style.left = Math.random() * 80 + 10 + '%';
                section.style.position = 'relative';
                section.style.overflow = 'hidden';
                section.appendChild(circle);
            } else {
                const square = document.createElement('div');
                square.className = 'floating-shape floating-square';
                square.style.top = Math.random() * 80 + 10 + '%';
                square.style.right = Math.random() * 80 + 10 + '%';
                section.style.position = 'relative';
                section.style.overflow = 'hidden';
                section.appendChild(square);
            }
        });
    };

    // ========================================
    // Particle Trail on Mouse Move
    // ========================================
    const initParticleTrail = () => {
        if (window.innerWidth <= 768) return;

        let lastTrailTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTrailTime < 50) return;
            lastTrailTime = now;

            if (Math.random() > 0.7) {
                const particle = document.createElement('div');
                particle.className = 'particle-trail';
                particle.style.left = e.clientX + 'px';
                particle.style.top = e.clientY + 'px';
                document.body.appendChild(particle);

                setTimeout(() => particle.remove(), 1000);
            }
        });
    };

    // ========================================
    // Ripple Effect on Click
    // ========================================
    const initRippleEffect = () => {
        const clickableElements = document.querySelectorAll('.btn-primary, .btn-secondary, .award-link, .project-link, .paper-link');

        clickableElements.forEach(el => {
            el.style.position = 'relative';
            el.style.overflow = 'hidden';

            el.addEventListener('click', function(e) {
                const ripple = document.createElement('div');
                ripple.className = 'ripple';

                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    };

    // ========================================
    // Magnetic Button Effect
    // ========================================
    const initMagneticButtons = () => {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

        buttons.forEach(btn => {
            btn.classList.add('magnetic-btn');

            btn.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const magneticStrength = 0.3;
                this.style.setProperty('--magnetic-x', (x * magneticStrength) + 'px');
                this.style.setProperty('--magnetic-y', (y * magneticStrength) + 'px');
            });

            btn.addEventListener('mouseleave', function() {
                this.style.setProperty('--magnetic-x', '0px');
                this.style.setProperty('--magnetic-y', '0px');
            });
        });
    };

    // ========================================
    // Spotlight Effect
    // ========================================
    const initSpotlightEffect = () => {
        const cards = document.querySelectorAll('.publication-item, .award-item');

        cards.forEach(card => {
            card.classList.add('spotlight-effect');

            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                this.style.setProperty('--spotlight-x', x + '%');
                this.style.setProperty('--spotlight-y', y + '%');
            });
        });
    };

    // ========================================
    // Animated Mesh Gradient Background
    // ========================================
    const initMeshGradients = () => {
        const hero = document.querySelector('.hero');
        const research = document.querySelector('.research');

        if (hero) {
            const meshBg = document.createElement('div');
            meshBg.className = 'mesh-gradient-bg';
            hero.style.position = 'relative';
            hero.insertBefore(meshBg, hero.firstChild);
        }

        if (research) {
            const meshBg = document.createElement('div');
            meshBg.className = 'mesh-gradient-bg';
            research.style.position = 'relative';
            research.insertBefore(meshBg, research.firstChild);
        }
    };

    // ========================================
    // Enhanced Title Effects
    // ========================================
    const enhanceTitles = () => {
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle) {
            heroTitle.classList.add('glow-text');
        }

        const sectionTitles = document.querySelectorAll('section h2');
        sectionTitles.forEach((title, index) => {
            if (index % 2 === 0) {
                title.classList.add('animated-gradient-text');
            }
        });
    };

    // ========================================
    // Star Field Background Effect
    // ========================================
    const initStarField = () => {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const starField = document.createElement('div');
        starField.className = 'star-field';
        starField.style.position = 'absolute';
        starField.style.top = '0';
        starField.style.left = '0';
        starField.style.width = '100%';
        starField.style.height = '100%';
        starField.style.overflow = 'hidden';
        starField.style.zIndex = '0';
        starField.style.pointerEvents = 'none';

        // Create stars
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.position = 'absolute';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.borderRadius = '50%';
            star.style.background = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animation = `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`;
            star.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px rgba(255, 255, 255, 0.8)`;
            starField.appendChild(star);
        }

        hero.insertBefore(starField, hero.firstChild);

        // Add twinkle animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes twinkle {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // Aurora Borealis Effect
    // ========================================
    const initAuroraEffect = () => {
        const sections = document.querySelectorAll('.research, .publications');
        sections.forEach(section => {
            const aurora = document.createElement('div');
            aurora.style.position = 'absolute';
            aurora.style.top = '0';
            aurora.style.left = '0';
            aurora.style.width = '100%';
            aurora.style.height = '100%';
            aurora.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(255, 0, 128, 0.1) 100%)';
            aurora.style.backgroundSize = '200% 200%';
            aurora.style.animation = 'auroraFlow 15s ease-in-out infinite';
            aurora.style.pointerEvents = 'none';
            aurora.style.zIndex = '0';

            section.style.position = 'relative';
            section.insertBefore(aurora, section.firstChild);
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes auroraFlow {
                0%, 100% {
                    background-position: 0% 50%;
                    opacity: 0.3;
                }
                50% {
                    background-position: 100% 50%;
                    opacity: 0.6;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // Shooting Stars Effect
    // ========================================
    const initShootingStars = () => {
        if (window.innerWidth <= 768) return;

        setInterval(() => {
            if (Math.random() > 0.7) {
                const star = document.createElement('div');
                star.style.position = 'fixed';
                star.style.width = '100px';
                star.style.height = '2px';
                star.style.background = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)';
                star.style.left = Math.random() * window.innerWidth + 'px';
                star.style.top = Math.random() * window.innerHeight / 2 + 'px';
                star.style.transform = 'rotate(-45deg)';
                star.style.pointerEvents = 'none';
                star.style.zIndex = '9999';
                star.style.animation = 'shootingStar 1.5s ease-out forwards';
                star.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
                document.body.appendChild(star);

                setTimeout(() => star.remove(), 1500);
            }
        }, 3000);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes shootingStar {
                0% {
                    transform: rotate(-45deg) translateX(0) translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: rotate(-45deg) translateX(300px) translateY(300px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // Neon Pulse Effect for Links
    // ========================================
    const initNeonPulse = () => {
        const links = document.querySelectorAll('.paper-link, .award-link, .project-link');
        links.forEach(link => {
            link.style.position = 'relative';
            link.style.overflow = 'visible';

            link.addEventListener('mouseenter', function() {
                this.style.animation = 'neonPulse 1s ease-in-out infinite';
            });

            link.addEventListener('mouseleave', function() {
                this.style.animation = 'none';
            });
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes neonPulse {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(49, 130, 206, 0.5),
                                0 0 40px rgba(49, 130, 206, 0.3),
                                0 0 60px rgba(49, 130, 206, 0.1);
                }
                50% {
                    box-shadow: 0 0 30px rgba(49, 130, 206, 0.8),
                                0 0 60px rgba(49, 130, 206, 0.6),
                                0 0 90px rgba(49, 130, 206, 0.4);
                }
            }
        `;
        document.head.appendChild(style);
    };

    // ========================================
    // Diamond Particle Effect
    // ========================================
    const initDiamondParticles = () => {
        const hero = document.querySelector('.hero');
        if (!hero || window.innerWidth <= 768) return;

        const diamondContainer = document.createElement('div');
        diamondContainer.className = 'diamond-particles';
        diamondContainer.style.position = 'absolute';
        diamondContainer.style.top = '0';
        diamondContainer.style.left = '0';
        diamondContainer.style.width = '100%';
        diamondContainer.style.height = '100%';
        diamondContainer.style.pointerEvents = 'none';
        diamondContainer.style.zIndex = '1';

        hero.insertBefore(diamondContainer, hero.firstChild);

        setInterval(() => {
            if (Math.random() > 0.8) {
                const particle = document.createElement('div');
                particle.className = 'diamond-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
                particle.style.animationDelay = Math.random() * 2 + 's';
                diamondContainer.appendChild(particle);

                setTimeout(() => particle.remove(), 6000);
            }
        }, 500);
    };

    // ========================================
    // Enhanced Scroll Reveal
    // ========================================
    const initEnhancedScrollReveal = () => {
        const revealElements = document.querySelectorAll(
            '.research-item, .publication-item, .award-item, .education-item, .experience-item'
        );

        revealElements.forEach(el => el.classList.add('reveal-from-bottom'));

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, index * 100);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    };

    // ========================================
    // Navbar Mouse Tracking
    // ========================================
    const initNavbarTracking = () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        navbar.addEventListener('mousemove', (e) => {
            const rect = navbar.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            navbar.style.setProperty('--mouse-x', x + '%');
            navbar.style.setProperty('--mouse-y', y + '%');
        });
    };

    // ========================================
    // Quantum Glow Buttons
    // ========================================
    const initQuantumButtons = () => {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(btn => {
            btn.classList.add('quantum-glow', 'btn-morph');
        });
    };

    // ========================================
    // Cyber Grid Background
    // ========================================
    const initCyberGrid = () => {
        const sections = document.querySelectorAll('.research, .awards, .experience');
        sections.forEach((section, index) => {
            if (index % 2 === 0) {
                section.classList.add('cyber-grid');
            }
        });
    };

    // ========================================
    // Laser Beam Effect
    // ========================================
    const initLaserBeams = () => {
        const titles = document.querySelectorAll('section h2');
        titles.forEach((title, index) => {
            if (index % 2 === 1) {
                title.classList.add('laser-beam');
            }
        });
    };

    // Initialize all effects
    try {
        initLoadingScreen();
        initCustomCursor();
        initScrollProgress();
        initNavbarTracking();
        setTimeout(() => {
            init3DCards();
            initFloatingElements();
            initParticleTrail();
            initRippleEffect();
            initMagneticButtons();
            initSpotlightEffect();
            initMeshGradients();
            enhanceTitles();
            initStarField();
            initAuroraEffect();
            initShootingStars();
            initNeonPulse();
            initDiamondParticles();
            initEnhancedScrollReveal();
            initQuantumButtons();
            initCyberGrid();
            initLaserBeams();
        }, 1000);
    } catch (error) {
        console.warn('Some visual effects failed to initialize:', error);
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

    // Enhanced parallax effect for all sections
    const initParallaxScroll = () => {
        const parallaxSections = document.querySelectorAll('.research, .publications, .awards');

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            parallaxSections.forEach((section, index) => {
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const elementTop = rect.top + scrolled;
                    const elementHeight = rect.height;

                    if (scrolled + window.innerHeight > elementTop && scrolled < elementTop + elementHeight) {
                        const progress = (scrolled + window.innerHeight - elementTop) / (window.innerHeight + elementHeight);
                        const offset = (progress - 0.5) * 100 * (index % 2 === 0 ? 1 : -1);

                        const floatingElements = section.querySelectorAll('.floating-shape');
                        floatingElements.forEach(el => {
                            el.style.transform = `translateY(${offset * 0.5}px)`;
                        });
                    }
                }
            });
        });
    };

    // Initialize parallax
    setTimeout(() => {
        initParallaxScroll();
    }, 1500);

    // Enhanced hover effects for publication items
    const publicationItems = document.querySelectorAll('.publication-item');
    publicationItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px -5px rgba(0, 0, 0, 0.2), 0 0 30px rgba(49, 130, 206, 0.3)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });

    // Text reveal animation on scroll
    const initTextReveal = () => {
        const textElements = document.querySelectorAll('.about-content p, .research-description, .award-description');

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        textElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s ease';
            revealObserver.observe(el);
        });
    };

    // Number counter animation
    const initCounterAnimation = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const text = element.textContent;
                    const numbers = text.match(/\d+/g);

                    if (numbers) {
                        numbers.forEach(num => {
                            const finalValue = parseInt(num);
                            let currentValue = 0;
                            const increment = finalValue / 50;

                            const counter = setInterval(() => {
                                currentValue += increment;
                                if (currentValue >= finalValue) {
                                    currentValue = finalValue;
                                    clearInterval(counter);
                                }
                                element.textContent = text.replace(num, Math.floor(currentValue));
                            }, 30);
                        });

                        observer.unobserve(element);
                    }
                }
            });
        }, { threshold: 0.5 });

        const stats = document.querySelectorAll('.research-achievements li, .achievements li');
        stats.forEach(stat => observer.observe(stat));
    };

    // Smooth reveal for images
    const initImageReveal = () => {
        const images = document.querySelectorAll('.period-logo, .award-photo, .project-photo, .research-image');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        }, { threshold: 0.1 });

        images.forEach(img => {
            img.style.opacity = '0';
            img.style.transform = 'scale(0.8) rotate(-5deg)';
            img.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            imageObserver.observe(img);
        });
    };

    // Initialize additional effects
    setTimeout(() => {
        initTextReveal();
        initCounterAnimation();
        initImageReveal();
    }, 1000);

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