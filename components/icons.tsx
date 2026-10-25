import {
  Atom,
  Binary,
  Cog,
  FlaskConical,
  Globe2,
  HeartPulse,
  Landmark,
  Sigma,
  Telescope,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  Sigma,
  Atom,
  FlaskConical,
  Cog,
  Landmark,
  Binary,
  HeartPulse,
  Telescope,
  Globe2,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Sigma;
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}
