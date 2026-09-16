type ToolbarProps = {
  timeframe: string;
  chartType: string;
  onTimeframe: (timeframe: string) => void;
  onChartType: (chartType: string) => void;
  onConnect: () => void;
};

const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
const chartTypes = ['candles', 'bars', 'line'];

export function Toolbar({
  timeframe,
  chartType,
  onTimeframe,
  onChartType,
  onConnect,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="tool-group">
        {timeframes.map((value) => (
          <button
            className={timeframe === value ? 'selected' : ''}
            key={value}
            onClick={() => onTimeframe(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="tool-group">
        {chartTypes.map((value) => (
          <button
            className={chartType === value ? 'selected' : ''}
            key={value}
            onClick={() => onChartType(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <button onClick={onConnect}>Connect</button>
    </div>
  );
}
