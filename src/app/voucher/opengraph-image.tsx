import { ImageResponse } from "next/og";

// Podgląd linku do vouchera w SMS-ach, Messengerze i WhatsAppie
export const alt = "Voucher -20% na soczewki okularowe, Optyk Galant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #ffffff 0%, #eef3f7 60%, #dfe8ef 100%)",
          color: "#1d2b4f",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 80, letterSpacing: 8 }}>VOUCHER</div>
        <div style={{ fontSize: 200, fontWeight: 700, color: "#e4413b", lineHeight: 1 }}>-20%</div>
        <div style={{ fontSize: 48, letterSpacing: 4, marginTop: 10 }}>SOCZEWKI OKULAROWE</div>
        <div style={{ fontSize: 36, marginTop: 30, color: "#5b6b72" }}>Optyk Galant · ul. Wapienna 20</div>
      </div>
    ),
    size,
  );
}
