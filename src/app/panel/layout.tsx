import type { Metadata } from "next";

// Panel dodany do ekranu głównego otwiera się od razu na liście wizyt
export const metadata: Metadata = {
  manifest: "/panel.webmanifest",
  appleWebApp: { title: "Wizyty" },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
