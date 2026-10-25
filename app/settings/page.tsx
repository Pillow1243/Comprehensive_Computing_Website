'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bookmark,
  Check,
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
import { toast } from '@/lib/toast';
import { useTheme } from '@/lib/theme';
import { useInstall } from '@/lib/install';
import { useI18n, type Language } from '@/lib/i18n';
import { useAppStore, useHydrated, type AccentId, type NumeralsSetting, type ThemeMode, type UnitSystem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { APP_VERSION, REPO_URL } from '@/lib/version';
import { cn, haptic } from '@/lib/utils';

const accents: Array<{ value: AccentId; labelKey: string; swatch: string }> = [
  { value: 'violet', labelKey: 'accentViolet', swatch: 'linear-gradient(135deg,#8B7CFF,#C484FF 55%,#2DD4E8)' },
  { value: 'ocean', labelKey: 'accentOcean', swatch: 'linear-gradient(135deg,#0284C7,#22D3EE 55%,#2DD4BF)' },
  { value: 'emerald', labelKey: 'accentEmerald', swatch: 'linear-gradient(135deg,#059669,#34D399 55%,#A3E635)' },
  { value: 'sunset', labelKey: 'accentSunset', swatch: 'linear-gradient(135deg,#F97316,#EC4899 55%,#F59E0B)' },
  { value: 'rose', labelKey: 'accentRose', swatch: 'linear-gradient(135deg,#E11D63,#FB7185 55%,#C084FC)' },
  { value: 'amber', labelKey: 'accentAmber', swatch: 'linear-gradient(135deg,#F59E0B,#FB923C 55%,#FACC15)' },
];

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
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-label-medium text-on-surface-variant">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" />
            {t('accent')}
          </p>
          <p className="mb-3 text-body-small text-on-surface-variant">{t('accentHint')}</p>
          <div className="flex flex-wrap gap-3" role="group" aria-label={t('accent')}>
            {accents.map((accent) => {
              const selected = settings.accent === accent.value;
              return (
                <button
                  key={accent.value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={t(accent.labelKey)}
                  title={t(accent.labelKey)}
                  onClick={() => {
                    haptic(12, settings.haptics);
                    updateSettings({ accent: accent.value });
                  }}
                  className="group flex w-14 flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full text-white shadow-elevation-1 transition-transform duration-200 group-active:scale-90',
                      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container',
                    )}
                    style={{ background: accent.swatch }}
                  >
                    {selected && <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span
                    className={cn(
                      'text-label-small',
                      selected ? 'font-bold text-on-surface' : 'text-on-surface-variant',
                    )}
                  >
                    {t(accent.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
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
