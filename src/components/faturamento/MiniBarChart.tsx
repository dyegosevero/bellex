/**
 * Mini bar chart showing last N charge amounts for a client.
 * If no data, shows empty placeholder bars.
 */
interface MiniBarChartProps {
  values: number[];
  color: string;
}

const MiniBarChart = ({ values, color }: MiniBarChartProps) => {
  const maxVal = Math.max(...values, 1);
  const bars = values.length > 0 ? values.slice(-6) : [];

  if (bars.length === 0) {
    return (
      <div className="flex items-end gap-[2px] h-5 w-16">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-sm bg-muted" style={{ height: "30%" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-[2px] h-5 w-16">
      {bars.map((v, i) => {
        const pct = Math.max(15, (v / maxVal) * 100);
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{ height: `${pct}%`, backgroundColor: color }}
          />
        );
      })}
    </div>
  );
};

export default MiniBarChart;
