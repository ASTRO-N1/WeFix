// src/app/layout.js
import "./globals.css";
import { Providers } from "./providers"; // Import the new providers component

// This metadata can now be exported because this is a Server Component
export const metadata = {
  title: "WeFix - Civic Complaint Platform",
  description: "Report and track civic issues in your area.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-900 text-gray-100 font-[Inter,sans-serif]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
