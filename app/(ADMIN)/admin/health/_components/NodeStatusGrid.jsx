// Mock Nodes
const NODES = [
  { id: "api-01", region: "us-east", status: "healthy", load: 45 },
  { id: "api-02", region: "us-east", status: "healthy", load: 52 },
  { id: "db-primary", region: "us-east", status: "healthy", load: 60 },
  { id: "auth-worker", region: "global", status: "healthy", load: 24 },
  { id: "img-process", region: "us-west", status: "warning", load: 88 },
];

export default function NodeStatusGrid() {
  return (
    <div className="bg-black border border-white/10 p-6">
        <h3 className="text-xs font-mono text-zinc-500 uppercase mb-6 tracking-widest">
            Infrastructure Nodes
        </h3>
        <div className="space-y-4">
            {NODES.map((node) => (
                <div key={node.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-2 h-2 rounded-full 
                            ${node.status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                              'bg-yellow-500 animate-pulse'}
                        `} />
                        <div>
                            <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{node.id}</div>
                            <div className="text-[10px] font-mono text-zinc-600 uppercase">{node.region}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xs font-mono ${node.load > 80 ? 'text-yellow-500' : 'text-zinc-400'}`}>
                            {node.load}% LOAD
                        </div>
                        <div className="w-16 h-1 bg-zinc-900 mt-1">
                            <div 
                                className={`h-full ${node.load > 80 ? 'bg-yellow-600' : 'bg-green-600'}`} 
                                style={{ width: `${node.load}%` }} 
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}