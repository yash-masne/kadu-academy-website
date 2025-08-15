import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { FaGooglePlay } from 'react-icons/fa';

// Define the courses data with updated images
const courses = [
    {
        id: 1,
        title: 'Banking Exams',
        description: 'Comprehensive preparation for IBPS, SBI, and other national banking exams.',
        imageUrl: '/images/bank_exams.png',
        category: 'Banking'
    },
    {
        id: 2,
        title: 'Railway Exams',
        description: 'Targeted coaching for Railway Group D, NTPC, and other technical posts.',
        imageUrl: '/images/railway_exams.png',
        category: 'Government'
    },
    {
        id: 3,
        title: 'Scholarship Exams',
        description: 'Advanced training for various state and national scholarship programs.',
        imageUrl: '/images/scholorship_exams.png',
        category: 'Scholarship'
    },
    {
        id: 4,
        title: 'Navodaya Entrance',
        description: 'Focused curriculum to help students ace the Navodaya Vidyalaya entrance test.',
        imageUrl: '/images/navodya_exams.png',
        category: 'School'
    },
    {
        id: 5,
        title: 'MBA-CET',
        description: 'Intensive crash course to master all sections and secure top scores in MBA-CET.',
        imageUrl: '/images/MBA_CET_exams.png',
        category: 'Management'
    },
    {
        id: 6,
        title: 'Police Bharti',
        description: 'Rigorous preparation for physical and written exams for police recruitment.',
        imageUrl: '/images/police_exams.png',
        category: 'Government'
    },
    {
        id: 7,
        title: 'Staff Selection (SSC)',
        description: 'Complete coaching for SSC CGL, CHSL, and other Staff Selection Commission exams.',
        imageUrl: '/images/ssc_exams.png',
        category: 'Government'
    },
    {
        id: 8,
        title: 'Aptitude & Reasoning',
        description: 'Master the core skills required for all competitive exams and interviews.',
        imageUrl: '/images/aptitude_exams.png',
        category: 'General'
    }
];

const CoursesPage = () => {
    
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            
            {/* Header: Fixed at the top */}
            <header className="bg-red-700 text-white p-6 shadow-md w-full z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl sm:text-3xl font-bold">Our Courses</h1>
                    <button
                        onClick={() => {
                            navigate('/');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white text-red-700 font-bold py-2 px-4 rounded-full shadow-md hover:bg-red-100 transition-all duration-300 hover:scale-105"
                    >
                        Go to Home
                    </button>
                </div>
            </header>

            {/* Content Wrapper to handle scrolling */}
            <div className="flex-grow overflow-y-auto mt-2">
                {/* Main Content Area: Padding top to account for the fixed header */}
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* New Introductory Section */}
                   <section className="text-center mb-12 mt-[-1rem]">
        <h2 className="text-4xl font-extrabold text-red-700 mb-4">
                            Discover Your Path to Success
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Explore our wide range of expertly crafted courses designed to help you ace your competitive exams. From government selections to scholarship programs, we have a course for every ambition.
                        </p>
                    </section>
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map(course => (
                            <div
                                key={course.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 cursor-pointer flex flex-col"
                                //onClick={() => navigate(`/courses/${course.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        navigate(`/courses/${course.id}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <img
    src={course.imageUrl}
    alt={course.title}
    title={course.title}
    className="w-130 h-58 object-contain"
    loading="lazy"
/>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2 py-2 px-4 mx-auto">{course.title}</h2>
                                    <p className="text-gray-600 text-sm mb-4 flex-grow">{course.description}</p>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* New promotional section */}
                    <section className="mt-12 text-center bg-red-700 text-white p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold mb-2">Unlock More with Our App</h3>
                        <p className="text-lg">
                            Download our app to access free tests and make offline payments for paid courses. 
                            Live streaming is also coming soon!
                        </p>
                        <div 
                            className="inline-flex items-center mt-4 bg-white text-red-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 cursor-pointer flex"
                        >
                            <FaGooglePlay className="h-6 w-6 mr-2" />
                            App coming soon
                        </div>
                    </section>
                </main>
                
                <Footer />
            </div>
            
        </div>
    );
};

export default CoursesPage;