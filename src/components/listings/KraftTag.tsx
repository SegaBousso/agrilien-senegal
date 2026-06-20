import { formatPrice } from '@/lib/utils';

const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const INK = '#17120C';

/** Étiquette de prix « kraft » — petit objet tactile de marché (page éditoriale). */
export function KraftTag({ price, unit }: { price: number; unit: string }) {
  return (
    <div
      className="relative flex items-center gap-1 rounded-md px-3 py-1.5 shadow-md"
      style={{ background: '#E4D5B7', color: INK, fontFamily: MONO }}
    >
      <span
        aria-hidden
        className="absolute -left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
        style={{ background: 'rgb(var(--background))', boxShadow: 'inset 0 0 0 1px rgba(23,18,12,.2)' }}
      />
      <span className="text-sm font-semibold">{formatPrice(price)}</span>
      <span className="text-[11px] opacity-70">/{unit}</span>
    </div>
  );
}
