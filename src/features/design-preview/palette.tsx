import { designPreview } from '@/i18n/pt-AO';
import type { ThemeDefinition } from '@/themes';
import { contrastRatio } from '@/themes/contrast';

export function Palette({ theme }: { theme: ThemeDefinition }) {
  const { colors } = theme;
  const swatches = Object.entries(colors).map(([name, value]) => {
    const against = name === 'accentContrast' ? colors.accent : colors.background;
    return { name, value, ratio: name === 'background' ? null : contrastRatio(value, against) };
  });
  return (
    <section className="space-y-4">
      <h2 className="font-sans text-2xl font-bold text-slate-900">
        {designPreview.palette.title} — {theme.name}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {swatches.map(({ name, value, ratio }) => (
          <li key={name} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="h-16" style={{ backgroundColor: value }} />
            <div className="p-3 font-sans text-xs text-slate-700">
              <p className="font-semibold text-slate-900">{name}</p>
              <p>{value}</p>
              {ratio ? (
                <p>
                  {designPreview.palette.contrast} {ratio.toFixed(2)}:1
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
