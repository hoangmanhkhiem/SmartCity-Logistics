import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { RouteGuard } from "@/components/auth/route-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nền tảng Logistics Đô thị thông minh",
  description: "Quy định vùng cấm, giao hàng chặng cuối và mô phỏng chính sách — đề tài B2025-GHA-05",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script id="strip-extension-dom" strategy="beforeInteractive">{`
          (function () {
            var ATTR = 'bis_skin_checked';
            function strip(n) {
              if (!n || n.nodeType !== 1 || !n.removeAttribute) return;
              if (n.hasAttribute && n.hasAttribute(ATTR)) n.removeAttribute(ATTR);
            }
            function stripTree(n) {
              strip(n);
              if (!n || !n.querySelectorAll) return;
              var list = n.querySelectorAll('[' + ATTR + ']');
              for (var i = 0; i < list.length; i++) strip(list[i]);
            }
            try {
              var obs = new MutationObserver(function (records) {
                for (var i = 0; i < records.length; i++) {
                  var r = records[i];
                  if (r.type === 'attributes') strip(r.target);
                  for (var j = 0; j < r.addedNodes.length; j++) stripTree(r.addedNodes[j]);
                }
              });
              obs.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [ATTR],
              });
              stripTree(document.documentElement);
              addEventListener('load', function () { setTimeout(function () { obs.disconnect(); }, 3000); });
            } catch (e) {}
          })();
        `}</Script>
        <ToastProvider>
          <RouteGuard>{children}</RouteGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
