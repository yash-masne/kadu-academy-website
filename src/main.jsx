// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Your main stylesheet with Tailwind
import 'katex/dist/katex.min.css'; // KaTeX CSS

// *** ADD THESE TWO LINES (new paths) ***
import './slick.css';      // Path to the manually copied slick.css
import './slick-theme.css'; // Path to the manually copied slick-theme.css

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);