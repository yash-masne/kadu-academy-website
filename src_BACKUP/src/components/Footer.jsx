import React from 'react';
import { useNavigate } from 'react-router-dom';





const Footer = () => {
    const navigate = useNavigate();



     const handleNavigation = (path) => {
        navigate(path);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };


    return (
        <footer className="bg-gray-900 text-gray-300 py-4 mt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Column 1: Logo and description */}
                <div className="flex flex-col items-start">
                    <div className="flex items-center mb-4">
                        <img
                            src="/images/kadu_logo.png"
                            alt="Kadu Academy Logo"
                            className="h-10 w-auto mr-2"
                        />
                        <h3 className="text-xl font-bold text-white">Kadu Academy</h3>
                    </div>
                    <p className="text-sm leading-relaxed">
                        Your ultimate platform for government exam preparation. Providing quality education for a brighter future.
                    </p>
                </div>
                {/* Column 2: Quick Links */}
                <div>
                     <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <button onClick={() => handleNavigation('/')} className="hover:text-red-400 transition-colors">
                                Home
                            </button>
                        </li>
                        <li><a href="#" className="hover:text-red-400 transition-colors">About Us</a></li>
                        <li>
                            <button onClick={() => handleNavigation('/Courses')} className="hover:text-red-400 transition-colors">
                                Courses
                            </button>
                        </li>
                        <li><a href="#" className="hover:text-red-400 transition-colors">Free Tests</a></li>
                    </ul>
                </div>
                {/* Column 3: Contact Us */}
                <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
                    <ul className="space-y-2 text-sm">
                        <li>Email: kaduacademy@gmail.com</li>
                        <li>Phone: +91 88300 20091</li>
                        <li>Address: Near School Number 9, Civil Lines, Khamgaon, Maharashtra, India</li>
                    </ul>
                </div>
                {/* Column 4: Follow Us */}
                <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
                    <ul className="flex space-x-4">
                        <li><a href="#" className="text-gray-400 hover:text-white">Facebook</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white">Twitter</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white">Instagram</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white">LinkedIn</a></li>
                    </ul>
                </div>
            </div>
            <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-gray-700">
                &copy; {new Date().getFullYear()} Kadu Academy. All rights reserved.
                <p className="mt-1">Developed by Yash Masne</p>
            </div>
        </footer>
    );
};

export default Footer;