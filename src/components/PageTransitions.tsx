"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [style, setStyle] = useState({
    opacity: 1,
    transform: "translateY(0px)",
  });
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    setStyle({ opacity: 0, transform: "translateY(8px)" });

    const t = setTimeout(() => {
      setStyle({ opacity: 1, transform: "translateY(0px)" });
    }, 180);

    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      style={{
        ...style,
        transition: "opacity 250ms ease-out, transform 250ms ease-out",
      }}
    >
      {children}
    </div>
  );
}
