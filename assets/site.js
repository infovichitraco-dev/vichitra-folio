/* Vichitra Co · shared script for the service pages: menu, nav, reveals, WhatsApp helpers, coming-soon toast */
(function(){
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* service pages that exist; links to the others show a "coming soon" note instead of a missing page */
  var BUILT = ['aarambh','katha','drishti','dwaar','yantra','khoj','vriddhi','sangam','setu'];

  /* ── WhatsApp: visitor text is cleaned, shown with textContent only, and URL-encoded into the message ── */
  var WA_URL = 'https://wa.me/918898490531?text=';
  function cleanText(s, max){
    return String(s == null ? '' : s)
      .replace(/[\u0000-\u001F\u007F<>{}\[\]\\`"]/g, '')
      .replace(/\s+/g, ' ').trim().slice(0, max || 40).trim();
  }
  function setCta(el, label, msg, pop){
    if(!el) return;
    var span = $('span', el) || el;
    var href = WA_URL + encodeURIComponent(msg);
    if(span.textContent === label && el.href === href) return;
    span.textContent = label; el.href = href; el.target = '_blank'; el.rel = 'noopener';
    if(pop){ el.classList.remove('cta-pop'); void el.offsetWidth; el.classList.add('cta-pop'); }
  }
  window.VC = {cleanText:cleanText, setCta:setCta, $:$, $$:$$};

  /* ── menu ── */
  var menuBtn = $('#menuBtn'), menuTxt = $('#menuTxt');
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    if(menuTxt) menuTxt.textContent = open ? 'Close' : 'Menu';
    if(menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if(menuBtn) menuBtn.addEventListener('click', function(){ setMenu(!document.body.classList.contains('menu-open')); });
  $$('.overlay a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setMenu(false); });

  /* ── nav background, progress thread, WhatsApp float ── */
  var nav = $('#nav'), thread = $('.thread'), fl = $('#waFloat');
  function onScroll(){
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if(thread) thread.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if(fl){
      var show = y > window.innerHeight * .7;
      /* step aside while an inline WhatsApp button or an interactive demo is on screen: same destination, and it would cover the demo on phones */
      if(show) $$('.wa-cta, .btn.primary, .demo-board').some(function(c){
        var r = c.getBoundingClientRect();
        if(r.width && r.bottom > 0 && r.top < window.innerHeight){ show = false; return true; }
      });
      fl.classList.toggle('on', show);
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ── reveal on scroll ── */
  var rv = $$('.rv');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    rv.forEach(function(el){ io.observe(el); });
  } else rv.forEach(function(el){ el.classList.add('in'); });

  /* ── coming-soon toast for services that aren't built yet ── */
  var toast = $('#soonToast'), hideT = 0;
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if(!a || !toast) return;
    var m = a.getAttribute('href').match(/(?:^|\/)(aarambh|katha|drishti|dwaar|yantra|khoj|vriddhi|sangam|setu)\.html$/);
    if(!m || BUILT.indexOf(m[1]) > -1) return;
    e.preventDefault();
    var name = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    $('span', toast).innerHTML = 'The <b>' + name + '</b> page is coming soon';
    toast.classList.add('on');
    clearTimeout(hideT); hideT = setTimeout(function(){ toast.classList.remove('on'); }, 2600);
  });
})();

/* ───────── nav colour + menu lock (shared logic, 2026-11-20) ───────── */
(function(){
  var nav = document.getElementById('nav'); if(!nav) return;
  var SKIP = '.overlay,.thread,.wa-float,.soon-toast,.type-sheet,.rotate-msg';
  function lum(c){
    var m = (c || '').match(/[\d.]+/g); if(!m || m.length < 3) return -1;
    if(m.length > 3 && +m[3] < .5) return -1;          /* see-through: look at what's behind */
    return (.2126 * m[0] + .7152 * m[1] + .0722 * m[2]) / 255;
  }
  /* what's painted just under the bar decides its colour */
  function dark(){
    if(!document.elementsFromPoint) return false;
    var els = document.elementsFromPoint(window.innerWidth / 2, nav.getBoundingClientRect().bottom + 2);
    for(var i = 0; i < els.length; i++){
      var el = els[i]; if(nav.contains(el) || (el.closest && el.closest(SKIP))) continue;
      while(el && el !== document.documentElement){ var L = lum(getComputedStyle(el).backgroundColor); if(L >= 0) return L < .4; el = el.parentElement; }
    }
    return false;
  }
  var queued = 0;
  function upd(){ queued = 0; nav.classList.toggle('scrolled', window.scrollY > 40); nav.classList.toggle('on-dark', dark()); }
  function ask(){ if(!queued){ queued = 1; requestAnimationFrame(upd); } }
  window.addEventListener('scroll', ask, {passive:true});
  window.addEventListener('resize', ask);
  setInterval(ask, 400);   /* pinned screens change colour while you scroll; this catches the last frame */
  upd();

  /* open menu: the page behind stays put (touch, wheel and keyboard scroll); the menu itself can still scroll */
  var lockY = 0;
  function isOpen(){ return document.body.classList.contains('menu-open'); }
  new MutationObserver(function(){ if(isOpen()) lockY = window.scrollY; }).observe(document.body, {attributes:true, attributeFilter:['class']});
  function block(e){
    if(!isOpen()) return;
    var ov = e.target.closest && e.target.closest('.overlay');
    if(ov && ov.scrollHeight > ov.clientHeight + 1) return;
    if(e.cancelable) e.preventDefault();
  }
  document.addEventListener('touchmove', block, {passive:false});
  document.addEventListener('wheel', block, {passive:false});
  window.addEventListener('scroll', function(){ if(isOpen() && Math.abs(window.scrollY - lockY) > 1) window.scrollTo(0, lockY); }, {passive:true});
})();
