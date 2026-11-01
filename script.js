/* ===== 1. The changing word in the headline ===== */
const words = ["see", "feel", "connect", "interact", "explore"];
const swapWord = document.querySelector(".swap-word");
let wordIndex = 0;

setInterval(() => {
  wordIndex = (wordIndex + 1) % words.length;
  swapWord.classList.add("is-leaving");

  // After the fade-out: change the word and fade it back in
  setTimeout(() => {
    swapWord.textContent = words[wordIndex];
    swapWord.classList.remove("is-leaving");
    swapWord.classList.add("is-entering");
    swapWord.offsetWidth; // let the browser register the start position
    swapWord.classList.remove("is-entering");
  }, 350);
}, 2400);

/* ===== 2. The talking cursor ===== */
// The cursor "talks" to the visitor. Edit this list to change what it says.
const cursorPhrases = ["Glad you’re here", "I can’t wait", "Psst… almost there"];
const cursor = document.querySelector(".cursor");
const cursorText = document.querySelector(".cursor-text");
let phraseIndex = 0;
let hoverPhrase = null; // a special phrase while the mouse is on a link

function showCursorText(text) {
  if (cursorText.textContent === text) return;
  cursorText.classList.add("is-changing");
  setTimeout(() => {
    cursorText.textContent = text;
    cursorText.classList.remove("is-changing");
  }, 250);
}

setInterval(() => {
  if (hoverPhrase) return; // don't change while on a link
  phraseIndex = (phraseIndex + 1) % cursorPhrases.length;
  showCursorText(cursorPhrases[phraseIndex]);
}, 2200);

// Links have their own phrase (data-cursor in index.html)
document.querySelectorAll("[data-cursor]").forEach((link) => {
  link.addEventListener("pointerenter", () => {
    hoverPhrase = link.dataset.cursor;
    showCursorText(hoverPhrase);
  });
  link.addEventListener("pointerleave", () => {
    hoverPhrase = null;
    showCursorText(cursorPhrases[phraseIndex]);
  });
});

/* ===== 3. The image trail ===== */
const works = [
  { src: "images/work/bond.jpg",      caption: "Bond — UX/UI, 2025" },
  { src: "images/work/maskit.jpg",    caption: "Maskit — Branding, 2025" },
  { src: "images/work/onset.jpg",     caption: "Onset — Product" },
  { src: "images/work/bloom.jpg",     caption: "Bloom — Branding" },
  { src: "images/work/bond-app.jpg",  caption: "Bond — UX/UI, 2025" },
  { src: "images/work/bloom-jar.jpg", caption: "Bloom — Branding" },
];

// Load all images in advance so they appear without delay
works.forEach((work) => { new Image().src = work.src; });

const trail = document.querySelector(".trail");
const MAX_IMAGES = 16;
let workIndex = 0;

// Adds one image, centered on (x, y), and removes it when its animation ends
function addImage(x, y, slow = false) {
  const work = works[workIndex];
  workIndex = (workIndex + 1) % works.length;

  const item = document.createElement("figure");
  item.className = "trail-item" + (slow ? " is-slow" : "");
  item.innerHTML = `<img src="${work.src}" alt=""><figcaption>${work.caption}</figcaption>`;
  item.style.translate = `calc(${x}px - 50%) calc(${y}px - 50%)`;
  item.addEventListener("animationend", () => item.remove());
  trail.appendChild(item);

  // Too many on screen: remove the oldest
  if (trail.children.length > MAX_IMAGES) trail.firstElementChild.remove();
}

// Images only appear between the top bar and the bottom bar,
// so they never cover the links there. Near the bars, only the cursor is shown.
const header = document.querySelector(".site-header");
const footer = document.querySelector(".site-footer");

function isInImageZone(y) {
  // Half the height of a trail image (same size as --trail-width in styles.css, 4:3)
  const imageWidth = Math.min(160, Math.max(90, window.innerWidth * 0.11));
  const halfHeight = (imageWidth * 3) / 4 / 2;
  const top = header.getBoundingClientRect().bottom + 24 + halfHeight;
  const bottom = footer.getBoundingClientRect().top - 24 - halfHeight;
  return y > top && y < bottom;
}

const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (hasMouse) {
  // Three points:
  // mouse  – where the real mouse is
  // label  – the cursor text, gliding softly after the mouse
  // head   – the start of the trail, gliding slower, so the images stay behind the cursor
  const mouse = { x: 0, y: 0 };
  const label = { x: 0, y: 0 };
  const head = { x: 0, y: 0 };
  let started = false;
  let speed = 0;      // how fast the mouse moves (pixels per millisecond, smoothed)
  let distance = 0;   // how far the trail head moved since the last image
  let lastMove = 0;

  window.addEventListener("pointermove", (event) => {
    if (!started) {
      // First move: put everything at the mouse
      Object.assign(mouse, { x: event.clientX, y: event.clientY });
      Object.assign(label, mouse);
      Object.assign(head, mouse);
      started = true;
      cursor.style.opacity = 1;
    }
    const step = Math.hypot(event.clientX - mouse.x, event.clientY - mouse.y);
    const time = Math.max(event.timeStamp - lastMove, 1);
    speed = speed * 0.7 + (step / time) * 0.3;
    lastMove = event.timeStamp;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    cursor.style.opacity = 1;
  });

  document.addEventListener("pointerleave", () => { cursor.style.opacity = 0; });

  // Runs every frame: moves the cursor and the trail smoothly
  function animate() {
    if (started) {
      // Soft follow: each frame, move part of the way toward the target
      label.x += (mouse.x - label.x) * 0.25;
      label.y += (mouse.y - label.y) * 0.25;
      cursor.style.translate = `${label.x + 14}px ${label.y + 10}px`;

      const dx = (mouse.x - head.x) * 0.12;
      const dy = (mouse.y - head.y) * 0.12;
      head.x += dx;
      head.y += dy;
      distance += Math.hypot(dx, dy);

      // Faster mouse = a new image after a shorter distance = a longer trail
      const gap = Math.min(110, Math.max(28, 110 - speed * 40));
      const behind = Math.hypot(mouse.x - head.x, mouse.y - head.y);
      if (distance > gap && behind > 60 && isInImageZone(head.y)) {
        addImage(head.x, head.y);
        distance = 0;
      }
      speed *= 0.95; // speed calms down when the mouse stops
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
} else {
  // No mouse (phones, tablets): one image at a time, in a calm rhythm
  setInterval(() => {
    const x = window.innerWidth * (0.35 + Math.random() * 0.4);
    const y = window.innerHeight * (0.2 + Math.random() * 0.25);
    addImage(x, y, true);
  }, 1600);
}
