// app/(HOME)/profile/_components/MyFinanceManager.jsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  Wallet, TrendingUp, DollarSign, Activity, 
  ArrowUpRight, Loader2, ArrowRightLeft, ShieldCheck, Database,
  Globe
} from "lucide-react";
import { getFinancialTelemetry } from "@/app/actions/getFinancialTelemetry";
import Image from "next/image";
import Link from "next/link";
import { getAvatar } from "@/constants/assets";

// Fallback Exchange Rate (Update this or connect to an API later)
const EXCHANGE_RATE_USD_TO_ETB = 120; 

export default function MyFinanceManager({ user, profile }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Currency Toggle State
  const [viewCurrency, setViewCurrency] = useState("USD"); // 'USD' or 'ETB'

  useEffect(() => {
    const fetchFinances = async () => {
      try {
        setLoading(true);
        const res = await getFinancialTelemetry(user.id);
        
        if (res?.success) {
          setTransactions(res.data || []);
        } else {
          toast.error("Telemetry Link Failure", { description: res?.error || "Unknown Error" });
          setTransactions([]);
        }
      } catch (err) {
        toast.error("Network Error", { description: "Failed to communicate with Mainframe." });
      } finally {
        setLoading(false); // This ensures the loader stops no matter what
      }
    };

    if (user?.id) fetchFinances();
  }, [user.id]);

  // --- FINANCIAL ALGORITHMS (Currency Conversion) ---
  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return parseFloat(amount);
    if (fromCurrency === 'USD' && toCurrency === 'ETB') return parseFloat(amount) * EXCHANGE_RATE_USD_TO_ETB;
    if (fromCurrency === 'ETB' && toCurrency === 'USD') return parseFloat(amount) / EXCHANGE_RATE_USD_TO_ETB;
    return parseFloat(amount);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  };

  // --- AGGREGATE DATA ---
  const stats = useMemo(() => {
    let totalVolume = 0;
    const assetMap = {};

    transactions.forEach(tx => {
      // Convert everything to the currently selected viewCurrency
      const convertedAmount = convertAmount(tx.net_amount, tx.currency, viewCurrency);
      totalVolume += convertedAmount;

      // Group by Asset for the Breakdown
      if (!assetMap[tx.asset_id]) {
        assetMap[tx.asset_id] = {
          title: tx.assetTitle,
          slug: tx.assetSlug,
          type: tx.asset_type,
          total: 0,
          injections: 0
        };
      }
      assetMap[tx.asset_id].total += convertedAmount;
      assetMap[tx.asset_id].injections += 1;
    });

    const topAssets = Object.values(assetMap).sort((a, b) => b.total - a.total);

    return { totalVolume, topAssets, totalInjections: transactions.length };
  }, [transactions, viewCurrency]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 w-full">
      
      {/* 1. HEADER & CURRENCY TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-2">
                <Wallet className="text-accent" /> Financial Telemetry
            </h2>
            <p className="text-xs font-mono text-muted-foreground uppercase mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Ledger Sync Complete
            </p>
        </div>

        <div className="flex items-center bg-secondary/10 border border-border p-1">
            <span className="text-[9px] font-mono uppercase text-muted-foreground mr-3 pl-2 hidden sm:block">Display Currency:</span>
            <button 
                onClick={() => setViewCurrency('USD')}
                className={`px-4 py-1.5 text-xs font-mono uppercase transition-all ${viewCurrency === 'USD' ? 'bg-foreground text-background font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                USD
            </button>
            <button 
                onClick={() => setViewCurrency('ETB')}
                className={`px-4 py-1.5 text-xs font-mono uppercase transition-all flex items-center gap-1 ${viewCurrency === 'ETB' ? 'bg-accent text-white font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <ArrowRightLeft size={10} className={viewCurrency === 'ETB' ? 'text-white' : 'text-muted-foreground'} /> ETB
            </button>
        </div>
      </div>

      {/* 2. TOP LEVEL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <MetricCard 
              label={`Total Net Volume (${viewCurrency})`}
              value={formatCurrency(stats.totalVolume, viewCurrency)}
              icon={Database}
              isHighlight
          />
          <MetricCard 
              label="Total Credit Injections"
              value={stats.totalInjections}
              icon={Activity}
          />
          <MetricCard 
              label="Public Display Status"
              value={profile?.show_financial_telemetry ? "PUBLIC" : "PRIVATE"}
              icon={profile?.show_financial_telemetry ? Globe : ShieldCheck}
              subtext="Manage in Settings"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* 3. ASSET BREAKDOWN (Left Column) */}
          <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Asset Yield Matrix</h3>
              {stats.topAssets.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border bg-secondary/5 text-[10px] font-mono text-muted-foreground uppercase">
                      No Yield Data Available
                  </div>
              ) : (
                  <div className="space-y-3">
                      {stats.topAssets.map((asset, idx) => (
                          <div key={idx} className="p-4 border border-border bg-background flex items-center justify-between group hover:border-accent transition-colors">
                              <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-mono text-accent uppercase tracking-widest mb-1">{asset.type}</p>
                                  <Link href={asset.type === 'project' ? `/project/${asset.slug}` : `/${profile.username}/blog/${asset.slug}`} className="font-bold text-sm uppercase truncate block group-hover:text-accent transition-colors">
                                      {asset.title}
                                  </Link>
                                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{asset.injections} Injections</p>
                              </div>
                              <div className="text-right pl-4">
                                  <p className="font-mono text-lg font-black text-foreground">{formatCurrency(asset.total, viewCurrency)}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* 4. INVESTOR LEDGER (Right Column) */}
          <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2 flex justify-between">
                  <span>Investor Ledger</span>
                  <span>{transactions.length} Records</span>
              </h3>
              
              <div className="border border-border bg-background">
                  {transactions.length === 0 ? (
                       <div className="p-12 text-center text-[10px] font-mono text-muted-foreground uppercase flex flex-col items-center gap-3">
                           <Activity size={24} className="opacity-20" />
                           Awaiting First Credit Injection
                       </div>
                  ) : (
                      <div className="divide-y divide-border max-h-[500px] overflow-y-auto custom-scrollbar">
                          {transactions.map(tx => (
                              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                                  <div className="flex items-center gap-4">
                                      {tx.supporter ? (
                                          <Link href={`/profile/${tx.supporter.username}`} className="w-10 h-10 bg-secondary border border-border relative overflow-hidden grayscale hover:grayscale-0 transition-all">
                                              <Image src={getAvatar(tx.supporter)} alt="" fill className="object-cover" />
                                          </Link>
                                      ) : (
                                          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                              <User size={16} className="text-zinc-600" />
                                          </div>
                                      )}
                                      <div>
                                          <p className="text-xs font-bold uppercase text-foreground">
                                              {tx.supporter ? `@${tx.supporter.username}` : "Anonymous_Node"}
                                          </p>
                                          <p className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">
                                              {new Date(tx.created_at).toLocaleString()} • via {tx.provider_id}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-mono font-black text-green-500">
                                          +{formatCurrency(convertAmount(tx.net_amount, tx.currency, viewCurrency), viewCurrency)}
                                      </p>
                                      <p className="text-[8px] font-mono text-muted-foreground uppercase">Target: {tx.assetTitle.substring(0, 15)}...</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, isHighlight, subtext }) {
    return (
        <div className="bg-background p-6 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{label}</span>
                <Icon size={16} className={isHighlight ? "text-accent" : "text-muted-foreground"} />
            </div>
            <div>
                <div className={`text-3xl font-black tracking-tighter font-mono ${isHighlight ? 'text-accent' : 'text-foreground'}`}>
                    {value}
                </div>
                {subtext && <div className="text-[9px] font-mono text-muted-foreground uppercase mt-1">{subtext}</div>}
            </div>
        </div>
    );
}