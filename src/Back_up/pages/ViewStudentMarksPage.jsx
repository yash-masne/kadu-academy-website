import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore'; // Added doc and getDoc
import { useNavigate } from 'react-router-dom';

// --- Global Firebase Config & Auth Token provided by the environment ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Make sure Firebase app is initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// --- Dashboard Component Icons (lucide-react style SVGs) ---
const LogOutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

// --- Constants (aligned with your Dart code) ---
const kBranches = [ 'CSE', 'IT', 'ENTC', 'MECH', 'CIVIL', 'ELPO', 'OTHER' ];
const kYears = [ 'First Year', 'Second Year', 'Third Year', 'Final Year', 'Other' ];
const kKaduCourses = [
  'Banking', 'MBA CET', 'BBA CET', 'BCA CET', 'MCA CET', 'Railway',
  'Staff selection commission', 'MPSC', 'Police Bharti', 'Others',
];
const kDateFilters = ['Today', 'Last 7 days', 'Last 30 days', 'Last 6 months', 'Last year', 'All Time'];
const kTestTypesForFilter = ['All', 'Free Test', 'Kadu Academy Student', 'College Student'];

// Helper function to calculate date range based on filter
const getDateRange = (filter) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate = null;
  let endDate = null;

  switch (filter) {
    case 'Today':
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Start of tomorrow
      break;
    case 'Last 7 days':
      startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 30 days':
      startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      break;
    case 'Last 6 months':
      startDate = new Date(today.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case 'Last year':
      startDate = new Date(today.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'All Time':
    default:
      startDate = null;
      endDate = null;
  }
  return { startDate, endDate };
};

// --- View Student Marks Page Component ---
export default function ViewStudentMarksPage() {
  // State variables for admin check and data fetching
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State variables for filters
  const [selectedDateFilter, setSelectedDateFilter] = useState('Today');
  const [selectedTestTypeFilter, setSelectedTestTypeFilter] = useState('All');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');

  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  // --- ADMIN CHECK LOGIC (Copied directly from AdminDashboardPage) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
          console.error("Error fetching user data:", error);
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

  // --- DATA FETCHING LOGIC (Triggers only when isAdmin is true) ---
  useEffect(() => {
    const fetchMarks = async () => {
      if (!db) {
        setError('Database connection not available.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setTests([]);

      try {
        // --- STEP 1: Get relevant testIds from studentTestSessions based on date filter ---
        const { startDate, endDate } = getDateRange(selectedDateFilter);

        let sessionsQueryRef = collection(db, 'studentTestSessions');
        let sessionsQuery = query(
          sessionsQueryRef,
          where('status', '==', 'completed')
        );

        if (startDate) {
          sessionsQuery = query(sessionsQuery, where('submissionTime', '>=', startDate));
        }
        if (endDate) {
          sessionsQuery = query(sessionsQuery, where('submissionTime', '<', endDate));
        }

        const sessionsSnapshot = await getDocs(sessionsQuery);
        const relevantTestIds = new Set();
        sessionsSnapshot.forEach(doc => relevantTestIds.add(doc.data().testId));
        
        if (relevantTestIds.size === 0) {
          setLoading(false);
          return;
        }

        // --- STEP 2: Fetch tests based on relevantTestIds and other filters (with chunking) ---
        const testIdsList = Array.from(relevantTestIds);
        let allFilteredTests = [];
        const chunkSize = 10; 

        for (let i = 0; i < testIdsList.length; i += chunkSize) {
          const chunk = testIdsList.slice(i, i + chunkSize);
          let testsQueryChunk = query(
            collection(db, 'tests'),
            where('__name__', 'in', chunk)
          );

          // Apply Test Type filter
          switch (selectedTestTypeFilter) {
            case 'Free Test':
              testsQueryChunk = query(testsQueryChunk, where('isFree', '==', true));
              break;
            case 'Kadu Academy Student':
              testsQueryChunk = query(testsQueryChunk, where('isPaidKaduAcademy', '==', true));
              if (selectedCourseFilter !== 'All') {
                testsQueryChunk = query(testsQueryChunk, where('allowedCourses', 'array-contains', selectedCourseFilter));
              }
              break;
            case 'College Student':
              testsQueryChunk = query(testsQueryChunk, where('isPaidCollege', '==', true));
              if (selectedBranchFilter !== 'All') {
                testsQueryChunk = query(testsQueryChunk, where('allowedBranches', 'array-contains', selectedBranchFilter));
              }
              break;
          }
          
          const testsSnapshotChunk = await getDocs(testsQueryChunk);
          testsSnapshotChunk.forEach(doc => {
            allFilteredTests.push({ id: doc.id, ...doc.data() });
          });
        }

        // --- STEP 3: Post-process for complex filters (e.g., both Branch & Year for College Student) ---
        let finalFilteredTests = allFilteredTests;
        if (selectedTestTypeFilter === 'College Student' && selectedYearFilter !== 'All') {
          finalFilteredTests = finalFilteredTests.filter(test => 
            test.allowedYears && Array.isArray(test.allowedYears) && test.allowedYears.includes(selectedYearFilter)
          );
        }

        // --- STEP 4: Sort the final list by createdAt descending ---
        finalFilteredTests.sort((a, b) => {
          const aCreated = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const bCreated = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return bCreated.getTime() - aCreated.getTime(); // Descending order
        });

        // --- STEP 5: Fetch submission counts for each test ---
        const testsWithSubmissions = await Promise.all(finalFilteredTests.map(async (test) => {
          const submissionQuery = query(
            collection(db, 'studentTestSessions'),
            where('testId', '==', test.id),
            where('status', '==', 'completed'),
            ...(startDate ? [where('submissionTime', '>=', startDate)] : []),
            ...(endDate ? [where('submissionTime', '<', endDate)] : [])
          );
          const submissionsSnapshot = await getDocs(submissionQuery);
          return { ...test, submissions: submissionsSnapshot.size };
        }));

        setTests(testsWithSubmissions);
        setLoading(false);

      } catch (e) {
        console.error("Error fetching student marks:", e);
        setError("Failed to load student marks.");
        setLoading(false);
      }
    };
    
    // Only fetch marks if the component is ready and the user is an admin
    if (isAuthReady && isAdmin) {
      fetchMarks();
    } else if (isAuthReady && !isAdmin) {
      // If auth is ready but not an admin, stop loading and clear tests
      setLoading(false);
      setTests([]);
    }
  }, [db, isAuthReady, isAdmin, selectedDateFilter, selectedTestTypeFilter, selectedBranchFilter, selectedYearFilter, selectedCourseFilter]);

  const handleFilterChange = (setter, value) => {
    setter(value);
  };
  
  const handleTestTypeChange = (value) => {
    setSelectedTestTypeFilter(value);
    setSelectedBranchFilter('All');
    setSelectedYearFilter('All');
    setSelectedCourseFilter('All');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin-login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // --- CONDITIONAL RENDERING (Same as AdminDashboardPage) ---
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

  // The rest of your page content, which only renders if isAdmin is true
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* The copied header code */}
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Student Test Overview </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg text-white bg-red-700 hover:bg-red-800 transition-colors"
        >
          <LogOutIcon />
          Logout
        </button>
      </header>

      {/* Main content of the View Student Marks Page */}
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Student Tests</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Back to Dashboard
            </button>
          </div>

          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {/* Date Filter */}
            <select
              value={selectedDateFilter}
              onChange={(e) => handleFilterChange(setSelectedDateFilter, e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
            >
              {kDateFilters.map(filter => <option key={filter} value={filter}>{`Date: ${filter}`}</option>)}
            </select>
            
            {/* Test Type Filter */}
            <select
              value={selectedTestTypeFilter}
              onChange={(e) => handleTestTypeChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
            >
              {kTestTypesForFilter.map(type => <option key={type} value={type}>{`Test Type: ${type}`}</option>)}
            </select>

            {/* Conditional Filters */}
            {selectedTestTypeFilter === 'College Student' && (
              <>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => handleFilterChange(setSelectedBranchFilter, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <option value="All">Branch: All</option>
                  {kBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => handleFilterChange(setSelectedYearFilter, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <option value="All">Year: All</option>
                  {kYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </>
            )}
            {selectedTestTypeFilter === 'Kadu Academy Student' && (
              <select
                value={selectedCourseFilter}
                onChange={(e) => handleFilterChange(setSelectedCourseFilter, e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <option value="All">Course: All</option>
                {kKaduCourses.map(course => <option key={course} value={course}>{course}</option>)}
              </select>
            )}
          </div>

          {/* Results Section */}
          {loading ? (
            <div className="text-center text-gray-500 mt-10">Loading student marks...</div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10">Error: {error}</div>
          ) : tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <div
                  key={test.id}
                  className="bg-white rounded-xl shadow-lg p-6 flex flex-col cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
                  onClick={() => {
                    // Navigate to a dedicated test-specific marks page
                    navigate(`/test-marks/${test.id}`, {
                      state: {
                        testId: test.id,
                        testTitle: test.title,
                        test: test, // Pass the full test object
                        dateFilter: selectedDateFilter // Pass the selected date filter
                      }
                    });
                  }}
                >
                  <h3 className="text-xl font-bold text-red-700">{test.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Type: {test.isFree ? 'Free' : test.isPaidKaduAcademy ? 'Kadu Academy' : 'College'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Submissions: <span className="font-semibold">{test.submissions}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-10">No tests with results found for this filter combination.</div>
          )}
        </div>
      </main>
    </div>
  );
}