/* Tiny carousel + image wiring for a static site */
(function(){
  // Allow quick troubleshooting from the URL:
  //  - add ?nojs=1 to view the static HTML without JS logic
  //  - add ?debug=1 to show a small on-screen banner when JS is running
  if(/(?:\?|&)nojs=1(?:&|$)/.test(location.search)) return;
  if(/(?:\?|&)debug=1(?:&|$)/.test(location.search)){
    window.addEventListener('DOMContentLoaded', ()=>{
      const b = document.createElement('div');
      b.textContent = 'JS running';
      b.style.cssText = 'position:fixed;top:8px;left:8px;padding:6px 10px;background:#fffb00;color:#111;border-radius:8px;font:600 12px/1.2 system-ui;z-index:99999;box-shadow:0 2px 6px rgba(0,0,0,.2)';
      document.body.appendChild(b);
    });
  }
  // Take all declared images but exclude any logo-like assets to avoid using them as gallery slides
  const images = (window.__PUBLIC_IMAGES__ || [])
    .filter(Boolean)
    .filter(u => !/logo/i.test(u));

  // Turn filename into readable alt text
  const altFrom = (url)=>{
    try{
      const name = url.split('/').pop().replace(/\.[^.]+$/, '');
      return name.replace(/[-_]+/g,' ').replace(/\b(wa)\b/i,'').trim() || 'Gallery image';
    }catch{ return 'Gallery image'; }
  };

  // Lazy-load <img> elements with IntersectionObserver
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries)=>{
    entries.forEach(({isIntersecting,target})=>{
      if(isIntersecting){
        const img = target;
        const src = img.getAttribute('data-src');
        if(src){ img.src = src; img.removeAttribute('data-src'); }
        io.unobserve(img);
      }
    });
  },{rootMargin:'200px'}) : null;

  function slideImg(url, onError){
    const img = document.createElement('img');
    img.alt = altFrom(url);
    img.decoding = 'async';
    img.loading = 'lazy';
    img.sizes = '(max-width: 600px) 100vw, 1100px';
    // If a referenced image is missing, don't swap to logo; mark slide via callback
    const onErr = ()=>{ try{ img.onerror = null; }catch{}; if(typeof onError==='function'){ onError(img); } };
    try{ img.addEventListener('error', onErr, {once:false}); }
    catch{ img.addEventListener('error', onErr, false); }
    if(io){ img.setAttribute('data-src', url); io.observe(img); }
    else { img.src = url; }
    return img;
  }

  // Global per-page selection so we avoid reusing the same photos across sections
  const usedGlobal = new Set();
  function selectImages(count){
    const c = Math.max(1, count|0);
    const available = images.filter(u=>!usedGlobal.has(u));
    const selection = [];
    let pool = available.length ? available : images.slice();
    let idx = 0;
    while(selection.length < c && pool.length){
      const url = pool[idx % pool.length];
      selection.push(url);
      usedGlobal.add(url);
      idx++;
      if(idx >= pool.length && selection.length < c){
        // exhausted uniques; allow reuse if needed by resetting pool to all images not yet in selection
        pool = images.filter(u=>!selection.includes(u));
        idx = 0;
        if(!pool.length) pool = images.slice();
      }
    }
    return selection;
  }

  function buildSlides(targetId, urls){
    const el = document.getElementById(targetId);
    if(!el) return [];
    const list = urls && urls.length ? urls : [];
    if(!list.length){
      const slide = document.createElement('div');
      slide.className = 'slide';
      el.appendChild(slide);
      return [];
    }
    list.forEach(url=>{
      const slide = document.createElement('div');
      slide.className = 'slide';
      const img = slideImg(url, ()=>{
        // Missing image: show simple placeholder instead of logo
        slide.classList.add('placeholder');
      });
      slide.appendChild(img);
      el.appendChild(slide);
    });
    return list;
  }

  function makeDots(dotsId, n){
    const dots = document.getElementById(dotsId);
    if(!dots) return [];
    const arr = [];
    for(let i=0;i<n;i++){
      const d = document.createElement('button');
      d.className = 'dot' + (i===0?' active':'');
      d.type = 'button';
      d.setAttribute('aria-label',`Go to slide ${i+1}`);
      dots.appendChild(d);
      arr.push(d);
    }
    return arr;
  }

  function attachCarousel(root){
    const slides = root.querySelector('.slides');
    const dots = root.querySelector('.dots');
    const dotEls = dots ? Array.from(dots.children) : [];
    let i = 0, t;

    function go(n){
      if(!slides.children.length) return;
      i = (n + slides.children.length) % slides.children.length;
      slides.style.transform = `translateX(-${i*100}%)`;
      dotEls.forEach((d,idx)=>d.classList.toggle('active', idx===i));
    }
    function next(){ go(i+1); }

    let auto = Number(root.dataset.auto || 0);
    // Respect reduced-motion
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      auto = 0;
    }
    function start(){ if(auto>0){ stop(); t=setInterval(next, auto); } }
    function stop(){ if(t) clearInterval(t); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    dotEls.forEach((d,idx)=>d.addEventListener('click', ()=>go(idx)));

    // Swipe support (touch/pointer)
    let startX = 0, startY = 0, dx = 0, dy = 0, isDragging = false;
    const threshold = 40;
    const onStart = (x,y)=>{ startX = x; startY = y; dx = 0; dy = 0; isDragging = true; stop(); };
    const onMove = (x,y)=>{ if(!isDragging) return; dx = x - startX; dy = y - startY; };
    const onEnd = ()=>{
      if(!isDragging) return; isDragging = false; start();
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold){ dx>0 ? go(i-1) : go(i+1); }
    };
    // Touch events
    root.addEventListener('touchstart', e=>{ const t=e.touches[0]; onStart(t.clientX,t.clientY); }, {passive:true});
    root.addEventListener('touchmove', e=>{ const t=e.touches[0]; onMove(t.clientX,t.clientY); }, {passive:true});
    root.addEventListener('touchend', onEnd, {passive:true});
    // Pointer events
    root.addEventListener('pointerdown', e=>onStart(e.clientX,e.clientY), {passive:true});
    root.addEventListener('pointermove', e=>onMove(e.clientX,e.clientY), {passive:true});
    root.addEventListener('pointerup', onEnd, {passive:true});

    start();
  }

  // Build sections by slicing a single pool to avoid ANY repetition.
  // Preferred distribution: hero(3), svc1(1), svc2(1), svc3(1), about(3), contact(remaining).
  const pool = images.slice();
  const take = (n)=> pool.splice(0, Math.max(0, Math.min(n, pool.length)));

  const heroList = take(3);
  const heroUsed = buildSlides('heroSlides', heroList.length ? heroList : take(1));
  makeDots('heroDots', Math.max(heroUsed.length || 1, 1));

  const s1 = buildSlides('svc1Slides', take(1));
  makeDots('svc1Dots', Math.max(s1.length || 1, 1));
  const s2 = buildSlides('svc2Slides', take(1));
  makeDots('svc2Dots', Math.max(s2.length || 1, 1));
  const s3 = buildSlides('svc3Slides', take(1));
  makeDots('svc3Dots', Math.max(s3.length || 1, 1));

  const about = buildSlides('aboutSlides', take(3));
  makeDots('aboutDots', Math.max(about.length || 1, 1));

  const contact = buildSlides('contactSlides', take(pool.length));
  makeDots('contactDots', Math.max(contact.length || 1, 1));

  // Gallery grid (no carousel). Fill with 6 images.
  const galleryGrid = document.getElementById('galleryGrid');
  if(galleryGrid){
    const picks = selectImages(6);
    picks.forEach(u=>{
      const f = document.createElement('figure');
      f.className = 'gallery-item';
      const img = slideImg(u);
      img.style.position = 'static';
      img.style.height = '100%';
      img.style.width = '100%';
      img.style.objectFit = 'cover';
      f.appendChild(img);
      galleryGrid.appendChild(f);
    });
  }

  // Activate all carousels
  document.querySelectorAll('.carousel').forEach(attachCarousel);

  // Boost first hero image priority a bit
  const firstHeroImg = document.querySelector('#heroSlides .slide img');
  if(firstHeroImg){ firstHeroImg.setAttribute('fetchpriority','high'); firstHeroImg.loading = 'eager'; }

  // Smooth scroll for header/nav links (generic)
  document.querySelectorAll('header a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      if(e.defaultPrevented) return; // offcanvas handler may have taken over
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });

  // Active tab highlighting based on scroll position
  const sections = ['#what','#about','#contact'].map(s=>document.querySelector(s)).filter(Boolean);
  const tabMap = new Map();
  document.querySelectorAll('header a[href^="#"]').forEach(a=>tabMap.set(a.getAttribute('href'), a));

  // Guard IntersectionObserver for older/locked-down environments
  if('IntersectionObserver' in window){
    try{
      const spy = new IntersectionObserver((entries)=>{
        let topMost = entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if(topMost){
          const id = '#' + topMost.target.id;
          tabMap.forEach(el=>el.classList.remove('active'));
          if(tabMap.get(id)) tabMap.get(id).classList.add('active');
        }
      },{rootMargin:'-40% 0px -55% 0px', threshold:[0,0.25,0.5,1]});
      sections.forEach(s=>spy.observe(s));
    }catch(e){ /* noop */ }
  }

  // Favorites toggle with persistence
  const favBtn = document.querySelector('.product .fav');
  if(favBtn){
    const KEY='gti:fav:bentonite';
    const setUI=(v)=>{ favBtn.textContent = v ? '❤' : '♡'; };
    setUI(localStorage.getItem(KEY)==='1');
    favBtn.addEventListener('click',()=>{
      const v = localStorage.getItem(KEY)==='1';
      localStorage.setItem(KEY, v?'0':'1');
      setUI(!v);
      showToast(!v? 'Saved to favorites' : 'Removed from favorites');
    });
  }

  // Tiny toast helper
  function showToast(msg){
    const t = document.getElementById('toast');
    if(!t) return; t.textContent = msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1500);
  }

  // See all just gives feedback
  const seeAll = document.getElementById('seeAll');
  if(seeAll){ seeAll.addEventListener('click', ()=> showToast('Showing featured products')); }

  // Sticky header shadow and back-to-top visibility
  const header = document.querySelector('.site-header');
  const toTop = document.getElementById('toTop');
  const onScroll = ()=>{
    const y = window.scrollY || window.pageYOffset;
    if(header){ header.classList.toggle('scrolled', y>10); }
    if(toTop){ toTop.classList.toggle('show', y>500); }
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if(toTop){ toTop.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'})); }

  // footer year
  const y = document.getElementById('year');
  if(y){ y.textContent = new Date().getFullYear(); }

  // Offcanvas toggler (Bootstrap-like)
  const toggler = document.querySelector('.navbar-toggler');
  let offcanvas = document.getElementById('offcanvasNavbar');
  // Reparent offcanvas to <body> to avoid ancestor stacking-context issues intercepting clicks
  if(offcanvas && offcanvas.parentElement !== document.body){ document.body.appendChild(offcanvas); }
  // Defensive: ensure drawer starts closed even if a stale class was left on the element
  if(offcanvas){ offcanvas.classList.remove('show'); }
  let backdrop;
  function openOff(){
    if(!offcanvas) return;
    offcanvas.classList.add('show');
    toggler?.setAttribute('aria-expanded','true');
    if(!backdrop){ backdrop = document.createElement('div'); backdrop.className = 'offcanvas-backdrop'; document.body.appendChild(backdrop); }
    requestAnimationFrame(()=> backdrop.classList.add('show'));
    document.body.style.overflow='hidden';
  }
  function closeOff(){
    if(!offcanvas) return;
    offcanvas.classList.remove('show');
    toggler?.setAttribute('aria-expanded','false');
    backdrop?.classList.remove('show');
    document.body.style.overflow='';
  }
  if(toggler && offcanvas){
    toggler.addEventListener('click', (e)=>{ e.preventDefault(); const isOpen = offcanvas.classList.contains('show'); isOpen ? closeOff() : openOff(); });
    offcanvas.querySelector('[data-bs-dismiss="offcanvas"]')?.addEventListener('click', closeOff);
    // Offcanvas link: close first, then smooth-scroll to target to ensure reliable behavior on mobile
    offcanvas.querySelectorAll('a[href^="#"]').forEach(a=> a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      const target = id ? document.querySelector(id) : null;
      e.preventDefault();
      closeOff();
      // wait for the drawer transition to finish, then scroll
      setTimeout(()=>{ if(target) target.scrollIntoView({behavior:'smooth', block:'start'}); }, 260);
    }));
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeOff(); });
    document.addEventListener('click', (e)=>{ if(backdrop && e.target===backdrop) closeOff(); });
  }

  // Keyboard nav for carousel dots
  document.querySelectorAll('.dots').forEach(dots =>{
    dots.addEventListener('keydown', (e)=>{
      const keys = ['ArrowLeft','ArrowRight','Home','End'];
      if(!keys.includes(e.key)) return;
      const btns = Array.from(dots.querySelectorAll('button'));
      const idx = btns.findIndex(b=>b.classList.contains('active'));
      let next = idx;
      if(e.key==='ArrowLeft') next = Math.max(0, idx-1);
      if(e.key==='ArrowRight') next = Math.min(btns.length-1, idx+1);
      if(e.key==='Home') next = 0;
      if(e.key==='End') next = btns.length-1;
      btns[next]?.click();
      btns[next]?.focus();
      e.preventDefault();
    });
  });

  // Contact form submission handling - Disabled to allow Formspree integration
  // Forms now submit directly to Formspree endpoint
  /*
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      
      // Show loading state
      const submitBtn = contactForm.querySelector('.submit-btn');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending...</span>';
      
      // Simulate form submission (replace with actual API call)
      setTimeout(()=>{
        // Reset form
        contactForm.reset();
        
        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        
        // Show success message
        alert('Thank you for your message! We will get back to you soon.');
        
        // In a real application, you would send the data to a server:
        // fetch('/api/contact', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(data)
        // }).then(response => response.json())
        //   .then(result => {
        //     alert('Message sent successfully!');
        //     contactForm.reset();
        //   })
        //   .catch(error => {
        //     alert('Error sending message. Please try again.');
        //   });
      }, 1500);
    });
  }
  */
})();
