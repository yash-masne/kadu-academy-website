// src/components/Header.jsx

import React, { useState, useEffect, useRef } from 'react'; // Keep useRef for lastScrollY, though not strictly needed for basic sticky
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  // New state to track if the user has scrolled past a certain point
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Function to handle scroll events
    const handleScroll = () => {
      // Check if current scroll position is past a threshold (e.g., 100px or hero banner height)
      // You can adjust this '100' value to be the exact height of your HeroBanner for a perfect transition
      if (window.scrollY > 100) { 
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Add scroll event listener when component mounts
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount


  // Determine logo source based on scroll state
  // When not scrolled (transparent over red banner), use white logo.
  // When scrolled (solid white header), use the original black/red logo (or black if you have one).
  const logoSrc = isScrolled 
    ? "/images/kadu_logo_2.png" // Your original logo with black 'A'/Academy, for white background
    : "/images/kadu_logo.png"; // Your all-white logo, for red background

  // Determine button text color based on scroll state
  const buttonTextColor = isScrolled ? "text-red-600" : "text-red-700"; // Red text on white button for solid state, darker red for transparent state if needed
  const buttonHoverBg = isScrolled ? "hover:bg-red-100" : "hover:bg-red-100"; // Always hover with light red background

  return (
    // Conditional classes based on isScrolled state
    // bg-transparent when not scrolled, bg-white with shadow when scrolled
    <header 
      className={`
        fixed inset-x-0 top-0 z-50 py-3 px-4 sm:px-6 lg:px-8 
        flex items-center justify-between 
        transition-all duration-300 ease-in-out
        ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}
      `}
    >
      {/* Logo on the left */}
      <div className="flex items-center">
        <img
          src={logoSrc} // Dynamically change logo source
          alt="Kadu Academy Logo"
          className="h-10 sm:h-12 w-auto" // Adjust size for header
        />
      </div>

      {/* Admin Login Button on the right */}
      <div>
        <button
          onClick={() => navigate('/admin-login')}
          className={`bg-white ${buttonTextColor} font-bold py-2 px-4 rounded-full shadow-md ${buttonHoverBg} transition duration-300 ease-in-out text-sm`}
        >
          Admin Login
        </button>
      </div>
    </header>
  );
};

export default Header;