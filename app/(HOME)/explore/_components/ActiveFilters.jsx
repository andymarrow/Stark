import { X } from "lucide-react";

export default function ActiveFilters({ filters, setFilters }) {
  
  // Helpers to remove specific items
  const removeStack = (item) => setFilters({ ...filters, stack: filters.stack.filter(i => i !== item) });
  const removeCategory = (item) => setFilters({ ...filters, category: filters.category.filter(i => i !== item) });
  const resetRegion = () => setFilters({ ...filters, region: null });
  const resetQuality = () => setFilters({ ...filters, minQuality: 0 });
  const resetAll = () => setFilters({ region: null, stack: [], category: [], search: "", minQuality: 0, forHire: false });

  // Calculate if any filter is active
  const hasActiveFilters = filters.region || filters.stack.length > 0 || filters.category.length > 0 || filters.minQuality > 0 || filters.search;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {filters.region && (
        <Badge label={`Region: ${filters.region.toUpperCase()}`} onRemove={resetRegion} />
      )}
      
      {filters.stack.map(s => (
        <Badge key={s} label={`Stack: ${s}`} onRemove={() => removeStack(s)} />
      ))}

      {filters.category.map(c => (
        <Badge key={c} label={`Cat: ${c}`} onRemove={() => removeCategory(c)} />
      ))}

      {filters.minQuality > 0 && (
        <Badge label={`Score > ${filters.minQuality}`} onRemove={resetQuality} />
      )}

      {filters.search && (
        <Badge label={`Search: "${filters.search}"`} onRemove={() => setFilters({...filters, search: ""})} />
      )}
      
      <button 
        onClick={resetAll}
        className="text-[10px] font-mono text-muted-foreground hover:text-destructive underline ml-auto transition-colors"
      >
        RESET_ALL()
      </button>
    </div>
  );
}

function Badge({ label, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-secondary/50 border border-border px-2 py-1 text-[10px] font-mono text-foreground hover:border-accent/50 transition-colors">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:text-accent transition-colors">
        <X size={10} />
      </button>
    </div>
  );
}