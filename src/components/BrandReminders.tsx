import { Star } from 'lucide-react';
import { BRAND_REMINDERS, QUOTES } from '@/constants';

const BrandReminders = () => (
  <div data-pdf-section className="bg-card rounded-xl border border-border shadow-sm p-5">
    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
      <Star size={14} className="text-primary" />
      苗林行品牌精神 — 讓品味與食俱進
    </h3>
    <div className="space-y-3 mb-4">
      {BRAND_REMINDERS.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <span className="text-xs font-bold text-primary whitespace-nowrap mt-0.5">{item.label}</span>
          <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
        </div>
      ))}
    </div>
    <div className="border-t border-border pt-3">
      <h4 className="text-xs font-bold text-muted-foreground mb-2">💡 業務心法</h4>
      <div className="space-y-2">
        {QUOTES.map((quote, idx) => (
          <p key={idx} className="text-sm text-muted-foreground italic pl-4 border-l-2 border-primary/30">
            "{quote}"
          </p>
        ))}
      </div>
    </div>
  </div>
);

export default BrandReminders;
