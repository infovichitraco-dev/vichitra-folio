/* Vichitra Co · visit measurement (2026-11-20)
   Sends events to the Google Tag Manager dataLayer (container GTM-TBXZS9WX). GTM forwards them to GA4.
   Nothing here collects names, numbers or anything typed into the site: only which button, which service, which section.

   Events
   - contact_click   method: whatsapp | email | call | instagram
                     service: aarambh … setu, or "general"
                     placement: which button (hero, demo, closer, float, footer, menu, or the button's id)
                     section: the part of the page it was in
   - section_view    section_name: the part of the page someone reached (once per visit per section)
                     section_index: its order on the page, so drop-off can be read top to bottom
   - demo_interact   service: the first time someone plays with a service page's demo
   - tab_click       tab_name: Dwaar, Yantra, Khoj, Vriddhi, Sangam or Setu tabs on the homepage
*/
(function(){
  'use strict';
  var dl = window.dataLayer = window.dataLayer || [];
  /* GTM keeps the last value of every key, so each event clears the ones it doesn't use (else a section_view would carry an old "method: whatsapp") */
  var KEYS = ['method','service','placement','section','section_name','section_index','tab_name'];
  function send(name, params){ try { var o = {event:name}; KEYS.forEach(function(k){ o[k] = undefined; }); for(var k in params) o[k] = params[k]; dl.push(o); } catch(e){} }

  var path = location.pathname;
  var pageService = (path.match(/\/services\/([a-z]+)\.html/) || [])[1] || '';
  var isHome = !pageService && (/\/$|\/index\.html$/.test(path));
  var SERVICES = ['aarambh','katha','drishti','dwaar','yantra','khoj','vriddhi','sangam','setu'];

  /* homepage sections, in story order */
  var HOME = [['b1','Namaste'],['b2','Wordmark'],['b3','Sab kuch'],['chCreate','Chapter I · Rachna'],['b4','Aarambh'],['b5','Katha'],['b6','Drishti'],
              ['chBuild','Chapter II · Nirmaan'],['nirmaan','Dwaar · Yantra · Khoj'],['chGrow','Chapter III · Vistaar'],['vistaar','Vriddhi · Sangam · Setu'],
              ['b9','Hamari Katha'],['b10','Chai pe charcha']];
  var HOME_SERVICE = {b4:'aarambh', b5:'katha', b6:'drishti'};

  function a_float(el){ return !!(el.closest && el.closest('.wa-float')); }
  function sectionOf(el){
    var s = el.closest ? el.closest('section, footer, .overlay, nav') : null;
    if(!s) return a_float(el) ? 'Floating button' : 'page';
    if(s.classList.contains('overlay')) return 'Menu';
    if(s.tagName === 'NAV') return 'Top bar';
    if(s.tagName === 'FOOTER') return 'Footer';
    if(s.classList.contains('hero')) return 'Hero';
    if(isHome) for(var i = 0; i < HOME.length; i++) if(HOME[i][0] === s.id) return HOME[i][1];
    var eb = s.querySelector('.eyebrow, .svc-t');
    return (eb ? eb.textContent : (s.id || s.className || 'section')).replace(/\s+/g, ' ').trim().slice(0, 40);
  }
  function serviceOf(a){
    if(pageService) return pageService;
    var href = a.getAttribute('href') || '';
    /* a service named in the WhatsApp message, e.g. "(Aarambh)" or "Found you on the Katha page" */
    var txt = decodeURIComponent((href.split('text=')[1] || '').replace(/\+/g, ' ')).toLowerCase();
    for(var i = 0; i < SERVICES.length; i++) if(txt.indexOf(SERVICES[i]) > -1) return SERVICES[i];
    /* otherwise: the nearest "Explore ‹service›" link around the button */
    var el = a.parentElement;
    while(el && el !== document.body){
      if(el.tagName === 'FOOTER' || el.id === 'b10' || (el.classList && el.classList.contains('overlay'))) break;   /* general enquiry areas */
      var found = {};
      (el.querySelectorAll ? el.querySelectorAll('a[href*="services/"]') : []).forEach(function(l){ var m = l.getAttribute('href').match(/services\/([a-z]+)\.html/); if(m) found[m[1]] = 1; });
      var keys = Object.keys(found);
      if(keys.length === 1) return keys[0];
      if(keys.length > 1) break;            /* several services nearby: don't guess */
      if(el.tagName === 'SECTION'){ if(HOME_SERVICE[el.id]) return HOME_SERVICE[el.id]; break; }
      el = el.parentElement;
    }
    return 'general';
  }
  function placementOf(a){
    var id = a.id || '';
    if(/float/i.test(id) || a.classList.contains('wa-float')) return 'float';
    if(/hero/i.test(id)) return 'hero';
    if(/demo|kit/i.test(id)) return 'demo';
    if(/end/i.test(id) || a.closest('#b10 .wrap, #b10 .b10-inner, section.closer > .wrap, #b10') && !a.closest('footer')) return 'closer';
    if(a.closest('footer')) return 'footer';
    if(a.closest('.overlay')) return 'menu';
    return id || (a.className && String(a.className).split(' ')[0]) || 'link';
  }

  /* ── clicks that matter ── */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if(!a) return;
    var href = a.getAttribute('href') || '', method = '';
    if(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) method = 'whatsapp';
    else if(/^mailto:/.test(href)) method = 'email';
    else if(/^tel:/.test(href)) method = 'call';
    else if(/instagram\.com/.test(href)) method = 'instagram';
    if(!method) return;
    send('contact_click', {method:method, service:serviceOf(a), placement:placementOf(a), section:sectionOf(a)});
  }, true);

  /* ── how far people get ── */
  if('IntersectionObserver' in window){
    var list = [];
    if(isHome) HOME.forEach(function(h, i){ var el = document.getElementById(h[0]); if(el) list.push([el, h[1], i + 1]); });
    else document.querySelectorAll('main > section').forEach(function(el, i){
      var eb = el.querySelector('.eyebrow');
      var name = el.classList.contains('hero') ? 'Hero' : eb ? eb.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : 'Section ' + (i + 1);
      list.push([el, name, i + 1]);
    });
    var seen = {};
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var item = e.target.__track; if(!item || seen[item[1]]) return;
        seen[item[1]] = 1; io.unobserve(e.target);
        send('section_view', {section_name:item[1], section_index:item[2], service:pageService || 'home'});
      });
    }, {threshold:0, rootMargin:'-45% 0px -45% 0px'});   /* counts once the section reaches the middle of the screen */
    list.forEach(function(it){ it[0].__track = it; io.observe(it[0]); });
  }

  /* ── service pages: did they play with the demo? ── */
  var demo = document.getElementById('demo') || document.getElementById('kit');
  if(demo && pageService){
    var played = false;
    var mark = function(){ if(played) return; played = true; send('demo_interact', {service:pageService}); };
    ['pointerdown','touchstart','mousedown','click','keydown','input'].forEach(function(t){ demo.addEventListener(t, mark, {capture:true, passive:true}); });
  }

  /* ── homepage tabs ── */
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('.tab'); if(!t) return;
    var n = (t.childNodes[0] && t.childNodes[0].textContent || t.textContent).trim();
    send('tab_click', {tab_name:n});
  }, true);
})();
