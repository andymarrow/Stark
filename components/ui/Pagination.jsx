"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isLoading 
}) {
  // Logic to determine which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; 

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t transition-colors duration-300 select-none
      border-zinc-200 bg-white/50 
      dark:border-white/10 dark:bg-zinc-900/30 backdrop-blur-sm">
      
      {/* 1. Context Info */}
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        Viewing Page <span className="font-bold text-zinc-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span>
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
            <div className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
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
                    // Light Mode: Black Block / Dark Mode: White Block
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white font-bold" 
                    // Light Mode: Gray Text / Dark Mode: Gray Text
                    : "bg-transparent text-zinc-500 border-transparent hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white dark:hover:bg-white/5"}
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
                w-8 h-8 flex items-center justify-center transition-colors
                text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100
                dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
            `}
        >
            <Icon size={14} />
        </button>
    );
}