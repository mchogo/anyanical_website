import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';

type SparkLineProps = {
  data: PriceHistoryPoint[];
  width?: number;
  height?: number;
};

export const SparkLine = ({ data, width = 120, height = 36 }: SparkLineProps) => {
  if (data.length < 2) {
    return null;
  }

  const prices = data.map((point) => point.price);
  const minValue = Math.min(...prices);
  const maxValue = Math.max(...prices);
  const minTime = data[0].time;
  const maxTime = data[data.length - 1].time;
  const valueRange = maxValue - minValue;
  const timeRange = maxTime - minTime;

  const points = data
    .map((point) => {
      const normalizedTime = timeRange === 0 ? 0 : (point.time - minTime) / timeRange;
      const x = normalizedTime * width;
      const normalizedValue =
        valueRange === 0 ? 0.5 : (point.price - minValue) / valueRange;
      const y = height - normalizedValue * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const firstValue = data[0].price;
  const lastValue = data[data.length - 1].price;
  const stroke =
    lastValue > firstValue ? '#34d399' : lastValue < firstValue ? '#fb7185' : '#94a3b8';

  return (
    <svg
      aria-hidden="true"
      className="h-9 w-full"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
