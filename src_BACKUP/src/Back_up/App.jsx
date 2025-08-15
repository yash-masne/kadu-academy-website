import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ViewStudentMarksPage from './pages/ViewStudentMarksPage';
import AdminTestManagementPage from './pages/AdminTestManagementPage';
import AdminCreateTestPage from './pages/AdminCreateTestPage';
import AdminTestListPage from './pages/AdminTestListPage';
import AdminTestDetailManagementPage from './pages/AdminTestDetailManagementPage';
import AdminArchivedTestsScreen from './pages/AdminArchivedTestsScreen';
import HomePage from './pages/HomePage';
import './index.css';
import AdminTestSpecificMarksScreen from './pages/AdminTestSpecificMarksScreen';

// Global Firebase Config & Auth Token provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const initFirebase = async () => {
      let firebaseApp;
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApp();
      }

      const currentAuth = getAuth(firebaseApp);
      const currentDb = getFirestore(firebaseApp);

      setAuth(currentAuth);
      setDb(currentDb);

      const unsubscribe = onAuthStateChanged(currentAuth, async (user) => {
        if (!user) {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(currentAuth, initialAuthToken);
            } else {
              await signInAnonymously(currentAuth);
            }
          } catch (anonError) {
            console.error("Anonymous/Custom token sign-in failed:", anonError);
          }
        }
      });

      return () => unsubscribe();
    };

    initFirebase();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage auth={auth} db={db} />} />
        <Route path="/view-marks" element={<ViewStudentMarksPage auth={auth} db={db} />} />
        <Route path="/test-management" element={<AdminTestManagementPage />} />
        <Route path="/test-marks/:testId" element={<AdminTestSpecificMarksScreen auth={auth} db={db} />} />
        <Route path="/admin-test-management" element={<AdminTestManagementPage />} />
        <Route path="/admin-create-test" element={<AdminCreateTestPage />} />
        <Route path="/admin-test-list" element={<AdminTestListPage />} />
        <Route path="/admin_test_detail_management" element={<AdminTestDetailManagementPage />} />
        <Route path="/admin_archived_tests" element={<AdminArchivedTestsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;