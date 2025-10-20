interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}

export const GaugeChart = ({ value, max, label, unit, color }: GaugeChartProps) => {
  const safeValue = value ?? 0;
  const percentage = (safeValue / max) * 100;
  const rotation = (percentage / 100) * 180;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-48 h-24">
        {/* Background arc */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(rotation / 180) * 251.2} 251.2`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-foreground origin-bottom transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${rotation - 90}deg)`,
          }}
        >
          <div className="absolute -top-2 -left-1.5 w-4 h-4 rounded-full bg-foreground border-2 border-background" />
        </div>

        {/* Center value */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {value !== null ? value.toFixed(1) : "-"}
          </div>
          <div className="text-xs text-muted-foreground">{unit}</div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-semibold text-lg">{label}</h3>
        <p className="text-xs text-muted-foreground">สูงสุด: {max} {unit}</p>
      </div>
    </div>
  );
};
