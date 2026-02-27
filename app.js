const SHEET_CONFIG = {
  // Replace these values with your sheet information.
  sheetId: "1kBe3OE1bLGzLTF1icGJdCuqIB1fjsUjc7Vbny_GPUr4",
  gid: "0",
  goalsColumnName: "Goals",
  notesColumnName: "Notes",
};

const SAMPLE_DATA = [
  {
    goal: "Increase board engagement",
    note: "Introduce a 10-minute strategy spotlight in each monthly meeting.",
  },
  {
    goal: "Strengthen fundraising outreach",
    note: "Pair board members with 3 prospective donors for warm introductions.",
  },
  {
    goal: "Improve committee reporting",
    note: "Standardize updates with a one-page dashboard template.",
  },
];

const cardsEl = document.getElementById("cards");
const statusEl = document.getElementById("status");
const cardTemplate = document.getElementById("cardTemplate");
const expandAllBtn = document.getElementById("expandAll");
const collapseAllBtn = document.getElementById("collapseAll");
const COLLAPSED_CARD_HEIGHT = 220;

async function init() {
  try {
    const rows = await loadRows();
    renderCards(rows);
    setStatus(`Loaded ${rows.length} goal${rows.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    renderCards(SAMPLE_DATA);
    setStatus(
      "Could not load Google Sheet. Showing sample data instead. Check README setup steps."
    );
  }
}

async function loadRows() {
  const { sheetId, gid, goalsColumnName, notesColumnName } = SHEET_CONFIG;

  if (!sheetId || sheetId === "PASTE_YOUR_SHEET_ID") {
    return SAMPLE_DATA;
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    sheetId
  )}/export?format=csv&gid=${encodeURIComponent(gid)}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Sheet request failed with status ${response.status}`);
  }

  const csv = await response.text();
  const parsed = parseCsv(csv);
  if (parsed.length === 0) {
    throw new Error("No rows found in sheet.");
  }

  const headers = parsed[0].map((header) => header.trim());
  const goalIdx = headers.findIndex((h) => h.toLowerCase() === goalsColumnName.toLowerCase());
  const notesIdx = headers.findIndex((h) => h.toLowerCase() === notesColumnName.toLowerCase());

  if (goalIdx === -1 || notesIdx === -1) {
    throw new Error(`Missing columns. Expected: ${goalsColumnName} and ${notesColumnName}.`);
  }

  const rows = parsed
    .slice(1)
    .map((cells) => ({
      goal: (cells[goalIdx] || "").trim(),
      note: (cells[notesIdx] || "").trim(),
    }))
    .filter((row) => row.goal || row.note);

  if (!rows.length) {
    throw new Error("Sheet has headers but no data rows.");
  }

  return rows;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function renderCards(rows) {
  cardsEl.innerHTML = "";

  rows.forEach(({ goal, note }) => {
    const node = cardTemplate.content.cloneNode(true);
    const cardWrap = node.querySelector(".card-wrap");
    const card = node.querySelector(".card");
    const contents = node.querySelectorAll(".content");

    contents[0].textContent = goal || "(No goal text)";
    contents[1].textContent = note || "(No notes text)";

    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });

    cardWrap.style.height = `${COLLAPSED_CARD_HEIGHT}px`;

    const expandCard = () => {
      if (!window.matchMedia("(hover: hover)").matches) {
        return;
      }

      const faces = card.querySelectorAll(".card-face");
      const expandedHeight = Math.max(
        ...Array.from(faces, (face) => face.scrollHeight),
        COLLAPSED_CARD_HEIGHT
      );
      cardWrap.style.height = `${expandedHeight}px`;
      cardWrap.classList.add("is-expanded");
    };

    const collapseCard = () => {
      cardWrap.classList.remove("is-expanded");
      cardWrap.style.height = `${COLLAPSED_CARD_HEIGHT}px`;
    };

    cardWrap.addEventListener("mouseenter", expandCard);
    cardWrap.addEventListener("mouseleave", collapseCard);
    card.addEventListener("focus", expandCard);
    card.addEventListener("blur", collapseCard);

    cardsEl.appendChild(node);
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

expandAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".card").forEach((card) => card.classList.add("is-flipped"));
});

collapseAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".card").forEach((card) => card.classList.remove("is-flipped"));
});

init();
