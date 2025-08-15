import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MathDisplay = ({ latex = '', displayMode = false }) => {
  return displayMode ? <BlockMath math={latex} /> : <InlineMath math={latex} />;
};

export default MathDisplay;
