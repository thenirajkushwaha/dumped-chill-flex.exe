import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "../globals.css";

import Header from "@/components/header";
import Footer from "@/components/footer";

const poppins = Poppins({ subsets: ['latin'], weight: ['100','200','300','400','500','600','700'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: "Chill Thrive",
  description: "Crafted and Created by Flex.exe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
          <Header></Header>
          {children}
          <Footer></Footer>
      </body>
    </html>
  );
}
