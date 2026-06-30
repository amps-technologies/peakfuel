"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function DemoWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // 1. Safe localStorage access on client mount
    const hasVisited = localStorage.getItem("gasgo-demo-acknowledged");

    if (!hasVisited) {
      // 2. Queue setting open to prevent cascading render warnings
      const openTimer = setTimeout(() => {
        setIsOpen(true);
        // Trigger smooth transition right after mounting into view
        setTimeout(() => setAnimateIn(true), 50);
      }, 0);

      return () => clearTimeout(openTimer);
    }
  }, []);

  const handleDismiss = () => {
    setAnimateIn(false);
    setTimeout(() => {
      localStorage.setItem("gasgo-demo-acknowledged", "true");
      setIsOpen(false);
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none transition-all duration-250 ease-out ${
        animateIn
          ? "bg-black/60 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
    >
      <div
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-500 overflow-hidden transition-all duration-250 cubic-bezier(0.16, 1, 0.3, 1) ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-3"
        }`}
      >
        {/* Banner Section */}
        <div className="bg-linear-to-r from-sky-500 to-sky-600 p-5 text-white text-center relative">
          {/* Dual Logo Container */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Client Logo Asset */}
            <div className="w-12 h-12 flex items-center justify-center shadow-xs overflow-hidden">
              <Image
                src="/logo.png"
                alt="PeakFuel Logo"
                className="w-10 h-10 object-contain"
                height={50}
                width={50}
              />
            </div>

            <span className="text-sky-200 text-sm font-medium">×</span>

            {/* Your Company Logo Asset */}
            <div className="w-12 h-12  flex items-center justify-center overflow-hidden">
              <Image
                src="/ampLogo.png"
                alt="AMPS Technologies Logo"
                // className="w-8 h-8 object-contain brightness-0 invert"
                height={35}
                width={35}
              />
            </div>
          </div>

          <h2 className="text-lg font-bold tracking-tight">
            Welcome to the Peak Fuel Evaluation Sandbox
          </h2>
          <p className="text-sky-100 text-xs mt-1">
            Prototype Developed by AMPS Technologies
          </p>
        </div>

        {/* Info Content Section */}
        <div className="p-5 space-y-4">
          {/* Compliance & Disclaimer text */}
          <div className="flex gap-3 items-start bg-amber-50/70 border border-amber-100 p-4 rounded-xl">
            <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                This platform is an official concept demonstration for{" "}
                <strong>Peak Fuel</strong>, engineered and developed by{" "}
                <strong>AMPS Technologies</strong> for design evaluation and
                interface testing. This is not a final production release.
              </p>
              <p className="font-semibold text-amber-800">
                Data Privacy & Compliance Notice:
              </p>
              <p className="text-amber-800">
                In compliance with data protection standards, please do not
                input real-world credentials, sensitive personal records, or
                financial information. All sandbox data is simulated and cleared
                periodically.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Confirmation Trigger */}
        <div className="px-5 pb-5">
          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-gray-900 text-white font-semibold text-sm rounded-xl hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Acknowledge & Enter</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
