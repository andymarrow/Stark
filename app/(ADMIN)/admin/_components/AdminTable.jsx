"use client";

export default function AdminTable({ headers, children }) {
  return (
    <div className="border border-white/10 bg-black overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-zinc-500 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminRow({ children, className }) {
    return (
        <tr className={`hover:bg-white/5 transition-colors group ${className}`}>
            {children}
        </tr>
    )
}

export function AdminCell({ children, className, mono }) {
    return (
        <td className={`px-6 py-4 whitespace-nowrap ${mono ? 'font-mono text-xs' : ''} ${className}`}>
            {children}
        </td>
    )
}