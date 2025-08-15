// src/components/LatexToolbar.jsx

import React from 'react';

const LatexToolbar = ({ onAddLatex }) => (
    <div className="flex flex-wrap gap-2">
        <button onClick={() => onAddLatex('\\frac{numerator}{denominator}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Fraction</button>
        <button onClick={() => onAddLatex('\\sum_{lower}^{upper}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Sum</button>
        <button onClick={() => onAddLatex('\\sqrt{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Sqrt</button>
        <button onClick={() => onAddLatex('\\alpha')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Alpha</button>
        <button onClick={() => onAddLatex('\\textbf{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Bold</button>
        <button onClick={() => onAddLatex('\\text{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Text</button>
        <button onClick={() => onAddLates('\\times')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">×</button>
        <button onClick={() => onAddLatex('\\div')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">÷</button>
        <button onClick={() => onAddLatex('\\approx')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≈</button>
        <button onClick={() => onAddLatex('\\implies')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">⇒</button>
        <button onClick={() => onAddLatex('\\iff')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">⇔</button>
        <button onClick={() => onAddLatex('\\therefore')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">∴</button>
        <button onClick={() => onAddLatex('\\because')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">∵</button>
        <button onClick={() => onAddLatex('\\geq')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≥</button>
        <button onClick={() => onAddLatex('\\leq')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≤</button>
    </div>
);

export default LatexToolbar;