import { useEffect, useRef } from 'react';
import {
  BarData,
  CandlestickData,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { api } from '../api';
import { useTerminal } from '../store';

type ChartType = 'candles' | 'bars' | 'line';
type CandlePoint = { time: UTCTimestamp; open: number; high: number; low: number; close: number };
type CandleResponse = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
type ChartSeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Bar'> | ISeriesApi<'Line'>;

const timeframeMs: Record<string, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
  W1: 604_800_000,
  MN: 2_592_000_000,
};

function bucketTime(time: number, timeframe: string) {
  return Math.floor(time / timeframeMs[timeframe]) * timeframeMs[timeframe];
}

function applyData(series: ChartSeries, chartType: ChartType, points: CandlePoint[]) {
  if (chartType === 'candles') {
    (series as ISeriesApi<'Candlestick'>).setData(points as CandlestickData<Time>[]);
  } else if (chartType === 'bars') {
    (series as ISeriesApi<'Bar'>).setData(points as BarData<Time>[]);
  } else {
    (series as ISeriesApi<'Line'>).setData(
      points.map((point): LineData<Time> => ({ time: point.time, value: point.close })),
    );
  }
}

export function Chart({ chartType }: { chartType: ChartType }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ChartSeries | null>(null);
  const dataRef = useRef<CandlePoint[]>([]);
  const historyLoadedRef = useRef(false);
  const contextRef = useRef({ symbol: '', tf: '' });
  const { symbol, tf, quotes, token } = useTerminal((state) => state);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#f7f7f7' }, textColor: '#222' },
      grid: { vertLines: { color: '#ddd' }, horzLines: { color: '#ddd' } },
    });
    return () => {
      seriesRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }
    if (chartType === 'candles') {
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#16833b',
        downColor: '#c63333',
        borderVisible: false,
      });
    } else if (chartType === 'bars') {
      seriesRef.current = chartRef.current.addBarSeries({
        upColor: '#16833b',
        downColor: '#c63333',
      });
    } else {
      seriesRef.current = chartRef.current.addLineSeries({ color: '#2869a8', lineWidth: 2 });
    }
    applyData(seriesRef.current, chartType, dataRef.current);
    if (dataRef.current.length) chartRef.current.timeScale().fitContent();
  }, [chartType]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const context = { symbol, tf };
    contextRef.current = context;
    historyLoadedRef.current = false;
    dataRef.current = [];
    if (seriesRef.current) applyData(seriesRef.current, chartType, []);
    api<CandleResponse[]>(`/api/candles?symbol=${symbol}&tf=${tf}&limit=100`)
      .then((candles) => {
        if (cancelled || contextRef.current !== context) return;
        dataRef.current = candles.map((candle) => ({
          time: Math.floor(bucketTime(candle.time, tf) / 1000) as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        if (seriesRef.current) {
          applyData(seriesRef.current, chartType, dataRef.current);
          chartRef.current?.timeScale().fitContent();
        }
        historyLoadedRef.current = true;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token, symbol, tf]);

  useEffect(() => {
    if (
      !token ||
      !historyLoadedRef.current ||
      contextRef.current.symbol !== symbol ||
      contextRef.current.tf !== tf
    ) {
      return;
    }
    const quote = quotes.find((item) => item.symbol === symbol);
    const series = seriesRef.current;
    if (!quote || !series || !dataRef.current.length) return;
    const current = dataRef.current[dataRef.current.length - 1];
    const time = Math.floor(bucketTime(quote.time, tf) / 1000) as UTCTimestamp;
    if (time < current.time) return;
    if (current.time === time) {
      current.high = Math.max(current.high, quote.ask);
      current.low = Math.min(current.low, quote.bid);
      current.close = quote.bid;
    } else {
      dataRef.current.push({
        time,
        open: quote.bid,
        high: quote.ask,
        low: quote.bid,
        close: quote.bid,
      });
    }
    const updated = dataRef.current[dataRef.current.length - 1];
    try {
      if (chartType === 'candles') {
        (series as ISeriesApi<'Candlestick'>).update(updated);
      } else if (chartType === 'bars') {
        (series as ISeriesApi<'Bar'>).update(updated);
      } else {
        (series as ISeriesApi<'Line'>).update({ time: updated.time, value: updated.close });
      }
    } catch {
      applyData(series, chartType, dataRef.current);
    }
  }, [quotes, symbol, tf, chartType, token]);

  return (
    <div className="chart-wrap">
      <div className="chart-title">
        {symbol},{tf}
      </div>
      <div ref={ref} className="chart" />
    </div>
  );
}
