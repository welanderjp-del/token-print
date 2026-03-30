import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Printer, RotateCcw, Check, ChevronRight, ChevronLeft, Plus, Minus, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import monsterData from './monster-tokens.json';
import sourceNames from './source-names.json';

// Types
interface Monster {
  name: string;
  source: string;
  size: string;
  tokenUrl: string;
}

interface SelectedToken extends Monster {
  quantity: number;
  id: string;
}

type PaperSize = 'A4' | 'A3';
type PrintMode = 'single' | 'double' | 'folded';

export default function App() {
  const [search, setSearch] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>(() => {
    const saved = localStorage.getItem('selectedTokens');
    return saved ? JSON.parse(saved) : [];
  });
  const [previewMonster, setPreviewMonster] = useState<Monster | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Print Settings
  const [paperSize, setPaperSize] = useState<PaperSize>(() => {
    const saved = localStorage.getItem('paperSize');
    return (saved as PaperSize) || 'A4';
  });
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    const saved = localStorage.getItem('showGrid');
    return saved !== null ? saved === 'true' : true;
  });
  const [printMode, setPrintMode] = useState<PrintMode>(() => {
    const saved = localStorage.getItem('printMode');
    return (saved as PrintMode) || 'single';
  });
  const [showLetters, setShowLetters] = useState<boolean>(() => {
    const saved = localStorage.getItem('showLetters');
    return saved !== null ? saved === 'true' : false;
  });
  const [separateSizes, setSeparateSizes] = useState<boolean>(() => {
    const saved = localStorage.getItem('separateSizes');
    return saved !== null ? saved === 'true' : false;
  });
  
  // Reset state
  const [resetConfirm, setResetConfirm] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('selectedTokens', JSON.stringify(selectedTokens));
    localStorage.setItem('paperSize', paperSize);
    localStorage.setItem('showGrid', String(showGrid));
    localStorage.setItem('printMode', printMode);
    localStorage.setItem('showLetters', String(showLetters));
    localStorage.setItem('separateSizes', String(separateSizes));
  }, [selectedTokens, paperSize, showGrid, printMode, showLetters, separateSizes]);

  // Filtered monsters
  const filteredMonsters = useMemo(() => {
    let list = monsterData as Monster[];
    if (search) {
      list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (showSelectedOnly) {
      list = list.filter(m => selectedTokens.some(st => st.name === m.name && st.source === m.source && st.size === m.size));
    }
    return list.slice(0, 150); // Limit display for performance
  }, [search, showSelectedOnly, selectedTokens]);

  const toggleMonster = (monster: Monster) => {
    const existing = selectedTokens.find(st => st.name === monster.name && st.source === monster.source && st.size === monster.size);
    if (existing) {
      setSelectedTokens(selectedTokens.filter(st => st !== existing));
    } else {
      setSelectedTokens([...selectedTokens, { ...monster, quantity: 1, id: `${monster.name}-${monster.source}-${monster.size}` }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedTokens(selectedTokens.map(st => 
      st.id === id ? { ...st, quantity: Math.max(1, st.quantity + delta) } : st
    ));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleReset = () => {
    if (resetConfirm) {
      setSelectedTokens([]);
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getFullSourceName = (abbr: string) => {
    return (sourceNames as Record<string, string>)[abbr] || abbr;
  };

  const getSizeInInches = (sizeStr: string) => {
    if (sizeStr.includes('Gargantuan')) return 4;
    if (sizeStr.includes('Huge')) return 3;
    if (sizeStr.includes('Large')) return 2;
    return 1; // Tiny, Small, Medium
  };

  return (
    <div className="h-[100dvh] bg-stone-100 text-stone-900 font-sans flex flex-col print:h-auto print:p-0 print:m-0" onMouseMove={handleMouseMove}>
      {/* Print View (Hidden in UI, visible in print) */}
      <PrintLayout 
        selectedTokens={selectedTokens} 
        paperSize={paperSize} 
        showGrid={showGrid} 
        printMode={printMode} 
        showLetters={showLetters} 
        separateSizes={separateSizes}
      />

      {/* Header */}
      <header className="bg-white border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-50 print-hidden">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = 'https://skolechips.dk/?dnd=true'}>
          <img 
            src="https://res.cloudinary.com/dtw8jfk0k/image/upload/v1774706790/d4b01caa-2d0a-405a-b893-1a04cfefab27_qf9jsx.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-bold tracking-tight text-stone-800">D&D Tokens</h1>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden print-hidden">
        {/* Left Side: Monster List */}
        <div className="w-1/2 flex flex-col border-r border-stone-200 bg-white">
          <div className="p-4 border-b border-stone-100 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Søg efter monstre..." 
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSelectedOnly ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {showSelectedOnly ? 'Vis alle' : 'Vis valgte'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredMonsters.map((monster) => {
              const isSelected = selectedTokens.some(st => st.name === monster.name && st.source === monster.source && st.size === monster.size);
              return (
                <div 
                  key={`${monster.name}-${monster.source}-${monster.size}`}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-orange-50 border-orange-100' : 'hover:bg-stone-50'
                  }`}
                  onClick={() => toggleMonster(monster)}
                  onMouseEnter={() => setPreviewMonster(monster)}
                  onMouseLeave={() => setPreviewMonster(null)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-orange-500 border-orange-500' : 'border-stone-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-800 truncate">{monster.name}</h3>
                    <p className="text-xs text-stone-500 truncate">
                      {getFullSourceName(monster.source)} • {monster.size}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selection & Settings */}
        <div className="w-1/2 flex flex-col bg-stone-50 overflow-y-auto custom-scrollbar">
          {/* Print Menu */}
          <div className="p-6 bg-white border-b border-stone-200 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Papirstørrelse</label>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                  {(['A4', 'A3'] as PaperSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setPaperSize(size)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        paperSize === size ? 'bg-white shadow-sm text-orange-600' : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 invisible">Spacer</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      showGrid ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-stone-200 text-stone-500'
                    }`}
                  >
                    {showGrid ? 'Grid Til' : 'Grid Fra'}
                  </button>
                  <button
                    onClick={() => setSeparateSizes(!separateSizes)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      separateSizes ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-stone-200 text-stone-500'
                    }`}
                  >
                    Adskil størrelser
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Print Tilstand</label>
              <div className="flex bg-stone-100 p-1 rounded-lg">
                {(['single', 'double', 'folded'] as PrintMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPrintMode(mode)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                      printMode === mode ? 'bg-white shadow-sm text-orange-600' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {mode === 'single' ? 'Enkeltside' : mode === 'double' ? 'Dobbeltside' : 'Foldede'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showLetters" 
                  checked={showLetters} 
                  onChange={() => setShowLetters(!showLetters)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label htmlFor="showLetters" className="text-sm font-medium text-stone-700">Vis bogstaver (A, B, C...)</label>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleReset}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    resetConfirm ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  {resetConfirm ? 'Sikker?' : 'Nulstil'}
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={selectedTokens.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
                >
                  <Printer className="w-4 h-4" />
                  Print Tokens
                </button>
              </div>
            </div>
          </div>

          {/* Selected Tokens List */}
          <div className="p-6 space-y-4">
            {selectedTokens.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                <Printer className="w-12 h-12 opacity-20" />
                <p>Ingen tokens valgt endnu</p>
              </div>
            ) : (
              selectedTokens.map((token) => (
                <div key={token.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4">
                  <img src={token.tokenUrl} alt={token.name} className="w-16 h-16 rounded-full border border-stone-100" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-800">{token.name}</h4>
                    <p className="text-xs text-stone-500">{token.size}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-50 p-1 rounded-lg border border-stone-200">
                    <button onClick={() => updateQuantity(token.id, -1)} className="p-1 hover:bg-white rounded transition-colors text-stone-400 hover:text-orange-600">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-stone-700">{token.quantity}</span>
                    <button onClick={() => updateQuantity(token.id, 1)} className="p-1 hover:bg-white rounded transition-colors text-stone-400 hover:text-orange-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => toggleMonster(token)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Preview Tooltip */}
      <AnimatePresence>
        {previewMonster && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed pointer-events-none z-[100] shadow-2xl rounded-full border-4 border-white bg-white overflow-hidden print-hidden"
            style={{ 
              left: mousePos.x + 220 > window.innerWidth ? mousePos.x - 220 : mousePos.x + 20, 
              top: mousePos.y + 220 > window.innerHeight ? mousePos.y - 220 : mousePos.y + 20,
              width: 200,
              height: 200
            }}
          >
            <img 
              src={previewMonster.tokenUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          @page {
            margin: 0;
            size: ${paperSize === 'A4' ? '210mm 297mm' : '297mm 420mm'};
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hidden {
            display: none !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            position: relative;
            width: ${paperSize === 'A4' ? '210mm' : '297mm'};
            height: ${paperSize === 'A4' ? '297mm' : '420mm'};
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

function PrintLayout({ selectedTokens, paperSize, showGrid, printMode, showLetters, separateSizes }: { 
  selectedTokens: SelectedToken[], 
  paperSize: PaperSize, 
  showGrid: boolean, 
  printMode: PrintMode,
  showLetters: boolean,
  separateSizes: boolean
}) {
  const cols = paperSize === 'A4' ? 7 : 10;
  const rows = paperSize === 'A4' ? 10 : 15;

  const getSizeInInches = (sizeStr: string) => {
    if (sizeStr.includes('Gargantuan')) return 4;
    if (sizeStr.includes('Huge')) return 3;
    if (sizeStr.includes('Large')) return 2;
    return 1;
  };

  // Flatten and calculate positions
  const pages = useMemo(() => {
    const allPages: { token: SelectedToken, letter: string, x: number, y: number, size: number }[][] = [];
    let currentLetterIdx = 0;

    const tokensToPlace = [...selectedTokens];
    if (tokensToPlace.length === 0) return [];
    
    // Group by size if separateSizes is true
    const groups = separateSizes 
      ? Array.from(new Set(tokensToPlace.map(t => getSizeInInches(t.size))))
          .sort((a, b) => b - a) // Sort by size descending
          .map(size => tokensToPlace.filter(t => getSizeInInches(t.size) === size))
      : [tokensToPlace];

    groups.forEach(group => {
      if (group.length === 0) return;
      let currentPage: { token: SelectedToken, letter: string, x: number, y: number, size: number }[] = [];
      let grid = Array(rows).fill(0).map(() => Array(cols).fill(false));

      group.forEach((st) => {
        const size = getSizeInInches(st.size);
        const h = printMode === 'folded' ? size * 2 : size;
        const w = size;

        for (let q = 0; q < st.quantity; q++) {
          const letter = String.fromCharCode(65 + (currentLetterIdx % 26));
          currentLetterIdx++;
          
          let placed = false;
          for (let r = 0; r <= rows - h; r++) {
            for (let c = 0; c <= cols - w; c++) {
              let free = true;
              for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                  if (grid[r + i][c + j]) {
                    free = false;
                    break;
                  }
                }
                if (!free) break;
              }

              if (free) {
                for (let i = 0; i < h; i++) {
                  for (let j = 0; j < w; j++) {
                    grid[r + i][c + j] = true;
                  }
                }
                currentPage.push({ token: st, letter, x: c, y: r, size });
                placed = true;
                break;
              }
            }
            if (placed) break;
          }

          if (!placed) {
            // New page for the same group
            allPages.push(currentPage);
            currentPage = [{ token: st, letter, x: 0, y: 0, size }];
            grid = Array(rows).fill(0).map(() => Array(cols).fill(false));
            for (let i = 0; i < h; i++) {
              for (let j = 0; j < w; j++) {
                grid[i][j] = true;
              }
            }
          }
        }
      });
      if (currentPage.length > 0) {
        allPages.push(currentPage);
      }
    });

    return allPages;
  }, [selectedTokens, printMode, cols, rows, separateSizes]);

  if (pages.length === 0) return null;

  const renderToken = (p: { token: SelectedToken, letter: string, x: number, y: number, size: number }, idx: number, isBackSide = false) => {
    const { token, letter, x, y, size } = p;
    
    const finalX = isBackSide ? (cols - x - size) : x;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${finalX}in`,
      top: `${y}in`,
      width: `${size}in`,
      height: `${size}in`,
      transform: isBackSide ? 'scaleX(-1)' : 'none',
    };

    if (printMode === 'folded') {
      return (
        <React.Fragment key={`${idx}-${isBackSide}`}>
          {/* Top part (mirrored vertically) */}
          <div style={{ ...style, transform: 'scaleY(-1)' }} className="flex items-center justify-center border-b border-dashed border-stone-300">
            <img src={token.tokenUrl} alt={token.name} className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
            {showLetters && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-white border border-black rounded-full flex items-center justify-center text-[9px] font-bold z-10 transform scaleY(-1)">
                {letter}
              </div>
            )}
          </div>
          {/* Bottom part (normal) */}
          <div style={{ ...style, top: `${y + size}in` }} className="flex items-center justify-center">
            <img src={token.tokenUrl} alt={token.name} className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
            {showLetters && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-white border border-black rounded-full flex items-center justify-center text-[9px] font-bold z-10">
                {letter}
              </div>
            )}
          </div>
        </React.Fragment>
      );
    }

    return (
      <div key={`${idx}-${isBackSide}`} style={style} className="flex items-center justify-center">
        <img src={token.tokenUrl} alt={token.name} className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
        {showLetters && (
          <div className="absolute top-1 left-1 w-5 h-5 bg-white border border-black rounded-full flex items-center justify-center text-[9px] font-bold z-10">
            {letter}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hidden print:block bg-white p-0 m-0">
      {pages.map((pageTokens, pageIdx) => (
        <React.Fragment key={pageIdx}>
          {/* Front Side */}
          <div className="print-page relative overflow-hidden bg-white box-border" 
               style={{ 
                 width: paperSize === 'A4' ? '210mm' : '297mm', 
                 height: paperSize === 'A4' ? '297mm' : '420mm',
                 padding: '10mm',
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center'
               }}>
            <div className="relative" style={{ width: `${cols}in`, height: `${rows}in` }}>
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none" style={{ 
                  backgroundImage: `linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)`,
                  backgroundSize: '1in 1in',
                  width: `${cols}in`,
                  height: `${rows}in`,
                  borderRight: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                  opacity: 0.5
                }} />
              )}
              {pageTokens.map((p, i) => renderToken(p, i))}
            </div>
          </div>

          {/* Back Side for Double Sided */}
          {printMode === 'double' && (
            <div className="print-page relative overflow-hidden bg-white box-border" 
                 style={{ 
                   width: paperSize === 'A4' ? '210mm' : '297mm', 
                   height: paperSize === 'A4' ? '297mm' : '420mm',
                   padding: '10mm',
                   display: 'flex',
                   justifyContent: 'center',
                   alignItems: 'center'
                 }}>
              <div className="relative" style={{ width: `${cols}in`, height: `${rows}in` }}>
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none" style={{ 
                    backgroundImage: `linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)`,
                    backgroundSize: '1in 1in',
                    width: `${cols}in`,
                    height: `${rows}in`,
                    borderRight: '1px solid #ccc',
                    borderBottom: '1px solid #ccc',
                    opacity: 0.5
                  }} />
                )}
                {pageTokens.map((p, i) => renderToken(p, i, true))}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
