// src/pages/AdminArchivedTestsScreen.jsx

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

// --- Global Firebase Config & Auth Token provided by the environment ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Make sure Firebase app is initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// --- ICON COMPONENTS ---
const LogOutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);
const BackIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
);
const UnarchiveIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="4" x="1" y="3"/><line x1="10" x2="14" y1="12" y2="12"/></svg>
);
const DeleteForeverIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PublishIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12V21a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12"/><rect width="20" height="5" x="2" y="3"/><path d="M10 9h4"/></svg>
);
const InfoIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
const ErrorIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>
);


// --- SNACKBAR COMPONENT ---
const Snackbar = ({ message, type = 'info', onHide }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onHide]);

  const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-gray-800');
  const Icon = type === 'success' ? InfoIcon : (type === 'error' ? ErrorIcon : InfoIcon);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-xl text-white ${bgColor} animate-slide-in-right`}>
      <Icon className="mr-3 flex-shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

// --- CONFIRM MODAL COMPONENT ---
const ConfirmModal = ({ isOpen, onClose, title, message, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 p-4">
      <div className="bg-white border border-gray-300 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-fade-in-scale">
        <h3 className="text-2xl font-bold text-red-600 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};


const AdminArchivedTestsScreen = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('All');
  const filterOptions = [
    'All',
    'Free Test',
    'Kadu Academy Student',
    'College Student',
  ];

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ show: true, message, type });
  };
  const hideSnackbar = () => {
    setSnackbar({ show: false, message: '', type: '' });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModalData({ title, message, onConfirm });
    setShowConfirmModal(true);
  };
  
  useEffect(() => {
    const authInstance = getAuth();
    const dbInstance = getFirestore();

    const unsubscribeAuth = onAuthStateChanged(authInstance, async (currentUser) => {
      if (currentUser) {
        try {
          const userSnap = await getDoc(doc(dbInstance, 'users', currentUser.uid));
          if (userSnap.exists() && userSnap.data()?.isAdmin === true) {
            setIsAdmin(true);
          } else {
            await signOut(authInstance);
            setIsAdmin(false);
            navigate('/admin-login');
          }
        } catch (err) {
          showSnackbar(`Authentication error. Redirecting.`, 'error');
          await signOut(authInstance);
          navigate('/admin-login');
        }
      } else {
        navigate('/admin-login');
      }
      setAuthCheckComplete(true);
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (authCheckComplete && isAdmin) {
      setLoading(true);
      const dbInstance = getFirestore();
      
      let testsQuery = query(
        collection(dbInstance, 'tests'),
        where('isArchived', '==', true)
      );

      const lowerCaseSearchQuery = searchQuery.toLowerCase();
      // FIX: Correctly apply the search filter in JavaScript
      if (lowerCaseSearchQuery) {
        testsQuery = query(testsQuery, 
          where('title_lowercase', '>=', lowerCaseSearchQuery),
          where('title_lowercase', '<=', lowerCaseSearchQuery + '\uf8ff')
        );
      }

      switch (currentFilter) {
        case 'Free Test':
          testsQuery = query(testsQuery, where('isFree', '==', true));
          break;
        case 'Kadu Academy Student':
          testsQuery = query(testsQuery, where('isPaidKaduAcademy', '==', true));
          break;
        case 'College Student':
          testsQuery = query(testsQuery, where('isPaidCollege', '==', true));
          break;
        default:
          break;
      }
      
      testsQuery = query(testsQuery, orderBy('createdAt', 'desc'));

      const unsubscribeSnapshot = onSnapshot(testsQuery, (snapshot) => {
        const fetchedTests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTests(fetchedTests);
        setLoading(false);
      }, (err) => {
        setError(`Failed to load tests: ${err.message}`);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    }
  }, [authCheckComplete, isAdmin, searchQuery, currentFilter]);

  const _unarchiveTest = (testId, testTitle) => {
    showConfirm(
      'Confirm Unarchive',
      `Are you sure you want to unarchive the test "${testTitle}"? It will move back to the main active tests list.`,
      async () => {
        setShowConfirmModal(false);
        try {
          await updateDoc(doc(getFirestore(), 'tests', testId), {
            isArchived: false,
            updatedAt: Timestamp.now(),
          });
          showSnackbar(`Test "${testTitle}" unarchived successfully!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to unarchive test: ${e.message}`, 'error');
        }
      }
    );
  };

  const _unpublishArchivedTest = async (testId, testTitle) => {
    try {
      await updateDoc(doc(getFirestore(), 'tests', testId), {
        isPublished: false,
        publishTime: null,
        globalExpiryTime: null,
        scheduledPublishTime: null,
        allowStudentReview: false,
        updatedAt: Timestamp.now(),
      });
      showSnackbar(`Archived test "${testTitle}" unpublished successfully!`, 'success');
    } catch (e) {
      showSnackbar(`Failed to unpublish archived test: ${e.message}`, 'error');
    }
  };

  const _deleteArchivedTest = (testId, testTitle) => {
    showConfirm(
      'Confirm Permanent Deletion',
      `Are you sure you want to PERMANENTLY delete the archived test "${testTitle}"? This cannot be undone and will also delete its questions and associated student sessions!`,
      async () => {
        setShowConfirmModal(false);
        try {
          const dbInstance = getFirestore();
          const batch = writeBatch(dbInstance);

          const sessionsSnapshot = await getDocs(query(collection(dbInstance, 'studentTestSessions'), where('testId', '==', testId)));
          sessionsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          const questionsSnapshot = await getDocs(collection(dbInstance, 'tests', testId, 'questions'));
          questionsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          batch.delete(doc(dbInstance, 'tests', testId));
          await batch.commit();

          showSnackbar(`Archived test "${testTitle}" permanently deleted!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to permanently delete archived test: ${e.message}`, 'error');
        }
      }
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!authCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Verifying authorization...</p>
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {snackbar.show && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onHide={hideSnackbar}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmModalData.title}
        message={confirmModalData.message}
        onConfirm={confirmModalData.onConfirm}
      />
      
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Archived Tests</span>
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
        <div className="flex justify-between items-center w-full max-w-5xl mb-6 flex-wrap gap-4">
          <button
            onClick={() => navigate('/admin-test-list')}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <BackIcon />
            Back to Test List
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title..."
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
          />
          <div className="flex-1 min-w-[200px] max-w-xs">
            <select
              value={currentFilter}
              onChange={(e) => setCurrentFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors bg-white text-gray-700"
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>{`Filter: ${option}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full max-w-5xl">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 p-4 rounded-lg mb-6 text-center" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <p className="text-xl text-gray-600 font-medium">No archived tests found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tests.map((test) => {
                const isPublished = test.isPublished ?? false;
                const accessType = test.accessType ?? 'Not Set';
                const allowedCourses = test.allowedCourses || [];
                const allowedBranches = test.allowedBranches || [];
                const allowedYears = test.allowedYears || [];
                const marksPerQuestion = test.marksPerQuestion ?? 1.0;
                const isNegativeMarking = test.isNegativeMarking ?? false;
                const negativeMarksValue = test.negativeMarksValue ?? 0.0;
                const enableOptionE = test.enableOptionE ?? true;

                const createdAt = test.createdAt ? test.createdAt.toDate() : null;
                const updatedAt = test.updatedAt ? test.updatedAt.toDate() : null;
                
                return (
                  <div key={test.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{test.title || 'No Title'}</h3>
                      <p className="text-gray-600 text-sm">{test.description || 'No Description'}</p>
                      <p className="text-sm font-medium text-indigo-700 mt-2">Test Type: {accessType}</p>
                      
                      {accessType === 'Kadu Academy Student' && allowedCourses.length > 0 && (
                        <p className="text-xs text-gray-600">Courses: {allowedCourses.join(', ')}</p>
                      )}
                      {accessType === 'College Student' && (
                        <>
                          {allowedBranches.length > 0 && <p className="text-xs text-gray-600">Branches: {allowedBranches.join(', ')}</p>}
                          {allowedYears.length > 0 && <p className="text-xs text-gray-600">Years: {allowedYears.join(', ')}</p>}
                        </>
                      )}

                      <p className="text-xs text-gray-600 mt-1">Marks/Q: {marksPerQuestion.toFixed(1)}</p>
                      <p className="text-xs text-gray-600">Negative Marking: {isNegativeMarking ? `Yes (${negativeMarksValue.toFixed(2)})` : 'No'}</p>
                      <p className="text-xs text-gray-600">Option E Enabled: {enableOptionE ? 'Yes' : 'No'}</p>

                      <p className={`text-sm font-semibold mt-2 ${isPublished ? 'text-green-600' : 'text-red-600'}`}>
                        Published: {isPublished ? 'Yes' : 'No'}
                      </p>
                      {createdAt && (
                        <p className="text-xs text-gray-500">Created: {moment(createdAt).format('DD MMM YYYY, hh:mm A')}</p>
                      )}
                      {updatedAt && (
                        <p className="text-xs text-gray-500">Updated: {moment(updatedAt).format('DD MMM YYYY, hh:mm A')}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 lg:mt-0">
                      <button
                        onClick={() => _unarchiveTest(test.id, test.title)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        <UnarchiveIcon />
                        Unarchive
                      </button>
                      <button
                        onClick={() => _unpublishArchivedTest(test.id, test.title)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <PublishIcon />
                        Unpublish
                      </button>
                      <button
                        onClick={() => _deleteArchivedTest(test.id, test.title)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-red-800 text-white hover:bg-red-900 transition-colors"
                      >
                        <DeleteForeverIcon />
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminArchivedTestsScreen;