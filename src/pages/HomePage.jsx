// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import ImageCarousel from '../components/ImageCarousel';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { FaGooglePlay } from 'react-icons/fa';

// --- Core Components ---

// Placeholder for Student Achievement Carousel
const StudentAchievementCarousel = () => (
    <div className="bg-white p-4 rounded-lg shadow-md my-4 text-center border border-gray-200">
        <h3 className="text-lg font-bold text-gray-700 mb-2">Student Achievements</h3>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500">
            <p>Student Achievement Carousel placeholder</p>
        </div>
    </div>
);

// Component for the main Hero/Banner section
// Updated to accept 'navigate' as a prop
const HeroBanner = ({ navigate }) => {
    const imageUrl = "https://placehold.co/1200x300/FF0000/FFFFFF?text=Kadu+Academy+Excellence";
    
    return (
        <section className="bg-red-700 text-white w-full py-6 md:py-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between z-10 relative">
                <div className="flex justify-start items-center p-0 md:pr-12 md:w-1/3">
                    <img 
                        src="/images/kadu_logo_2.png"
                        alt="Kadu Academy Logo"
                        className="w-full max-w-[100px] sm:max-w-[150px] md:max-w-[180px] lg:max-w-[250px] h-auto rounded-lg"
                    />
                </div>
                <div className="text-center md:text-left md:w-2/3 mt-4 md:mt-0 md:ml-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 animate-fade-in-down">
                        <span className="block text-white">Unlock Your</span>
                        <span className="block text-yellow-300">True Potential</span>
                        <span className="block text-white">with Kadu Academy!</span>
                    </h1>
                    <p className="text-xs sm:text-sm mb-4 opacity-90 mx-auto md:mx-0">
                        Your journey to success starts here. Comprehensive courses, expert guidance, and proven results.
                    </p>
                    {/* Added an onClick handler to navigate to the Courses page */}
                    <button
                        onClick={() => navigate('/courses')}
                        className="bg-white text-red-700 font-bold py-2 px-6 rounded-full shadow-lg hover:bg-red-100 transition duration-300 transform hover:scale-105">
                        Explore Our Courses
                    </button>
                </div>
            </div>
            <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
        </section>
    );
};

// Component for "Award Winning Results" section
const AwardWinningResults = () => {
    const studentResults = [
        { id: 1, name: 'Viraj Patil', avatar: '/images/st1.jpg', score: '96.27%', ExamType: 'MBA-CET' },
        { id: 2, name: 'Rishika Nima', avatar: '/images/st2.jpg', score: 'IBPS-Clerk', ExamType: 'Government Selection' },
        { id: 3, name: 'Akash Raut', avatar: '/images/st3.jpg', score: 'RRB-PO', ExamType: 'Government Selection' },
        { id: 4, name: 'Sudarshan Wagh', avatar: '/images/st4.jpg', score: 'SBI-Associate', ExamType: 'Government Selection' },
        { id: 5, name: 'Siddharth Suradkar', avatar: '/images/st5.jpg', score: 'Railway G-D', ExamType: 'Government Selection' },
        { id: 6, name: 'Yuvraj Dhabade', avatar: '/images/st6.jpg', score: '94.63%', ExamType: 'MBA-CET' },
    ];

    return (
        <section className="py-12 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Award Winning Results in 2024-25</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center">
                    {studentResults.map(student => (
                        <div key={student.id} className="flex flex-col items-center p-4 rounded-xl transition-all duration-300 ease-in-out hover:bg-red-50 hover:shadow-xl hover:scale-105 cursor-pointer">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-2 border-red-500 mb-2">
                                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover"/>
                            </div>
                            <p className="text-md font-semibold text-gray-800">{student.name}</p>
                            <p className="text-sm text-red-600">{student.score}</p>
                            <p className="text-xs text-gray-600">{student.ExamType}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Dynamic Advertisement Banner (Fetches from Firestore's studentDashboardImages)
const AdvertisementBanner = () => {
    const [adData, setAdData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const db = getFirestore();
        const q = query(
            collection(db, 'studentDashboardImages'),
            orderBy('order', 'asc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                setAdData({
                    imageUrl: docData.imageUrl || 'https://placehold.co/600x200/FF0000/FFFFFF?text=Default+Ad',
                });
                setLoading(false);
            } else {
                setAdData(null);
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching dashboard images:", err);
            setError("Failed to load ads. Please check network.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32 bg-gray-100 rounded-lg shadow-md my-4">
                <div className="spinner w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (!adData) {
        return <div className="text-gray-500 text-center py-4">No dashboard images available.</div>;
    }

    return (
        <section className="mb-8">
            <div className="w-full rounded-lg overflow-hidden shadow-lg border border-red-200 cursor-pointer">
                <img 
                    src={adData.imageUrl} 
                    alt="Kadu Academy Advertisement" 
                    className="w-full h-auto object-contain"
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/600x337/CCCCCC/808080?text=Image+Load+Error';
                    }}
                />
            </div>
        </section>
    );
};

// Component for "Why Choose Kadu Academy"
const WhyChooseKaduAcademy = () => {
    const reasons = [
        { icon: '💡', title: 'Expert Educators', description: 'Learn from industry veterans and top-tier subject matter experts.' },
        { icon: '🎯', title: 'Targeted Curriculum', description: 'Precisely designed courses aligned with exam patterns and syllabi.' },
        { icon: '📈', title: 'Proven Success Record', description: 'Join a community with a history of remarkable achievements and top ranks.' },
        { icon: '📱', title: 'Flexible Learning', description: 'Access content anytime, anywhere, on any device for ultimate convenience.' },
        { icon: '🤝', title: 'Dedicated Support', description: 'Get personalized guidance and doubt resolution from our mentors.' },
        { icon: '🔗', title: 'Integrated Platform', description: 'Seamless experience with study materials, tests, and live classes in one place.' },
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-10">Why Choose Kadu Academy?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reasons.map((reason, index) => (
                        <div key={index} className="flex flex-col items-center p-6 bg-red-50 rounded-lg shadow-md border border-red-100 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 hover:translate-y-[-2px] cursor-pointer">
                            <span className="text-5xl mb-4 text-red-700">{reason.icon}</span>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{reason.title}</h3>
                            <p className="text-sm text-gray-600">{reason.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Component for the blue download banner
const DownloadAppBanner = () => {
    return (
        <section className="w-full bg-red-700 text-white py-12 px-4 rounded-lg text-center shadow-lg my-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                    Try Our 10+ Free Tests on Kadu Academy App!
                </h2>
                <button className="inline-flex items-center bg-white text-red-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-100 transition duration-300 transform hover:scale-105">
                    <FaGooglePlay className="h-6 w-6 mr-2" />
                    App coming soon
                </button>
            </div>
        </section>
    );
};


// Component for the Footer

// --- Main HomePage Component ---
const HomePage = () => {
    // Removed all previous user-related states and effects as per requirement
    const navigate = useNavigate();
    // Main render method
    return (
        <div className="min-h-screen bg-white relative">

            {/* TOP-LEFT LOGO - ADD THIS BLOCK */}
            <img
                src="/images/kadu_logo.png" // Path to your logo in public/images/
                alt="Kadu Academy Logo"
                className="absolute top-4 left-4 z-50 h-10 w-auto sm:h-12" // Positioning and size
            />

            {/* Admin Login Button - positioned absolutely */}
            <button
                onClick={() => navigate('/admin-login')}
                className="absolute top-4 right-4 z-50 bg-white text-red-600 font-bold py-2 px-4 rounded-full shadow-md hover:bg-yellow-400 hover:text-black transition duration-300 ease-in-out text-sm"
            >
                Admin Login
            </button>

            {/* Top Hero Banner (Red + White Theme) */}
            <HeroBanner navigate={navigate} />

            {/* Main content area, centered with max-w */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* THIS SECTION WILL NOW SHOW YOUR AUTO-SCROLLING IMAGES */}
                <section className="mb-8">
                    <ImageCarousel />
                </section>

                {/* Award Winning Results */}
                <AwardWinningResults />

                {/* Why Choose Kadu Academy */}
                <WhyChooseKaduAcademy />

                {/* Download App Banner */}
                <DownloadAppBanner />
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default HomePage;