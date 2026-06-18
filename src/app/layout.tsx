import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransitions";
import ToastContainer from "@/components/Toast";
import CartDrawer from "@/components/CartDrawer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Peak Fuel — LPG Delivery",
  description: "Fast LPG delivery to your door",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} bg-gray-50 text-gray-900 min-h-screen`}
      >
        <Suspense
          fallback={<div className="h-14 bg-white border-b border-gray-200" />}
        >
          <Navbar />
        </Suspense>
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        <CartDrawer />
        <ToastContainer />
      </body>
    </html>
  );
}
