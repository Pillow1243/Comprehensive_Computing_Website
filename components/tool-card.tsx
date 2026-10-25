'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ToolIcon } from '@/components/tool-icon';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ToolDef } from '@/lib/tools';

export function ToolCard({ tool, compact = false }: { tool: ToolDef; compact?: boolean }) {
  const { lang } = useI18n();
  const title = lang === 'fa' ? tool.fa : tool.en;
  const description = lang === 'fa' ? tool.descriptionFa : tool.descriptionEn;

  if (compact) {
    return (
      <Link
        href={tool.href}
        className="card-lift group flex w-[9.5rem] shrink-0 flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-container p-3"
      >
        <span
          className={cn('icon-bubble h-9 w-9', `bg-gradient-to-br ${tool.tint}`)}
          style={{ color: tool.accent }}
        >
          <ToolIcon name={tool.icon} className="h-4.5 w-4.5" />
        </span>
        <span className="text-label-large font-semibold leading-snug text-on-surface">{title}</span>
      </Link>
    );
  }

  return (
    <Link
      href={tool.href}
      className="card-lift group relative flex items-start gap-3 rounded-2xl border border-outline-variant bg-surface-container p-4"
    >
      <span
        className={cn('icon-bubble h-12 w-12 shrink-0', `bg-gradient-to-br ${tool.tint}`)}
        style={{ color: tool.accent }}
      >
        <ToolIcon name={tool.icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-title-small font-semibold text-on-surface">
          {title}
          <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-70 rtl:-scale-x-100" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-body-small leading-relaxed text-on-surface-variant">
          {description}
        </span>
      </span>
    </Link>
  );
}
