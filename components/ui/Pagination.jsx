"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isLoading 
}) {
  // Logic to determine which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // How many buttons to show max

    if (totalPages <= maxVisible) {
      // If few pages, show all: [1, 2, 3, 4]
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Complex logic for ... separators
      if (currentPage <= 3) {
        // Near start: [1, 2, 3, ..., 10]
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: [1, ..., 8, 9, 10]
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle: [1, ..., 4, 5, 6, ..., 10]
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null; // Don't show if only 1 page

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/10 bg-zinc-900/30 backdrop-blur-sm select-none">
      
      {/* 1. Context Info */}
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
        Viewing Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
      </div>

      {/* 2. Controls */}
      <div className="flex items-center gap-1">
        
        {/* First / Prev */}
        <div className="flex mr-2">
            <NavButton 
                onClick={() => onPageChange(1)} 
                disabled={currentPage === 1 || isLoading} 
                icon={ChevronsLeft} 
            />
            <NavButton 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={currentPage === 1 || isLoading} 
                icon={ChevronLeft} 
            />
        </div>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
                <PageButton 
                    key={idx} 
                    page={page} 
                    isActive={page === currentPage} 
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    isLoading={isLoading}
                />
            ))}
        </div>

        {/* Next / Last */}
        <div className="flex ml-2">
            <NavButton 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={currentPage === totalPages || isLoading} 
                icon={ChevronRight} 
            />
            <NavButton 
                onClick={() => onPageChange(totalPages)} 
                disabled={currentPage === totalPages || isLoading} 
                icon={ChevronsRight} 
            />
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function PageButton({ page, isActive, onClick, isLoading }) {
    const isEllipsis = page === '...';
    
    if (isEllipsis) {
        return (
            <div className="w-8 h-8 flex items-center justify-center text-zinc-600">
                <MoreHorizontal size={14} />
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                w-8 h-8 flex items-center justify-center text-xs font-mono border transition-all duration-200
                ${isActive 
                    ? "bg-white text-black border-white font-bold" 
                    : "bg-transparent text-zinc-400 border-transparent hover:border-white/20 hover:text-white hover:bg-white/5"}
            `}
        >
            {page}
        </button>
    );
}

function NavButton({ onClick, disabled, icon: Icon }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-8 h-8 flex items-center justify-center text-zinc-400 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:text-white hover:bg-white/10
            `}
        >
            <Icon size={14} />
        </button>
    );
}