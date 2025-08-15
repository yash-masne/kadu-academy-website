// src/pages/AdminTestDetailManagementPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, Timestamp, writeBatch, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLocation, useNavigate } from 'react-router-dom';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Footer from '../components/Footer'; // Import the new component

// --- Global Firebase Config & Auth Token provided by the environment ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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
const SaveIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const AddIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
);
const ImagePlusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
);
const XCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const EditIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
);
const DuplicateIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const DeleteIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const InfoIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
const ErrorIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const ArrowDownCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-8.86"/><path d="M9 11l3 3L22 4"/></svg>
);

// --- CONSTANTS ---
const kBranches = ['CSE', 'IT', 'ENTC', 'MECH', 'CIVIL', 'ELPO', 'OTHER'];
const kYears = ['First Year', 'Second Year', 'Third Year', 'Final Year', 'Other'];
const kTestTypes = ['Free', 'Kadu Academy Student', 'College Student'];
const kKaduCourses = ['Banking', 'MBA CET', 'BBA CET', 'BCA CET', 'MCA CET', 'Railway', 'Staff selection commission', 'MPSC', 'Police Bharti', 'Others'];

// --- HELPER COMPONENTS ---
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
      <div className={`fixed top-24 right-4 z-[60] flex items-center p-4 rounded-lg shadow-xl text-white ${bgColor} animate-slide-in-right`}>
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

// --- MODIFIED CODE START: Expanded LatexToolbar with new buttons and dynamic insertion ---
const LatexToolbar = ({ onAddLatex }) => (
  <div className="flex flex-wrap gap-2">
    <button onClick={() => onAddLatex('\\frac{numerator}{denominator}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Fraction</button>
    <button onClick={() => onAddLatex('\\sum_{lower}^{upper}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Sum</button>
    <button onClick={() => onAddLatex('\\sqrt{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Sqrt</button>
    <button onClick={() => onAddLatex('\\alpha')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Alpha</button>
    <button onClick={() => onAddLatex('\\textbf{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Bold</button>
    <button onClick={() => onAddLatex('\\text{}')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">Text</button>
    <button onClick={() => onAddLatex('\\times')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">×</button>
    <button onClick={() => onAddLatex('\\div')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">÷</button>
    <button onClick={() => onAddLatex('\\approx')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≈</button>
    <button onClick={() => onAddLatex('\\implies')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">⇒</button>
    <button onClick={() => onAddLatex('\\iff')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">⇔</button>
    <button onClick={() => onAddLatex('\\therefore')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">∴</button>
    <button onClick={() => onAddLatex('\\because')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">∵</button>
    <button onClick={() => onAddLatex('\\geq')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≥</button>
    <button onClick={() => onAddLatex('\\leq')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">≤</button>
  </div>
);
// --- MODIFIED CODE END ---


// NEW: ImportQuestionsModal Component
// NEW: ImportQuestionsModal Component
const ImportQuestionsModal = ({ isOpen, onClose, currentTestId, onImportQuestions, showSnackbar }) => {
    const db = getFirestore();
    const [availableTests, setAvailableTests] = useState([]);
    const [selectedTestToImportFrom, setSelectedTestToImportFrom] = useState(null);
    const [questionsFromSelectedTest, setQuestionsFromSelectedTest] = useState([]);
    const [selectedQuestionsForImport, setSelectedQuestionsForImport] = useState({}); // { questionId: true/false }
    const [loadingTests, setLoadingTests] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchTests = async () => {
            setLoadingTests(true);
            try {
                const q = query(collection(db, 'tests'), orderBy('createdAt', 'desc')); // Order for recent tests first
                const querySnapshot = await getDocs(q);
                const tests = querySnapshot.docs
                    .filter(doc => doc.id !== currentTestId) // Exclude current test
                    .map(doc => ({ id: doc.id, ...doc.data() }));
                setAvailableTests(tests);
            } catch (e) {
                showSnackbar(`Failed to load tests: ${e.message}`, 'error');
            } finally {
                setLoadingTests(false);
            }
        };

        fetchTests();
    }, [isOpen, currentTestId, db, showSnackbar]);

    useEffect(() => {
        if (!selectedTestToImportFrom) {
            setQuestionsFromSelectedTest([]);
            setSelectedQuestionsForImport({});
            return;
        }

        const fetchQuestions = async () => {
            setLoadingQuestions(true);
            try {
                const q = query(collection(db, 'tests', selectedTestToImportFrom.id, 'questions'), orderBy('createdAt', 'asc'));
                const querySnapshot = await getDocs(q);
                const questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setQuestionsFromSelectedTest(questions);
            } catch (e) {
                showSnackbar(`Failed to load questions from selected test: ${e.message}`, 'error');
            } finally {
                setLoadingQuestions(false);
            }
        };

        fetchQuestions();
    }, [selectedTestToImportFrom, db, showSnackbar]);

    const handleQuestionCheckboxChange = (questionId, isChecked) => {
        setSelectedQuestionsForImport(prev => ({
            ...prev,
            [questionId]: isChecked,
        }));
    };

    const handleImportClick = () => {
        const questionsToImport = questionsFromSelectedTest.filter(q => selectedQuestionsForImport[q.id]);
        if (questionsToImport.length === 0) {
            showSnackbar('Please select at least one question to import.', 'info');
            return;
        }
        onImportQuestions(questionsToImport);
        onClose();
    };

    if (!isOpen) return null;

    // --- MODIFIED CODE START: Re-using the formatTextWithBold function for preview
    const formatTextWithBold = (text) => {
      if (typeof text !== 'string') {
        return text;
      }
      const parts = text.split('*');
      let result = '';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 !== 0) {
          result += `<strong>${parts[i]}</strong>`;
        } else {
          result += parts[i];
        }
      }
      return result;
    };
    // --- MODIFIED CODE END ---


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 p-4">
            <div className="bg-white border border-gray-300 p-8 rounded-xl shadow-2xl max-w-3xl w-full h-5/6 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Import Questions</h3>
                
                {loadingTests ? (
                    <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500"></div></div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Test Selection */}
                        <div className="mb-4 flex-shrink-0">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Source Test:</label>
                            <select
                                value={selectedTestToImportFrom?.id || ''}
                                onChange={(e) => {
                                    const test = availableTests.find(t => t.id === e.target.value);
                                    setSelectedTestToImportFrom(test);
                                }}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">-- Select a Test --</option>
                                {availableTests.map(test => (
                                    <option key={test.id} value={test.id}>{test.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Questions from Selected Test */}
                        {selectedTestToImportFrom && (
                            <div className="flex-1 overflow-y-auto border p-4 rounded-lg bg-gray-50">
                                <h4 className="text-lg font-bold text-gray-800 mb-3">Questions from "{selectedTestToImportFrom.title}"</h4>
                                {loadingQuestions ? (
                                    <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-red-500"></div></div>
                                ) : questionsFromSelectedTest.length === 0 ? (
                                    <p className="text-center text-gray-600">No questions found in this test.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {questionsFromSelectedTest.map((question, index) => (
                                            <div key={question.id} className="flex items-start p-3 border rounded-lg bg-white shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedQuestionsForImport[question.id]}
                                                    onChange={(e) => handleQuestionCheckboxChange(question.id, e.target.checked)}
                                                    className="form-checkbox h-5 w-5 text-blue-600 rounded mt-1 mr-3 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    {/* NEW: Render image based on placement */}
                                                    {question.isImageAboveQuestion && question.imageUrl && <img src={question.imageUrl} alt="Question" className="max-h-16 mb-2 object-contain" />}
                                                    <p className="text-sm font-medium text-gray-800 break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {question.isLatexQuestion ? (
                                                            <Latex>{`$${question.questionTextPart1}$`}</Latex>
                                                        ) : (
                                                            <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(question.questionTextPart1) }}></span>
                                                        )}
                                                    </p>
                                                    {/* NEW: Render image in-between */}
                                                    {question.isImageInBetween && question.imageUrl && <img src={question.imageUrl} alt="Question" className="max-h-16 my-2 object-contain" />}
                                                    {/* NEW: Render second part of text */}
                                                    {question.isImageInBetween && question.questionTextPart2 && (
                                                        <p className="text-sm font-medium text-gray-800 break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {question.isLatexQuestion ? (
                                                                <Latex>{`$${question.questionTextPart2}$`}</Latex>
                                                            ) : (
                                                                <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(question.questionTextPart2) }}></span>
                                                            )}
                                                        </p>
                                                    )}
                                                    {/* NEW: Render image below text */}
                                                    {!question.isImageAboveQuestion && !question.isImageInBetween && question.imageUrl && <img src={question.imageUrl} alt="Question" className="max-h-16 mt-2 object-contain" />}
                                                    {/* NEW: Display options for the question */}
                                                    <ul className="mt-2 text-xs text-gray-600 space-y-1">
                                                        {question.options.slice(0, question.enableOptionE ? 5 : 4).map((option, optIndex) => (
                                                            <li key={optIndex} className="flex items-center">
                                                                <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                                                <div className="flex-1">
                                                                    {option.isLatexOption ? (
                                                                        <Latex>{`$${option.text}$`}</Latex>
                                                                    ) : (
                                                                        <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(option.text) }}></span>
                                                                    )}
                                                                </div>
                                                                {option.imageUrl && <img src={option.imageUrl} alt="Option" className="max-h-12 ml-2 object-contain" />}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200"
                    >
                        Import Selected Questions
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const AdminTestDetailManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId, initialTestData } = location.state || {};
  const db = getFirestore();
  const storage = getStorage();

  const questionFormRef = useRef(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});
  const [showImportModal, setShowImportModal] = useState(false); // NEW: State for import modal

  // Test Details State
  const [title, setTitle] = useState(initialTestData?.title ?? '');
  const [description, setDescription] = useState(initialTestData?.description ?? '');
  const [duration, setDuration] = useState(initialTestData?.durationMinutes?.toString() ?? '');
  
  // Test Type & Multi-Selects State
  const [selectedTestType, setSelectedTestType] = useState(null);
  const [selectedKaduCourses, setSelectedKaduCourses] = useState(initialTestData?.allowedCourses ?? []);
  const [selectedCollegeBranches, setSelectedCollegeBranches] = useState(initialTestData?.allowedBranches ?? []);
  const [selectedCollegeYears, setSelectedCollegeYears] = useState(initialTestData?.allowedYears ?? []);

  // Marking Scheme State
  const [marksPerQuestion, setMarksPerQuestion] = useState(initialTestData?.marksPerQuestion?.toString() ?? '1.0');
  const [isNegativeMarking, setIsNegativeMarking] = useState(initialTestData?.isNegativeMarking ?? false);
  const [negativeMarksValue, setNegativeMarksValue] = useState(initialTestData?.negativeMarksValue?.toString() ?? '0.0');

  // Option E and Question Image State
  const [enableOptionE, setEnableOptionE] = useState(initialTestData?.enableOptionE ?? true);
  const [questionImageUrl, setQuestionImageUrl] = useState(initialTestData?.imageUrl ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);



// --- MODIFIED CODE START: Re-using the formatTextWithBold function for preview
// Locate and replace the existing formatTextWithBold function with this:

const formatTextWithBold = (text) => {
    if (typeof text !== 'string') {
        return text;
    }
    // MODIFIED: Updated to split by a single asterisk
    const parts = text.split('*');
    let result = '';

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 !== 0) {
            result += `<strong>${parts[i]}</strong>`;
        } else {
            result += parts[i];
        }
    }
    return result;
};
// --- MODIFIED CODE END ---


// --- Question Management Form State ---
const [editingQuestionId, setEditingQuestionId] = useState(null);
const [questionTextPart1, setQuestionTextPart1] = useState('');
const [questionTextPart2, setQuestionTextPart2] = useState('');
const [isImageAboveQuestion, setIsImageAboveQuestion] = useState(false);
const [isImageInBetween, setIsImageInBetween] = useState(false);
// --- MODIFIED CODE START: Separate state for LaTeX part 1 and 2
const [isLatexQuestion, setIsLatexQuestion] = useState(false);
// --- MODIFIED CODE END ---
const [options, setOptions] = useState(Array.from({ length: 5 }, () => ({ text: '', isCorrect: false, imageUrl: null, isLatexOption: false })));
const [isUploadingOptionImage, setIsUploadingOptionImage] = useState(Array(5).fill(false));
// ... (existing states for test details like title, description, etc. should also be here)

// ...

// In the form's Image Placement select dropdown, update the `value` and `onChange` handler.
// ... (in the question form section)

<select
  value={isImageInBetween ? 'inBetween' : (isImageAboveQuestion ? 'above' : 'below')}
  onChange={(e) => {
    const value = e.target.value;
    setIsImageAboveQuestion(value === 'above');
    setIsImageInBetween(value === 'inBetween');
    // We don't need a setIsImageBelowQuestion call here
  }}
  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
>
  <option value="below">Below Text</option>
  <option value="above">Above Text</option>
  <option value="inBetween">In-Between Text</option>
</select>

  // Existing Questions List State
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // --- HELPER FUNCTIONS ---
  const showSnackbar = (message, type = 'info') => setSnackbar({ show: true, message, type });
  const hideSnackbar = () => setSnackbar({ show: false, message: '', type: '' });
  const showConfirm = (title, message, onConfirm) => {
    setConfirmModalData({ title, message, onConfirm });
    setShowConfirmModal(true);
  };
  
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin-test-list');
  };

  // --- EFFECTS FOR INITIALIZATION & DATA FETCHING ---
  useEffect(() => {
    if (!testId || !initialTestData) {
      navigate('/admin-test-management');
      return;
    }

    if (initialTestData.isFree) {
        setSelectedTestType('Free');
    } else if (initialTestData.isPaidCollege) {
        setSelectedTestType('College Student');
    } else if (initialTestData.isPaidKaduAcademy) {
        setSelectedTestType('Kadu Academy Student');
    }

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
          showSnackbar('Authentication error. Redirecting.', 'error');
          await signOut(authInstance);
          navigate('/admin-login');
        }
      } else {
        navigate('/admin-login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, [navigate, testId, initialTestData]);

  useEffect(() => {
    if (isAuthReady && isAdmin && testId) {
      // MODIFIED: Order by the new 'order' field instead of 'createdAt'
      const questionsQuery = query(collection(db, 'tests', testId, 'questions'), orderBy('order', 'asc'));
      const unsubscribeQuestions = onSnapshot(questionsQuery, (snapshot) => {
        const fetchedQuestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuestions(fetchedQuestions);
        setQuestionsLoading(false);
      }, (err) => {
        showSnackbar(`Failed to load questions: ${err.message}`, 'error');
        setQuestionsLoading(false);
      });
      return () => unsubscribeQuestions();
    }
  }, [isAuthReady, isAdmin, testId, db]);

// Locate and replace the existing deleteQuestion function with this code.

const deleteQuestion = (questionId, questionText) => {
  // NEW: Truncate the question text for the confirmation modal
  const truncatedText = questionText.length > 150 ? `${questionText.substring(0, 150)}...` : questionText;
  
  showConfirm(
    'Confirm Deletion',
    `Are you sure you want to delete this question: "${truncatedText}"?`,
    async () => {
      // Close the modal first
      setShowConfirmModal(false);
      
      try {
        // 1. Delete the question from the database
        await deleteDoc(doc(db, 'tests', testId, 'questions', questionId));
        
        // 2. Filter out the deleted question from the local state list
        const remainingQuestions = questions.filter(q => q.id !== questionId);

        // 3. Re-index the remaining questions to fill the gap
        // This function will handle the batch write to Firestore.
        await reIndexQuestions(db, testId, remainingQuestions);
        
        // 4. Update the total question count on the main test document
        await updateDoc(doc(db, 'tests', testId), {
          totalQuestions: remainingQuestions.length,
          updatedAt: Timestamp.now()
        });

        showSnackbar('Question deleted successfully!', 'success');
        clearQuestionForm();
        
      } catch (e) {
        showSnackbar(`Failed to delete question: ${e.message}`, 'error');
        console.error('Deletion error:', e);
      }
    }
  );
};
  // NEW: Effect to control body scrolling
  useEffect(() => {
    // Save original body overflow style
    const originalOverflow = document.body.style.overflow;
    // Set body overflow to hidden when modal is open
    if (showImportModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow; // Restore original
    }

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showImportModal]);


  // --- TEST DETAILS MANAGEMENT ---
  const updateTestDetails = async () => {
    if (!selectedTestType) {
        showSnackbar('Please select a Test Type.', 'error');
        return;
    }
    if (title.trim() === '' || description.trim() === '' || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      showSnackbar('Please fill all test details correctly.', 'error');
      return;
    }

    if (selectedTestType === 'Kadu Academy Student' && selectedKaduCourses.length === 0) {
        showSnackbar('Please select at least one course for a Kadu Academy Test.', 'error');
        return;
    } else if (selectedTestType === 'College Student') {
        if (selectedCollegeBranches.length === 0) {
            showSnackbar('Please select at least one branch for a College Test.', 'error');
            return;
        }
        if (selectedCollegeYears.length === 0) {
            showSnackbar('Please select at least one year for a College Test.', 'error');
            return;
        }
    }
    
    try {
      const updateData = {
        title,
        description,
        durationMinutes: parseInt(duration),
        marksPerQuestion: parseFloat(marksPerQuestion),
        isNegativeMarking,
        negativeMarksValue: isNegativeMarking ? parseFloat(negativeMarksValue) : 0,
        enableOptionE,
        isFree: selectedTestType === 'Free',
        isPaidCollege: selectedTestType === 'College Student',
        isPaidKaduAcademy: selectedTestType === 'Kadu Academy Student',
        updatedAt: Timestamp.now(),
        title_lowercase: title.toLowerCase()
      };

      if (selectedTestType === 'Kadu Academy Student') {
        updateData.allowedCourses = selectedKaduCourses;
        updateData.allowedBranches = [];
        updateData.allowedYears = [];
      } else if (selectedTestType === 'College Student') {
        updateData.allowedBranches = selectedCollegeBranches;
        updateData.allowedYears = selectedCollegeYears;
        updateData.allowedCourses = [];
      } else { // Free test or other
        updateData.allowedCourses = [];
        updateData.allowedBranches = [];
        updateData.allowedYears = [];
      }

      await updateDoc(doc(db, 'tests', testId), updateData);
      showSnackbar('Test details updated successfully!', 'success');
    } catch (e) {
      showSnackbar(`Failed to update test details: ${e.message}`, 'error');
    }
  };


  // --- IMAGE UPLOAD LOGIC ---
  const handleImageUpload = async (file, isOption = false, optionIndex = null) => {
    if (!file) return;

    if (isOption) {
      const newUploadingState = [...isUploadingOptionImage];
      newUploadingState[optionIndex] = true;
      setIsUploadingOptionImage(newUploadingState);
    } else {
      setIsUploadingImage(true);
    }

    const storageInstance = getStorage();
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storageInstance, `question_images/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      if (isOption) {
        const newOptions = [...options];
        newOptions[optionIndex].imageUrl = downloadUrl;
        setOptions(newOptions);
      } else {
        setQuestionImageUrl(downloadUrl);
      }
      showSnackbar('Image uploaded successfully!', 'success');
    } catch (e) {
      showSnackbar(`Failed to upload image: ${e.message}`, 'error');
    } finally {
      if (isOption) {
        const newUploadingState = [...isUploadingOptionImage];
        newUploadingState[optionIndex] = false;
        setIsUploadingOptionImage(newUploadingState);
      } else {
        setIsUploadingImage(false);
      }
    }
  };

  const clearImage = (isOption = false, optionIndex = null) => {
    if (isOption) {
      const newOptions = [...options];
      newOptions[optionIndex].imageUrl = null;
      setOptions(newOptions);
    } else {
      setQuestionImageUrl(null);
    }
  };

  const handleFileChange = (e, isOption = false, optionIndex = null) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file, isOption, optionIndex);
    }
  };

  // --- MODIFIED CODE START: Handle image paste for all textareas
  // Locate and replace the existing handleTextPaste function with this updated version:

const handleTextPaste = (e, isOption = false, optionIndex = null) => {
    const item = e.clipboardData.items[0];
    if (item && item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        handleImageUpload(file, isOption, optionIndex);
        e.preventDefault();
        return;
      }
    }

    const pastedText = e.clipboardData.getData('text');

    // Only apply the text splitting logic for the first option (optionIndex === 0)
    if (isOption && optionIndex === 0 && pastedText.includes('\n')) {
      const lines = pastedText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^\(?\w+\)?\.?\s*/, '').trim());

      const newOptions = Array.from({ length: 5 }, (_, i) => {
        const line = lines[i] || '';
        return {
          ...options[i],
          text: line,
        };
      });

      setOptions(newOptions);
      showSnackbar('Options populated from paste.', 'info');
      e.preventDefault();
      return;
    }
};

const duplicateImageAndGetUrl = async (sourceUrl) => {
  if (!sourceUrl) return null;
  try {
    const response = await fetch(sourceUrl);
    const imageBlob = await response.blob();
    const fileName = sourceUrl.substring(sourceUrl.lastIndexOf('%2F') + 3, sourceUrl.indexOf('?'));
    const newFileName = `${Date.now()}-${fileName}`;
    const storageRef = ref(storage, `question_images/${newFileName}`);
    await uploadBytes(storageRef, imageBlob);
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error("Failed to duplicate image:", e);
    return null;
  }
};
// Reusable function to create a deep clone of an object and duplicate images
// Reusable function to create a deep clone of an object and duplicate images
// NEW: Reusable function to create a deep clone of an object and duplicate images
const deepCloneAndDuplicateImages = async (originalQuestion) => {
    // Create a deep copy of all properties to ensure a new, independent object
    const clonedData = JSON.parse(JSON.stringify(originalQuestion));

    // Wait for the image duplication process to complete
    if (clonedData.imageUrl) {
        clonedData.imageUrl = await duplicateImageAndGetUrl(clonedData.imageUrl);
    }
    
    // Duplicate images for options
    if (clonedData.options && Array.isArray(clonedData.options)) {
        for (let i = 0; i < clonedData.options.length; i++) {
            if (clonedData.options[i].imageUrl) {
                clonedData.options[i].imageUrl = await duplicateImageAndGetUrl(clonedData.options[i].imageUrl);
            }
        }
    }

    // Clean up non-duplicable properties
    delete clonedData.id;
    delete clonedData.createdAt;

    return clonedData;
};

// Reusable function to re-index all questions
const reIndexQuestions = async (db, testId, questionList) => {
  const batch = writeBatch(db);
  questionList.forEach((question, index) => {
    const questionRef = doc(db, 'tests', testId, 'questions', question.id);
    batch.update(questionRef, { order: index + 1 });
  });
  try {
    await batch.commit();
    console.log('Questions re-indexed successfully.');
  } catch (error) {
    console.error('Error re-indexing questions: ', error);
    throw new Error('Failed to re-index questions.');
  }
};

const finalCheckTest = () => {
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const hasCorrectOption = question.options.some(option => option.isCorrect);
    
    if (!hasCorrectOption) {
      showSnackbar(`Validation Failed: Question ${question.order} has no correct option selected.`, 'error');
      
      // Optional: Find the element and scroll to it for the user
      const element = document.getElementById(`question-${question.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return; // Stop checking and exit the function
    }
  }

  showSnackbar('Final check passed! All questions have a correct option selected.', 'success');
};
  // --- QUESTION MANAGEMENT ---
 // ... (inside the AdminTestDetailManagementPage component)

const addOrUpdateQuestion = async () => {
    const questionText = isImageInBetween ? `${questionTextPart1} ${questionTextPart2}` : questionTextPart1;
    if (questionText.trim() === '' && !questionImageUrl) {
      showSnackbar('Question must have text or an image.', 'error');
      return;
    }

    try {
      const questionsCollection = collection(db, 'tests', testId, 'questions');
      const newTotalQuestions = questions.length + (editingQuestionId ? 0 : 1);

      const questionData = {
        questionText,
        questionTextPart1: questionTextPart1,
        questionTextPart2: isImageInBetween ? questionTextPart2 : '',
        isImageAboveQuestion,
        isImageInBetween,
        // MODIFIED: Use the single isLatexQuestion variable
        isLatexQuestion,
        options,
        imageUrl: questionImageUrl,
      };

      if (editingQuestionId) {
        await updateDoc(doc(questionsCollection, editingQuestionId), {
          ...questionData,
          updatedAt: Timestamp.now()
        });
        showSnackbar('Question updated successfully!', 'success');
      } else {
        await addDoc(questionsCollection, {
          ...questionData,
          order: newTotalQuestions,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        showSnackbar('Question added successfully!', 'success');
      }

      await updateDoc(doc(db, 'tests', testId), {
        totalQuestions: newTotalQuestions,
        updatedAt: Timestamp.now()
      });

      clearQuestionForm();

    } catch (e) {
      showSnackbar(`Failed to save question: ${e.message}`, 'error');
    }
};
const clearQuestionForm = () => {
  setEditingQuestionId(null);
  setQuestionTextPart1('');
  setQuestionTextPart2('');
  setIsImageAboveQuestion(false);
  setIsImageInBetween(false);
  // MODIFIED: Clear the single LaTeX state variable
  setIsLatexQuestion(false);
  setQuestionImageUrl(null);
  setOptions(Array.from({ length: 5 }, () => ({ text: '', isCorrect: false, imageUrl: null, isLatexOption: false })));
  setIsUploadingOptionImage(Array(5).fill(false));
};

// ... (inside the AdminTestDetailManagementPage component)

const editQuestion = (question) => {
  setEditingQuestionId(question.id);
  setQuestionTextPart1(question.questionTextPart1 ?? question.questionText ?? '');
  setQuestionTextPart2(question.questionTextPart2 ?? '');
  setIsImageAboveQuestion(question.isImageAboveQuestion ?? false);
  setIsImageInBetween(question.isImageInBetween ?? false);
  // MODIFIED: Set the single LaTeX state variable
  setIsLatexQuestion(question.isLatexQuestion ?? false)
  setQuestionImageUrl(question.imageUrl ?? null);

  const loadedOptions = question.options.map(o => ({
    text: o.text ?? '',
    isCorrect: o.isCorrect ?? false,
    imageUrl: o.imageUrl ?? null,
    isLatexOption: o.isLatexOption ?? false,
  }));

  while (loadedOptions.length < 5) {
    loadedOptions.push({ text: '', isCorrect: false, imageUrl: null, isLatexOption: false });
  }
  setOptions(loadedOptions);
  showSnackbar('Editing existing question.', 'info');

  if (questionFormRef.current) {
    questionFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// UPDATED: This function now makes a true duplicate and re-indexes
// This function now makes a true duplicate and correctly re-indexes
// UPDATED: This function now makes a true duplicate and correctly re-indexes
const duplicateQuestion = async (originalQuestion) => {
    showSnackbar('Duplicating question...', 'info');

    try {
        // Step 1: Create a completely new question object with new image URLs
        const newQuestionData = await deepCloneAndDuplicateImages(originalQuestion);

        // Step 2: Get the current number of questions and calculate the new order
        const originalIndex = questions.findIndex(q => q.id === originalQuestion.id);
        const newOrder = originalIndex + 2;

        // Step 3: Use a batch write for an atomic update
        const batch = writeBatch(db);
        const questionsCollection = collection(db, 'tests', testId, 'questions');
        const newDocRef = doc(questionsCollection);

        // First, add the new question with its correct order
        batch.set(newDocRef, {
            ...newQuestionData,
            order: newOrder,
            createdAt: Timestamp.now(),
        });
        
        // Then, update the order of all subsequent questions
        for (let i = originalIndex + 1; i < questions.length; i++) {
            const questionToUpdate = questions[i];
            const questionRef = doc(questionsCollection, questionToUpdate.id);
            batch.update(questionRef, { order: questionToUpdate.order + 1 });
        }

        // Commit all changes
        await batch.commit();

        // Update the total questions count on the main test document
        await updateDoc(doc(db, 'tests', testId), {
            totalQuestions: questions.length + 1,
            updatedAt: Timestamp.now(),
        });

        showSnackbar('Question duplicated successfully!', 'success');
    } catch (e) {
        showSnackbar(`Failed to duplicate question: ${e.message}`, 'error');
        console.error('Duplication error:', e);
    }
};

// MODIFIED: The drag-and-drop handler now updates the 'order' field using a batch write.
const handleDragEnd = async (result) => {
  if (!result.destination) return;

  const newQuestions = [...questions];
  const [removed] = newQuestions.splice(result.source.index, 1);
  newQuestions.splice(result.destination.index, 0, removed);

  const batch = writeBatch(db);
  newQuestions.forEach((question, index) => {
    const questionRef = doc(db, 'tests', testId, 'questions', question.id);
    batch.update(questionRef, { order: index + 1 });
  });

  try {
    await batch.commit();
    showSnackbar('Question order updated successfully!', 'success');
  } catch (e) {
    showSnackbar(`Failed to update question order: ${e.message}`, 'error');
    console.error(e);
  }
};

// NEW: handleImportQuestions function passed to the modal
// Locate and replace the handleImportQuestions function
const handleImportQuestions = async (questionsToImport) => {
    if (questionsToImport.length === 0) {
      showSnackbar('No questions selected for import.', 'info');
      return;
    }

    showSnackbar(`Importing ${questionsToImport.length} questions...`, 'info');

    try {
        const batch = writeBatch(db);
        const questionsCollectionRef = collection(db, 'tests', testId, 'questions');

        // Get the highest existing order to continue numbering
        const currentHighestOrder = questions.length > 0
            ? Math.max(...questions.map(q => q.order))
            : 0;
        let nextOrder = currentHighestOrder + 1;
        
        // Use a Promise.all to handle all asynchronous image duplications in parallel
        const duplicatedQuestions = await Promise.all(questionsToImport.map(async (q) => {
            const newQuestionData = await deepCloneAndDuplicateImages(q);
            return {
                ...newQuestionData,
                order: nextOrder++,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
        }));
        
        // Add all the newly duplicated questions to the batch
        duplicatedQuestions.forEach((qData) => {
            const newQuestionRef = doc(questionsCollectionRef);
            batch.set(newQuestionRef, qData);
        });
        
        await batch.commit();

        // Update totalQuestions count for the current test
        await updateDoc(doc(db, 'tests', testId), {
            totalQuestions: questions.length + questionsToImport.length,
            updatedAt: Timestamp.now()
        });

        showSnackbar(`Successfully imported ${questionsToImport.length} questions!`, 'success');
    } catch (e) {
        showSnackbar(`Failed to import questions: ${e.message}`, 'error');
        console.error('Import questions error:', e);
    }
};


  if (!isAuthReady || !testId) {
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
      {snackbar.show && <Snackbar message={snackbar.message} type={snackbar.type} onHide={hideSnackbar} />}
      {showConfirmModal && <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title={confirmModalData.title} message={confirmModalData.message} onConfirm={confirmModalData.onConfirm} />}
      {/* NEW: ImportQuestionsModal */}
      {showImportModal && (
        <ImportQuestionsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          currentTestId={testId}
          onImportQuestions={handleImportQuestions}
          showSnackbar={showSnackbar} // Pass showSnackbar to the modal
        />
      )}

<header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
  <div className="flex items-center space-x-4">
    <span className="text-xl font-bold text-gray-800">Test Detail Managment</span>
  </div>
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 py-2 px-4 rounded-lg text-white bg-red-700 hover:bg-red-800 transition-colors"
  >
    <LogOutIcon />
    Logout
  </button>
</header>

<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-4 items-end">
  <button
    onClick={finalCheckTest}
    className="flex items-center gap-2 py-3 px-5 rounded-full bg-green-600 text-white font-bold shadow-lg transition-all duration-200 hover:bg-green-700 hover:scale-105"
  >
    <CheckCircleIcon className="w-5 h-5" />
    Final Check
  </button>
  <button
    onClick={() => {
      if (questionFormRef.current) {
        questionFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }}
    className="flex items-center gap-2 py-3 px-5 rounded-full bg-red-700 text-white font-bold shadow-lg transition-all duration-200 hover:bg-red-800 hover:scale-105"
  >
    <AddIcon />
    Go to Add Questions
  </button>
  <button
    onClick={() => {
      if (questions.length > 0) {
        const mostRecentQuestion = questions.reduce((prev, current) => {
          const prevDate = prev.updatedAt?.toDate() || new Date(0);
          const currDate = current.updatedAt?.toDate() || new Date(0);
          return currDate > prevDate ? current : prev;
        }, questions[0]);
        
        const element = document.getElementById(`question-${mostRecentQuestion.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }}
    className="flex items-center gap-2 py-3 px-5 rounded-full bg-blue-700 text-white font-bold shadow-lg transition-all duration-200 hover:bg-blue-800 hover:scale-105"
  >
    <EditIcon className="w-5 h-5" />
    Go to Recently Modified Question
  </button>
  <button
    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
    className="flex items-center gap-2 py-3 px-5 rounded-full bg-violet-600 text-white font-bold shadow-lg transition-all duration-200 hover:bg-violet-700 hover:scale-105"
  >
    <ArrowDownCircleIcon className="w-5 h-5" />
    Scroll to Bottom
  </button>
</div>


      <main className="flex-1 p-8 bg-gray-50 flex flex-col items-center pt-10">
        <div className="flex justify-start w-full max-w-3xl mb-6 flex-shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <BackIcon />
            Back to Test List
          </button>


        </div>


        <div className="flex flex-col space-y-8 w-full max-w-3xl">
    
          
          <div className="p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Test Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <input type="text" placeholder="Test Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" />
              <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" rows="3" />
              <input type="number" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Test Type</label>
              <select value={selectedTestType || ''} onChange={(e) => {
                setSelectedTestType(e.target.value);
                setSelectedKaduCourses([]);
                setSelectedCollegeBranches([]);
                setSelectedCollegeYears([]);
              }} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500">
                <option value="" disabled>Select Test Type</option>
                {kTestTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            {selectedTestType === 'Kadu Academy Student' && (
              <div className="mt-6">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Select Courses:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {kKaduCourses.map(course => (
                    <label key={course} className="inline-flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <input type="checkbox" className="form-checkbox text-red-600 rounded" checked={selectedKaduCourses.includes(course)} onChange={(e) => {
                        const newCourses = e.target.checked ? [...selectedKaduCourses, course] : selectedKaduCourses.filter(c => c !== course);
                        setSelectedKaduCourses(newCourses);
                      }} />
                      <span className="ml-2 text-sm text-gray-700">{course}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {selectedTestType === 'College Student' && (
              <div className="mt-6">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Select Branches and Years:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-800 block mb-2">Branches</span>
                    {kBranches.map(branch => (
                      <label key={branch} className="flex items-center mt-2 cursor-pointer">
                        <input type="checkbox" className="form-checkbox text-red-600 rounded" checked={selectedCollegeBranches.includes(branch)} onChange={(e) => {
                          const newBranches = e.target.checked ? [...selectedCollegeBranches, branch] : selectedCollegeBranches.filter(b => b !== branch);
                          setSelectedCollegeBranches(newBranches);
                        }} />
                        <span className="ml-2 text-sm text-gray-700">{branch}</span>
                      </label>
                    ))}
                  </div>
                  <div className="border p-4 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-800 block mb-2">Years</span>
                    {kYears.map(year => (
                      <label key={year} className="flex items-center mt-2 cursor-pointer">
                        <input type="checkbox" className="form-checkbox text-red-600 rounded" checked={selectedCollegeYears.includes(year)} onChange={(e) => {
                          const newYears = e.target.checked ? [...selectedCollegeYears, year] : selectedCollegeYears.filter(y => y !== year);
                          setSelectedCollegeYears(newYears);
                        }} />
                        <span className="ml-2 text-sm text-gray-700">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Marking Scheme</h3>
              <div className="grid grid-cols-1 gap-4">
                <input type="number" placeholder="Marks per Question" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" />
                <div className="flex items-center justify-between p-2">
                  <label className="text-gray-700 font-medium">Negative Marking</label>
                  <input type="checkbox" checked={isNegativeMarking} onChange={(e) => setIsNegativeMarking(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 rounded" />
                </div>
                {isNegativeMarking && (
                  <input type="number" placeholder="Negative Marks Value" value={negativeMarksValue} onChange={(e) => setNegativeMarksValue(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" />
                )}
                <div className="flex items-center justify-between p-2">
                  <label className="text-gray-700 font-medium">Enable Option E</label>
                  <input type="checkbox" checked={enableOptionE} onChange={(e) => {
                    setEnableOptionE(e.target.checked);
                    if (!e.target.checked) {
                      const newOptions = [...options];
                      newOptions[4] = { text: '', isCorrect: false, imageUrl: null, isLatexOption: false };
                      setOptions(newOptions);
                    }
                  }} className="form-checkbox h-5 w-5 text-red-600 rounded" />
                </div>
              </div>
              <button onClick={updateTestDetails} className="mt-8 w-full py-4 px-6 rounded-lg bg-red-700 text-white font-bold shadow-md transition-all duration-200 hover:bg-red-800 hover:shadow-xl active:scale-99 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                <SaveIcon className="mr-2 inline-block" />
                Save Test Details
              </button>
            </div>
          </div>

          {/* Question Management Section */}
{/* Question Management Section */}

<div ref={questionFormRef} className="p-8 bg-white rounded-xl shadow-lg">
    <div className="flex justify-between items-center mb-6 border-b pb-4">
      <h2 className="text-2xl font-bold text-gray-800">{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h2>
      <button
        onClick={() => setShowImportModal(true)}
        className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <AddIcon />
        Import Questions
      </button>
    </div>
    <div className="border p-4 rounded-lg bg-gray-50">
      {/* === START NEW CODE === */}
      {questionImageUrl && (
          <div className="relative p-4 bg-gray-100 rounded-lg mb-4">
              <h4 className="text-sm font-semibold mb-2">Question Image Preview</h4>
              <img src={questionImageUrl} alt="Question Preview" className="max-h-32 object-contain mx-auto" />
              <button
                  onClick={() => clearImage()}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
              >
                  <XCircleIcon className="text-red-500 h-5 w-5" />
              </button>
          </div>
      )}
      {/* === END NEW CODE === */}

<div className="flex items-start gap-4 mb-4">
    <textarea
        placeholder="Question Text (Part 1)"
        value={questionTextPart1}
        onChange={(e) => setQuestionTextPart1(e.target.value)}
        // MODIFIED: Pass 'false' for isOption and 'null' for optionIndex
        onPaste={(e) => handleTextPaste(e, false, null)}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
        rows="3"
    />
    <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-700 flex items-center cursor-pointer">
            LaTeX
            <input type="checkbox" className="form-checkbox ml-2 rounded" checked={isLatexQuestion} onChange={(e) => setIsLatexQuestion(e.target.checked)} />
        </label>
        <button onClick={() => document.getElementById('question-image-upload').click()} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors">
            <ImagePlusIcon />
        </button>
        <input type="file" id="question-image-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e)} />
    </div>
</div>


      {/* NEW: Dropdown for image placement */}
      <div className="flex items-center justify-between p-2 mt-4 border-t pt-4">
        <label className="text-gray-700 font-medium">Image Placement</label>
        <select
          value={isImageInBetween ? 'inBetween' : (isImageAboveQuestion ? 'above' : 'below')}
          onChange={(e) => {
            const value = e.target.value;
            setIsImageAboveQuestion(value === 'above');
            setIsImageInBetween(value === 'inBetween');
          }}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
        >
          <option value="below">Below Text</option>
          <option value="above">Above Text</option>
          <option value="inBetween">In-Between Text</option>
        </select>
      </div>
      {/* Only show the second text area when "In-Between" is selected */}
{isImageInBetween && (
    <div className="flex items-start gap-4 mt-4">
        <textarea
            placeholder="Question Text (Part 2)"
            value={questionTextPart2}
            onChange={(e) => setQuestionTextPart2(e.target.value)}
            // MODIFIED: Pass 'false' for isOption and 'null' for optionIndex
            onPaste={(e) => handleTextPaste(e, false, null)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            rows="3"
        />
    </div>
)}
      {/* MODIFIED CODE START: Use the single LaTeX state variable to display the toolbar */}
{isLatexQuestion && (
  <div className="mt-4 border-t pt-4">
    <LatexToolbar onAddLatex={(latex) => {
      // MODIFIED: This function will now always add the LaTeX code
      // to the first part of the question.
      setQuestionTextPart1(q => q + latex);
    }} />
  </div>
)}
      {/* MODIFIED CODE END */}
      {/* Options */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Options</h4>
        {options.slice(0, enableOptionE ? 5 : 4).map((option, index) => (
          <div key={index} className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 flex flex-col items-center gap-2 mt-1">
              <input type="checkbox" checked={option.isCorrect} onChange={() => setOptions(opts => opts.map((o, i) => i === index ? { ...o, isCorrect: !o.isCorrect } : { ...o, isCorrect: false }))} className="form-checkbox h-5 w-5 text-green-600 rounded-full flex-shrink-0" />
              <label className="text-xs font-bold text-gray-800">{String.fromCharCode(65 + index)}</label>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2">
                <textarea placeholder={`Option ${String.fromCharCode(65 + index)}`} value={option.text} onChange={(e) => setOptions(opts => opts.map((o, i) => i === index ? { ...o, text: e.target.value } : o))} onPaste={(e) => handleTextPaste(e, true, index)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500" rows="1" />
                <div className="flex flex-col gap-1 items-center">
                  <label className="text-xs text-gray-700 flex items-center cursor-pointer">
                    LaTeX
                    <input type="checkbox" className="form-checkbox ml-2 rounded" checked={option.isLatexOption} onChange={(e) => setOptions(opts => opts.map((o, i) => i === index ? { ...o, isLatexOption: e.target.checked } : o))} />
                  </label>
                  <button onClick={() => document.getElementById(`option-image-upload-${index}`).click()} className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors">
                    <ImagePlusIcon className="h-4 w-4" />
                  </button>
                  <input type="file" id={`option-image-upload-${index}`} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, true, index)} />
                </div>
              </div>
              {isUploadingOptionImage[index] && <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-red-600 h-2.5 rounded-full animate-pulse"></div></div>}
              {option.imageUrl && (
                <div className="relative p-2 bg-gray-100 rounded-lg">
                  <img src={option.imageUrl} alt={`Option ${index}`} className="max-h-24 object-contain mx-auto" />
                  <button onClick={() => clearImage(true, index)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow">
                    <XCircleIcon className="text-red-500 h-5 w-5" />
                  </button>
                </div>
              )}
              {option.isLatexOption && (
                  <LatexToolbar onAddLatex={(latex) => setOptions(opts => opts.map((o, i) => i === index ? { ...o, text: o.text + latex } : o))} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-between gap-4">
        <button onClick={addOrUpdateQuestion} className="w-full py-4 px-6 rounded-lg bg-red-700 text-white font-bold shadow-md transition-all duration-200 hover:bg-red-800 hover:shadow-xl active:scale-99">
          {editingQuestionId ? 'Update Question' : 'Add Question'}
        </button>
        {editingQuestionId && (
          <button onClick={clearQuestionForm} className="w-full py-4 px-6 rounded-lg bg-gray-300 text-gray-800 font-bold shadow-md transition-all duration-200 hover:bg-gray-400 active:scale-99">
            Cancel Edit
          </button>
        )}
      </div>
    </div>
</div>



{/* Existing Questions List */}
<div className="p-8 bg-white rounded-xl shadow-lg flex-1 flex flex-col">
  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex-shrink-0">Existing Questions</h2>
  {questionsLoading ? (
    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500"></div></div>
  ) : questions.length === 0 ? (
    <p className="text-center text-gray-600 py-10">No questions added yet. Use the form above to add one.</p>
  ) : (
    <div className="flex-1 overflow-y-auto pr-2 -mr-2"> {/* Added new scroll container */}
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions-list">
                {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
          {questions.map((question, index) => (
            <Draggable key={question.id} draggableId={question.id} index={index}>
              {(provided) => (
// src/pages/AdminTestDetailManagementPage.jsx

// ... (existing code)

// Locate this section in your JSX and replace it with the code below:
<li
    id={`question-${question.id}`}
    ref={provided.innerRef}
    {...provided.draggableProps}
    className="border p-4 rounded-lg bg-gray-50 shadow-sm transition-shadow hover:shadow-md flex items-start"
>
    <div
        className="drag-handle-container flex-shrink-0 mr-4 h-6 w-6 mt-1 cursor-grab"
        {...provided.dragHandleProps}
        style={{ border: '2px dotted #d1d5db', borderRadius: '4px' }}
    ></div>
 <div className="flex-1">
    {/* Renders image ONLY if it is explicitly set to be "above" */}
    {question.isImageAboveQuestion && question.imageUrl && (
      <img src={question.imageUrl} alt="Question" className="max-h-24 mb-2 object-contain" />
    )}
    
    {/* MODIFIED: Change the outer <p> tag to a <div> tag */}
    <div className="text-gray-900 mb-2 break-words" style={{ whiteSpace: 'pre-wrap' }}>
      <div className="inline-block">
        <span className="mr-2 text-base font-bold">{question.order}.</span>
        {question.isLatexQuestion ? (
          <Latex>{`$${question.questionTextPart1}$`}</Latex>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(question.questionTextPart1) }}></span>
        )}
      </div>
    </div>

    {/* Renders image ONLY if it is explicitly set to be "in-between" */}
    {question.isImageInBetween && question.imageUrl && (
      <img src={question.imageUrl} alt="Question" className="max-h-24 my-2 object-contain" />
    )}
    
    {/* MODIFIED: Change the outer <p> tag to a <div> tag */}
    {question.isImageInBetween && question.questionTextPart2 && (
      <div className="text-gray-900 mb-2 break-words" style={{ whiteSpace: 'pre-wrap' }}>
        <div className="inline-block">
          {question.isLatexQuestion ? (
            <Latex>{`$${question.questionTextPart2}$`}</Latex>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(question.questionTextPart2) }}></span>
          )}
        </div>
      </div>
    )}
        {!question.isImageAboveQuestion && !question.isImageInBetween && question.imageUrl && (
            <img src={question.imageUrl} alt="Question" className="max-h-24 mt-2 object-contain" />
        )}
       <ul className="mt-4 text-sm text-gray-800 space-y-2">
    {(question.options || []).slice(0, enableOptionE ? 5 : 4).map((option, optIndex) => (
        <li key={optIndex} className={`flex items-start ${option.isCorrect ? 'text-green-800 font-bold' : ''}`}>
            <span className="mr-2 flex-shrink-0">{String.fromCharCode(65 + optIndex)}.</span>
            <div className="flex-1 break-words" style={{ whiteSpace: 'pre-wrap' }}>
                {option.isLatexOption ? (
                    <div className="inline-block">
                        {(() => {
                            try {
                                return <Latex>{`$${option.text}$`}</Latex>;
                            } catch (e) {
                                return <span>{`${option.text} (LaTeX Error)`}</span>;
                            }
                        })()}
                    </div>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(option.text) }}></span>
                )}
            </div>
            {option.imageUrl && <img src={option.imageUrl} alt="Option" className="max-h-12 ml-2 object-contain" />}
        </li>
    ))}
</ul>
    </div>
    <div className="flex-shrink-0 flex flex-col gap-2 ml-4">
        <button onClick={() => editQuestion(question)} className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
            <EditIcon className="text-blue-600" />
        </button>
        <button onClick={() => duplicateQuestion(question)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <DuplicateIcon className="text-gray-600" />
        </button>
        <button onClick={() => deleteQuestion(question.id, question.questionText)} className="p-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
            <DeleteIcon className="text-red-600" />
        </button>
    </div>
</li>

// ... (rest of the file)
                      )}
            </Draggable>
          ))}
          {provided.placeholder}
          </ul>
                      )}
                </Droppable>
            </DragDropContext>
        </div>
    )}
</div>
        </div>

      </main>
<Footer />
    </div>
  );
};

// --- UTILITY FUNCTION FOR BOLD FORMATTING ---
const formatTextWithBold = (text) => {
    if (typeof text !== 'string') {
        return text;
    }
    const parts = text.split('*');
    let result = '';

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 !== 0) {
            result += `<strong>${parts[i]}</strong>`;
        } else {
            result += parts[i];
        }
    }
    return result;
};


export default AdminTestDetailManagementPage;