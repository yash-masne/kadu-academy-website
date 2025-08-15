// src/pages/AdminTestListPage.jsx

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs, Timestamp, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
const ArchiveIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="4" x="1" y="3"/><line x1="10" x2="14" y1="12" y2="12"/></svg>
);
const DuplicateIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const EditIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
);
const DeleteIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PublishIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12V21a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12"/><rect width="20" height="5" x="2" y="3"/><path d="M10 9h4"/></svg>
);
const ScheduledIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const InfoIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
const ErrorIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>
);

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

const ScheduleTestModal = ({ isOpen, onClose, testId, testTitle, onConfirmSchedule }) => {
  const [scheduledTime, setScheduledTime] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setScheduledTime(null);
      setExpiryTime(null);
      setModalError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setModalError(null);

    if (!scheduledTime || !moment(scheduledTime).isValid()) {
      setModalError('Please select a valid scheduled date/time.');
      return;
    }
    if (moment(scheduledTime).isBefore(moment().add(10, 'seconds'))) {
      setModalError('Scheduled time must be in the future.');
      return;
    }

    if (expiryTime) {
      if (!moment(expiryTime).isValid()) {
        setModalError('Please select a valid expiry date/time.');
        return;
      }
      if (moment(expiryTime).isBefore(moment(scheduledTime).add(1, 'minute'))) {
        setModalError('Expiry time must be after scheduled publish time.');
        return;
      }
    }

    await onConfirmSchedule(testId, testTitle, scheduledTime, expiryTime);
    onClose();
  };

  if (!isOpen) return null;

  const filterPassedDates = (date) => moment(date).isAfter(moment().subtract(1, 'day'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full animate-fade-in-scale">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Schedule Test: "{testTitle}"</h3>
        
        {modalError && (
          <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded-lg mb-4 text-sm text-center" role="alert">
            {modalError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Time</label>
            <DatePicker
              selected={scheduledTime}
              onChange={(date) => setScheduledTime(date)}
              showTimeSelect
              filterDate={filterPassedDates}
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="Select date and time"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="expiryTime" className="block text-sm font-semibold text-gray-700 mb-2">Global Expiry (Optional)</label>
            <DatePicker
              selected={expiryTime}
              onChange={(date) => setExpiryTime(date)}
              showTimeSelect
              filterDate={filterPassedDates}
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="Select date and time"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">Test will automatically unpublish after this time.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};


const AdminTestListPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentTestForAction, setCurrentTestForAction] = useState(null);

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
        where('isArchived', '==', false)
      );

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
  }, [authCheckComplete, isAdmin, currentFilter]);

  const _archiveTest = (testId, testTitle) => {
    showConfirm(
      'Confirm Archive',
      `Are you sure you want to archive the test "${testTitle}"? It will be moved to the archived list.`,
      async () => {
        setShowConfirmModal(false);
        try {
          await updateDoc(doc(getFirestore(), 'tests', testId), {
            isArchived: true,
            isPublished: false,
            publishTime: null,
            globalExpiryTime: null,
            scheduledPublishTime: null,
            updatedAt: Timestamp.now(),
          });
          showSnackbar(`Test "${testTitle}" archived successfully!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to archive test: ${e.message}`, 'error');
        }
      }
    );
  };

  const _deleteTest = (testId, testTitle) => {
    showConfirm(
      'Confirm Deletion',
      `Are you sure you want to delete "${testTitle}"? This cannot be undone.`,
      async () => {
        setShowConfirmModal(false);
        try {
          const questionsSnapshot = await getDocs(collection(getFirestore(), 'tests', testId, 'questions'));
          const deleteQuestionPromises = questionsSnapshot.docs.map(qDoc => deleteDoc(doc(getFirestore(), 'tests', testId, 'questions', qDoc.id)));
          await Promise.all(deleteQuestionPromises);
          await deleteDoc(doc(getFirestore(), 'tests', testId));
          showSnackbar(`Test "${testTitle}" deleted successfully!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to delete test: ${e.message}`, 'error');
        }
      }
    );
  };

  const _duplicateTest = (originalTestId, originalTestTitle, originalTestData) => {
    showConfirm(
      'Confirm Duplicate',
      `Are you sure you want to duplicate "${originalTestTitle}" and all its questions?`,
      async () => {
        setShowConfirmModal(false);
        try {
          const newTestData = {
            title: `${originalTestData.title ?? 'Untitled'} (Copy)`,
            description: originalTestData.description ?? '',
            durationMinutes: originalTestData.durationMinutes ?? 0,
            isFree: originalTestData.isFree ?? false,
            isPaidCollege: originalTestData.isPaidCollege ?? false,
            isPaidKaduAcademy: originalTestData.isPaidKaduAcademy ?? false,
            allowedCourses: originalTestData.allowedCourses ?? [],
            allowedBranches: originalTestData.allowedBranches ?? [],
            allowedYears: originalTestData.allowedYears ?? [],
            marksPerQuestion: originalTestData.marksPerQuestion ?? 1.0,
            isNegativeMarking: originalTestData.isNegativeMarking ?? false,
            negativeMarksValue: originalTestData.negativeMarksValue ?? 0.0,
            enableOptionE: originalTestData.enableOptionE ?? false,
            allowStudentReview: false,
            isPublished: false,
            isArchived: false,
            totalQuestions: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            publishTime: null,
            globalExpiryTime: null,
            scheduledPublishTime: null,
          };

          const newTestDocRef = await addDoc(collection(getFirestore(), 'tests'), newTestData);

          const originalQuestionsSnapshot = await getDocs(query(collection(getFirestore(), 'tests', originalTestId, 'questions'), orderBy('createdAt', 'asc')));
          
          const newQuestionsCollectionRef = collection(newTestDocRef, 'questions');
          const addQuestionPromises = originalQuestionsSnapshot.docs.map(qDoc => {
              const questionData = qDoc.data();
              return addDoc(newQuestionsCollectionRef, { 
                ...questionData,
                createdAt: Timestamp.now(), 
              });
          });
          await Promise.all(addQuestionPromises);

          const newTotalQuestions = originalQuestionsSnapshot.docs.length;
          await updateDoc(newTestDocRef, { totalQuestions: newTotalQuestions });

          showSnackbar(`Test "${originalTestTitle}" duplicated successfully!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to duplicate test: ${e.message}`, 'error');
        }
      }
    );
  };

  const _toggleAllowStudentReviewStatus = async (testId, testTitle, isCurrentlyAllowed) => {
    try {
      await updateDoc(doc(getFirestore(), 'tests', testId), {
        allowStudentReview: !isCurrentlyAllowed,
        updatedAt: Timestamp.now(),
      });
      showSnackbar(`Student review for "${testTitle}" ${isCurrentlyAllowed ? "disabled" : "enabled"}!`, 'success');
    } catch (e) {
      showSnackbar(`Failed to toggle student review: ${e.message}`, 'error');
    }
  };

  const _cancelScheduledPublish = (testId, testTitle) => {
    showConfirm(
      'Confirm Cancel Schedule',
      `Are you sure you want to cancel the scheduled publication for "${testTitle}"? It will revert to Draft status.`,
      async () => {
        setShowConfirmModal(false);
        try {
          await updateDoc(doc(getFirestore(), 'tests', testId), {
            isPublished: false,
            publishTime: null,
            scheduledPublishTime: null,
            globalExpiryTime: null,
            updatedAt: Timestamp.now(),
          });
          showSnackbar(`Schedule for "${testTitle}" cancelled!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to cancel schedule: ${e.message}`, 'error');
        }
      }
    );
  };

  const _unpublishTest = (testId, testTitle) => {
    showConfirm(
      'Confirm Unpublish',
      `Are you sure you want to unpublish the test "${testTitle}"? Students will no longer see it.`,
      async () => {
        setShowConfirmModal(false);
        try {
          await updateDoc(doc(getFirestore(), 'tests', testId), {
            isPublished: false,
            publishTime: null,
            globalExpiryTime: null,
            scheduledPublishTime: null,
            updatedAt: Timestamp.now(),
          });
          showSnackbar(`Test "${testTitle}" unpublished.`, 'success');
        } catch (e) {
          showSnackbar(`Failed to unpublish test: ${e.message}`, 'error');
        }
      }
    );
  };

  const _publishTestImmediately = (testId, testTitle) => {
    showConfirm(
      'Confirm Publish',
      `Are you sure you want to publish "${testTitle}" immediately?`,
      async () => {
        setShowConfirmModal(false);
        try {
          await updateDoc(doc(getFirestore(), 'tests', testId), {
            isPublished: true,
            publishTime: Timestamp.now(),
            globalExpiryTime: null,
            scheduledPublishTime: null,
            updatedAt: Timestamp.now(),
          });

          showSnackbar(`Test "${testTitle}" published immediately!`, 'success');
        } catch (e) {
          showSnackbar(`Failed to publish test immediately: ${e.message}`, 'error');
        }
      }
    );
  };

  const _scheduleTest = (testId, testTitle) => {
    setCurrentTestForAction({ testId, testTitle });
    setShowScheduleModal(true);
  };
  
  const handleConfirmSchedule = async (testId, testTitle, scheduledTime, expiryTime) => {
    try {
      const scheduledTimestamp = scheduledTime ? Timestamp.fromDate(scheduledTime) : null;
      const expiryTimestamp = expiryTime ? Timestamp.fromDate(expiryTime) : null;

      await updateDoc(doc(getFirestore(), 'tests', testId), {
        isPublished: false,
        publishTime: null,
        globalExpiryTime: expiryTimestamp,
        scheduledPublishTime: scheduledTimestamp,
        updatedAt: Timestamp.now(),
      });

      if (scheduledTime) {
        try {
          const callableUrl = 'YOUR_CLOUD_FUNCTION_ENDPOINT_URL';
          const response = await fetch(callableUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                testId: testId,
                testTitle: testTitle,
                scheduledTime: scheduledTime.toISOString(),
              },
            }),
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'Failed to call Cloud Function');
          }
        } catch (e) {
          showSnackbar(`Failed to send scheduled notification: ${e.message}`, 'error');
        }
      }
      showSnackbar(`Test "${testTitle}" scheduled successfully!`, 'success');
    } catch (e) {
      showSnackbar(`Failed to schedule test: ${e.message}`, 'error');
    }
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

      <ScheduleTestModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        testId={currentTestForAction?.testId}
        testTitle={currentTestForAction?.testTitle}
        onConfirmSchedule={handleConfirmSchedule}
      />

      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Test List</span>
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
            onClick={() => navigate('/admin-test-management')}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <BackIcon />
            Back to Test Management
          </button>
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
          <button
            onClick={() => navigate('/admin_archived_tests')}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <ArchiveIcon className="w-4 h-4" />
            View Archived Tests
          </button>
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
              <p className="text-xl text-gray-600 font-medium">No active tests found for selected filter. Start by creating a new one!</p>
              <button
                onClick={() => navigate('/admin-create-test')}
                className="mt-6 py-3 px-6 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors duration-200"
              >
                Create New Test
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {tests.map((test) => {
                const isPublished = test.isPublished ?? false;
                const scheduledPublishTime = test.scheduledPublishTime ? test.scheduledPublishTime.toDate() : null;
                const globalExpiryTime = test.globalExpiryTime ? test.globalExpiryTime.toDate() : null;
                
                let statusText;
                let statusColorClass;
                let showCancelScheduleButton = false;

                if (isPublished) {
                  statusText = 'Status: Published';
                  statusColorClass = 'text-green-600';
                } else if (scheduledPublishTime && scheduledPublishTime.getTime() > (new Date().getTime() + 10000)) {
                  statusText = `Scheduled: ${moment(scheduledPublishTime).format('DD MMM YYYY, hh:mm A')}`;
                  statusColorClass = 'text-blue-600';
                  showCancelScheduleButton = true;
                } else if (globalExpiryTime && globalExpiryTime.getTime() < new Date().getTime() && !isPublished) {
                  statusText = 'Status: Expired';
                  statusColorClass = 'text-red-600';
                } else {
                  statusText = 'Status: Draft';
                  statusColorClass = 'text-yellow-600';
                }

                const displayedTestType = test.isFree ? 'Free' :
                                          test.isPaidKaduAcademy ? 'Kadu Academy Student' :
                                          test.isPaidCollege ? 'College Student' : 'Undefined';

                const allowedCourses = test.allowedCourses || [];
                const allowedBranches = test.allowedBranches || [];
                const allowedYears = test.allowedYears || [];
                const marksPerQuestion = test.marksPerQuestion ?? 1.0;
                const isNegativeMarking = test.isNegativeMarking ?? false;
                const negativeMarksValue = test.negativeMarksValue ?? 0.0;
                const enableOptionE = test.enableOptionE ?? true;

                return (
                  <div key={test.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{test.title || 'No Title'}</h3>
                      <p className="text-gray-600 text-sm">{test.description || 'No Description'}</p>
                      <p className="text-sm font-medium text-indigo-700 mt-2">Test Type: {displayedTestType}</p>
                      
                      {test.isPaidKaduAcademy && allowedCourses.length > 0 && (
                        <p className="text-xs text-gray-600">Courses: {allowedCourses.join(', ')}</p>
                      )}
                      {test.isPaidCollege && allowedBranches.length > 0 && (
                        <p className="text-xs text-gray-600">Branches: {allowedBranches.join(', ')}</p>
                      )}
                      {test.isPaidCollege && allowedYears.length > 0 && (
                        <p className="text-xs text-gray-600">Years: {allowedYears.join(', ')}</p>
                      )}

                      <p className="text-xs text-gray-600 mt-1">Marks/Q: {marksPerQuestion.toFixed(1)}</p>
                      <p className="text-xs text-gray-600">Negative Marking: {isNegativeMarking ? `Yes (${negativeMarksValue.toFixed(2)})` : 'No'}</p>
                      <p className="text-xs text-gray-600">Option E Enabled: {enableOptionE ? 'Yes' : 'No'}</p>

                      <p className={`text-sm font-semibold mt-2 ${statusColorClass}`}>{statusText}</p>
                      {isPublished && test.publishTime && (
                        <p className="text-xs text-gray-500">Published On: {moment(test.publishTime.toDate()).format('DD MMM YYYY, hh:mm A')}</p>
                      )}
                      {globalExpiryTime && (
                        <p className="text-xs text-red-500">Global Expiry: {moment(globalExpiryTime).format('DD MMM YYYY, hh:mm A')}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 lg:mt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Review:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={test.allowStudentReview ?? false}
                            onChange={async () => await _toggleAllowStudentReviewStatus(test.id, test.title, test.allowStudentReview ?? false)}
                            disabled={!isPublished}
                          />
                          <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500
                            after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                            peer-checked:bg-red-500 peer-checked:after:translate-x-full
                            ${!isPublished ? 'bg-gray-200' : 'bg-gray-400'}`}></div>
                        </label>
                      </div>

                      <button
                        onClick={() => _duplicateTest(test.id, test.title, test)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <DuplicateIcon />
                        Duplicate
                      </button>
                      <button
                        onClick={() => navigate('/admin_test_detail_management', { state: { testId: test.id, initialTestData: test } })}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <EditIcon />
                        Edit
                      </button>
                      {showCancelScheduleButton && (
                        <button
                          onClick={async () => await _cancelScheduledPublish(test.id, test.title)}
                          className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                        >
                          <ScheduledIcon />
                          Cancel Schedule
                        </button>
                      )}
                      <button
                        onClick={async () => await _archiveTest(test.id, test.title)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                      >
                        <ArchiveIcon />
                        Archive
                      </button>
                      <button
                        onClick={async () => await _deleteTest(test.id, test.title)}
                        className="flex items-center gap-1 py-2 px-3 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <DeleteIcon />
                        Delete
                      </button>
                      {isPublished ? (
                        <button
                          onClick={() => _unpublishTest(test.id, test.title)}
                          className={`
                            flex items-center gap-1 py-2 px-3 text-sm rounded-lg text-white font-bold transition-colors bg-red-600 hover:bg-red-700
                          `}
                        >
                          <PublishIcon />
                          Unpublish
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => _publishTestImmediately(test.id, test.title)}
                            className={`
                              flex items-center gap-1 py-2 px-3 text-sm rounded-lg text-white font-bold transition-colors bg-green-600 hover:bg-green-700
                            `}
                          >
                            <PublishIcon />
                            Publish
                          </button>
                          <button
                            onClick={() => _scheduleTest(test.id, test.title)}
                            className={`
                              flex items-center gap-1 py-2 px-3 text-sm rounded-lg text-white font-bold transition-colors bg-blue-600 hover:bg-blue-700
                            `}
                          >
                            <ScheduledIcon />
                            Schedule
                          </button>
                        </>
                      )}
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

export default AdminTestListPage;