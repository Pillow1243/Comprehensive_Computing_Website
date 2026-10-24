'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bookmark,
  Download,
  ExternalLink,
  Github,
  Languages,
  Palette,
  Ruler,
  Shield,
  Smartphone,
  Trash2,
  Type,
  Vibrate,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme';
import { useInstall } from '@/lib/install';
import { useI18n, type Language } from '@/lib/i18n';
import { useAppStore, useHydrated, type NumeralsSetting, type ThemeMode, type UnitSystem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { APP_VERSION, REPO_URL } from '@/lib/version';
import { cn, haptic } from '@/lib/utils';

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-surface-container p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-10 flex-1 rounded-full px-2 text-label-medium transition-colors',
            value === option.value
              ? 'bg-primary-container text-on-primary-container'
              : 'text-on-surface-variant',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-body-large text-on-surface">{label}</span>
        {description && <span className="block text-body-small text-on-surface-variant">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors',
          checked ? 'border-primary bg-primary' : 'border-outline bg-surface-container-highest',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all',
            checked ? 'start-7.5 bg-on-primary' : 'start-0.5 bg-outline',
          )}
        />
      </button>
    </label>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container p-4">
      <h2 className="mb-3 flex items-center gap-2 text-title-small font-semibold text-on-surface">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { t, lang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { available, installed, promptInstall, isIos } = useInstall();
  const hydrated = useHydrated();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const clearAll = useAppStore((state) => state.clearAll);
  const historyCount = useAppStore((state) => state.history.length);
  const bookmarkCount = useAppStore((state) => state.bookmarks.length);
  const [clearOpen, setClearOpen] = useState(false);

  const changeHaptics = (value: boolean) => {
    updateSettings({ haptics: value });
    if (value) haptic([10, 30, 10], true);
  };

  const wipeLocalData = async () => {
    clearAll();
    try {
      localStorage.removeItem('solveeverything.store.v3');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      /* storage may be blocked */
    }
    toast.success(t('cacheCleared'));
  };

  return (
    <div className="space-y-3 px-4 pb-10 pt-3">
      <Section icon={<Palette className="h-4 w-4" aria-hidden="true" />} title={t('appearance')}>
        <div>
          <p className="mb-1.5 text-label-medium text-on-surface-variant">{t('chooseTheme')}</p>
          <Segmented<ThemeMode>
            label={t('chooseTheme')}
            value={theme}
            onChange={(value) => {
              setTheme(value);
              haptic(8, settings.haptics);
            }}
            options={[
              { value: 'system', label: t('themeSystem') },
              { value: 'light', label: t('themeLight') },
              { value: 'dark', label: t('themeDark') },
            ]}
          />
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-label-medium text-on-surface-variant">
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            {t('numerals')}
          </p>
          <Segmented<NumeralsSetting>
            label={t('numerals')}
            value={settings.numerals}
            onChange={(value) => updateSettings({ numerals: value })}
            options={[
              { value: 'latin', label: t('numeralsLatin') },
              { value: 'native', label: t('numeralsNative') },
            ]}
          />
        </div>
      </Section>

      <Section icon={<Languages className="h-4 w-4" aria-hidden="true" />} title={t('language')}>
        <Segmented<Language>
          label={t('chooseLanguage')}
          value={settings.language}
          onChange={(value) => {
            updateSettings({ language: value });
            haptic(8, settings.haptics);
          }}
          options={[
            { value: 'fa', label: t('persian') },
            { value: 'en', label: t('english') },
            { value: 'ar', label: t('arabic') },
          ]}
        />
        <p className="text-body-small text-on-surface-variant" dir="auto">
          {lang === 'fa'
            ? 'راست‌به‌چپ با فونت وزیرمتن؛ انگلیسی و عربی به‌صورت خودکار تنظیم می‌شوند.'
            : 'Layout direction and typography switch automatically.'}
        </p>
      </Section>

      <Section icon={<Ruler className="h-4 w-4" aria-hidden="true" />} title={t('units')}>
        <Segmented<UnitSystem>
          label={t('units')}
          value={settings.units}
          onChange={(value) => updateSettings({ units: value })}
          options={[
            { value: 'SI', label: t('si') },
            { value: 'Imperial', label: t('imperial') },
          ]}
        />
        <div>
          <label htmlFor="decimals" className="mb-1.5 flex items-center justify-between text-label-medium text-on-surface-variant">
            <span>{t('decimals')}</span>
            <span className="tnum font-mono text-on-surface">{hydrated ? settings.decimals : 6}</span>
          </label>
          <input
            id="decimals"
            type="range"
            min={0}
            max={10}
            step={1}
            value={hydrated ? settings.decimals : 6}
            onChange={(event) => updateSettings({ decimals: Number(event.target.value) })}
            className="h-10 w-full accent-[rgb(var(--md-primary))]"
          />
        </div>
      </Section>

      <Section icon={<Vibrate className="h-4 w-4" aria-hidden="true" />} title={t('general')}>
        <Switch
          label={t('haptics')}
          description={t('hapticsHint')}
          checked={hydrated ? settings.haptics : true}
          onChange={changeHaptics}
        />
      </Section>

      <Section icon={<Smartphone className="h-4 w-4" aria-hidden="true" />} title={t('installApp')}>
        <p className="text-body-small text-on-surface-variant">
          {installed ? t('installed') : isIos ? t('iosInstallHint') : t('installHint')}
        </p>
        {available && !installed && (
          <Button
            onClick={async () => {
              const outcome = await promptInstall();
              if (outcome === 'accepted') toast.success(t('installed'));
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('installApp')}
          </Button>
        )}
      </Section>

      <Section icon={<Bookmark className="h-4 w-4" aria-hidden="true" />} title={t('data')}>
        <div className="flex justify-between text-body-medium text-on-surface-variant">
          <span>{t('history')}</span>
          <span className="tnum">{hydrated ? historyCount : 0}</span>
        </div>
        <div className="flex justify-between text-body-medium text-on-surface-variant">
          <span>{t('bookmarks')}</span>
          <span className="tnum">{hydrated ? bookmarkCount : 0}</span>
        </div>
        <p className="text-body-small text-on-surface-variant">{t('signInHint')}</p>
        <Button variant="danger" size="sm" onClick={() => setClearOpen(true)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('clearCache')}
        </Button>
      </Section>

      <Section icon={<Shield className="h-4 w-4" aria-hidden="true" />} title={t('about')}>
        <div className="flex items-center justify-between text-body-medium text-on-surface-variant">
          <span>{t('version')}</span>
          <span className="font-mono">{APP_VERSION}</span>
        </div>
        <p className="text-body-small text-on-surface-variant">{t('secure')}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-label-medium text-primary"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            {t('viewSource')}
          </a>
          <a
            href={`${REPO_URL}/issues/new/choose`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-label-medium text-primary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t('reportBug')}
          </a>
          <Link
            href="/search/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-label-medium text-primary"
          >
            {t('search')}
          </Link>
        </div>
        <p className="text-label-small text-on-surface-variant">{t('license')}</p>
      </Section>

      <ConfirmDialog
        open={clearOpen}
        title={t('clearCacheConfirm')}
        description={t('clearCacheConfirmHint')}
        destructive
        confirmLabel={t('clearCache')}
        onClose={() => setClearOpen(false)}
        onConfirm={() => void wipeLocalData()}
      />
    </div>
  );
}
