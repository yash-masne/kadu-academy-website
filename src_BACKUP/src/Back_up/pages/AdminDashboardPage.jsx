import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// --- Dashboard Component Icons (lucide-react style SVGs) ---
const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const TestIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);
const ScoreIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 22l4-1.5 4 1.5-1.21-8.11"/></svg>
);
const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1 0-2.73l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const LogOutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);
const MenuIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

// --- DashboardCard Component for reusable navigation buttons ---
const DashboardCard = ({ name, path, icon, onClick }) => {
  const IconComponent = icon;
  return (
    <button
      onClick={() => onClick(path)}
      className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
    >
      <div className="p-4 rounded-full bg-red-100 mb-4 transition-colors duration-200 group-hover:bg-red-200">
        <IconComponent className="h-10 w-10 text-red-700 transition-colors duration-200 group-hover:text-red-800" />
      </div>
      <span className="text-xl font-semibold text-gray-700 transition-colors duration-200 group-hover:text-red-700">
        {name}
      </span>
    </button>
  );
};


// --- Admin Dashboard Page Component ---
export default function AdminDashboardPage({ auth, db }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth || !db) {
        // This case should ideally not be reached if App.jsx handles loading correctly.
        // It's a safeguard to prevent crashes.
        setIsAuthReady(true);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData?.isAdmin === true) {
                  setIsAdmin(true);
              } else {
                  await signOut(auth);
                  setIsAdmin(false);
                  navigate('/admin-login');
              }
          } else {
              await signOut(auth);
              setIsAdmin(false);
              navigate('/admin-login');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          await signOut(auth);
          setIsAdmin(false);
          navigate('/admin-login');
        }
      } else {
        setUserId(null);
        setIsAdmin(false);
        navigate('/admin-login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate, auth, db]);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        navigate('/admin-login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  const navItems = [
    { name: 'Manage Tests', path: '/test-management', icon: TestIcon },
    { name: 'Manage Users', path: '/manage-users', icon: UsersIcon },
    { name: 'View Student Marks', path: '/view-marks', icon: ScoreIcon },
    { name: 'Dashboard Settings', path: '/dashboard-settings', icon: SettingsIcon },
  ];

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

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Admin Dashboard</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg text-white bg-red-700 hover:bg-red-800 transition-colors"
        >
          <LogOutIcon />
          Logout
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col items-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg mb-8 max-w-2xl w-full">
          <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-red-900">
            Kadu Academy
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-800">Welcome, Administrator!</p>
          <p className="mt-2 text-lg text-gray-600">Select an option below to get started.</p>
          <p className="mt-4 text-sm text-gray-500">Your User ID: {userId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl">
          {navItems.map((item, index) => (
            <DashboardCard
              key={index}
              name={item.name}
              path={item.path}
              icon={item.icon}
              onClick={navigate}
            />
          ))}
        </div>
      </main>
    </div>
  );
}