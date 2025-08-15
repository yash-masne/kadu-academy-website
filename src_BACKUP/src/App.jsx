import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Page Components ---
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ViewStudentMarksPage from './pages/ViewStudentMarksPage';
import AdminTestManagementPage from './pages/AdminTestManagementPage';
import AdminCreateTestPage from './pages/AdminCreateTestPage';
import AdminTestListPage from './pages/AdminTestListPage';
import AdminTestDetailManagementPage from './pages/AdminTestDetailManagementPage';
import AdminArchivedTestsScreen from './pages/AdminArchivedTestsScreen';
import HomePage from './pages/HomePage';
import ManageUsersPage from './pages/ManageUsersPage';
import AdminTestSpecificMarksScreen from './pages/AdminTestSpecificMarksScreen';
import CoursesPage from './pages/CoursesPage.jsx';
import DashboardSettings from './pages/DashboardSettings';
import './index.css';

// --- Firebase Initialization (Optimized to run once) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- Main App Component ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is now set up once and handles auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Retain original logic for anonymous/custom token sign-in
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (anonError) {
          console.error("Anonymous/Custom token sign-in failed:", anonError);
        }
      }
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Show a loading screen while authentication is being checked
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12 border-4 border-red-200 border-t-red-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes - accessible to all users */}
        <Route path="/" element={<HomePage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/courses" element={<CoursesPage />} />

        {/* Protected Routes - only for authenticated users */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<AdminDashboardPage auth={auth} db={db} />} />
            <Route path="/manage-users" element={<ManageUsersPage />} />
            <Route path="/dashboard-settings" element={<DashboardSettings />} />
            <Route path="/view-marks" element={<ViewStudentMarksPage auth={auth} db={db} />} />
            <Route path="/test-management" element={<AdminTestManagementPage />} />
            <Route path="/test-marks/:testId" element={<AdminTestSpecificMarksScreen auth={auth} db={db} />} />
            <Route path="/admin-test-management" element={<AdminTestManagementPage />} />
            <Route path="/admin-create-test" element={<AdminCreateTestPage />} />
            <Route path="/admin-test-list" element={<AdminTestListPage />} />
            <Route path="/admin_test_detail_management" element={<AdminTestDetailManagementPage />} />
            <Route path="/admin_archived_tests" element={<AdminArchivedTestsScreen />} />
          </>
        ) : (
          // Redirect any unauthenticated user trying to access a protected route
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;