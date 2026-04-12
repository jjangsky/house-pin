import type { BargainScore } from '@/types/bargain';

interface BargainBadgeProps {
  score: BargainScore;
}

const GRADE_CONFIG: Record<
  BargainScore['grade'],
  { label: string; className: string } | null
> = {
  hot: {
    label: '\uD83D\uDD25 급매',
    className:
      'bg-danger/10 text-danger border border-danger/20',
  },
  good: {
    label: '\uD83D\uDC4D 좋은 가격',
    className:
      'bg-accent/10 text-accent border border-accent/20',
  },
  normal: {
    label: '적정가',
    className:
      'bg-surface text-secondary border border-border',
  },
  overpriced: null,
};

export default function BargainBadge({ score }: BargainBadgeProps) {
  const config = GRADE_CONFIG[score.grade];

  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${config.className}`}
      title={score.summary}
    >
      {config.label}
    </span>
  );
}
