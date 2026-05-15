'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Loader2, Wifi, WifiOff, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export function Header({ data, loading, connected, onClearAll }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bangladeshTime, setBangladeshTime] = useState('');
  const [clearingData, setClearingData] = useState(false);
  const pathname = usePathname();
  const isConnected =
    typeof connected === 'boolean' ? connected : data !== null;
  const formatTimestamp = (ts) =>
    ts ? new Date(ts).toLocaleTimeString() : '--:--:--';
  const formatBangladeshTime = () =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());

  useEffect(() => {
    const updateTime = () => {
      setBangladeshTime(formatBangladeshTime());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/graphs', label: 'Analytics' },
    { href: '/data', label: 'History' },
  ];

  const executeClearAll = async () => {
    setClearingData(true);

    try {
      const response = await fetch('/api/admin/clear-all', {
        method: 'POST',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to clear data');
      }

      onClearAll?.();
      toast.success('All data cleared successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  const handleClearAll = () => {
    if (clearingData) return;

    const confirmToastId = toast(
      ({ closeToast }) => (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Clear all data?
          </p>
          <p className="text-xs text-slate-600">
            This will delete history, latest data, and logs permanently.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                closeToast();
                toast.info('Data clear canceled');
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                await executeClearAll();
              }}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              Clear All
            </button>
          </div>
        </div>
      ),
      {
        className: 'clear-confirm-toast',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      },
    );

    return confirmToastId;
  };

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky max-w-full mx-auto top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Logo, Nav, Mobile Menu Toggle */}
        <div className="flex items-center justify-between pt-4 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                SoilSync
              </h1>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-600" />
            ) : (
              <Menu className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2 border-t border-slate-200 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Desktop Status Bar */}
        <div className="hidden md:flex items-center justify-end gap-6 pb-4 border-t border-slate-200 pt-4">
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Status
            </span>
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold ${
                isConnected ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              <span>
                {loading ? 'Connecting' : isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearingData}
            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearingData ? 'Clearing...' : 'Clear All Data'}
          </button>

          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Last Heartbeat
            </span>
            <p className="text-sm font-semibold text-slate-700">
              {bangladeshTime || '--:--:--'}
            </p>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              Timestamp: {formatTimestamp(data?.timestamp)}
            </span>
          </div>
        </div>

        {/* Mobile Status Bar */}
        <div className="md:hidden flex items-center justify-between gap-4 pb-4 border-t border-slate-200 pt-4">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Status
            </span>
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                isConnected ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span>
                {loading ? 'Connecting' : isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Last Update
            </span>
            <p className="text-xs font-semibold text-slate-700">
              {formatTimestamp(data?.timestamp)}
            </p>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              Bangladesh Time: {bangladeshTime || '--:--:--'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={clearingData}
          className="md:hidden mb-4 inline-flex w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {clearingData ? 'Clearing...' : 'Clear All Data'}
        </button>
      </div>
    </header>
  );
}
