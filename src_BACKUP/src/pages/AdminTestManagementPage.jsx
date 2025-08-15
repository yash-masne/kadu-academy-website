// src/pages/AdminTestManagementPage.jsx

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer'; // Import the new component

// --- Global Firebase Config & Auth Token provided by the environment ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Make sure Firebase app is initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// --- Icon Components (from lucide-react) ---
const LogOutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);
const AddIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
);
const ListIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);


const AdminTestManagementPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // Security check: Ensure only admins can access this page
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
            setIsAdmin(true);
          } else {
            console.warn('Non-admin user attempted to access Test Management. Logging out.');
            await signOut(auth);
            setIsAdmin(false);
            navigate('/admin-login');
          }
        } catch (error) {
          console.error("Error checking admin status for Test Management:", error);
          await signOut(auth);
          setIsAdmin(false);
          navigate('/admin-login');
        }
      } else {
        setIsAdmin(false);
        navigate('/admin-login'); // Redirect to login if not authenticated
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate, auth, db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Conditional Rendering based on authentication status and isAdmin flag
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-lg w-full">
          <p className="text-2xl font-bold text-red-600">Access Denied: Unauthorized User</p>
          <p className="mt-4 text-gray-600">You do not have the required permissions to view this page. Please log in with an administrator account.</p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Main page content (rendered only if isAdmin is true)
  return (
    
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      {/* PROFESSIONAL HEADER */}
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Test Management</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg text-white bg-red-700 hover:bg-red-800 transition-colors"
        >
          <LogOutIcon />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col items-center">
        <div className="flex justify-start w-full max-w-4xl mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back to Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <button
            onClick={() => navigate('/admin-create-test')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 group"
          >
            <div className="p-4 rounded-full bg-red-100 mb-4 transition-colors duration-200 group-hover:bg-red-200">
              <AddIcon className="h-10 w-10 text-red-700 transition-colors duration-200 group-hover:text-red-800" />
            </div>
            <span className="text-xl font-semibold text-gray-700 transition-colors duration-200 group-hover:text-red-700">
              Create New Test
            </span>
          </button>
          <button
            onClick={() => navigate('/admin-test-list')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 group"
          >
            <div className="p-4 rounded-full bg-red-100 mb-4 transition-colors duration-200 group-hover:bg-red-200">
              <ListIcon className="h-10 w-10 text-red-700 transition-colors duration-200 group-hover:text-red-800" />
            </div>
            <span className="text-xl font-semibold text-gray-700 transition-colors duration-200 group-hover:text-red-700">
              View/Edit Tests
            </span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminTestManagementPage;