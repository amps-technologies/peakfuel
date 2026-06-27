"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Immediately reset the window viewport back to coordinates (0, 0)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // 'instant' resets it instantly before the entry animation paints
    });

    // 2. Safely capture scroll overflows for full-width layout wrapper containers
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]); // Runs every single time the user clicks a link and the pathname changes

  return <div className="animate-fade-in">{children}</div>;
}
