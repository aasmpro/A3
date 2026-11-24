import "../assets/styles/main.css";
import { ThemeScript } from "./ThemeScript";
import { TriangleCursor } from "../components/TriangleCursor";
import { Toaster } from "../components/ui/toast";
export const metadata = { metadataBase: new URL("https://a3.amiri.cc"), title: "A3", description: "Play A3, the matrix airplane game.", alternates: { canonical: "/" }, manifest: "/manifest.webmanifest", icons: { icon: "/a3/icons/dark-32.png", apple: "/a3/icons/dark-180.png" }, appleWebApp: { capable: true, title: "A3", statusBarStyle: "black-translucent" } };
export const viewport = { themeColor: "#000000" };
export default function Layout({children}) { return <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning><head><link rel="stylesheet" href="https://amiri.cc/delta/assets/css/fonts.css" /></head><body><ThemeScript /><a href="#content" data-link-unstyled className="sr-only focus:not-sr-only">Skip to content</a><main id="content" tabIndex={-1}>{children}</main><TriangleCursor /><Toaster /></body></html>; }
