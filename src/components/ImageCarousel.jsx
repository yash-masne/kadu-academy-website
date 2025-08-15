// src/components/ImageCarousel.jsx

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick'; // Import the Slider component
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Import slick-carousel CSS (essential for styling)
//import "slick-carousel/slick/slick.css";
//import "slick-carousel/slick/slick-theme.css";

const ImageCarousel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirestore();
    // Query ALL documents from 'studentDashboardImages', ordered by 'order'
    const q = query(collection(db, 'studentDashboardImages'), orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedImages = snapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl || 'https://placehold.co/600x200/cccccc/ffffff?text=Image+Missing',
        // Add other fields like title, subtitle if you intend to use them
      }));
      setImages(fetchedImages);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching carousel images:", err);
      setError("Failed to load carousel images.");
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // react-slick settings for auto-scrolling
  const settings = {
    dots: true,            // Show navigation dots
    infinite: true,        // Loop carousel indefinitely
    speed: 500,            // Transition speed (ms)
    slidesToShow: 1,       // Show one slide at a time
    slidesToScroll: 1,     // Scroll one slide at a time
    autoplay: true,        // Auto-play the carousel
    autoplaySpeed: 3000,   // Time between slides (ms)
    arrows: false,         // Hide navigation arrows
    cssEase: "linear"      // Linear transition for smooth scrolling
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-gray-100 rounded-lg shadow-md">
        <div className="spinner w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (images.length === 0) {
    return <div className="text-gray-500 text-center py-4">No carousel images available.</div>;
  }

  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden border border-red-200">
      <Slider {...settings}>
        {images.map((image) => (
          <div key={image.id}>
            <div className="relative w-full aspect-video flex items-center justify-center bg-gray-100">
              <img
                src={image.imageUrl}
                alt={`Carousel Image ${image.id}`}
                className="absolute inset-0 w-full h-full object-contain" // object-contain to prevent stretching/cropping
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x337/CCCCCC/808080?text=Image+Load+Error';
                }}
              />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageCarousel;