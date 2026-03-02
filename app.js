(() => {
  const docEl = document.documentElement;
  const body = document.body;

  const setupTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    docEl.setAttribute('data-theme', initialTheme);

    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    const updateToggleLabel = (theme) => {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('title', theme === 'dark' ? 'Light mode' : 'Dark mode');
      toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    };

    updateToggleLabel(initialTheme);

    toggle.addEventListener('click', () => {
      const nextTheme = docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      docEl.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
      updateToggleLabel(nextTheme);
      showToast(`Theme changed to ${nextTheme}.`);
    });
  };

  const setupMobileMenu = () => {
    const header = document.querySelector('header');
    const nav = header?.querySelector('nav');
    if (!header || !nav) return;

    if (!nav.id) nav.id = 'navMenu';

    let toggle = header.querySelector('[data-nav-toggle]');
    if (!toggle) {
      toggle = header.querySelector('.mobile-menu-btn, .menu-toggle');
      if (toggle) toggle.setAttribute('data-nav-toggle', '');
    }
    if (!toggle) return;

    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', 'false');
    if (toggle.tagName !== 'BUTTON') {
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');
    }

    const closeMenu = () => {
      nav.classList.remove('is-open');
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      nav.classList.add('is-open');
      header.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    const toggleMenu = () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    };

    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
      }
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  };

  const setupSmoothScrolling = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      });
    });
  };

  const setupActiveAnchorHighlight = () => {
    const anchorLinks = [...document.querySelectorAll('nav a[href^="#"]')];
    if (!anchorLinks.length || !('IntersectionObserver' in window)) return;

    const sections = anchorLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          anchorLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === id);
          });
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const setupRevealAnimations = () => {
    const targets = document.querySelectorAll('.reveal, section, .product-card, .news-card, .stat, .node-card, .variant-card, .cap-item');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    targets.forEach((el) => {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      observer.observe(el);
    });
  };

  const ensureToastContainer = () => {
    let container = document.querySelector('[data-toast-container]');
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('data-toast-container', '');
      container.className = 'toast-container';
      body.appendChild(container);
    }
    return container;
  };

  const showToast = (message, timeout = 2500) => {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 220);
    }, timeout);
  };

  const setupParticleCanvas = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId;
    const pointer = { x: null, y: null };

    const particles = [];
    const PARTICLE_COUNT = reduceMotion ? 28 : 72;
    const LINK_DISTANCE = 140;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 1.8 + 0.8
    });

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i += 1) particles.push(createParticle());
    };

    const draw = () => {
      const styles = getComputedStyle(docEl);
      const dotColor = styles.getPropertyValue('--particle-color').trim() || 'rgba(120, 180, 255, 0.7)';
      const lineColor = styles.getPropertyValue('--particle-line-color').trim() || 'rgba(120, 180, 255, 0.25)';

      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        if (pointer.x !== null && pointer.y !== null) {
          const dx = pointer.x - particle.x;
          const dy = pointer.y - particle.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            particle.x -= dx * 0.0009;
            particle.y -= dy * 0.0009;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = dotColor;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const p2 = particles[j];
          const d = Math.hypot(particle.x - p2.x, particle.y - p2.y);
          if (d < LINK_DISTANCE) {
            const alpha = (1 - d / LINK_DISTANCE) * 0.65;
            ctx.strokeStyle = lineColor.replace(/0\.\d+\)/, `${alpha.toFixed(2)})`);
            if (!lineColor.includes('rgba')) ctx.strokeStyle = `rgba(120, 180, 255, ${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    window.addEventListener('mouseleave', () => {
      pointer.x = null;
      pointer.y = null;
    });

    resize();
    initParticles();

    if (!reduceMotion) {
      draw();
    } else {
      draw();
      cancelAnimationFrame(rafId);
    }
  };

  window.showToast = showToast;

  setupTheme();
  setupMobileMenu();
  setupSmoothScrolling();
  setupActiveAnchorHighlight();
  setupRevealAnimations();
  setupParticleCanvas();
})();
