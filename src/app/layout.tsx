import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";
import CartDrawer from "@/components/CartDrawer";
import DemoBadge from "@/components/DemoBadge";
import CartSync from "@/components/CartSync";
import AndroidBackHandler from "@/components/AndroidBackHandler";
import Link from "next/link";
import DemoWelcomeModal from "@/components/DemoWelcomeModal";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PeakFuel — LPG Delivery",
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
        {/*
          Navbar renders its own sticky <header> directly — no Suspense
          wrapper here. Any suspending hooks (useSearchParams) are isolated
          to inner components with their own Suspense boundaries inside
          Navbar.tsx, so this <header> is always present in the DOM and
          `sticky top-0` works as expected.
        */}
        <Navbar />
        <main>
          {/* <PageTransition>{children}</PageTransition> */}
          {children}
        </main>
        <CartSync />
        <CartDrawer />
        <DemoWelcomeModal />
        <AndroidBackHandler />
        <ToastContainer />
        <DemoBadge />
        <footer className="mt-12 py-6 border-t border-gray-100 text-center space-x-4 text-xs text-gray-400">
          <span>© 2026 Peak Fuel Demo Platform</span>
          <Link
            href="/privacy"
            className="hover:text-sky-500 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-sky-500 transition-colors">
            Terms of Service
          </Link>
        </footer>
      </body>
    </html>
  );
}
