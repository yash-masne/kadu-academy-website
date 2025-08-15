import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, FieldPath, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

// New PDF library for a more modern, component-based approach
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';

// Firebase imports for auth, needed for the header's logout functionality
import { getAuth, signOut } from 'firebase/auth';

// --- Dashboard Component Icons (lucide-react style SVGs) ---
// LogOutIcon is needed for the header
const LogOutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

// --- Consistent Constants (aligned with Dart code) ---
const kBranches = ['CSE', 'IT', 'ENTC', 'MECH', 'CIVIL', 'ELPO', 'OTHER'];
const kYears = ['First Year', 'Second Year', 'Third Year', 'Final Year', 'Other'];
const kKaduCourses = [
  'Banking', 'MBA CET', 'BBA CET', 'BCA CET', 'MCA CET', 'Railway',
  'Staff selection commission', 'MPSC', 'Police Bharti', 'Others',
];
const kDateFilters = [
  'Today', 'Last 7 days', 'Last 30 days', 'Last 6 months', 'Last year', 'All Time',
];
const kStudentSortOptions = [
  'Submission Time (Latest First)',
  'Roll Number (Ascending)',
];

// Helper function to calculate date range based on filter (replicated from Dart)
const getDateRange = (filter) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate = null;
  let endDate = null;

  switch (filter) {
    case 'Today':
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
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

// --- PDF Styles (dynamic width based on number of columns) ---
// This will be a function that creates styles based on the number of columns
const getPdfStyles = () => StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  audienceText: {
    fontSize: 12,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 15,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
  },
});

// PDF Document Component
// Now accepts 'dynamicColumns' and 'filtersDisplay'
const MyDocument = ({ submissions, testTitle, filtersDisplay, dynamicColumns }) => {
  const currentStyles = getPdfStyles();
  const numDataColumns = dynamicColumns.length - 1; // Exclude S.No.
  const snoWidth = '5%';
  const otherColWidth = numDataColumns > 0 ? `${95 / numDataColumns}%` : 'auto';

  return (
    <Document>
      <Page size="A4" style={currentStyles.page}>
        <Text style={currentStyles.header}>Kadu Academy - Student Test Results Report</Text>
        <Text style={currentStyles.subheader}>Test: {testTitle || 'Selected Test'}</Text>
        <Text style={currentStyles.audienceText}>{filtersDisplay}</Text>
        <Text style={currentStyles.dateText}>Date: {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</Text>

        <View style={currentStyles.table}>
          {/* Table Header */}
          <View style={currentStyles.tableRow}>
            {dynamicColumns.map((col, index) => (
              <View
                key={index}
                style={[
                  currentStyles.tableColHeader,
                  { width: col.key === 'serialNumber ' ? snoWidth : otherColWidth },
                ]}
              >
                <Text style={currentStyles.tableCellHeader}>{col.header}</Text>
              </View>
            ))}
          </View>

          {/* Table Body */}
          {submissions.map((submission, index) => (
            <View style={currentStyles.tableRow} key={submission.id}>
              {dynamicColumns.map((col, colIndex) => {
                let value;
                switch (col.key) {
                  case 'serialNumber ':
                    value = index + 1;
                    break;
                  case 'score':
                    value = `${(submission.score ?? 'N/A').toFixed(2)} / ${(submission.totalMarks ?? 'N/A').toFixed(2)}`;
                    break;
                  case 'percentage':
                    value = submission.percentage !== 'N/A' ? `${submission.percentage}%` : 'N/A';
                    break;
                  default:
                    value = submission[col.key] ?? 'N/A';
                    break;
                }
                return (
                  <View
                    key={colIndex}
                    style={[
                      currentStyles.tableCol,
                      { width: col.key === 'serialNumber ' ? snoWidth : otherColWidth },
                    ]}
                  >
                    <Text style={currentStyles.tableCell}>{value}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default function AdminTestSpecificMarksScreen({ auth, db }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentSortOption, setSelectedStudentSortOption] = useState('Submission Time (Latest First)');
  const [selectedStudentBranchFilter, setSelectedStudentBranchFilter] = useState('All');
  const [selectedStudentYearFilter, setSelectedStudentYearFilter] = useState('All');
  const [selectedStudentCourseFilter, setSelectedStudentCourseFilter] = useState('All');

  const navigate = useNavigate();
  const location = useLocation();

  const { testId, testTitle, test, dateFilter } = location.state || {};
  const cachedUsers = useRef({});

  // handleLogout function for the header
  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        navigate('/admin-login'); // Redirect to admin login page after logout
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  const fetchUserData = async (uid) => {
    if (cachedUsers.current[uid]) {
      return cachedUsers.current[uid];
    }
    if (!db) {
      return {};
    }
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (Object.keys(userData).length === 0) {
          return {};
        }
        const firstName = userData.firstName || userData.firstname || userData.FirstName || 'NOT_FOUND_FIRST';
        const lastName = userData.lastName || userData.lastname || userData.LastName || 'NOT_FOUND_LAST';
        const rollNo = userData.rollNo || userData.rollno || userData.RollNo || 'N/A';
        const branch = userData.branch || userData.Branch || 'N/A';
        const year = userData.year || userData.Year || 'N/A';
        // CORRECTED: Look for selectedCourse and course
        const course = userData.selectedCourse || userData.course || userData.Course || 'N/A';
        const processedUserData = {
          ...userData,
          firstName: firstName,
          lastName: lastName,
          rollNo: rollNo,
          branch: branch,
          year: year,
          course: course,
        };
        cachedUsers.current[uid] = processedUserData;
        return processedUserData;
      }
    } catch (e) {
      console.error(`Error fetching user data for ${uid}:`, e);
    }
    return {};
  };

  const processAndFilterAndSortStudentSessions = async () => {
    if (!db || !testId || !dateFilter || !test) {
      const missing = [];
      if (!db) missing.push('db');
      if (!testId) missing.push('testId');
      if (!dateFilter) missing.push('dateFilter');
      if (!test) missing.push('test object');
      setError(`Initialization failed: Missing ${missing.join(', ')}.`);
      setLoading(false);
      return [];
    }

    // --- START DEBUG LOGGING ---
    console.log("--- Starting data processing ---");
    console.log("Fetching submissions for testId:", testId, "with date filter:", dateFilter);
    const { startDate, endDate } = getDateRange(dateFilter);
    console.log("Calculated date range:", startDate, "to", endDate);
    // --- END DEBUG LOGGING ---

    let sessionsQueryRef = collection(db, 'studentTestSessions');
    let sessionsQuery = query(
      sessionsQueryRef,
      where('testId', '==', testId),
      where('status', '==', 'completed')
    );

    if (startDate) {
      sessionsQuery = query(sessionsQuery, where('submissionTime', '>=', startDate));
    }
    if (endDate) {
      sessionsQuery = query(sessionsQuery, where('submissionTime', '<', endDate));
    }
    sessionsQuery = query(sessionsQuery, orderBy('submissionTime', 'desc'));

    const snapshot = await getDocs(sessionsQuery);
    let studentSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // --- START DEBUG LOGGING ---
    console.log("Fetched initial student sessions from DB:", studentSessions.length);
    // --- END DEBUG LOGGING ---

    let filteredByTestAudience = [];
    if (test?.isFree) {
      filteredByTestAudience = studentSessions;
    } else {
      // --- START DEBUG LOGGING ---
      console.log("Test is not free. Filtering by test audience rules...");
      // --- END DEBUG LOGGING ---
      for (const sessionDoc of studentSessions) {
        const studentId = sessionDoc.studentId || '';
        if (!studentId) {
          continue;
        }

        const userData = await fetchUserData(studentId);
        const studentBranch = userData.branch || '';
        const studentYear = userData.year || '';
        const studentCourse = userData.course || '';

        // --- START DEBUG LOGGING ---
        console.log(`Checking student ${studentId}: Branch='${studentBranch}', Year='${studentYear}', Course='${studentCourse}'`);
        // --- END DEBUG LOGGING ---

        let matchesAudience = false;
        if (test?.isPaidCollege) {
          const branchMatches = test.allowedBranches?.includes('All') || test.allowedBranches?.includes(studentBranch);
          const yearMatches = test.allowedYears?.includes('All') || test.allowedYears?.includes(studentYear);
          matchesAudience = branchMatches && yearMatches;
        } else if (test?.isPaidKaduAcademy) {
          const courseMatches = test.allowedCourses?.includes('All') || test.allowedCourses?.includes(studentCourse);
          matchesAudience = courseMatches;
        }

        if (matchesAudience) {
          filteredByTestAudience.push(sessionDoc);
        } else {
            // --- START DEBUG LOGGING ---
            console.log(`- Excluded student ${studentId}: No audience match.`);
            // --- END DEBUG LOGGING ---
        }
      }
    }

    // --- START DEBUG LOGGING ---
    console.log("Sessions after audience filter:", filteredByTestAudience.length);
    // --- END DEBUG LOGGING ---

    let finalFilteredStudents = [];
    // --- START DEBUG LOGGING ---
    console.log("Applying UI filters to remaining students...");
    // --- END DEBUG LOGGING ---
    for (const sessionDoc of filteredByTestAudience) {
      const studentId = sessionDoc.studentId || '';
      if (!studentId) {
        continue;
      }

      const userData = cachedUsers.current[studentId] || {};
      const studentName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      const studentRollNo = userData.rollNo || 'N/A';
      const studentBranch = userData.branch || '';
      const studentYear = userData.year || '';
      const studentCourse = userData.course || '';

      const rawScore = sessionDoc.score ?? 0;
      const rawTotalQuestions = sessionDoc.totalQuestions ?? 0;
      const marksPerQuestion = test.marksPerQuestion ?? 1.0;
      const calculatedTotalMarks = rawTotalQuestions * marksPerQuestion;
      
      const percentage = calculatedTotalMarks > 0
        ? Math.round((rawScore / calculatedTotalMarks) * 100)
        : 'N/A';

      let matchesStudentBranchFilter = true;
      let matchesStudentYearFilter = true;
      let matchesStudentCourseFilter = true;

      if (test?.isPaidCollege) {
        if (selectedStudentBranchFilter !== 'All' && selectedStudentBranchFilter !== '') {
          matchesStudentBranchFilter = (studentBranch === selectedStudentBranchFilter);
        }
        if (selectedStudentYearFilter !== 'All' && selectedStudentYearFilter !== '') {
          matchesStudentYearFilter = (studentYear === selectedStudentYearFilter);
        }
      } else if (test?.isPaidKaduAcademy) {
        if (selectedStudentCourseFilter !== 'All' && selectedStudentCourseFilter !== '') {
          matchesStudentCourseFilter = (studentCourse === selectedStudentCourseFilter);
        }
      }

      if (matchesStudentBranchFilter && matchesStudentYearFilter && matchesStudentCourseFilter) {
        finalFilteredStudents.push({
          ...sessionDoc,
          studentName,
          rollNo: studentRollNo,
          branch: studentBranch,
          year: studentYear,
          course: studentCourse,
          totalMarks: calculatedTotalMarks,
          percentage: percentage,
          submissionTime: sessionDoc.submissionTime?.toDate ? sessionDoc.submissionTime.toDate().toLocaleString() : 'N/A'
        });
      } else {
          // --- START DEBUG LOGGING ---
          console.log(`- Excluded student ${studentId}: UI filter mismatch. Student: {branch: '${studentBranch}', year: '${studentYear}', course: '${studentCourse}'}. Filters: {branch: '${selectedStudentBranchFilter}', year: '${selectedStudentYearFilter}', course: '${selectedStudentCourseFilter}'}`);
          // --- END DEBUG LOGGING ---
      }
    }

    if (selectedStudentSortOption === 'Roll Number (Ascending)') {
      finalFilteredStudents.sort((a, b) => {
        const rollNoA = a.rollNo || 'ZZZ';
        const rollNoB = b.rollNo || 'ZZZ';
        return rollNoA.localeCompare(rollNoB);
      });
    } else {
      finalFilteredStudents.sort((a, b) => {
        const submissionTimeA = a.submissionTime?.toDate ? a.submissionTime.toDate() : new Date(0);
        const submissionTimeB = b.submissionTime?.toDate ? b.submissionTime.toDate() : new Date(0);
        return submissionTimeB.getTime() - submissionTimeA.getTime();
      });
    }

    // --- START DEBUG LOGGING ---
    console.log("--- Data processing complete ---");
    console.log("Final number of students to display:", finalFilteredStudents.length);
    // --- END DEBUG LOGGING ---

    return finalFilteredStudents;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    processAndFilterAndSortStudentSessions()
      .then(data => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error in processAndFilterAndSortStudentSessions (useEffect catch):", e);
        setError("Failed to load student submissions due to an internal error.");
        setLoading(false);
      });
  }, [db, testId, test, dateFilter, selectedStudentSortOption, selectedStudentBranchFilter, selectedStudentYearFilter, selectedStudentCourseFilter]);

  // Reset sort option if user switches test types
  useEffect(() => {
    if (test && !test.isPaidCollege && selectedStudentSortOption === 'Roll Number (Ascending)') {
      setSelectedStudentSortOption('Submission Time (Latest First)');
    }
  }, [test, selectedStudentSortOption]);


  // --- Helper to get dynamic columns for PDF/Excel ---
  const getDynamicExportColumns = (data) => {
    const baseColumns = [
      { header: 'S.No. ', key: 'serialNumber ' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Roll No', key: 'rollNo' },
      { header: 'Branch', key: 'branch' },
      { header: 'Year', key: 'year' },
      { header: 'Course', key: 'course' },
      { header: 'Score', key: 'score' },
      { header: 'Percentage', key: 'percentage' },
      { header: 'Correct Answers', key: 'correctAnswers' },
    ];

    const finalVisibleColumns = baseColumns.filter(column => {
      if (['serialNumber ', 'studentName', 'score', 'percentage'].includes(column.key)) {
        return true;
      }
      return data.some(submission => {
        const value = submission[column.key];
        return value !== 'N/A' && value !== null && value !== undefined && value !== '';
      });
    });

    return finalVisibleColumns;
  };

  // --- Helper to get dynamic columns for the HTML table ---
  const getDynamicTableColumns = (data) => {
    const baseColumns = [
      { header: 'S.No. ', key: 'serialNumber ' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Roll No', key: 'rollNo' },
      { header: 'Branch', key: 'branch' },
      { header: 'Year', key: 'year' },
      { header: 'Course', key: 'course' },
      { header: 'Score', key: 'score' },
      { header: 'Percentage', key: 'percentage' },
      { header: 'Submitted At', key: 'submissionTime' },
    ];

    return baseColumns.filter(column => {
      if (['serialNumber ', 'studentName', 'score', 'percentage', 'submissionTime'].includes(column.key)) {
        return true;
      }
      return data.some(submission => {
        const value = submission[column.key];
        return value !== 'N/A' && value !== null && value !== undefined && value !== '';
      });
    });
  };

  // --- Excel Generation Logic ---
  const generateExcelReport = async () => {
    if (submissions.length === 0) {
      alert('No data to export to Excel.');
      return;
    }

    const dynamicColumns = getDynamicExportColumns(submissions);
    const worksheetHeaders = dynamicColumns.map(column => column.header);

    const worksheetData = submissions.map((submission, index) => {
      const row = {};

      for (const column of dynamicColumns) {
        let value;
        switch (column.key) {
          case 'score':
            // Corrected to use 2 decimal places
            const score = (submission.score ?? 'N/A').toFixed(2);
            const totalMarks = (submission.totalMarks ?? 'N/A').toFixed(2);
            value = `${score} / ${totalMarks}`;
            break;
          case 'percentage':
            value = submission.percentage !== 'N/A' ? `${submission.percentage}%` : 'N/A';
            break;
          case 'serialNumber ':
            value = index + 1;
            break;
          case 'correctAnswers':
            value = submission.correctAnswers ?? 'N/A';
            break;
          default:
            value = submission[column.key] ?? 'N/A';
            break;
        }
        row[column.key] = value;
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.sheet_add_aoa(ws, [worksheetHeaders], { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Results');
    XLSX.writeFile(wb, `${testTitle || 'Test'}_Marks_Report.xlsx`);
    alert('Excel generated and downloaded!');
  };

  if (!testId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-lg w-full">
          <p className="text-2xl font-bold text-red-600">Test Not Found</p>
          <p className="mt-4 text-gray-600">No test ID provided. Please navigate from the Student Marks overview.</p>
          <button
            onClick={() => navigate('/view-marks')}
            className="mt-6 w-full py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Go to Student Marks
          </button>
        </div>
      </div>
    );
  }

  // New logic to create the display string for the PDF
  const isFilterSelected =
    selectedStudentBranchFilter !== 'All' ||
    selectedStudentYearFilter !== 'All' ||
    selectedStudentCourseFilter !== 'All';

  let filtersDisplay = '';
  if (!isFilterSelected) {
    filtersDisplay = 'All Students';
  } else {
    const filters = [];
    if (test?.isPaidCollege) {
      if (selectedStudentBranchFilter !== 'All') {
        filters.push(`Branch: ${selectedStudentBranchFilter}`);
      }
      if (selectedStudentYearFilter !== 'All') {
        filters.push(`Year: ${selectedStudentYearFilter}`);
      }
    } else if (test?.isPaidKaduAcademy) {
      if (selectedStudentCourseFilter !== 'All') {
        filters.push(`Course: ${selectedStudentCourseFilter}`);
      }
    }
    filtersDisplay = filters.length > 0 ? filters.join(', ') : 'All Students';
  }

  const dynamicExportColumns = getDynamicExportColumns(submissions);
  const dynamicTableColumns = getDynamicTableColumns(submissions);
  const availableSortOptions = test?.isPaidCollege
    ? kStudentSortOptions
    : kStudentSortOptions.filter(opt => opt !== 'Roll Number (Ascending)');


  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* The copied header code */}
      <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold text-gray-800">Student Marks Overview</span>
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
            <h2 className="text-3xl font-bold text-gray-800">Marks for: {testTitle || 'Selected Test'}</h2>
            <div className="flex space-x-3">
              {/* PDF Download Link with new library */}
              {submissions.length > 0 && testTitle && filtersDisplay ? (
                <PDFDownloadLink
                  key={Date.now()}
                  document={<MyDocument submissions={submissions} testTitle={testTitle} filtersDisplay={filtersDisplay} dynamicColumns={dynamicExportColumns} />}
                  fileName={`${testTitle || 'Test'}_Marks_Report.pdf`}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {({ blob, url, loading, error }) =>
                    loading ? (
                      'Loading PDF...'
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucude-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                        PDF
                      </>
                    )
                  }
                </PDFDownloadLink>
              ) : (
                <button
                  className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-600 text-white font-medium opacity-50 cursor-not-allowed"
                  disabled
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucude-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                  PDF
                </button>
              )}
              
              <button
                onClick={generateExcelReport}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                title="Export to Excel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-spreadsheet"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 20V12"/><path d="M16 20V12"/><path d="M4 12h16"/></svg>
                Excel
              </button>
              <button
                onClick={() => navigate('/view-marks')}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                Back
              </button>
            </div>
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-lg font-semibold text-gray-700">Audience: {filtersDisplay}</p>
          </div>

          {/* Filter & Sort Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Sort Students By */}
            <select
              value={selectedStudentSortOption}
              onChange={(e) => setSelectedStudentSortOption(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
            >
              {availableSortOptions.map(option => <option key={option} value={option}>{`Sort: ${option}`}</option>)}
            </select>

            {/* Conditional Branch Filter (for College Student tests) */}
            {test?.isPaidCollege && (
              <select
                value={selectedStudentBranchFilter}
                onChange={(e) => setSelectedStudentBranchFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <option value="All">Branch: All</option>
                {kBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            )}

            {/* Conditional Year Filter (for College Student tests) */}
            {test?.isPaidCollege && (
              <select
                value={selectedStudentYearFilter}
                onChange={(e) => setSelectedStudentYearFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <option value="All">Year: All</option>
                {kYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            )}

            {/* Conditional Course Filter (for Kadu Academy Student tests) */}
            {test?.isPaidKaduAcademy && (
              <select
                value={selectedStudentCourseFilter}
                onChange={(e) => setSelectedStudentCourseFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <option value="All">Course: All</option>
                {kKaduCourses.map(course => <option key={course} value={course}>{course}</option>)}
              </select>
            )}
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="text-center text-gray-500 mt-10">Loading submissions...</div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10">Error: {error}</div>
          ) : submissions.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Dynamically render table headers */}
                    {dynamicTableColumns.map((col, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission, index) => {
                    return (
                      <tr key={submission.id}>
                        {/* Dynamically render table cells */}
                        {dynamicTableColumns.map((col, colIndex) => {
                          let value;
                          switch (col.key) {
                            case 'serialNumber ':
                              value = index + 1;
                              break;
                            case 'score':
                              value = `${(submission.score ?? 'N/A').toFixed(2)} / ${(submission.totalMarks ?? 'N/A').toFixed(2)}`;
                              break;
                            case 'percentage':
                              value = submission.percentage !== 'N/A' ? `${submission.percentage}%` : 'N/A';
                              break;
                            default:
                              value = submission[col.key] ?? 'N/A';
                              break;
                          }
                          return (
                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-10">No submissions found for this test matching the selected filters.</div>
          )}
        </div>
      </main>
    </div>
  );
}
