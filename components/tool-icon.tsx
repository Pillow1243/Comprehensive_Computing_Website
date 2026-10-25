'use client';

import { BookMarked, FlaskConical, Grid3x3, Ruler, type LucideIcon } from 'lucide-react';

const map: Record<string, LucideIcon> = {
  Ruler,
  FlaskConical,
  Grid3x3,
  BookMarked,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Ruler;
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}
