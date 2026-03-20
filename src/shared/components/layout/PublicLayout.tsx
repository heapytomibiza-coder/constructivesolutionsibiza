import React from 'react';
import { PublicNav } from './PublicNav';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden w-full max-w-[100vw]">
      <PublicNav />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <PublicFooter />
    </div>
  );
}
