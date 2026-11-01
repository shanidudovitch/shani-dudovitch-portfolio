/* ===== 1. The changing word in the headline ===== */
const words = ["see", "think about", "experience", "interact with"];
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

/* ===== 2. The image trail ===== */
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
const MAX_IMAGES = 14;
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

const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const cursor = document.querySelector(".cursor");

if (hasMouse) {
  let lastX = null, lastY = null, lastTime = 0, distance = 0;

  window.addEventListener("pointermove", (event) => {
    const { clientX: x, clientY: y } = event;

    // The "Coming soon" cursor follows the mouse
    cursor.style.translate = `${x + 12}px ${y + 8}px`;
    cursor.style.opacity = 1;

    if (lastX === null) { lastX = x; lastY = y; lastTime = event.timeStamp; return; }

    const step = Math.hypot(x - lastX, y - lastY);
    const speed = step / Math.max(event.timeStamp - lastTime, 1); // pixels per millisecond
    distance += step;
    lastX = x; lastY = y; lastTime = event.timeStamp;

    // Faster mouse = a new image after a shorter distance = a longer trail
    const gap = Math.min(150, Math.max(35, 150 - speed * 45));
    if (distance > gap) {
      addImage(x, y);
      distance = 0;
    }
  });

  document.addEventListener("pointerleave", () => { cursor.style.opacity = 0; });
} else {
  // No mouse (phones, tablets): one image at a time, in a calm rhythm
  setInterval(() => {
    const x = window.innerWidth * (0.35 + Math.random() * 0.4);
    const y = window.innerHeight * (0.2 + Math.random() * 0.25);
    addImage(x, y, true);
  }, 1600);
}
