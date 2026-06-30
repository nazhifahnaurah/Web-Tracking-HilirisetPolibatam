'use client';

import Image from 'next/image';
import { User, LogOut } from 'lucide-react';
import { Student, Supervisor } from '@/lib/types';

interface HeaderProps {
  currentUser: Student | Supervisor | null;
  onLogout?: () => void;
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Hiliriset · IJO · Polibatam"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">HILIRISET LPDP · Platform Aerial ULV-Fogging dengan Kontrol Droplet Adaptif</h1>
            <p className="text-xs text-muted-foreground">Weekly Progress & Supervision</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {currentUser.role}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-border" />

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
