/* jshint esversion: 11, browser: true */

/*
   SELECT HTML ELEMENTS
   Connects JavaScript to the HTML interface.
*/

const newNoteBtn = document.querySelector("#newNoteBtn");
const noteOptions = document.querySelector("#noteOptions");
const noteModal = document.querySelector("#noteModal");
const closeModalBtn = document.querySelector("#closeModal");
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
const canvasContext = drawingCanvas.getContext("2d");

const emptyBinBtn = document.querySelector("#emptyBinBtn");
const themeToggle = document.querySelector("#themeToggle");


/*
   CONSTANTS
*/

const STORAGE_KEY = "notes";
const THEME_KEY = "theme";

const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";


/*
   APPLICATION STATE
*/

let notes = loadNotes();
let currentView = "all";
let currentNoteType = "text";
let isFavorite = false;
let uploadedImage = "";
let isDrawing = false;
let hasDrawing = false;
let editingNoteId = null;


/*
   STORAGE
*/

function loadNotes() {
  const savedNotes = localStorage.getItem(STORAGE_KEY);

  if (!savedNotes) {
    return [];
  }

  try {
    const parsedNotes = JSON.parse(savedNotes);

    if (Array.isArray(parsedNotes)) {
      return parsedNotes;
    }

    return [];
  } catch (error) {
    console.error("Could not load saved notes:", error);
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}


/*
   NOTE MODAL
*/

function setModalMode(type) {
  noteModal.classList.remove(
    "text-mode",
    "image-mode",
    "drawing-mode"
  );

  imageUploadBox.classList.add("hidden");
  drawingBox.classList.add("hidden");

  if (type === "image") {
    noteModal.classList.add("image-mode");
    imageUploadBox.classList.remove("hidden");
    noteText.placeholder = "Write an image description...";
    return;
  }

  if (type === "drawing") {
    noteModal.classList.add("drawing-mode");
    drawingBox.classList.remove("hidden");
    noteText.placeholder = "Write a drawing description...";
    return;
  }

  noteModal.classList.add("text-mode");
  noteText.placeholder = "Write your note...";
}

function openNoteModal(type) {
  editingNoteId = null;
  currentNoteType = type;
  isFavorite = false;
  uploadedImage = "";

  noteOptions.classList.add("hidden");
  noteModal.classList.remove("hidden");

  saveNoteBtn.textContent = "Save Note";
  favoriteBtn.classList.remove("favorite");

  noteTitle.value = "";
  noteText.value = "";
  noteTags.value = "";

  imageInput.value = "";
  imagePreview.src = EMPTY_IMAGE;
  imagePreview.classList.add("hidden");

  setModalMode(type);

  if (type === "drawing") {
    resetCanvas();
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
  imagePreview.src = EMPTY_IMAGE;
  imagePreview.classList.add("hidden");

  imageUploadBox.classList.add("hidden");
  drawingBox.classList.add("hidden");

  resetCanvas();
}


/*
   NEW NOTE MENU
*/

newNoteBtn.addEventListener("click", function () {
  noteOptions.classList.toggle("hidden");
});

closeModalBtn.addEventListener("click", closeNoteModal);

document.querySelectorAll(".option-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    const type = button.dataset.type || "text";
    openNoteModal(type);
  });
});


/*
   IMAGE UPLOAD
*/

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please choose a valid image file.");
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", function () {
    uploadedImage = reader.result;
    imagePreview.src = uploadedImage;
    imagePreview.classList.remove("hidden");
  });

  reader.readAsDataURL(file);
});


/*
   DRAWING CANVAS
*/

function resetCanvas() {
  canvasContext.fillStyle = "#111827";

  canvasContext.fillRect(
    0,
    0,
    drawingCanvas.width,
    drawingCanvas.height
  );

  hasDrawing = false;
}

function loadImageToCanvas(imageSource) {
  const image = new Image();

  image.addEventListener("load", function () {
    resetCanvas();

    canvasContext.drawImage(
      image,
      0,
      0,
      drawingCanvas.width,
      drawingCanvas.height
    );

    hasDrawing = true;
  });

  image.src = imageSource;
}

function getCanvasPosition(event) {
  const rectangle = drawingCanvas.getBoundingClientRect();

  let clientX;
  let clientY;

  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  return {
    x:
      (clientX - rectangle.left) *
      (drawingCanvas.width / rectangle.width),

    y:
      (clientY - rectangle.top) *
      (drawingCanvas.height / rectangle.height)
  };
}

function startDrawing(event) {
  event.preventDefault();

  isDrawing = true;
  hasDrawing = true;

  const position = getCanvasPosition(event);

  canvasContext.beginPath();
  canvasContext.moveTo(position.x, position.y);
}

function draw(event) {
  if (!isDrawing) {
    return;
  }

  event.preventDefault();

  const position = getCanvasPosition(event);

  canvasContext.lineWidth = Number(penSize.value);
  canvasContext.lineCap = "round";
  canvasContext.lineJoin = "round";
  canvasContext.strokeStyle = penColor.value;

  canvasContext.lineTo(position.x, position.y);
  canvasContext.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

drawingCanvas.addEventListener("mousedown", startDrawing);
drawingCanvas.addEventListener("mousemove", draw);
drawingCanvas.addEventListener("mouseup", stopDrawing);
drawingCanvas.addEventListener("mouseleave", stopDrawing);

drawingCanvas.addEventListener("touchstart", startDrawing, {
  passive: false
});

drawingCanvas.addEventListener("touchmove", draw, {
  passive: false
});

drawingCanvas.addEventListener("touchend", stopDrawing);

clearCanvasBtn.addEventListener("click", resetCanvas);


/*
   FAVOURITE BUTTON INSIDE MODAL
*/

favoriteBtn.addEventListener("click", function () {
  isFavorite = !isFavorite;
  favoriteBtn.classList.toggle("favorite", isFavorite);
});


/*
   TAGS
*/

function getTagsFromInput() {
  const tags = noteTags.value
    .split(",")
    .map(function (tag) {
      return tag.trim().toLowerCase();
    })
    .filter(function (tag) {
      return tag !== "";
    });

  return [...new Set(tags)];
}


/*
   CREATE OR UPDATE NOTE
*/

function createNoteObject(title, text, tags, noteImage) {
  return {
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
}

function updateExistingNote(title, text, tags, noteImage) {
  notes = notes.map(function (note) {
    if (note.id !== editingNoteId) {
      return note;
    }

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
  });
}

saveNoteBtn.addEventListener("click", function () {
  const title = noteTitle.value.trim();
  const text = noteText.value.trim();
  const tags = getTagsFromInput();

  let noteImage = uploadedImage;

  if (currentNoteType === "drawing" && hasDrawing) {
    noteImage = drawingCanvas.toDataURL("image/png");
  }

  if (!title && !text && !noteImage) {
    alert(
      "Please add a title, text, image, or drawing before saving."
    );
    return;
  }

  if (editingNoteId !== null) {
    updateExistingNote(title, text, tags, noteImage);
  } else {
    const newNote = createNoteObject(
      title,
      text,
      tags,
      noteImage
    );

    notes.unshift(newNote);
  }

  saveToStorage();
  closeNoteModal();
  renderNotes();
});


/*
   EDIT NOTE
*/

function editNote(id) {
  const note = notes.find(function (savedNote) {
    return savedNote.id === id;
  });

  if (!note) {
    return;
  }

  editingNoteId = id;
  currentNoteType = note.type || "text";
  isFavorite = Boolean(note.favorite);
  uploadedImage = note.image || "";

  noteTitle.value = note.title || "";
  noteText.value = note.text || "";

  if (Array.isArray(note.tags)) {
    noteTags.value = note.tags.join(", ");
  } else {
    noteTags.value = "";
  }

  favoriteBtn.classList.toggle("favorite", isFavorite);
  saveNoteBtn.textContent = "Update Note";

  imageInput.value = "";
  imagePreview.src = EMPTY_IMAGE;
  imagePreview.classList.add("hidden");

  setModalMode(currentNoteType);

  if (currentNoteType === "image" && uploadedImage) {
    imagePreview.src = uploadedImage;
    imagePreview.classList.remove("hidden");
  }

  if (currentNoteType === "drawing") {
    if (uploadedImage) {
      loadImageToCanvas(uploadedImage);
    } else {
      resetCanvas();
    }
  }

  noteModal.classList.remove("hidden");
  noteTitle.focus();
}


/*
   DARK AND LIGHT MODE
*/

function updateThemeIcon(isLightMode) {
  if (isLightMode) {
    themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
  } else {
    themeToggle.innerHTML = "<i class='bx bx-moon'></i>";
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isLightMode = savedTheme === "light";

  document.body.classList.toggle(
    "light-mode",
    isLightMode
  );

  updateThemeIcon(isLightMode);
}

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("light-mode");

  const isLightMode =
    document.body.classList.contains("light-mode");

  if (isLightMode) {
    localStorage.setItem(THEME_KEY, "light");
  } else {
    localStorage.setItem(THEME_KEY, "dark");
  }

  updateThemeIcon(isLightMode);
});


/*
   SECURITY HELPERS
*/

function escapeHTML(text) {
  return String(text).replace(
    /[&<>"']/g,
    function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    }
  );
}


/*
   NOTE CARD MARKUP
*/

function createTagsMarkup(note) {
  if (!Array.isArray(note.tags) || note.tags.length === 0) {
    return "";
  }

  const tagsMarkup = note.tags
    .map(function (tag) {
      return (
        '<span class="tag-pill">#' +
        escapeHTML(tag) +
        "</span>"
      );
    })
    .join("");

  return '<div class="tags-row">' + tagsMarkup + "</div>";
}

function createImageMarkup(note) {
  if (!note.image) {
    return "";
  }

  return (
    '<img src="' +
    note.image +
    '" alt="Note attachment" class="note-image">'
  );
}

function createTextMarkup(note) {
  if (!note.text) {
    return "";
  }

  return "<p>" + escapeHTML(note.text) + "</p>";
}

function createActiveActionsMarkup(note) {
  let starClass;

  if (note.favorite) {
    starClass = "bxs-star favorite";
  } else {
    starClass = "bx-star";
  }

  return `
    <button
      type="button"
      data-action="edit"
      data-id="${note.id}"
      title="Edit note"
      aria-label="Edit note"
    >
      <i class="bx bx-edit"></i>
    </button>

    <button
      type="button"
      data-action="favorite"
      data-id="${note.id}"
      title="Favourite note"
      aria-label="Favourite note"
    >
      <i class="bx ${starClass}"></i>
    </button>

    <button
      type="button"
      data-action="bin"
      data-id="${note.id}"
      title="Move to bin"
      aria-label="Move note to bin"
    >
      <i class="bx bx-trash"></i>
    </button>
  `;
}

function createDeletedActionsMarkup(note) {
  return `
    <button
      type="button"
      data-action="restore"
      data-id="${note.id}"
      title="Restore note"
      aria-label="Restore note"
    >
      <i class="bx bx-undo"></i>
    </button>

    <button
      type="button"
      data-action="delete"
      data-id="${note.id}"
      title="Delete forever"
      aria-label="Delete note forever"
    >
      <i class="bx bx-x"></i>
    </button>
  `;
}

function createNoteCard(note) {
  const noteCard = document.createElement("article");

  let dateText;
  let actionMarkup;

  if (note.updatedAt) {
    dateText = "Updated " + note.updatedAt;
  } else {
    dateText = note.createdAt;
  }

  if (note.deleted) {
    actionMarkup = createDeletedActionsMarkup(note);
  } else {
    actionMarkup = createActiveActionsMarkup(note);
  }

  noteCard.className = "note-card";

  noteCard.innerHTML = `
    ${createImageMarkup(note)}

    <h3>${escapeHTML(note.title)}</h3>

    ${createTextMarkup(note)}

    ${createTagsMarkup(note)}

    <div class="note-actions">
      <small>${escapeHTML(dateText || "")}</small>

      <div class="note-icons">
        ${actionMarkup}
      </div>
    </div>
  `;

  return noteCard;
}


/*
   FILTER NOTES
*/

function noteMatchesSearch(note, searchTerm) {
  const title = String(note.title || "").toLowerCase();
  const text = String(note.text || "").toLowerCase();

  let tags = "";

  if (Array.isArray(note.tags)) {
    tags = note.tags.join(" ").toLowerCase();
  }

  return (
    title.includes(searchTerm) ||
    text.includes(searchTerm) ||
    tags.includes(searchTerm)
  );
}

function noteMatchesCurrentView(note) {
  if (currentView === "favorites") {
    return note.favorite && !note.deleted;
  }

  if (currentView === "tags") {
    return (
      !note.deleted &&
      Array.isArray(note.tags) &&
      note.tags.length > 0
    );
  }

  if (currentView === "bin") {
    return Boolean(note.deleted);
  }

  return !note.deleted;
}


/*
   RENDER NOTES
*/

function renderNotes() {
  notesGrid.innerHTML = "";

  emptyBinBtn.classList.toggle(
    "hidden",
    currentView !== "bin"
  );

  const searchTerm = searchInput.value
    .trim()
    .toLowerCase();

  const filteredNotes = notes.filter(function (note) {
    return (
      noteMatchesCurrentView(note) &&
      noteMatchesSearch(note, searchTerm)
    );
  });

  if (filteredNotes.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No notes found.";

    notesGrid.appendChild(emptyMessage);
    return;
  }

  filteredNotes.forEach(function (note) {
    notesGrid.appendChild(createNoteCard(note));
  });
}


/*
   NOTE ACTIONS
*/

function toggleFavorite(id) {
  notes = notes.map(function (note) {
    if (note.id === id) {
      return {
        ...note,
        favorite: !note.favorite
      };
    }

    return note;
  });

  saveToStorage();
  renderNotes();
}

function moveToBin(id) {
  notes = notes.map(function (note) {
    if (note.id === id) {
      return {
        ...note,
        deleted: true
      };
    }

    return note;
  });

  saveToStorage();
  renderNotes();
}

function restoreNote(id) {
  notes = notes.map(function (note) {
    if (note.id === id) {
      return {
        ...note,
        deleted: false
      };
    }

    return note;
  });

  saveToStorage();
  renderNotes();
}

function deleteForever(id) {
  const confirmed = confirm(
    "Permanently delete this note?"
  );

  if (!confirmed) {
    return;
  }

  notes = notes.filter(function (note) {
    return note.id !== id;
  });

  saveToStorage();
  renderNotes();
}

function emptyBin() {
  const binHasNotes = notes.some(function (note) {
    return note.deleted;
  });

  if (!binHasNotes) {
    alert("Bin is already empty.");
    return;
  }

  const confirmed = confirm(
    "Permanently delete all notes in the bin?"
  );

  if (!confirmed) {
    return;
  }

  notes = notes.filter(function (note) {
    return !note.deleted;
  });

  saveToStorage();
  renderNotes();
}


/*
   NOTE CARD EVENT DELEGATION
*/

notesGrid.addEventListener("click", function (event) {
  const actionButton = event.target.closest(
    "button[data-action]"
  );

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const noteId = Number(actionButton.dataset.id);

  if (action === "edit") {
    editNote(noteId);
    return;
  }

  if (action === "favorite") {
    toggleFavorite(noteId);
    return;
  }

  if (action === "bin") {
    moveToBin(noteId);
    return;
  }

  if (action === "restore") {
    restoreNote(noteId);
    return;
  }

  if (action === "delete") {
    deleteForever(noteId);
  }
});


/*
   SIDEBAR NAVIGATION
*/

navItems.forEach(function (item, index) {
  item.addEventListener("click", function (event) {
    event.preventDefault();

    navItems.forEach(function (navigationItem) {
      navigationItem.classList.remove("active");
    });

    item.classList.add("active");

    const views = [
      "all",
      "favorites",
      "tags",
      "bin"
    ];

    currentView = views[index] || "all";
    renderNotes();
  });
});


/*
   SEARCH AND BIN EVENTS
*/

searchInput.addEventListener("input", renderNotes);
emptyBinBtn.addEventListener("click", emptyBin);


/*
   CLOSE MODAL USING OVERLAY OR ESCAPE
*/

noteModal.addEventListener("click", function (event) {
  if (event.target === noteModal) {
    closeNoteModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    !noteModal.classList.contains("hidden")
  ) {
    closeNoteModal();
  }
});


/*
   INITIAL LOAD
*/

loadSavedTheme();
resetCanvas();
renderNotes();