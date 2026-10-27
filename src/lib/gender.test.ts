import { describe, expect, it } from "vitest";
import { genderOf, guessGender, honorifics } from "./gender";

describe("guessGender", () => {
  it("rozpoznaje typowe imiona", () => {
    for (const n of ["Anna", "Małgorzata", "ewa", "Zofia"]) expect(guessGender(n)).toBe("f");
    for (const n of ["Jan", "Piotr", "Ireneusz", "Kuba", "Jerzy", "Antoni", "Bartłomiej"]) expect(guessGender(n)).toBe("m");
    for (const n of ["Beatrycze", "Noemi", "Nel"]) expect(guessGender(n)).toBe("f");
  });
  it("gdy nie wiadomo, zwraca null", () => {
    for (const n of ["", "J.", "Ali", "Rene"]) expect(guessGender(n)).toBeNull();
  });
  it("bierze pierwsze z kilku imion", () => expect(guessGender("Anna Maria")).toBe("f"));
  it("ręczna poprawka wygrywa", () => expect(genderOf({ first_name: "Kuba", gender: "f" })).toBe("f"));
});

describe("honorifics", () => {
  it("formy dla pani, pana i neutralne", () => {
    expect(honorifics("f")["{powitanie}"]).toBe("Szanowna Pani");
    expect(honorifics("m")["{panu}"]).toBe("Panu");
    expect(honorifics(null)["{powitanie}"]).toBe("Dzień dobry");
  });
});
