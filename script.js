/* ===== 1. The changing word in the headline ===== */
const words = ["see", "feel", "connect", "interact", "explore"];
// (There can be two copies of the headline: the normal one and the white one, see part 4)
const swapWords = document.getElementsByClassName("swap-word");
let wordIndex = 0;

setInterval(() => {
  wordIndex = (wordIndex + 1) % words.length;
  for (const swapWord of swapWords) swapWord.classList.add("is-leaving");

  // After the fade-out: change the word and fade it back in
  setTimeout(() => {
    for (const swapWord of swapWords) {
      swapWord.textContent = words[wordIndex];
      swapWord.classList.remove("is-leaving");
      swapWord.classList.add("is-entering");
      swapWord.offsetWidth; // let the browser register the start position
      swapWord.classList.remove("is-entering");
    }
  }, 350);
}, 2400);

/* ===== 2. The talking cursor ===== */
// The cursor starts with "Coming soon". On the top and bottom bars it "talks":
// each item there has its own phrase in data-cursor (index.html).
// The phrase stays until the mouse touches the next item.
// Moving the mouse fast makes it say "Psst…"; when the mouse stops, it goes back to "Coming soon".
const cursor = document.querySelector(".cursor");
const cursorText = document.querySelector(".cursor-text");

function showCursorText(text) {
  if (cursorText.textContent === text) return;
  cursorText.classList.add("is-changing");
  setTimeout(() => {
    cursorText.textContent = text;
    cursorText.classList.remove("is-changing");
  }, 250);
}

let isFast = false; // true while the cursor says "Psst…" because of a fast move

document.querySelectorAll("[data-cursor]").forEach((item) => {
  item.addEventListener("pointerenter", () => {
    isFast = false;
    showCursorText(item.dataset.cursor);
  });
});

/* ===== 3. The email link ===== */
// Opens the visitor's mail app, and also copies the address,
// for visitors who don't have a mail app set up.
const emailLink = document.querySelector(".email-link");
emailLink.addEventListener("click", () => {
  const address = emailLink.href.replace("mailto:", "");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(address).then(() => showCursorText("Copied ✓"));
  }
});

/* ===== 4. The image trail ===== */
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
const header = document.querySelector(".site-header");
const footer = document.querySelector(".site-footer");

// Images only show between the top bar and the bottom bar,
// so they never cover the links there. Near the bars, only the cursor is shown.
// Returns 1 inside that area, and fades to 0 toward the bars.
function zoneFade(y) {
  const imageWidth = Math.min(160, Math.max(90, window.innerWidth * 0.11));
  const halfHeight = (imageWidth * 3) / 4 / 2;
  const top = header.getBoundingClientRect().bottom + 24 + halfHeight;
  const bottom = footer.getBoundingClientRect().top - 24 - halfHeight;
  const fadeLength = 60;
  return Math.max(0, Math.min(1, (y - top) / fadeLength, (bottom - y) / fadeLength));
}

const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (hasMouse) {
  // A white copy of all the text, on top of everything.
  // Each frame it is cut to the shape of the images, so text turns white only over them.
  const lightText = document.createElement("div");
  lightText.className = "text-light";
  lightText.setAttribute("aria-hidden", "true");
  lightText.append(header.cloneNode(true), document.querySelector("main").cloneNode(true), footer.cloneNode(true));
  lightText.querySelectorAll("[aria-live]").forEach((el) => el.removeAttribute("aria-live"));
  document.body.appendChild(lightText);

  // A fixed chain of images. Image 0 is the head (biggest, closest to the cursor),
  // each next one follows the one before it and is a little smaller.
  const COUNT = 9;
  const slots = [];
  for (let i = COUNT - 1; i >= 0; i--) {   // add the tail first, so the head is on top
    const slot = document.createElement("figure");
    slot.className = "trail-slot";
    slot.innerHTML = `<img src="" alt="">${i === 0 ? "<figcaption></figcaption>" : ""}`;
    trail.appendChild(slot);
    slots[i] = { el: slot, img: slot.querySelector("img"), caption: slot.querySelector("figcaption"), x: 0, y: 0 };
  }

  // Gives the chain images, starting from a different work each time
  let firstWork = 0;
  function fillImages() {
    slots.forEach((slot, i) => {
      const work = works[(firstWork + i) % works.length];
      slot.img.src = work.src;
      if (slot.caption) slot.caption.textContent = work.caption;
    });
    firstWork = (firstWork + 1) % works.length;
  }
  fillImages();

  const mouse = { x: 0, y: 0 };
  const label = { x: 0, y: 0 };
  let started = false;
  let speed = 0;      // how fast the mouse moves (smoothed)
  let activity = 0;   // 0 = trail hidden, 1 = full trail
  let lastMove = 0;

  window.addEventListener("pointermove", (event) => {
    if (!started) {
      // First move: put everything at the mouse
      mouse.x = label.x = event.clientX;
      mouse.y = label.y = event.clientY;
      slots.forEach((slot) => { slot.x = mouse.x; slot.y = mouse.y; });
      started = true;
    }
    const step = Math.hypot(event.clientX - mouse.x, event.clientY - mouse.y);
    const time = Math.max(event.timeStamp - lastMove, 1);
    speed = speed * 0.8 + (step / time) * 0.2;
    lastMove = event.timeStamp;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    cursor.style.opacity = 1;
  });

  document.addEventListener("pointerleave", () => { cursor.style.opacity = 0; });

  // Runs every frame: moves the cursor and the chain smoothly
  function animate() {
    if (started) {
      // The cursor text glides softly after the mouse
      label.x += (mouse.x - label.x) * 0.25;
      label.y += (mouse.y - label.y) * 0.25;
      cursor.style.translate = `${label.x + 14}px ${label.y + 10}px`;

      // The head follows the mouse slowly (so it stays behind the cursor),
      // and every image follows the one before it: one flowing line
      slots.forEach((slot, i) => {
        const target = i === 0 ? mouse : slots[i - 1];
        const ease = i === 0 ? 0.12 : 0.3;
        slot.x += (target.x - slot.x) * ease;
        slot.y += (target.y - slot.y) * ease;
      });

      // Fast mouse: "Psst…". Stopped after that: back to "Coming soon".
      if (!isFast && speed > 1.6) {
        isFast = true;
        showCursorText("Psst…");
      } else if (isFast && speed < 0.05) {
        isFast = false;
        showCursorText("Coming soon");
      }

      // Moving: the trail grows (faster = longer). Still: it fades out slowly.
      const wanted = Math.min(1, speed * 0.9);
      if (wanted > activity) activity += (wanted - activity) * 0.15;
      else activity *= 0.985;
      speed *= 0.92;

      // When the trail is gone, the next one starts with other works
      if (activity < 0.01 && activity > 0) { activity = 0; fillImages(); }

      const shown = activity * COUNT; // how many images are visible
      const imageWidth = slots[0].img.offsetWidth;
      let lightShape = "M0 0Z";        // the outline of the images, for the white text
      slots.forEach((slot, i) => {
        const scale = 1 - (i / (COUNT - 1)) * 0.6;                 // 1 at the head → 0.4 at the tail
        const visible = Math.max(0, Math.min(1, shown - i));      // the tail disappears first
        const opacity = visible * zoneFade(slot.y);
        slot.el.style.opacity = opacity;
        slot.el.style.translate = `calc(${slot.x}px - 50%) calc(${slot.y}px - 50%)`;
        slot.el.style.scale = scale;

        // Images that are clearly visible turn the text above them white
        if (opacity > 0.5) {
          // The image sits at the top of its figure, which is scaled around its center
          const w = imageWidth * scale, h = w * 0.75;
          const left = slot.x - w / 2, top = slot.y - (slot.el.offsetHeight / 2) * scale;
          lightShape += ` M${left} ${top}h${w}v${h}h${-w}Z`;
        }
      });
      lightText.style.clipPath = `path("${lightShape}")`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
} else {
  // No mouse (phones, tablets): one image at a time, in a calm rhythm
  let workIndex = 0;
  setInterval(() => {
    const work = works[workIndex];
    workIndex = (workIndex + 1) % works.length;
    const item = document.createElement("figure");
    item.className = "trail-item is-slow";
    item.innerHTML = `<img src="${work.src}" alt=""><figcaption>${work.caption}</figcaption>`;
    const x = window.innerWidth * (0.35 + Math.random() * 0.4);
    const y = window.innerHeight * (0.2 + Math.random() * 0.25);
    item.style.translate = `calc(${x}px - 50%) calc(${y}px - 50%)`;
    item.addEventListener("animationend", () => item.remove());
    trail.appendChild(item);
  }, 1600);
}
