/* ===== 1. The changing word in the headline ===== */

// Wraps each letter in its own <span class="letter">, so letters can move on their own (part 4)
function splitIntoLetters(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const pieces = document.createDocumentFragment();
    for (const char of node.textContent) {
      if (char.trim() === "") { pieces.append(char); continue; }
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.textContent = char;
      pieces.append(letter);
    }
    node.replaceWith(pieces);
  });
}
splitIntoLetters(document.querySelector(".headline"));

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
      splitIntoLetters(swapWord);
      swapWord.classList.remove("is-leaving");
      swapWord.classList.add("is-entering");
      swapWord.offsetWidth; // let the browser register the start position
      swapWord.classList.remove("is-entering");
    }
  }, 350);
}, 2400);

/* ===== 2. The talking cursor ===== */
// The cursor says "Coming soon". While the mouse is on an item in the top or bottom bar,
// it says that item's phrase (data-cursor in index.html), and goes back when the mouse leaves.
// Moving the mouse fast makes it say "Psst…"; when the mouse stops, it goes back to "Coming soon".
const DEFAULT_PHRASE = "Coming soon";
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

let isFast = false;     // true while the cursor says "Psst…" because of a fast move
let isOnItem = false;   // true while the mouse is on a bar item

document.querySelectorAll("[data-cursor]").forEach((item) => {
  item.addEventListener("pointerenter", () => {
    isFast = false;
    isOnItem = true;
    showCursorText(item.dataset.cursor);
  });
  item.addEventListener("pointerleave", () => {
    isOnItem = false;
    showCursorText(DEFAULT_PHRASE);
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
  const imageWidth = Math.min(160, Math.max(100, window.innerWidth * 0.11));
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

  // A chain of images laid out along the path of the mouse.
  // Image 0 is the front: the biggest, right behind the cursor.
  // Each next image sits further back on the path and is a little smaller.
  const COUNT = 14;   // the most images the trail can have

  // Size of image i compared to the front one: 1, 0.86, 0.74, 0.64… (never smaller than 0.22)
  const sizeOf = (i) => Math.max(0.22, Math.pow(0.86, i));
  const slots = [];
  for (let i = COUNT - 1; i >= 0; i--) {   // add the back first, so the front is on top
    const slot = document.createElement("figure");
    slot.className = "trail-slot";
    slot.innerHTML = `<img src="" alt="">${i === 0 ? "<figcaption></figcaption>" : ""}`;
    trail.appendChild(slot);
    slots[i] = { el: slot, img: slot.querySelector("img"), caption: slot.querySelector("figcaption"), x: 0, y: 0 };
  }

  // Which work is in which place. Clicking the page rotates it:
  // the second becomes the first, and the first goes to the back.
  const order = Array.from({ length: COUNT }, (_, i) => i % works.length);
  function fillImages() {
    slots.forEach((slot, i) => {
      const work = works[order[i]];
      slot.img.src = work.src;
      if (slot.caption) slot.caption.textContent = work.caption;
    });
  }
  fillImages();

  // Each click brings a new image to the front of the trail (the others move one step back),
  // keeps the trail on screen and makes it a little longer. When the clicks stop, it fades slowly.
  document.addEventListener("click", (event) => {
    if (event.target.closest("a")) return; // links keep working as usual
    order.unshift((order[0] + 1) % works.length);
    order.length = COUNT;
    fillImages();
    // Each click makes the trail longer: many fast clicks = a long trail
    activity = Math.min(1, Math.max(activity, 0.3) + 0.12);
    // A small "pop" on the new front image
    slots[0].img.classList.remove("is-new");
    slots[0].img.offsetWidth;
    slots[0].img.classList.add("is-new");
  });

  const mouse = { x: 0, y: 0 };
  const label = { x: 0, y: 0 };  // the cursor text, gliding after the mouse
  const pen = { x: 0, y: 0 };    // draws the path, gliding a bit so the curves are round
  const labelOffset = { x: 14, y: 10 }; // where the cursor text sits next to the mouse
  let labelScale = 1;                    // the cursor text grows when the mouse is fast
  let path = [];                 // points the mouse passed, newest first
  let started = false;
  let speed = 0;      // how fast the mouse moves (smoothed)
  let activity = 0;   // 0 = trail hidden, 1 = full trail
  let lastMove = 0;

  window.addEventListener("pointermove", (event) => {
    if (!started) {
      // First move: put everything at the mouse
      mouse.x = label.x = pen.x = event.clientX;
      mouse.y = label.y = pen.y = event.clientY;
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

  // The point on the path that is `distance` pixels back from the newest point
  function pointOnPath(distance) {
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance <= length) {
        const t = distance / length;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      distance -= length;
    }
    return path[path.length - 1];
  }

  // Runs every frame: moves the cursor and the chain smoothly
  function animate() {
    if (started) {
      label.x += (mouse.x - label.x) * 0.25;
      label.y += (mouse.y - label.y) * 0.25;

      // The cursor text opens to the side away from the images, so it's never on top of them
      if (path.length > 1) {
        const behind = pointOnPath(60);
        const wantedX = behind.x > path[0].x + 2 ? -14 - cursor.offsetWidth : 14;
        const wantedY = behind.y > path[0].y + 2 ? -10 - cursor.offsetHeight : 10;
        labelOffset.x += (wantedX - labelOffset.x) * 0.15;
        labelOffset.y += (wantedY - labelOffset.y) * 0.15;
      }
      cursor.style.translate = `${label.x + labelOffset.x}px ${label.y + labelOffset.y}px`;

      // The faster the mouse, the bigger the cursor text (up to about twice the size).
      // It grows away from the mouse, from the corner closest to it.
      labelScale += (1 + Math.min(1.1, speed * 0.45) - labelScale) * 0.12;
      cursor.style.scale = labelScale.toFixed(3);
      cursor.style.transformOrigin = `${labelOffset.x < 0 ? "right" : "left"} ${labelOffset.y < 0 ? "bottom" : "top"}`;

      // Add the new point to the path
      pen.x += (mouse.x - pen.x) * 0.11;   // lower = slower, rounder movement
      pen.y += (mouse.y - pen.y) * 0.11;
      if (!path.length || Math.hypot(pen.x - path[0].x, pen.y - path[0].y) > 2) {
        path.unshift({ x: pen.x, y: pen.y });
        if (path.length > 2000) path.length = 2000;
      }

      // Fast mouse: "Psst…". Stopped after that: back to "Coming soon".
      if (!isFast && !isOnItem && speed > 1.6) {
        isFast = true;
        showCursorText("Psst…");
      } else if (isFast && speed < 0.05) {
        isFast = false;
        showCursorText(DEFAULT_PHRASE);
      }

      // Moving: the faster the mouse, the more images (slow ≈ 3, fast = all 10).
      // Still: the trail stays in place and fades out slowly.
      const wanted = speed > 0.05 ? Math.min(1, 0.3 + speed * 0.8) : 0;
      if (wanted > activity) activity += (wanted - activity) * 0.08;   // images join the trail smoothly
      else activity = activity < 0.02 ? 0 : activity * 0.99;
      speed *= 0.92;

      const shown = activity * COUNT; // how many images are visible
      const imageWidth = slots[0].img.offsetWidth;
      let distance = 0;
      let lightShape = "M0 0Z";        // the outline of the images, for the white text
      slots.forEach((slot, i) => {
        const scale = sizeOf(i);                       // clear steps: each image is 80% of the one before
        const width = imageWidth * scale;

        // Spread along the path: the front starts behind the cursor,
        // each next image overlaps the one before it a little
        distance += i === 0 ? width * 0.6 + 24 : ((width + imageWidth * sizeOf(i - 1)) / 2) * 1.15;
        const point = pointOnPath(distance);
        slot.x = point.x;
        slot.y = point.y;

        const visible = Math.max(0, Math.min(1, shown - i));  // the back disappears first
        const softer = 1 - (i / COUNT) * 0.7;           // the back images are lighter, like they're fading away
        const opacity = visible * softer * zoneFade(slot.y);
        slot.el.style.opacity = opacity;
        slot.el.style.translate = `calc(${slot.x}px - 50%) calc(${slot.y}px - 50%)`;
        slot.el.style.scale = scale;
        // The further back, the softer: the front image is sharp, the end of the trail melts away
        slot.el.style.filter = i < 2 ? "none" : `blur(${((i - 1) * 0.9).toFixed(1)}px)`;
        // A gentle sway, each image a little out of step with the next: playful, like a ribbon
        slot.el.style.rotate = `${Math.sin(performance.now() / 1100 + i * 0.7) * 1.2}deg`;

        // Images that are clearly visible turn the text above them white
        if (opacity > 0.5) {
          // The image sits at the top of its figure, which is scaled around its center
          const w = width, h = w * 0.75;
          const left = slot.x - w / 2, top = slot.y - (slot.el.offsetHeight / 2) * scale;
          lightShape += ` M${left} ${top}h${w}v${h}h${-w}Z`;
        }
      });
      lightText.style.clipPath = `path("${lightShape}")`;



      // Letters of the headline move a little away from the mouse, and glide back
      const letters = document.querySelectorAll("body > main .letter");
      const lightLetters = lightText.querySelectorAll(".letter");
      letters.forEach((letter, i) => {
        const offset = letter.offset || (letter.offset = { x: 0, y: 0 });
        const box = letter.getBoundingClientRect();
        const centerX = box.left + box.width / 2 - offset.x;
        const centerY = box.top + box.height / 2 - offset.y;
        const dx = centerX - mouse.x, dy = centerY - mouse.y;
        const distance = Math.hypot(dx, dy) || 1;
        const reach = 130;   // how close the mouse must be (px)
        const strength = distance < reach ? Math.pow(1 - distance / reach, 2) * 12 : 0;
        offset.x += ((dx / distance) * strength - offset.x) * 0.15;
        offset.y += ((dy / distance) * strength - offset.y) * 0.15;
        const move = `${offset.x.toFixed(2)}px ${offset.y.toFixed(2)}px`;
        letter.style.translate = move;
        if (lightLetters[i]) lightLetters[i].style.translate = move; // keep the white copy in place
      });
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
