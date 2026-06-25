(function () {
  var overlay = document.getElementById("intro-overlay");
  var video = document.getElementById("intro-video");
  var tapHint = document.getElementById("tap-hint");
  var bgMusic = document.getElementById("bg-music");
  var mainSite = document.getElementById("main-site");
  var heroFloatContainer = document.getElementById("hero-float");
  var hasStarted = false;
  var isFading = false;
  var fadeLead = 1.4;
  var heroFloatActive = false;
  var musicVolume = 0.35;
  var musicFade = 3;
  var musicLoopReady = false;

  var heroFloatSvgs = {
    heart:
      '<svg class="hero-float__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.5 1.5 4 2.5.5-1 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
      "</svg>",
    petal:
      '<svg class="hero-float__svg" viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M10 1.5C4.5 8 2.5 15.5 10 26.5C17.5 15.5 15.5 8 10 1.5Z" fill="currentColor"/>' +
      "</svg>",
    sparkle:
      '<svg class="hero-float__svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="0.7" stroke-linecap="round"/>' +
      "</svg>",
  };

  var heroFloatTypes = ["petal", "petal", "petal", "petal", "heart", "sparkle"];

  document.body.classList.add("intro-active");

  function smoothstep(value) {
    var t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function syncMusicVolume() {
    if (!bgMusic || !isFinite(bgMusic.duration)) return;

    var current = bgMusic.currentTime;
    var total = bgMusic.duration;
    var fade = Math.min(musicFade, total * 0.25);

    if (current < fade) {
      bgMusic.volume = musicVolume * smoothstep(current / fade);
      return;
    }

    if (total - current < fade) {
      bgMusic.volume = musicVolume * smoothstep((total - current) / fade);
      return;
    }

    bgMusic.volume = musicVolume;
  }

  function restartBackgroundMusic() {
    if (!bgMusic) return;
    bgMusic.currentTime = 0;

    var playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {});
    }
  }

  function initBackgroundMusicLoop() {
    if (!bgMusic || musicLoopReady) return;
    musicLoopReady = true;
    bgMusic.addEventListener("timeupdate", syncMusicVolume);
    bgMusic.addEventListener("ended", restartBackgroundMusic);
  }

  function startBackgroundMusic() {
    if (!bgMusic || bgMusic.dataset.started === "1") return;
    bgMusic.dataset.started = "1";
    initBackgroundMusicLoop();
    bgMusic.volume = 0;

    var playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {});
    }
  }

  function spawnHeroFloat() {
    if (!heroFloatContainer) return;

    var type = heroFloatTypes[Math.floor(Math.random() * heroFloatTypes.length)];
    var item = document.createElement("div");
    item.className = "hero-float__item hero-float__item--" + type;
    item.innerHTML = heroFloatSvgs[type];

    var size = type === "sparkle" ? 10 + Math.random() * 8 : 14 + Math.random() * 14;
    var sway = 22 + Math.random() * 38;
    var duration = type === "petal" ? 22 + Math.random() * 10 : 18 + Math.random() * 8;
    var spinStart = -20 + Math.random() * 40;
    var spinEnd = spinStart + (-30 + Math.random() * 60);

    item.style.left = 4 + Math.random() * 92 + "%";
    item.style.width = size + "px";
    item.style.setProperty("--sway", sway + "px");
    item.style.setProperty("--spin-start", spinStart + "deg");
    item.style.setProperty("--spin-end", spinEnd + "deg");
    item.style.setProperty("--float-duration", duration + "s");
    item.style.animationDelay = Math.random() * 2.5 + "s";

    heroFloatContainer.appendChild(item);
    item.addEventListener("animationend", function () {
      item.remove();
    });
  }

  function startHeroFloat() {
    if (heroFloatActive || !heroFloatContainer) return;
    heroFloatActive = true;

    var i;
    for (i = 0; i < 6; i++) {
      setTimeout(spawnHeroFloat, i * 550);
    }

    setInterval(spawnHeroFloat, 3000);
  }

  function initCountdown() {
    var section = document.getElementById("countdown");
    if (!section) return;

    var targetStr = section.getAttribute("data-target");
    var target = targetStr ? new Date(targetStr) : null;
    var daysEl = document.getElementById("countdown-days");
    var hoursEl = document.getElementById("countdown-hours");
    var minutesEl = document.getElementById("countdown-minutes");
    var secondsEl = document.getElementById("countdown-seconds");

    if (!target || isNaN(target.getTime()) || !daysEl || !hoursEl || !minutesEl || !secondsEl) {
      return;
    }

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }

    function updateCountdown() {
      var now = new Date();
      var diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        daysEl.textContent = "0";
        hoursEl.textContent = "00";
        minutesEl.textContent = "00";
        secondsEl.textContent = "00";
        return;
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      daysEl.textContent = String(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);
      secondsEl.textContent = pad(seconds);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  function initScrollToTop() {
    var btn = document.getElementById("scroll-to-top");
    if (!btn) return;

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initMemoriesCarousel() {
    var track = document.getElementById("memories-track");
    var prevBtn = document.getElementById("memories-prev");
    var nextBtn = document.getElementById("memories-next");
    var dotsWrap = document.getElementById("memories-dots");

    if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

    var slides = track.querySelectorAll(".memories__slide");
    var dots = dotsWrap.querySelectorAll(".memories__dot");
    var current = 0;
    var total = slides.length;
    var autoTimer;

    if (!total) return;

    function goTo(index) {
      current = (index + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });

      dots.forEach(function (dot, i) {
        var isActive = i === current;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }

    function next() {
      goTo(current + 1);
    }

    function prev() {
      goTo(current - 1);
    }

    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(next, 5000);
    }

    prevBtn.addEventListener("click", function () {
      prev();
      resetAuto();
    });

    nextBtn.addEventListener("click", function () {
      next();
      resetAuto();
    });

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(index)) {
          goTo(index);
          resetAuto();
        }
      });
    });

    goTo(0);
    resetAuto();
  }

  function initRevealAnimations() {
    var sections = document.querySelectorAll(".save-date, .love-story, .gallery, .the-couple, .engagement-details, .countdown, .blessings, .memories, .quote, .thank-you");

    sections.forEach(function (section) {
      var reveals = section.querySelectorAll(".reveal");
      if (!reveals.length) return;

      function showReveals() {
        section.classList.add("is-inview");
        reveals.forEach(function (el) {
          el.classList.add("is-visible");
        });
      }

      if (!("IntersectionObserver" in window)) {
        showReveals();
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              showReveals();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px 6% 0px" }
      );

      observer.observe(section);

      function checkInView() {
        var rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          showReveals();
          observer.disconnect();
        }
      }

      setTimeout(checkInView, 300);
      window.addEventListener("scroll", checkInView, { passive: true });
    });
  }

  function initScrollArrow() {
    var arrow = document.getElementById("scroll-to-story");
    var target = document.getElementById("love-story");

    if (!arrow || !target) return;

    arrow.addEventListener("click", function () {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initHeroScroll() {
    var btn = document.getElementById("scroll-to-save-date");
    var target = document.getElementById("save-date");

    if (!btn || !target) return;

    btn.addEventListener("click", function () {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initSaveDateButton() {
    var btn = document.getElementById("save-date-btn");
    var popup = document.getElementById("celebration-popup");
    var particlesEl = document.getElementById("celebration-particles");
    var btnText = btn && btn.querySelector(".save-date__btn-text");
    var popupTimer;

    if (!btn || !popup || !particlesEl || !btnText) return;

    function markSaved() {
      btn.classList.add("is-saved");
      btnText.textContent = "Saved the Date";
    }

    function spawnParticles(originX, originY) {
      var heartSvg =
        '<svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M8 14s-4-2.6-5.6-5.2C1 7.2 1.8 4.8 4 4.8c1.2 0 2 0.8 2.4 1.6.4-.8 1.2-1.6 2.4-1.6 2.2 0 3 2.4 1.6 4C12 11.4 8 14 8 14z" fill="currentColor"/>' +
        "</svg>";
      var i;
      var count = 28;

      for (i = 0; i < count; i++) {
        var particle = document.createElement("span");
        var isHeart = i % 3 === 0;
        var size = isHeart ? 10 + Math.random() * 10 : 4 + Math.random() * 5;

        particle.className =
          "celebration-particle " +
          (isHeart ? "celebration-particle--heart" : "celebration-particle--dot");
        particle.style.left = originX + (-40 + Math.random() * 80) + "px";
        particle.style.top = originY + (-20 + Math.random() * 40) + "px";
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.setProperty("--drift-x", -30 + Math.random() * 60 + "px");
        particle.style.setProperty("--drift-y", -80 - Math.random() * 100 + "px");
        particle.style.setProperty("--spin", -30 + Math.random() * 60 + "deg");
        particle.style.setProperty("--duration", 2 + Math.random() * 1.5 + "s");

        if (isHeart) {
          particle.innerHTML = heartSvg;
        }

        particlesEl.appendChild(particle);
        particle.addEventListener("animationend", function () {
          particle.remove();
        });
      }
    }

    function hidePopup() {
      popup.classList.remove("is-visible");
      popup.setAttribute("aria-hidden", "true");
      clearTimeout(popupTimer);
    }

    function showCelebration() {
      var rect = btn.getBoundingClientRect();
      var originX = rect.left + rect.width / 2;
      var originY = rect.top + rect.height / 2;

      markSaved();
      spawnParticles(originX, originY);

      popup.setAttribute("aria-hidden", "false");
      popup.classList.add("is-visible");

      popupTimer = setTimeout(hidePopup, 3200);
    }

    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-saved")) return;
      showCelebration();
    });

    popup.addEventListener("click", hidePopup);
  }

  function showMainSite() {
    if (!mainSite) return;
    mainSite.setAttribute("aria-hidden", "false");
    mainSite.classList.add("is-visible");
    document.body.classList.remove("intro-active");
    document.body.classList.add("intro-done");
    startHeroFloat();
    setTimeout(initRevealAnimations, 200);
    initSaveDateButton();
    initScrollArrow();
    initHeroScroll();
    initCountdown();
    initMemoriesCarousel();
    initScrollToTop();
  }

  if (!overlay || !video) {
    showMainSite();
    return;
  }

  function startIntro() {
    if (hasStarted || isFading) return;
    hasStarted = true;

    overlay.classList.add("is-playing");
    tapHint.classList.add("is-hidden");
    startBackgroundMusic();
    video.muted = false;
    video.currentTime = 0;

    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        video.muted = true;
        video.play();
      });
    }
  }

  function enterWebsite() {
    if (isFading) return;
    isFading = true;

    mainSite.setAttribute("aria-hidden", "false");
    mainSite.classList.add("is-visible");
    overlay.classList.add("is-fading");
    document.body.classList.remove("intro-active");
    document.body.classList.add("intro-done");
    startHeroFloat();
    setTimeout(initRevealAnimations, 200);
    initSaveDateButton();
    initScrollArrow();
    initHeroScroll();
    initCountdown();
    initMemoriesCarousel();
    initScrollToTop();

    setTimeout(function () {
      overlay.classList.add("is-hidden");
      overlay.setAttribute("aria-hidden", "true");
      video.pause();
      video.removeAttribute("src");
      video.load();
    }, 1400);
  }

  function handleTap(e) {
    e.preventDefault();
    startIntro();
  }

  function checkFadeTiming() {
    if (isFading || !hasStarted || !video.duration) return;
    if (video.duration - video.currentTime <= fadeLead) {
      enterWebsite();
    }
  }

  video.addEventListener("loadeddata", function () {
    video.currentTime = 0;
  });

  overlay.addEventListener("click", handleTap);
  overlay.addEventListener("touchend", handleTap, { passive: false });
  video.addEventListener("timeupdate", checkFadeTiming);
  video.addEventListener("ended", enterWebsite);
  video.addEventListener("error", function () {
    enterWebsite();
  });
})();
