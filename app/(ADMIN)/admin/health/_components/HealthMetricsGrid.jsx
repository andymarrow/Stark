import { Activity, Database, Users, FileCode } from "lucide-react";

export default function HealthMetricsGrid({ userCount, projectCount }) {
  // Calculated Metrics based on real data
  const totalRecords = (userCount + projectCount).toLocaleString();
  const dbLoad = Math.min(100, Math.floor((userCount + projectCount) / 100)); // Fake load calculation

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <HealthCard 
        label="Total Users" 
        value={userCount.toLocaleString()} 
        status="good" 
        icon={Users} 
      />
      <HealthCard 
        label="Total Projects" 
        value={projectCount.toLocaleString()} 
        status="good" 
        icon={FileCode} 
      />
      <HealthCard 
        label="Database Records" 
        value={totalRecords} 
        status="good" 
        icon={Database} 
      />
      <HealthCard 
        label="System Load" 
        value={`${dbLoad}%`} 
        status={dbLoad > 80 ? "warning" : "good"} 
        icon={Activity} 
      />
    </div>
  );
}

function HealthCard({ label, value, status, icon: Icon }) {
    const colorClass = status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500';
    const bgClass = status === 'good' ? 'bg-green-500/10 border-green-500/20' : status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

    return (
        <div className={`p-4 border ${bgClass} flex items-center justify-between`}>
            <div>
                <p className="text-[10px] font-mono uppercase text-zinc-400">{label}</p>
                <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            </div>
            <Icon className={`${colorClass} opacity-50`} size={24} />
        </div>
    )
}