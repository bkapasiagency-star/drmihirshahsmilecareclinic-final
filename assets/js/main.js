document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Nav scroll state ---------------- */
  const nav = document.getElementById('siteNav');
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    fabTop.classList.toggle('show', window.scrollY > 500);
  };

  /* ---------------- Mobile nav toggle ---------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  let lockedScrollY = 0;

  const lockBodyScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };
  const unlockBodyScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  };

  const setMenuOpen = (open) => {
    navLinks.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    if (open) lockBodyScroll(); else unlockBodyScroll();
  };

  navToggle.addEventListener('click', () => {
    setMenuOpen(!navLinks.classList.contains('open'));
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    setMenuOpen(false);
  }));

  /* ---------------- Active nav link on scroll ---------------- */
  const sections = document.querySelectorAll('section[id], div.hero[id]');
  const navA = document.querySelectorAll('.nav-links a[data-nav]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => navObserver.observe(s));

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-scale');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // arc underlines that live inside section headers should draw when heading in view
  document.querySelectorAll('.section-head').forEach(el => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } });
    }, { threshold: 0.3 });
    obs.observe(el);
  });

  /* ---------------- Counter animation ---------------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCount(entry.target); counterObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  /* ---------------- Trust strip seamless marquee ---------------- */
  const track = document.getElementById('trustTrack');
  if (track) track.innerHTML += track.innerHTML; // duplicate for seamless loop

  /* ---------------- About Clinic Carousel ---------------- */
  const carTrack = document.getElementById('carouselTrack');
  const carDotsWrap = document.getElementById('carouselDots');
  if (carTrack) {
    const slides = carTrack.querySelectorAll('.carousel-slide');
    let carIndex = 0;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goToCar(i));
      carDotsWrap.appendChild(b);
    });
    const dots = carDotsWrap.querySelectorAll('button');
    function goToCar(i) {
      carIndex = (i + slides.length) % slides.length;
      carTrack.style.transform = `translateX(-${carIndex * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('active', di === carIndex));
    }
    document.getElementById('carPrev').addEventListener('click', () => goToCar(carIndex - 1));
    document.getElementById('carNext').addEventListener('click', () => goToCar(carIndex + 1));
    let carTimer = setInterval(() => goToCar(carIndex + 1), 4200);
    const carouselEl = document.getElementById('clinicCarousel');
    carouselEl.addEventListener('mouseenter', () => clearInterval(carTimer));
    carouselEl.addEventListener('mouseleave', () => { carTimer = setInterval(() => goToCar(carIndex + 1), 4200); });

    // basic touch swipe
    let touchStartX = 0;
    carouselEl.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX, { passive: true });
    carouselEl.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (diff > 50) goToCar(carIndex - 1);
      else if (diff < -50) goToCar(carIndex + 1);
    }, { passive: true });
  }

  /* ---------------- Gallery Carousel (swipeable, filterable) ---------------- */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const filterBtns = Array.from(document.querySelectorAll('.gf-btn'));
  function visibleItems() { return galleryItems.filter(item => !item.classList.contains('gi-hidden')); }

  const galCarousel = document.getElementById('galleryCarousel');
  if (galCarousel) {
    const galViewport = document.getElementById('galleryViewport');
    const galDotsWrap = document.getElementById('galleryDots');
    const galPrevBtn = document.getElementById('galPrev');
    const galNextBtn = document.getElementById('galNext');

    let wasDragged = false;
    let activeIdx = 0;
    let io = null;

    function buildDots() {
      galDotsWrap.innerHTML = '';
      visibleItems().forEach((item, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Go to photo ' + (i + 1));
        b.addEventListener('click', () => scrollToItem(item));
        galDotsWrap.appendChild(b);
      });
      updateDots();
    }

    function updateDots() {
      const dots = galDotsWrap.querySelectorAll('button');
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
      galPrevBtn.disabled = activeIdx <= 0;
      galNextBtn.disabled = activeIdx >= visibleItems().length - 1;
    }

    function scrollToItem(item, smooth) {
      if (!item) return;
      galViewport.scrollTo({
        left: item.offsetLeft,
        behavior: smooth === false ? 'auto' : 'smooth'
      });
    }

    function goRel(dir) {
      const items = visibleItems();
      const next = Math.max(0, Math.min(activeIdx + dir, items.length - 1));
      scrollToItem(items[next]);
    }

    function observeItems() {
      if (io) io.disconnect();
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const items = visibleItems();
            const idx = items.indexOf(entry.target);
            if (idx !== -1) { activeIdx = idx; updateDots(); }
          }
        });
      }, { root: galViewport, threshold: [0.6] });
      visibleItems().forEach(item => io.observe(item));
    }

    galPrevBtn.addEventListener('click', () => goRel(-1));
    galNextBtn.addEventListener('click', () => goRel(1));

    /* Autoplay, paused during interaction */
    let galTimer = setInterval(() => {
      const items = visibleItems();
      if (!items.length) return;
      const next = activeIdx >= items.length - 1 ? 0 : activeIdx + 1;
      scrollToItem(items[next]);
    }, 4500);
    function pauseAutoplay() { clearInterval(galTimer); }
    function resumeAutoplay() {
      clearInterval(galTimer);
      galTimer = setInterval(() => {
        const items = visibleItems();
        if (!items.length) return;
        const next = activeIdx >= items.length - 1 ? 0 : activeIdx + 1;
        scrollToItem(items[next]);
      }, 4500);
    }
    galCarousel.addEventListener('mouseenter', pauseAutoplay);
    galCarousel.addEventListener('mouseleave', resumeAutoplay);

    /* Drag-to-scroll — lets desktop mouse users swipe just like touch users */
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;

    galViewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      wasDragged = false;
      dragStartX = e.clientX;
      dragStartScroll = galViewport.scrollLeft;
      galViewport.classList.add('dragging');
      pauseAutoplay();
      try { galViewport.setPointerCapture(e.pointerId); } catch (err) {}
    });

    galViewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 5) wasDragged = true;
      galViewport.scrollLeft = dragStartScroll - delta;
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      galViewport.classList.remove('dragging');
      resumeAutoplay();
      setTimeout(() => { wasDragged = false; }, 0);
    }
    galViewport.addEventListener('pointerup', endDrag);
    galViewport.addEventListener('pointercancel', endDrag);
    galViewport.addEventListener('pointerleave', () => { if (dragging) endDrag(); });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const f = btn.getAttribute('data-filter');
        filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        galleryItems.forEach(item => {
          const match = f === 'all' || item.getAttribute('data-cat') === f;
          item.classList.toggle('gi-hidden', !match);
        });
        activeIdx = 0;
        galViewport.scrollTo({ left: 0, behavior: 'auto' });
        buildDots();
        observeItems();
      });
    });

    buildDots();
    observeItems();

    // expose for the lightbox click-suppression check below
    var galleryWasDragged = () => wasDragged;
  }

  /* ---------------- Gallery Lightbox ---------------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  let lbIndex = 0;
  function openLightbox(item) {
    const items = visibleItems();
    lbIndex = items.indexOf(item);
    lbImg.src = item.getAttribute('data-full');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function stepLightbox(dir) {
    const items = visibleItems();
    if (!items.length) return;
    lbIndex = (lbIndex + dir + items.length) % items.length;
    lbImg.src = items[lbIndex].getAttribute('data-full');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  galleryItems.forEach(item => item.addEventListener('click', () => {
    if (typeof galleryWasDragged === 'function' && galleryWasDragged()) return;
    openLightbox(item);
  }));
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.getElementById('lbPrev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lbNext').addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });

  /* ---------------- Testimonial Slider ---------------- */
  const tTrack = document.getElementById('testiTrack');
  const tDotsWrap = document.getElementById('testiDots');
  if (tTrack) {
    const tSlides = tTrack.querySelectorAll('.testi-slide');
    let tIndex = 0;
    tSlides.forEach((_, i) => {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goToTesti(i));
      tDotsWrap.appendChild(b);
    });
    const tDots = tDotsWrap.querySelectorAll('button');
    function goToTesti(i) {
      tIndex = (i + tSlides.length) % tSlides.length;
      tTrack.style.transform = `translateX(-${tIndex * 100}%)`;
      tDots.forEach((d, di) => d.classList.toggle('active', di === tIndex));
    }
    document.getElementById('tPrev').addEventListener('click', () => goToTesti(tIndex - 1));
    document.getElementById('tNext').addEventListener('click', () => goToTesti(tIndex + 1));
    let tTimer = setInterval(() => goToTesti(tIndex + 1), 5000);
    const testiWrap = document.querySelector('.testi-wrap');
    testiWrap.addEventListener('mouseenter', () => clearInterval(tTimer));
    testiWrap.addEventListener('mouseleave', () => { tTimer = setInterval(() => goToTesti(tIndex + 1), 5000); });
  }

  /* ---------------- FAQ Accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------------- Contact form (Formspree submission) ---------------- */
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const submitLabel = document.getElementById('contactSubmitLabel');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fname').value.trim();
      const phone = document.getElementById('fphone').value.trim();
      const msg = document.getElementById('fmsg').value.trim();
      if (!name || !phone || !msg) return;

      formError.classList.remove('show');
      formSuccess.classList.remove('show');
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then((response) => {
          if (response.ok) {
            formSuccess.classList.add('show');
            form.reset();
          } else {
            formError.classList.add('show');
          }
        })
        .catch(() => {
          formError.classList.add('show');
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitLabel.textContent = 'Send Enquiry';
        });
    });
  }

  /* ---------------- Back to top ---------------- */
  const fabTop = document.getElementById('fabTop');
  fabTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.addEventListener('scroll', onScroll);
  onScroll();
});
