const root = document.documentElement;
const openingScene = document.querySelector("#opening");
const openingGuideItems = [...document.querySelectorAll(".opening-guide li")];
const progressLinks = [...document.querySelectorAll(".progress-rail a")];
const progressLine = document.querySelector(".progress-rail-line i");

function updateScrollState() {
  const openingDistance = Math.max(1, openingScene.offsetHeight - window.innerHeight);
  const openingProgress = Math.min(1, Math.max(0, (window.scrollY - openingScene.offsetTop) / openingDistance));
  const doorProgress = openingProgress * openingProgress * (3 - 2 * openingProgress);
  const pageDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const pageProgress = Math.min(1, Math.max(0, window.scrollY / pageDistance));

  root.style.setProperty("--open-progress", openingProgress.toFixed(3));
  root.style.setProperty("--door-left-angle", `${(-104 * doorProgress).toFixed(2)}deg`);
  root.style.setProperty("--door-right-angle", `${(104 * doorProgress).toFixed(2)}deg`);
  root.style.setProperty("--door-shade", Math.max(0.54, 1 - doorProgress * 0.46).toFixed(3));
  root.style.setProperty("--reveal-blur", `${(12 * (1 - doorProgress)).toFixed(2)}px`);
  root.style.setProperty("--reveal-brightness", (0.58 + doorProgress * 0.42).toFixed(3));
  root.style.setProperty("--light-spread", (0.018 + doorProgress * 0.982).toFixed(3));
  root.style.setProperty("--seam-opacity", Math.max(0, 1 - doorProgress * 2.4).toFixed(3));
  root.style.setProperty("--page-progress", pageProgress.toFixed(3));
  root.classList.toggle("is-opening-complete", openingProgress >= 0.98);
  progressLine.style.height = `${pageProgress * 100}%`;

  let guideIndex = 0;
  openingGuideItems.forEach((item, index) => {
    if (openingProgress >= Number(item.dataset.guide)) guideIndex = index;
  });
  openingGuideItems.forEach((item, index) => item.classList.toggle("is-active", index === guideIndex));
}

let scrollUpdateScheduled = false;

function scheduleScrollStateUpdate() {
  if (scrollUpdateScheduled) return;
  scrollUpdateScheduled = true;
  window.requestAnimationFrame(() => {
    updateScrollState();
    scrollUpdateScheduled = false;
  });
}

window.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });
window.addEventListener("resize", scheduleScrollStateUpdate, { passive: true });
updateScrollState();

const openingParticles = document.querySelector(".opening-particles");
if (openingParticles) {
  const fragment = document.createDocumentFragment();
  const randomBetween = (minimum, maximum) => Math.random() * (maximum - minimum) + minimum;

  for (let index = 0; index < 24; index += 1) {
    const isPetal = index >= 18;
    const particle = document.createElement("span");
    particle.className = `opening-particle ${isPetal ? "opening-particle-petal" : "opening-particle-dust"}`;
    particle.style.setProperty("--particle-x", `${randomBetween(2, 98).toFixed(2)}%`);
    particle.style.setProperty("--particle-size", `${randomBetween(isPetal ? 5 : 1, isPetal ? 11 : 3.4).toFixed(2)}px`);
    particle.style.setProperty("--particle-duration", `${randomBetween(isPetal ? 9 : 8, isPetal ? 17 : 18).toFixed(2)}s`);
    particle.style.setProperty("--particle-delay", `${randomBetween(-18, 0).toFixed(2)}s`);
    particle.style.setProperty("--particle-drift", `${randomBetween(-140, 140).toFixed(1)}px`);
    particle.style.setProperty("--particle-opacity", randomBetween(0.12, isPetal ? 0.38 : 0.34).toFixed(2));
    particle.style.setProperty("--particle-spin", `${randomBetween(240, 780).toFixed(1)}deg`);
    fragment.appendChild(particle);
  }

  openingParticles.appendChild(fragment);
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.14 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const trackedSections = ["opening", "invitation", "details", "schedule", "locations", "gallery", "gift"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function updateActiveLink() {
  const marker = window.innerHeight * 0.38;
  let activeId = "opening";
  trackedSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) activeId = section.id;
  });

  progressLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
}

progressLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
  });
});

window.addEventListener("scroll", updateActiveLink, { passive: true });
window.addEventListener("resize", updateActiveLink);
updateActiveLink();

const countdownTarget = new Date("2026-10-18T00:00:00+07:00").getTime();
function updateCountdown() {
  const distance = Math.max(0, countdownTarget - Date.now());
  const values = {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor(distance / 3_600_000) % 24,
    minutes: Math.floor(distance / 60_000) % 60,
    seconds: Math.floor(distance / 1_000) % 60,
  };
  Object.entries(values).forEach(([key, value]) => {
    const element = document.querySelector(`[data-countdown="${key}"]`);
    if (element) element.textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const attendanceForm = document.querySelector("#attendance-form");
if (attendanceForm) {
  const attendanceRadios = [...attendanceForm.elements.attendance];
  const guestCount = attendanceForm.elements.guests;
  const guestField = attendanceForm.querySelector(".attendance-guests");
  const attendanceStatus = document.querySelector("#attendance-status");

  function updateGuestCountVisibility() {
    const attending = attendanceForm.elements.attendance.value === "attending";
    guestField.classList.toggle("is-hidden", !attending);
    guestCount.required = attending;
    guestCount.disabled = !attending;
  }

  attendanceRadios.forEach((radio) => radio.addEventListener("change", updateGuestCountVisibility));
  updateGuestCountVisibility();

  attendanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!attendanceForm.reportValidity()) return;

    const response = {
      name: attendanceForm.elements.name.value.trim(),
      attendance: attendanceForm.elements.attendance.value,
      guests: guestCount.disabled ? null : guestCount.value,
    };

    try {
      localStorage.setItem("wedding-attendance-confirmation", JSON.stringify(response));
    } catch {
      // Form vẫn có phản hồi khi trình duyệt chặn bộ nhớ cục bộ.
    }

    attendanceStatus.textContent = response.attendance === "attending"
      ? `Cảm ơn ${response.name}, chúng mình rất mong được đón bạn!`
      : `Cảm ơn ${response.name} đã phản hồi. Hẹn gặp bạn vào một dịp gần nhất nhé.`;
    attendanceForm.querySelector(".attendance-submit").blur();
  });
}

const giftDialog = document.querySelector("#gift-dialog");
const giftTrigger = document.querySelector(".gift-trigger");
const giftEnvelopes = [...giftTrigger.querySelectorAll(".gift-envelope")];
const giftCards = [...giftDialog.querySelectorAll(".gift-card")];
let giftRevealAnimations = [];
let giftRevealRun = 0;

giftTrigger.addEventListener("click", () => {
  const envelopeRects = giftEnvelopes.map((envelope) => envelope.getBoundingClientRect());
  giftDialog.showModal();
  giftTrigger.setAttribute("aria-expanded", "true");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !giftCards[0]?.animate) return;

  const run = ++giftRevealRun;
  giftDialog.classList.add("is-revealing");
  giftRevealAnimations = giftCards.map((card, index) => {
    const envelope = envelopeRects[index];
    const target = card.getBoundingClientRect();
    const dx = envelope.left + envelope.width / 2 - (target.left + target.width / 2);
    const dy = envelope.top + envelope.height * 0.6 - (target.top + target.height / 2);
    const scale = Math.min(0.62, envelope.width / target.width);

    return card.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${index === 0 ? -10 : 10}deg)`, opacity: 0 },
      { opacity: 1, offset: 0.32 },
      { transform: "translate(0, 0) scale(1) rotate(0)", opacity: 1 }
    ], {
      duration: 1100,
      delay: index * 150,
      easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
      fill: "backwards"
    });
  });

  Promise.allSettled(giftRevealAnimations.map((animation) => animation.finished)).then(() => {
    if (run === giftRevealRun) giftDialog.classList.remove("is-revealing");
  });
});
giftDialog.querySelector(".dialog-close").addEventListener("click", () => giftDialog.close());
giftDialog.addEventListener("close", () => {
  giftRevealRun++;
  giftRevealAnimations.forEach((animation) => animation.cancel());
  giftRevealAnimations = [];
  giftDialog.classList.remove("is-revealing");
  giftTrigger.setAttribute("aria-expanded", "false");
});

const originalPhotoExtensions = {
  LINH1451: "png", LINH1614: "png", LINH1753: "png", LINH1785: "jpg",
  LINH1824: "jpg", LINH1834: "png", LINH1840: "jpg", LINH1862: "jpg",
  LINH1892: "png", LINH1911: "png", LINH1914: "jpg", LINH1938: "jpg",
  LINH1946: "png", LINH1992: "jpg", LINH2010: "png", LINH2032: "png",
  LINH2054: "png", LINH2089: "png", LINH2130: "png", LINH2187: "png",
  LINH2231: "JPG"
};
const featuredPhotos = new Set(["LINH1451", "LINH1753", "LINH1824", "LINH1946", "LINH2231"]);
const storyPhotoGroups = [
  ["#invitation", ["LINH1785", "LINH1911"]],
  [".countdown-section", ["LINH1614", "LINH1834"]],
  ["#details", ["LINH2187", "LINH1892", "LINH1914"]],
  ["#schedule", ["LINH2010", "LINH2032", "LINH2054"]],
  ["#attendance", ["LINH2089", "LINH2130", "LINH1840"]],
  ["#locations", ["LINH1862", "LINH1938", "LINH1992"]]
];
const storyImageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    image.src = image.dataset.src;
    delete image.dataset.src;
    observer.unobserve(image);
  });
}, { rootMargin: "400px 0px" });

storyPhotoGroups.forEach(([sectionSelector, photos], groupIndex) => {
  const section = document.querySelector(sectionSelector);
  if (!section) return;
  const figure = document.createElement("figure");
  figure.className = `story-gallery story-gallery--${photos.length}${groupIndex % 2 ? " story-gallery--reverse" : ""}`;
  figure.setAttribute("aria-label", "Khoảnh khắc của Thu Hương và Văn Lâm");
  photos.forEach((name, imageIndex) => {
    const image = document.createElement("img");
    image.dataset.src = `assets/photos/album/${name}.${originalPhotoExtensions[name]}`;
    image.alt = `Khoảnh khắc cưới của Thu Hương và Văn Lâm ${imageIndex + 1}`;
    image.loading = "lazy";
    image.decoding = "async";
    figure.appendChild(image);
    storyImageObserver.observe(image);
  });
  section.insertAdjacentElement("afterend", figure);
});

document.querySelectorAll(".gallery-card").forEach((card) => {
  const name = card.dataset.lightbox.match(/(LINH\d+)/)?.[1];
  if (!name || !featuredPhotos.has(name)) {
    card.remove();
    return;
  }
  const originalSource = `assets/photos/album/${name}.${originalPhotoExtensions[name]}`;
  card.dataset.thumbnail = `assets/photos/album_thumbs/${name}.webp`;
  card.dataset.lightbox = originalSource;
  card.querySelector("img").dataset.src = originalSource;
});

const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxCaption = document.querySelector(".lightbox-caption");
const lightboxCounter = document.querySelector(".lightbox-counter");
const lightboxPrev = document.querySelector(".lightbox-arrow-prev");
const lightboxNext = document.querySelector(".lightbox-arrow-next");
const galleryCards = [...document.querySelectorAll(".gallery-card")];
let lightboxIndex = 0;
let lightboxTouchStart = null;
const thumbnailStrip = document.querySelector(".lightbox-thumbnails");
const thumbnailButtons = galleryCards.map((card, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lightbox-thumbnail";
  button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
  const image = document.createElement("img");
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.dataset.src = card.dataset.thumbnail || card.dataset.lightbox;
  button.appendChild(image);
  button.addEventListener("click", () => updateLightbox(index));
  thumbnailStrip.appendChild(button);
  return button;
});
const thumbnailObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    if (!image.dataset.src) {
      observer.unobserve(image);
      return;
    }
    image.src = image.dataset.src;
    delete image.dataset.src;
    observer.unobserve(image);
  });
}, { root: thumbnailStrip, rootMargin: "0px 200px" });
thumbnailButtons.forEach((button) => thumbnailObserver.observe(button.querySelector("img")));

function refreshThumbnails() {
  thumbnailButtons.forEach((button, index) => {
    button.setAttribute("aria-current", String(index === lightboxIndex));
  });
  const active = thumbnailButtons[lightboxIndex];
  const activeImage = active.querySelector("img");
  if (activeImage?.dataset.src) {
    activeImage.src = activeImage.dataset.src;
    delete activeImage.dataset.src;
  }
  thumbnailStrip.scrollTo({ left: active.offsetLeft - thumbnailStrip.offsetLeft - (thumbnailStrip.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
}

// Năm ảnh nổi bật kết lại câu chuyện ở cuối trang.
const INITIAL_VISIBLE_COUNT = 5;
let isGalleryExpanded = false;
const galleryImageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    if (!image.dataset.src) {
      observer.unobserve(image);
      return;
    }
    image.src = image.closest(".gallery-card")?.dataset.lightbox || image.dataset.src;
    delete image.dataset.src;
    observer.unobserve(image);
  });
}, { rootMargin: "500px 0px" });

function setupMasonryGallery() {
  galleryCards.forEach((card, index) => {
    const image = card.querySelector("img");
    if (index < INITIAL_VISIBLE_COUNT) {
      card.style.display = "";
      if (image) galleryImageObserver.observe(image);
    } else {
      card.style.display = "none";
    }

    card.addEventListener("click", () => {
      updateLightbox(index);
      lightbox.showModal();
      refreshThumbnails();
    });
  });

  const galleryCarouselContainer = document.querySelector(".gallery-carousel");
  if (galleryCarouselContainer && galleryCards.length > INITIAL_VISIBLE_COUNT) {
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "gallery-actions";
    actionsWrapper.innerHTML = `
      <button class="gallery-toggle-btn" type="button">
        <span class="gallery-toggle-text">Xem thêm album (${galleryCards.length} ảnh)</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    `;
    galleryCarouselContainer.appendChild(actionsWrapper);

    const toggleBtn = actionsWrapper.querySelector(".gallery-toggle-btn");
    const toggleText = actionsWrapper.querySelector(".gallery-toggle-text");

    toggleBtn.addEventListener("click", () => {
      isGalleryExpanded = !isGalleryExpanded;
      if (isGalleryExpanded) {
        galleryCards.forEach((card) => {
          card.style.display = "";
          const img = card.querySelector("img");
          if (img && img.dataset.src) galleryImageObserver.observe(img);
        });
        toggleBtn.classList.add("is-expanded");
        toggleText.textContent = "Thu gọn album";
      } else {
        galleryCards.forEach((card, index) => {
          if (index >= INITIAL_VISIBLE_COUNT) {
            card.style.display = "none";
          }
        });
        toggleBtn.classList.remove("is-expanded");
        toggleText.textContent = `Xem thêm album (${galleryCards.length} ảnh)`;
        document.querySelector("#gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
}

setupMasonryGallery();

function updateLightbox(index) {
  lightboxIndex = (index + galleryCards.length) % galleryCards.length;

  const card = galleryCards[lightboxIndex];
  const image = card.querySelector("img");
  const previousCard = galleryCards[(lightboxIndex - 1 + galleryCards.length) % galleryCards.length];
  const nextCard = galleryCards[(lightboxIndex + 1) % galleryCards.length];

  lightboxImage.src = card.dataset.lightbox;
  lightboxImage.alt = image ? image.alt : "Ảnh cưới";
  lightboxCaption.textContent = card.dataset.caption;
  lightboxCaption.classList.toggle("couple-names", card.dataset.caption === "Thu Hương & Văn Lâm");
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${galleryCards.length}`;
  if (lightbox.open) refreshThumbnails();
  lightboxPrev.setAttribute("aria-label", `Xem ảnh trước: ${previousCard.dataset.caption}`);
  lightboxNext.setAttribute("aria-label", `Xem ảnh tiếp theo: ${nextCard.dataset.caption}`);
}

function moveLightbox(direction) {
  updateLightbox(lightboxIndex + direction);
}

lightboxPrev.addEventListener("click", () => moveLightbox(-1));
lightboxNext.addEventListener("click", () => moveLightbox(1));

lightbox.querySelector(".dialog-close").addEventListener("click", () => lightbox.close());

lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveLightbox(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveLightbox(1);
  }
});

lightboxImage.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  lightboxTouchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

lightboxImage.addEventListener("touchend", (event) => {
  if (!lightboxTouchStart) return;

  const touch = event.changedTouches[0];
  const distanceX = touch.clientX - lightboxTouchStart.x;
  const distanceY = touch.clientY - lightboxTouchStart.y;
  lightboxTouchStart = null;

  if (Math.abs(distanceX) >= 45 && Math.abs(distanceX) > Math.abs(distanceY)) {
    moveLightbox(distanceX > 0 ? -1 : 1);
  }
}, { passive: true });

const audio = document.querySelector("#wedding-audio");
const musicToggle = document.querySelector(".music-toggle");
const musicDiscBtn = document.querySelector(".music-disc-btn");

function setMusicState(isPlaying) {
  if (musicToggle) {
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền");
  }
  if (musicDiscBtn) {
    musicDiscBtn.classList.toggle("is-playing", isPlaying);
    musicDiscBtn.setAttribute("aria-label", isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền");
  }
}

function startMusic() {
  return audio.play().then(() => setMusicState(true));
}

function removeAutoplayFallback() {
  document.removeEventListener("pointerdown", autoplayFallback);
  document.removeEventListener("keydown", autoplayFallback);
}

function autoplayFallback(event) {
  if (event.target.closest?.(".music-toggle") || event.target.closest?.(".music-disc-btn")) return;
  startMusic().then(removeAutoplayFallback).catch(() => undefined);
}

startMusic().then(removeAutoplayFallback).catch(() => {
  document.addEventListener("pointerdown", autoplayFallback);
  document.addEventListener("keydown", autoplayFallback);
});

function toggleAudio() {
  if (audio.paused) {
    startMusic().then(removeAutoplayFallback).catch(() => undefined);
  } else {
    audio.pause();
    setMusicState(false);
  }
}

if (musicToggle) musicToggle.addEventListener("click", toggleAudio);
if (musicDiscBtn) musicDiscBtn.addEventListener("click", toggleAudio);

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

/* Xử lý sao chép STK & Toast */
const toast = document.querySelector("#toast");
let toastTimeout;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 2400);
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const textToCopy = btn.getAttribute("data-copy");
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }
      showToast(`Đã sao chép số tài khoản: ${textToCopy}`);
    } catch (err) {
      showToast(`Không thể sao chép tự động: ${textToCopy}`);
    }
  });
});

/* Hiệu ứng cánh hoa rơi nhẹ (Falling Petals Canvas) */
(function setupPetalsCanvas() {
  const canvas = document.querySelector("#petals-canvas");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petalCount = window.innerWidth < 768 ? 16 : 28;
  const petals = [];

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 7;
      this.speedY = Math.random() * 0.9 + 0.55;
      this.speedX = Math.random() * 0.7 - 0.35;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.02;
      this.flip = Math.random() * Math.PI * 2;
      this.flipSpeed = Math.random() * 0.03 + 0.01;
      this.opacity = Math.random() * 0.45 + 0.35;
      // Gam màu hồng đào ánh son nhẹ nhàng
      const colors = [
        "rgba(242, 166, 178, ",
        "rgba(235, 138, 155, ",
        "rgba(217, 107, 126, ",
        "rgba(247, 194, 203, "
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.angle) * 0.75 + this.speedX;
      this.angle += this.angularSpeed;
      this.flip += this.flipSpeed;

      if (this.y > height + 20 || this.x < -40 || this.x > width + 40) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, Math.cos(this.flip));

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);

      ctx.fillStyle = `${this.colorBase}${this.opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(render);
  }

  render();
})();
