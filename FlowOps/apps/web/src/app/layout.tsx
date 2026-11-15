import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'FlowOps — AI-Powered Cloud Workflow Orchestration Platform',
  description: 'Design, automate, execute, and observe complex workflows through an enterprise AWS-native orchestration engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
