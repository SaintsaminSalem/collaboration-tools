const COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635",
  "#34d399", "#22d3ee", "#60a5fa", "#a78bfa",
  "#f472b6", "#fb7185"
];

const ADJECTIVES = ["Swift", "Clever", "Bright", "Calm", "Bold", "Quiet", "Sharp", "Gentle"];
const ANIMALS = ["Fox", "Owl", "Wolf", "Hawk", "Bear", "Lynx", "Otter", "Falcon"];

export function getLocalUser() {
  const stored = localStorage.getItem("collab-user");
  if (stored) return JSON.parse(stored);

  const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const user = { name, color, id: crypto.randomUUID() };

  localStorage.setItem("collab-user", JSON.stringify(user));
  return user;
}
