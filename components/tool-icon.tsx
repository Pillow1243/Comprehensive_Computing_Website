'use client';

import {
  AudioWaveform,
  BarChart3,
  BookMarked,
  Briefcase,
  Dumbbell,
  FlaskConical,
  GraduationCap,
  Grid3x3,
  LineChart,
  MessagesSquare,
  Rocket,
  Ruler,
  Shapes,
  Sigma,
  Sparkles,
  Table2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  Ruler,
  FlaskConical,
  Grid3x3,
  BookMarked,
  LineChart,
  Table2,
  BarChart3,
  MessagesSquare,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Sigma,
  Shapes,
  Rocket,
  AudioWaveform,
  Wallet,
  Sparkles,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Ruler;
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}
