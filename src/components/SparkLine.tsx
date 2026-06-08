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

  const coords = data.map((point) => {
    const normalizedTime = timeRange === 0 ? 0 : (point.time - minTime) / timeRange;
    const x = normalizedTime * width;
    const normalizedValue = valueRange === 0 ? 0.5 : (point.price - minValue) / valueRange;
    const y = height - normalizedValue * height;
    return { x, y };
  });

  const linePoints = coords.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];
  const areaPoints = [
    `${firstCoord.x.toFixed(2)},${height}`,
    linePoints,
    `${lastCoord.x.toFixed(2)},${height}`,
  ].join(' ');

  const firstValue = data[0].price;
  const lastValue = data[data.length - 1].price;
  const isUp = lastValue > firstValue;
  const isDown = lastValue < firstValue;
  const stroke = isUp ? '#34d399' : isDown ? '#fb7185' : '#94a3b8';
  const gradientId = `spark-${stroke.replace('#', '')}`;

  return (
    <svg
      aria-hidden="true"
      className="h-9 w-full animate-fade-in"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradientId})`}
        points={areaPoints}
      />
      <polyline
        fill="none"
        points={linePoints}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
