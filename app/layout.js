// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SiteHeader from "@/components/site-header";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LastLoginTracker from "@/components/LastLoginTracker";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Safe Space App",
  description: "Web app for admin, team leader, and support worker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const k='safespace_theme';const s=localStorage.getItem(k);const d=s? s==='dark' : window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const el=document.documentElement;d?el.classList.add('dark'):el.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/"
          signUpUrl="/"
        >
          <ConvexClientProvider>
            <ThemeProvider>
              <ToastProvider>
                <LastLoginTracker />
                <SiteHeader />
                {children}
              </ToastProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
