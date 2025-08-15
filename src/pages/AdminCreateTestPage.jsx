import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

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
const SaveIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-8.8"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);


const AdminCreateTestPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [isQuestionBank, setIsQuestionBank] = useState(false); // NEW
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // NEW STATE FOR THE MODAL
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTestData, setCreatedTestData] = useState(null);


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
            await signOut(auth);
            setIsAdmin(false);
            navigate('/admin-login');
          }
        } catch (error) {
          await signOut(auth);
          setIsAdmin(false);
          navigate('/admin-login');
        }
      } else {
        setIsAdmin(false);
        navigate('/admin-login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate, auth, db]);

  const handleSaveTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const parsedDuration = parseInt(duration, 10);

    // --- NEW: Conditional Validation ---
    if (!isQuestionBank) {
      if (title.trim() === '' || description.trim() === '' || isNaN(parsedDuration) || parsedDuration <= 0) {
        setErrorMsg('Please fill all fields correctly. Duration must be a positive number.');
        setLoading(false);
        return;
      }
    }

    try {
      const testsCollectionRef = collection(db, 'tests');
      const docRef = await addDoc(testsCollectionRef, {
        title: title.trim() || 'Untitled Question Bank', // Set a default title if none provided
        description: description.trim() || 'Question bank for internal use.', // Set a default description
        durationMinutes: isQuestionBank ? null : parsedDuration, // Set to null for question banks
        isQuestionBank: isQuestionBank, // NEW
        createdAt: serverTimestamp(),
        isPublished: false,
        isArchived: false,
        title_lowercase: (title.trim() || 'Untitled Question Bank').toLowerCase(),
      });

      const newTestId = docRef.id;
      
      // NEW: Set state for modal instead of showing alert and navigating
      setCreatedTestData({
        testId: newTestId,
        initialTestData: {
          title: title.trim() || 'Untitled Question Bank',
          description: description.trim() || 'Question bank for internal use.',
          durationMinutes: isQuestionBank ? null : parsedDuration,
          isQuestionBank: isQuestionBank,
          createdAt: new Date().toISOString(),
          isPublished: false,
          isArchived: false,
          title_lowercase: (title.trim() || 'Untitled Question Bank').toLowerCase(),
        },
      });
      setShowSuccessModal(true);

      // OLD: The clear fields and navigation is now handled by the modal buttons.
    } catch (error) {
      setErrorMsg(`Failed to save test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // NEW: MODAL HANDLERS
  const handleGoToAddQuestions = () => {
    if (createdTestData) {
      setShowSuccessModal(false);
      setTitle('');
      setDescription('');
      setDuration('');
      setIsQuestionBank(false); // Reset the state
      navigate('/admin_test_detail_management', {
        state: createdTestData,
        replace: true
      });
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setCreatedTestData(null);
    setTitle('');
    setDescription('');
    setDuration('');
    setIsQuestionBank(false); // Reset the state
  };


  // Conditional Rendering
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
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      {/* PROFESSIONAL HEADER */}
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Create New Test</span>
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
        <div className="flex justify-start w-full max-w-2xl mb-6">
          <button
            onClick={() => navigate('/admin-test-management')}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back to Test Management
          </button>
        </div>
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Test Details</h2>

          {errorMsg && (
            <div className="bg-red-50 border border-red-400 text-red-700 p-4 rounded-lg mb-6 text-center" role="alert">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveTest} className="flex flex-col items-center">
            {/* NEW: Question Bank Checkbox */}
            <div className="mb-6 w-full flex items-center justify-start gap-4 p-4 rounded-lg bg-gray-100 border border-gray-300">
              <input
                type="checkbox"
                id="isQuestionBank"
                checked={isQuestionBank}
                onChange={(e) => setIsQuestionBank(e.target.checked)}
                className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
              />
              <label htmlFor="isQuestionBank" className="text-base font-semibold text-gray-700">
                Create as a Question Bank
              </label>
            </div>
            
            <div className="mb-6 w-full">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Test Title</label>
              <input
                type="text"
                id="title"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., General Knowledge Quiz"
                required={!isQuestionBank}
                disabled={isQuestionBank}
              />
            </div>

            <div className="mb-6 w-full">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-y min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief description of the test"
                rows="3"
                required={!isQuestionBank}
                disabled={isQuestionBank}
              ></textarea>
            </div>

            <div className="mb-8 w-full">
              <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 60"
                min="1"
                required={!isQuestionBank}
                disabled={isQuestionBank}
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-lg bg-red-700 text-white font-bold shadow-lg transition-all duration-200 hover:bg-red-800 hover:shadow-xl active:scale-99 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <SaveIcon />
                  Save Test Details & Manage Questions
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100 ease-in-out duration-300">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Created Successfully!</h3>
            <p className="text-gray-600 mb-6">What would you like to do next?</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleGoToAddQuestions}
                className="w-full py-3 px-6 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Go to Add Questions
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full py-3 px-6 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
    
  );
};

export default AdminCreateTestPage;
