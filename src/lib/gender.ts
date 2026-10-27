// Zwrot „Pan”/„Pani” w SMS-ach. Płeć zgadujemy z imienia; gdy nie wiadomo, piszemy neutralnie.
export type Gender = "f" | "m";

// Męskie imiona zakończone na -a
const MALE_A = new Set(["kuba", "barnaba", "bonawentura", "kosma", "jarema", "zawisza", "dyzma", "sasza", "nikita", "luca", "andrea", "ilja", "boryna"]);
// Żeńskie imiona bez -a na końcu
const FEMALE = new Set([
  "beatrycze", "noemi", "nel", "miriam", "rut", "abigail", "dagmar", "ingrid", "inez", "ines", "karmen", "carmen",
  "mercedes", "nicole", "michelle", "vivien", "ruth", "esther", "ester", "doris", "iris", "lili", "zoe", "chloe", "sophie",
]);
// Męskie imiona zakończone na -i, -e, -y (reszta takich imion jest niejednoznaczna)
const MALE_IEY = new Set(["jerzy", "antoni", "ksawery", "ignacy", "bonifacy", "walery", "teodory", "gerwazy", "remigiusz", "mike", "jose"]);

export function guessGender(firstName: string): Gender | null {
  const n = firstName.trim().split(/[\s-]+/)[0]?.toLocaleLowerCase("pl-PL") ?? "";
  if (!/^\p{L}{2,}$/u.test(n)) return null;
  if (FEMALE.has(n)) return "f";
  if (MALE_A.has(n) || MALE_IEY.has(n)) return "m";
  if (n.endsWith("a")) return "f";
  if (/[iey]$/.test(n)) return null;
  return "m";
}

/** Ustawiona ręcznie w panelu płeć ma pierwszeństwo przed zgadywaniem. */
export function genderOf(b: { first_name: string; gender?: Gender | null }): Gender | null {
  return b.gender ?? guessGender(b.first_name);
}

export function honorifics(g: Gender | null): Record<string, string> {
  if (g === "f") return { "{powitanie}": "Szanowna Pani", "{pan}": "Pani", "{pana}": "Pani", "{panu}": "Pani" };
  if (g === "m") return { "{powitanie}": "Szanowny Panie", "{pan}": "Pan", "{pana}": "Pana", "{panu}": "Panu" };
  return { "{powitanie}": "Dzień dobry", "{pan}": "Pan/Pani", "{pana}": "Pana/Pani", "{panu}": "Panu/Pani" };
}
