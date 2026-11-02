import { useId } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePreference } from '@/lib/theme';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { preference, setTheme } = useTheme();
  const groupId = useId();
  const selected = themes.find(theme => theme.value === preference)!;

  if (compact) {
    const Icon = selected.icon;
    return (
      <Select value={preference} onValueChange={value => setTheme(value as ThemePreference)}>
        <SelectTrigger className="h-11 w-11 shrink-0 justify-center border-transparent bg-transparent p-0 text-muted hover:bg-warm-100 hover:text-ink [&>svg]:hidden" aria-label={`Color theme: ${selected.label}`} title="Color theme">
          <SelectValue><Icon className="h-5 w-5" aria-hidden="true" /><span className="sr-only">{selected.label}</span></SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {themes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <fieldset className="px-4 py-3">
      <legend className="mb-2 text-sm font-semibold text-ink">Color theme</legend>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon: Icon }) => (
          <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface ${preference === value ? 'border-primary bg-iris-50 text-primary' : 'border-border text-muted hover:bg-warm-100'}`}>
            <input className="sr-only" type="radio" name={groupId} value={value} checked={preference === value} onChange={() => setTheme(value)} />
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
