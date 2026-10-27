// Godziny do wyboru przy ręcznym dodawaniu wizyty: co pół godziny, 8:00–20:30
export const PANEL_TIMES = Array.from({ length: 26 }, (_, i) => {
  const m = 8 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
