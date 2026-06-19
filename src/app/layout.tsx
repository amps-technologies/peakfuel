import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransitions";
import ToastContainer from "@/components/Toast";
import CartDrawer from "@/components/CartDrawer";

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
          <PageTransition>{children}</PageTransition>
        </main>
        <CartDrawer />
        <ToastContainer />
      </body>
    </html>
  );
}
