/* =========================
   SELECT HTML ELEMENTS
   These connect JavaScript to the buttons, modal, inputs, and notes area.
========================= */

const newNoteBtn = document.querySelector("#newNoteBtn");
const noteOptions = document.querySelector("#noteOptions");
const noteModal = document.querySelector("#noteModal");
const closeModal = document.querySelector("#closeModal");
const saveNoteBtn = document.querySelector("#saveNoteBtn");

const noteTitle = document.querySelector("#noteTitle");
const noteText = document.querySelector("#noteText");
const noteTags = document.querySelector("#noteTags");
const notesGrid = document.querySelector("#notesGrid");

const favoriteBtn = document.querySelector(".favorite-btn");
const searchInput = document.querySelector(".search-box input");
const navItems = document.querySelectorAll(".nav-item");

const imageUploadBox = document.querySelector("#imageUploadBox");
const imageInput = document.querySelector("#imageInput");
const imagePreview = document.querySelector("#imagePreview");

const drawingBox = document.querySelector("#drawingBox");
const drawingCanvas = document.querySelector("#drawingCanvas");
const penColor = document.querySelector("#penColor");
const penSize = document.querySelector("#penSize");
const clearCanvasBtn = document.querySelector("#clearCanvasBtn");
const ctx = drawingCanvas.getContext("2d");

const emptyBinBtn = document.querySelector("#emptyBinBtn");


/* =========================
   APP STATE
   notes stores saved notes.
   currentView controls what the sidebar is showing.
   editingNoteId is null when creating, or an id when editing.
========================= */

let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentView = "all";
let currentNoteType = "text";
let isFavorite = false;
let uploadedImage = "";
let isDrawing = false;
let hasDrawing = false;
let editingNoteId = null;


/* =========================
   SAVE DATA
   Stores notes in localStorage so they stay after refresh.
========================= */

function saveToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}


/* =========================
   OPEN / CLOSE UI
========================= */

newNoteBtn.addEventListener("click", () => {
  noteOptions.classList.toggle("hidden");
});

closeModal.addEventListener("click", closeNoteModal);

function openNoteModal(type) {
  editingNoteId = null;
  currentNoteType = type;

  noteOptions.classList.add("hidden");
  noteModal.classList.remove("hidden");

  saveNoteBtn.textContent = "Save Note";

  imageUploadBox.classList.add("hidden");
  drawingBox.classList.add("hidden");

  if (type === "image") {
    imageUploadBox.classList.remove("hidden");
    noteText.placeholder = "Write a caption for your image...";
  } else if (type === "drawing") {
    drawingBox.classList.remove("hidden");
    noteText.placeholder = "Write a caption for your drawing...";
    resetCanvas();
  } else {
    noteText.placeholder = "Write your note...";
  }

  noteTitle.focus();
}

function closeNoteModal() {
  noteModal.classList.add("hidden");

  noteTitle.value = "";
  noteText.value = "";
  noteTags.value = "";

  isFavorite = false;
  uploadedImage = "";
  currentNoteType = "text";
  hasDrawing = false;
  editingNoteId = null;

  favoriteBtn.classList.remove("favorite");
  saveNoteBtn.textContent = "Save Note";

  imageInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("hidden");

  imageUploadBox.classList.add("hidden");
  drawingBox.classList.add("hidden");

  resetCanvas();
}


/* =========================
   NOTE TYPE MENU
   Opens a modal for writing, image, or drawing notes.
========================= */

document.querySelectorAll(".option-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type || "text";
    openNoteModal(type);
  });
});


/* =========================
   IMAGE UPLOAD
   Reads uploaded image and converts it into base64.
========================= */

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    uploadedImage = reader.result;
    imagePreview.src = uploadedImage;
    imagePreview.classList.remove("hidden");
  });

  reader.readAsDataURL(file);
});


/* =========================
   DRAWING CANVAS
   Lets the user draw on the canvas.
   Canvas is saved as an image when the note is saved.
========================= */

function resetCanvas() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  hasDrawing = false;
}

function loadImageToCanvas(imageSrc) {
  const image = new Image();

  image.onload = () => {
    resetCanvas();
    ctx.drawImage(image, 0, 0, drawingCanvas.width, drawingCanvas.height);
    hasDrawing = true;
  };

  image.src = imageSrc;
}

function getCanvasPosition(event) {
  const rect = drawingCanvas.getBoundingClientRect();

  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  return {
    x: (clientX - rect.left) * (drawingCanvas.width / rect.width),
    y: (clientY - rect.top) * (drawingCanvas.height / rect.height)
  };
}

function startDrawing(event) {
  event.preventDefault();

  isDrawing = true;
  hasDrawing = true;

  const pos = getCanvasPosition(event);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(event) {
  if (!isDrawing) return;

  event.preventDefault();

  const pos = getCanvasPosition(event);

  ctx.lineWidth = penSize.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = penColor.value;

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

drawingCanvas.addEventListener("mousedown", startDrawing);
drawingCanvas.addEventListener("mousemove", draw);
drawingCanvas.addEventListener("mouseup", stopDrawing);
drawingCanvas.addEventListener("mouseleave", stopDrawing);

drawingCanvas.addEventListener("touchstart", startDrawing);
drawingCanvas.addEventListener("touchmove", draw);
drawingCanvas.addEventListener("touchend", stopDrawing);

clearCanvasBtn.addEventListener("click", resetCanvas);


/* =========================
   FAVORITE BUTTON
   Toggles favorite state inside the modal.
========================= */

favoriteBtn.addEventListener("click", () => {
  isFavorite = !isFavorite;
  favoriteBtn.classList.toggle("favorite");
});


/* =========================
   CREATE OR UPDATE NOTE
   If editingNoteId exists, update the old note.
   Otherwise create a new note.
========================= */

saveNoteBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim();
  const text = noteText.value.trim();

  const tags = noteTags.value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag !== "");

  let noteImage = uploadedImage;

  if (currentNoteType === "drawing" && hasDrawing) {
    noteImage = drawingCanvas.toDataURL("image/png");
  }

  if (!title && !text && !noteImage) {
    alert("Please add a title, text, image, or drawing before saving.");
    return;
  }

  if (editingNoteId) {
    notes = notes.map((note) => {
      if (note.id === editingNoteId) {
        return {
          ...note,
          type: currentNoteType,
          title: title || "Untitled Note",
          text: text,
          image: noteImage,
          tags: tags,
          favorite: isFavorite,
          updatedAt: new Date().toLocaleDateString()
        };
      }

      return note;
    });
  } else {
    const newNote = {
      id: Date.now(),
      type: currentNoteType,
      title: title || "Untitled Note",
      text: text,
      image: noteImage,
      tags: tags,
      favorite: isFavorite,
      deleted: false,
      createdAt: new Date().toLocaleDateString()
    };

    notes.unshift(newNote);
  }

  saveToStorage();
  closeNoteModal();
  renderNotes();
});


/* =========================
   EDIT EXISTING NOTE
   Opens the modal with the note's current saved data.
========================= */

function editNote(id) {
  const note = notes.find((note) => note.id === id);

  if (!note) return;

  editingNoteId = id;
  currentNoteType = note.type || "text";
  isFavorite = note.favorite;
  uploadedImage = note.image || "";

  noteTitle.value = note.title;
  noteText.value = note.text || "";
  noteTags.value = note.tags ? note.tags.join(", ") : "";

  favoriteBtn.classList.toggle("favorite", isFavorite);
  saveNoteBtn.textContent = "Update Note";

  imageUploadBox.classList.add("hidden");
  drawingBox.classList.add("hidden");
  imagePreview.classList.add("hidden");

  if (currentNoteType === "image") {
    imageUploadBox.classList.remove("hidden");
    noteText.placeholder = "Write a caption for your image...";

    if (uploadedImage) {
      imagePreview.src = uploadedImage;
      imagePreview.classList.remove("hidden");
    }
  } else if (currentNoteType === "drawing") {
    drawingBox.classList.remove("hidden");
    noteText.placeholder = "Write a caption for your drawing...";

    if (uploadedImage) {
      loadImageToCanvas(uploadedImage);
    }
  } else {
    noteText.placeholder = "Write your note...";
  }

  noteModal.classList.remove("hidden");
  noteTitle.focus();
}


/* =========================
   RENDER NOTES
   Filters and displays notes based on sidebar view + search.
========================= */

function renderNotes() {
  notesGrid.innerHTML = "";

  emptyBinBtn.classList.toggle("hidden", currentView !== "bin");

  const searchTerm = searchInput.value.toLowerCase();

  const filteredNotes = notes.filter((note) => {
    const noteTagsText = note.tags ? note.tags.join(" ") : "";

    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm) ||
      note.text.toLowerCase().includes(searchTerm) ||
      noteTagsText.includes(searchTerm);

    if (currentView === "all") return !note.deleted && matchesSearch;
    if (currentView === "favorites") return note.favorite && !note.deleted && matchesSearch;
    if (currentView === "tags") return !note.deleted && note.tags && note.tags.length > 0 && matchesSearch;
    if (currentView === "bin") return note.deleted && matchesSearch;

    return !note.deleted && matchesSearch;
  });

  if (filteredNotes.length === 0) {
    notesGrid.innerHTML = `<p style="color:#9ca3af;">No notes found.</p>`;
    return;
  }

  filteredNotes.forEach((note) => {
    const noteCard = document.createElement("article");
    noteCard.className = "note-card";

    noteCard.innerHTML = `
      ${note.image ? `<img src="${note.image}" alt="Note image" class="note-image">` : ""}

      <h3>${escapeHTML(note.title)}</h3>

      ${note.text ? `<p>${escapeHTML(note.text)}</p>` : ""}

      ${
        note.tags && note.tags.length > 0
          ? `<div class="tags-row">
              ${note.tags.map((tag) => `<span class="tag-pill">#${escapeHTML(tag)}</span>`).join("")}
            </div>`
          : ""
      }

      <div class="note-actions">
        <small>${note.updatedAt ? `Updated ${note.updatedAt}` : note.createdAt}</small>

        <div class="note-icons">
          ${
            note.deleted
              ? `
                <button onclick="restoreNote(${note.id})" title="Restore note">
                  <i class='bx bx-undo'></i>
                </button>
                <button onclick="deleteForever(${note.id})" title="Delete forever">
                  <i class='bx bx-x'></i>
                </button>
              `
              : `
                <button onclick="editNote(${note.id})" title="Edit note">
                  <i class='bx bx-edit'></i>
                </button>
                <button onclick="toggleFavorite(${note.id})" title="Favourite note">
                  <i class='bx ${note.favorite ? "bxs-star favorite" : "bx-star"}'></i>
                </button>
                <button onclick="moveToBin(${note.id})" title="Move to bin">
                  <i class='bx bx-trash'></i>
                </button>
              `
          }
        </div>
      </div>
    `;

    notesGrid.appendChild(noteCard);
  });
}


/* =========================
   NOTE ACTIONS
   Favorite, move to bin, restore, and delete forever.
========================= */

function toggleFavorite(id) {
  notes = notes.map((note) => {
    if (note.id === id) return { ...note, favorite: !note.favorite };
    return note;
  });

  saveToStorage();
  renderNotes();
}

function moveToBin(id) {
  notes = notes.map((note) => {
    if (note.id === id) return { ...note, deleted: true };
    return note;
  });

  saveToStorage();
  renderNotes();
}

function restoreNote(id) {
  notes = notes.map((note) => {
    if (note.id === id) return { ...note, deleted: false };
    return note;
  });

  saveToStorage();
  renderNotes();
}

function deleteForever(id) {
  const confirmDelete = confirm("Permanently delete this note?");
  if (!confirmDelete) return;

  notes = notes.filter((note) => note.id !== id);

  saveToStorage();
  renderNotes();
}

function emptyBin() {
  const notesInBin = notes.filter((note) => note.deleted);

  if (notesInBin.length === 0) {
    alert("Bin is already empty.");
    return;
  }

  const confirmEmpty = confirm("Permanently delete all notes in the bin?");
  if (!confirmEmpty) return;

  notes = notes.filter((note) => !note.deleted);

  saveToStorage();
  renderNotes();
}


/* =========================
   SIDEBAR NAVIGATION
   Changes which section of notes is shown.
========================= */

navItems.forEach((item, index) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();

    navItems.forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");

    if (index === 0) currentView = "all";
    if (index === 1) currentView = "favorites";
    if (index === 2) currentView = "tags";
    if (index === 3) currentView = "bin";

    renderNotes();
  });
});


/* =========================
   SEARCH
   Re-renders notes whenever the user types in the search bar.
========================= */

searchInput.addEventListener("input", renderNotes);


/* =========================
   EMPTY BIN EVENT
========================= */

emptyBinBtn.addEventListener("click", emptyBin);


/* =========================
   SECURITY HELPER
   Prevents user text from being treated as HTML.
========================= */

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}


/* =========================
   INITIAL LOAD
   Prepares canvas and displays saved notes.
========================= */

resetCanvas();
renderNotes();