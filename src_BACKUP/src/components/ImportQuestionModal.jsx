// src/components/ImportQuestionModal.jsx

import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; // Corrected: db and storage
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp // Corrected: Consolidated Firestore imports
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject // Corrected: Storage function imports
} from 'firebase/storage';

// Basic Modal Structure (will be expanded)
const ImportQuestionModal = ({ show, onClose, currentTestId, onQuestionsImported }) => {
  const [loadingTests, setLoadingTests] = useState(true);
  const [tests, setTests] = useState([]);
  const [selectedSourceTestId, setSelectedSourceTestId] = useState('');
  
  const [loadingQuestions, setLoadingQuestions] = useState(false); // Used for both loading questions and import process
  const [sourceQuestions, setSourceQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]); // For checkboxes

  // State for internal modal alerts
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  // Fetch all tests for the dropdown when the modal is shown
  useEffect(() => {
    if (show) {
      const fetchTests = async () => {
        setLoadingTests(true);
        setModalError(null);
        try {
          const querySnapshot = await getDocs(collection(db, 'tests'));
          const fetchedTests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Untitled Test',
          }));
          // Filter out the current test to prevent importing from itself
          setTests(fetchedTests.filter(test => test.id !== currentTestId));
        } catch (error) {
          console.error("Error fetching tests:", error);
          setModalError('Failed to load tests.');
        } finally {
          setLoadingTests(false);
        }
      };
      fetchTests();
    } else {
      // Reset states when modal is closed
      setSelectedSourceTestId('');
      setSourceQuestions([]);
      setSelectedQuestionIds([]);
      setModalError(null);
      setModalSuccess(null);
    }
  }, [show, currentTestId]);

  // Fetch questions from selected source test
  useEffect(() => {
    if (selectedSourceTestId) {
      const fetchSourceQuestions = async () => {
        setLoadingQuestions(true);
        setModalError(null);
        try {
          const questionsCollectionRef = collection(db, 'tests', selectedSourceTestId, 'questions');
          const q = query(questionsCollectionRef, orderBy('createdAt', 'asc'));
          const querySnapshot = await getDocs(q);
          const fetchedQuestions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSourceQuestions(fetchedQuestions);
          setSelectedQuestionIds([]); // Reset selection when source test changes
        } catch (error) {
          console.error("Error fetching source questions:", error);
          setModalError('Failed to load questions from selected test.');
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchSourceQuestions();
    } else {
      setSourceQuestions([]); // Clear questions if no test selected
    }
  }, [selectedSourceTestId]);

  const handleQuestionCheckboxChange = (questionId) => {
    setSelectedQuestionIds(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleImport = async () => {
    if (selectedQuestionIds.length === 0) {
      setModalError('Please select at least one question to import.');
      return;
    }
    setModalError(null);
    setModalSuccess(null);
    setLoadingQuestions(true); // Use this state to show import is in progress

    let importedCount = 0;
    try {
      for (const questionId of selectedQuestionIds) {
        // 1. Fetch the full question data from the source test
        const questionDocRef = doc(db, 'tests', selectedSourceTestId, 'questions', questionId);
        const questionDocSnap = await getDoc(questionDocRef);

        if (questionDocSnap.exists()) {
          const questionData = questionDocSnap.data();
          const newQuestionData = { ...questionData }; // Start with a copy

          // 2. Handle Question Image Duplication
          if (questionData.imageUrl) {
            try {
              const response = await fetch(questionData.imageUrl);
              const blob = await response.blob();
              // Extract original filename safely
              const originalFileName = questionData.imageUrl.split('/').pop().split('?')[0].split('%2F').pop();
              const newQuestionImageRef = ref(storage, `question_images/${currentTestId}/imported_${Date.now()}_${originalFileName}`);
              const snapshot = await uploadBytes(newQuestionImageRef, blob);
              newQuestionData.imageUrl = await getDownloadURL(snapshot.ref);
            } catch (imageError) {
              console.warn(`Failed to duplicate question image for ${questionId}:`, imageError);
              newQuestionData.imageUrl = null; // Clear image if duplication fails
              setModalError(`Warning: Could not import question image for one question. Reason: ${imageError.message}`);
            }
          }

          // 3. Handle Option Images Duplication
          if (newQuestionData.options && newQuestionData.options.length > 0) {
            const updatedOptions = await Promise.all(newQuestionData.options.map(async (option, optIndex) => {
              if (option.imageUrl) {
                try {
                  const response = await fetch(option.imageUrl);
                  const blob = await response.blob();
                  // Extract original filename safely
                  const originalFileName = option.imageUrl.split('/').pop().split('?')[0].split('%2F').pop();
                  const newOptionImageRef = ref(storage, `option_images/${currentTestId}/imported_option${optIndex}_${Date.now()}_${originalFileName}`);
                  const snapshot = await uploadBytes(newOptionImageRef, blob);
                  return { ...option, imageUrl: await getDownloadURL(snapshot.ref) };
                } catch (imageError) {
                  console.warn(`Failed to duplicate option image for question ${questionId}, option ${optIndex}:`, imageError);
                  setModalError(`Warning: Could not import option image for one question. Reason: ${imageError.message}`);
                  return { ...option, imageUrl: null }; // Clear image if duplication fails
                }
              }
              return option; // Return option as is if no image
            }));
            newQuestionData.options = updatedOptions;
          }

          // Set creation timestamp for the new question
          newQuestionData.createdAt = serverTimestamp();
          // Remove updatedAt if it exists, as this is a new creation
          delete newQuestionData.updatedAt;

          // 4. Add the duplicated question to the current test
          await addDoc(collection(db, 'tests', currentTestId, 'questions'), newQuestionData);
          importedCount++;
        } else {
          console.warn(`Question ${questionId} not found in source test.`);
          setModalError(`Warning: One or more selected questions could not be found.`);
        }
      }

      setModalSuccess(`Successfully imported ${importedCount} question(s).`);
      onQuestionsImported(importedCount); // Notify parent component (AdminTestDetailManagementPage)
      onClose(); // Close modal after successful import
    } catch (error) {
      console.error("Error importing questions:", error);
      setModalError(`Failed to import questions: ${error.message}`);
    } finally {
      setLoadingQuestions(false); // Reset loading state
    }
  };

  if (!show) return null; // Don't render if not shown

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px', overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
        maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        animation: 'fade-in-scale 0.3s ease-out forwards'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>
          Import Questions from Another Test
        </h2>

        {modalError && (
          <p style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center' }}>{modalError}</p>
        )}
        {modalSuccess && (
          <p style={{ color: '#22c55e', marginBottom: '15px', textAlign: 'center' }}>{modalSuccess}</p>
        )}

        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label htmlFor="source-test-select" style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
            Select Source Test:
          </label>
          <select
            id="source-test-select"
            value={selectedSourceTestId}
            onChange={(e) => setSelectedSourceTestId(e.target.value)}
            style={{ ...formSelectStyle, width: '100%', maxWidth: '400px' }}
            disabled={loadingTests}
          >
            <option value="">{loadingTests ? 'Loading Tests...' : 'Choose a test'}</option>
            {tests.map(test => (
              <option key={test.id} value={test.id}>{test.title}</option>
            ))}
          </select>
        </div>

        {selectedSourceTestId && (
          <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', minHeight: '150px' }}>
            {loadingQuestions && sourceQuestions.length === 0 ? ( // Show loading when first fetching or during import
              <p style={{ textAlign: 'center', color: '#4a5568' }}>Loading questions...</p>
            ) : sourceQuestions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#4a5568' }}>No questions found in this test.</p>
            ) : (
              sourceQuestions.map(question => (
                <div key={question.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px', padding: '10px', borderBottom: '1px dashed #e2e8f0' }}>
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={() => handleQuestionCheckboxChange(question.id)}
                    style={{ marginRight: '10px', marginTop: '5px' }}
                  />
                  <div>
                    <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem', marginBottom: '5px' }}>
                      {question.questionText}
                    </p>
                    {question.imageUrl && (
                        <img src={question.imageUrl} alt="Q-Img" style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain', borderRadius: '4px', marginTop: '5px' }}/>
                    )}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#4a5568' }}>
                      {(question.options || []).map((option, optIdx) => (
                        <li key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {String.fromCharCode(65 + optIdx)}. {option.text}
                          {option.isCorrect && <span style={{ color: '#16a34a', marginLeft: '5px' }}>✓</span>}
                          {option.imageUrl && (
                            <img src={option.imageUrl} alt={`Opt-${String.fromCharCode(65 + optIdx)}`} style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain', borderRadius: '2px' }}/>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px' }}>
          <button onClick={onClose} style={{ ...actionButtonBase, backgroundColor: '#ef4444' }}>
            Cancel
          </button>
          {/* Changed disabled logic and added spinner for import */}
          <button onClick={handleImport} style={{ ...actionButtonBase, backgroundColor: '#22c55e' }} disabled={selectedQuestionIds.length === 0 || loadingQuestions}>
            {loadingQuestions ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white', borderLeftColor: 'rgba(255,255,255,0.3)', borderRightColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(255,255,255,0.3)' }}></div>
            ) : (
              `Import Selected (${selectedQuestionIds.length})`
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// Reusing some styles for consistency
const formSelectStyle = {
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '1rem',
  color: '#1f2937',
  transition: 'all 0.2s ease-in-out',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
  backgroundColor: '#ffffff',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '1em',
};

const actionButtonBase = {
  padding: '10px 20px',
  color: 'white',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.2s ease, transform 0.2s ease',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};


export default ImportQuestionModal;