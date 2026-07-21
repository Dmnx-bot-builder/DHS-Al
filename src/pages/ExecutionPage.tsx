import { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { OrderEntryPanel } from '../components/execution/OrderEntryPanel';
import { TradeSettingsPanel } from '../components/execution/TradeSettingsPanel';
import { TradeConfirmationModal } from '../components/execution/TradeConfirmationModal';
import { ExecutionLog } from '../components/execution/ExecutionLog';
import { BrokerStatusCard } from '../components/execution/BrokerStatusCard';
import { OpenPositionsTable } from '../components/execution/OpenPositionsTable';
import {
  type TradingMode, type TradingEngine, type OrderSide,
  type OpenPosition, type ExecutionLogEntry, type TradeSettings,
  brokerConnection, defaultSettings, openPositions as initialPositions,
  initialExecutionLog,
} from '../data/execution';
import { account } from '../data/trading';
import { useGlobalMarket } from '../hooks/useGlobalMarket';

let ticketCounter = 50421876;
let logCounter = 100;

function timeNow(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export function ExecutionPage() {
  const { symbol, quote } = useGlobalMarket();
  const [mode, setMode] = useState<TradingMode>('SEMI_AUTO');
  const [engine, setEngine] = useState<TradingEngine>('MT5');
  const [settings, setSettings] = useState<TradeSettings>(defaultSettings);
  const [positions, setPositions] = useState<OpenPosition[]>(initialPositions);
  const [log, setLog] = useState<ExecutionLogEntry[]>(initialExecutionLog);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSide, setPendingSide] = useState<OrderSide>('BUY');

  const openCount = positions.length;
  const riskAmount = (account.balance * settings.riskPct) / 100;

  // Live bid/ask from the global market cache — same source as everywhere else.
  const bid = quote?.bid ?? 0;
  const ask = quote?.ask ?? 0;

  const handleBuy = useCallback((side: OrderSide) => {
    setPendingSide(side);
    setModalOpen(true);
  }, []);

  const handleSell = useCallback((side: OrderSide) => {
    setPendingSide(side);
    setModalOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    const side = pendingSide;
    const isBuy = side === 'BUY';
    const entry = isBuy ? ask : bid;
    const ticket = ticketCounter++;
    const id = `p${ticket}`;
    const logId = `l${logCounter++}`;

    const newPosition: OpenPosition = {
      id,
      ticket,
      symbol,
      side,
      lotSize: settings.lotSize,
      entryPrice: entry,
      currentPrice: entry,
      stopLoss: isBuy ? entry - settings.stopLoss : entry + settings.stopLoss,
      takeProfit: isBuy ? entry + settings.takeProfit : entry - settings.takeProfit,
      pnl: 0,
      pips: 0,
      swap: 0,
      commission: -(settings.lotSize * 12),
      openedAt: timeNow(),
      strategy: mode === 'MANUAL' ? 'Manual Entry' : 'AI Signal',
      mode,
    };

    setPositions((prev) => [newPosition, ...prev]);
    setLog((prev) => [{
      id: logId,
      time: timeNow(),
      type: 'ORDER',
      message: `${side} ${settings.lotSize.toFixed(2)} ${symbol} @ ${entry.toFixed(2)} — ${newPosition.strategy}`,
      status: 'FILLED',
      ticket,
      symbol,
    }, ...prev]);
    setModalOpen(false);
  }, [pendingSide, settings, mode, symbol, ask, bid]);

  const handleClose = useCallback((id: string) => {
    setPositions((prev) => {
      const pos = prev.find((p) => p.id === id);
      if (pos) {
        const logId = `l${logCounter++}`;
        const pnlText = pos.pnl >= 0 ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`;
        setLog((l) => [{
          id: logId,
          time: timeNow(),
          type: 'CLOSE',
          message: `Closed #${pos.ticket} ${pos.side} ${pos.lotSize.toFixed(2)} @ ${pos.entryPrice.toFixed(2)} → ${pos.currentPrice.toFixed(2)}, P/L ${pnlText}`,
          status: 'FILLED',
          ticket: pos.ticket,
          symbol: pos.symbol,
        }, ...l]);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleCloseAll = useCallback(() => {
    setPositions((prev) => {
      if (prev.length > 0) {
        const logId = `l${logCounter++}`;
        const totalPnl = prev.reduce((sum, p) => sum + p.pnl, 0);
        setLog((l) => [{
          id: logId,
          time: timeNow(),
          type: 'CLOSE',
          message: `Closed all ${prev.length} positions, total P/L ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`,
          status: 'FILLED',
        }, ...l]);
      }
      return [];
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Trade Execution</h1>
          <p className="text-xs text-slate-500">Order management, live positions & broker status · {symbol}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          <OrderEntryPanel
            mode={mode}
            engine={engine}
            onModeChange={setMode}
            onEngineChange={setEngine}
            onBuy={handleBuy}
            onSell={handleSell}
            onCloseAll={handleCloseAll}
            openCount={openCount}
            bid={bid}
            ask={ask}
          />
          <TradeSettingsPanel settings={settings} onChange={setSettings} accountBalance={account.balance} />
          <BrokerStatusCard broker={brokerConnection} />
        </div>

        {/* Right column */}
        <div className="space-y-4 xl:col-span-2">
          <OpenPositionsTable positions={positions} onClose={handleClose} />
          <ExecutionLog log={log} />
        </div>
      </div>

      <TradeConfirmationModal
        open={modalOpen}
        side={pendingSide}
        mode={mode}
        lotSize={settings.lotSize}
        stopLoss={settings.stopLoss}
        takeProfit={settings.takeProfit}
        entryPrice={pendingSide === 'BUY' ? ask : bid}
        riskAmount={riskAmount}
        onConfirm={handleConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}