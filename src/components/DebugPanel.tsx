'use client';

import { useState, useEffect } from 'react';
import { Bug, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElementInfo {
  tagName: string;
  id: string;
  classList: string[];
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
    border: string;
  };
  dimensions: {
    width: number;
    height: number;
  };
  path: string;
}

export function DebugPanel() {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setSelectedElement(null);
      setHoveredElement(null);
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.debug-panel')) return;
      setHoveredElement(target);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.debug-panel')) return;
      
      e.preventDefault();
      e.stopPropagation();

      const computed = window.getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      // Build element path
      const path: string[] = [];
      let current: HTMLElement | null = target;
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        if (current.id) selector += `#${current.id}`;
        if (current.classList.length > 0) {
          selector += `.${Array.from(current.classList).slice(0, 2).join('.')}`;
        }
        path.unshift(selector);
        current = current.parentElement;
      }

      setSelectedElement({
        tagName: target.tagName.toLowerCase(),
        id: target.id || '(none)',
        classList: Array.from(target.classList),
        computedStyles: {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          padding: computed.padding,
          margin: computed.margin,
          borderRadius: computed.borderRadius,
          border: computed.border,
        },
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        path: path.join(' > '),
      });
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isActive]);

  // Highlight hovered element
  useEffect(() => {
    if (!hoveredElement || !isActive) return;

    const originalOutline = hoveredElement.style.outline;
    hoveredElement.style.outline = '2px solid #00F59B';

    return () => {
      hoveredElement.style.outline = originalOutline;
    };
  }, [hoveredElement, isActive]);

  const copyToClipboard = () => {
    if (!selectedElement) return;
    
    const feedback = `
## UI Element Feedback

**Element:** ${selectedElement.tagName}
**Classes:** ${selectedElement.classList.join(', ') || '(none)'}
**Path:** ${selectedElement.path}

**Current Styles:**
- Color: ${selectedElement.computedStyles.color}
- Background: ${selectedElement.computedStyles.backgroundColor}
- Font Size: ${selectedElement.computedStyles.fontSize}
- Font Weight: ${selectedElement.computedStyles.fontWeight}
- Padding: ${selectedElement.computedStyles.padding}
- Border Radius: ${selectedElement.computedStyles.borderRadius}
- Dimensions: ${selectedElement.dimensions.width}x${selectedElement.dimensions.height}px

**Requested Change:**
[Describe what you want changed here]
    `.trim();

    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsActive(!isActive)}
        className="fixed bottom-6 right-6 z-[100] p-3 rounded-full shadow-lg transition-all"
        style={{ 
          backgroundColor: isActive ? '#00F59B' : '#1a1a1a',
          color: isActive ? '#000000' : '#a1a1aa'
        }}
        title="Toggle Debug Mode"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug panel */}
      {isActive && (
        <div className="debug-panel fixed bottom-20 right-6 z-[100] w-80 bg-black border border-surface-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" style={{ color: '#00F59B' }} />
              <span className="text-sm font-semibold text-white">Debug Mode</span>
            </div>
            <button
              onClick={() => setIsActive(false)}
              className="p-1 hover:bg-surface-800 rounded text-surface-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {!selectedElement ? (
              <p className="text-sm text-surface-500 text-center py-4">
                Click on any element to inspect it
              </p>
            ) : (
              <div className="space-y-4">
                {/* Element info */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Element
                  </h4>
                  <code className="text-sm" style={{ color: '#00F59B' }}>&lt;{selectedElement.tagName}&gt;</code>
                </div>

                {/* Classes */}
                {selectedElement.classList.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                      Classes
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedElement.classList.map((cls, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-surface-800 text-xs text-surface-300 rounded"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styles */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Computed Styles
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Color</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border border-surface-600"
                          style={{ backgroundColor: selectedElement.computedStyles.color }}
                        />
                        <span className="text-surface-300 font-mono">
                          {selectedElement.computedStyles.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Background</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border border-surface-600"
                          style={{ backgroundColor: selectedElement.computedStyles.backgroundColor }}
                        />
                        <span className="text-surface-300 font-mono truncate max-w-[120px]">
                          {selectedElement.computedStyles.backgroundColor}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Font Size</span>
                      <span className="text-surface-300 font-mono">
                        {selectedElement.computedStyles.fontSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Font Weight</span>
                      <span className="text-surface-300 font-mono">
                        {selectedElement.computedStyles.fontWeight}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Padding</span>
                      <span className="text-surface-300 font-mono truncate max-w-[120px]">
                        {selectedElement.computedStyles.padding}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Border Radius</span>
                      <span className="text-surface-300 font-mono">
                        {selectedElement.computedStyles.borderRadius}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Size</span>
                      <span className="text-surface-300 font-mono">
                        {selectedElement.dimensions.width} × {selectedElement.dimensions.height}px
                      </span>
                    </div>
                  </div>
                </div>

                {/* Path */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Path
                  </h4>
                  <code className="text-[10px] text-surface-400 break-all">
                    {selectedElement.path}
                  </code>
                </div>

                {/* Copy button */}
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 py-2 text-black text-sm font-semibold rounded transition-colors"
                  style={{ backgroundColor: '#00F59B' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#33FDB5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00F59B'}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Feedback Template
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="px-4 py-3 border-t border-surface-800 bg-surface-900">
            <p className="text-[10px] text-surface-500">
              Click "Copy Feedback Template" then paste it in the chat with your requested change.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

