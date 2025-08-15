// src/pages/ManageUsersPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import ToggleSwitch from './ToggleSwitch.jsx';
import Footer from '../components/Footer'; // Import the new component

// --- ICON COMPONENTS ---
const ArrowLeftIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-8.82"/><path d="M22 4 12 14.01l-3-3"/></svg>
);
const XCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const InfoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
const ErrorIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const DeleteIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

// --- INLINE SNACKBAR COMPONENT ---
const Snackbar = ({ message, type = 'info', onHide }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onHide();
        }, 4000); // Hide after 4 seconds
        return () => clearTimeout(timer);
    }, [onHide]);

    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-gray-800');
    const Icon = type === 'success' ? CheckCircleIcon : (type === 'error' ? ErrorIcon : InfoIcon);

    return (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center p-4 rounded-lg shadow-xl text-white ${bgColor} transition-all duration-300 transform animate-fade-in-up`}>
            <Icon className="mr-3 flex-shrink-0" />
            <span className="font-medium text-sm">{message}</span>
            <button onClick={onHide} className="ml-4 text-white font-bold text-xl leading-none opacity-70 hover:opacity-100 transition-opacity">&times;</button>
        </div>
    );
};

// --- NEW CONFIRM MODAL COMPONENT ---
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

// --- CONSTANTS ---
const kStudentTypeFilterOptions = ['All', 'Kadu Academy Student', 'College Student'];
const kApprovalStatusFilterOptions = ['All', 'Approved', 'Unapproved', 'Denied'];
const kBranches = ['All', 'CSE', 'IT', 'ENTC', 'MECH', 'CIVIL', 'ELPO', 'OTHER'];
const kYears = ['All', 'First Year', 'Second Year', 'Third Year', 'Final Year', 'Other'];

export default function ManageUsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        studentType: 'All',
        approvalStatus: 'All',
        branch: 'All',
        year: 'All',
    });
    // State for the snackbar
    const [snackbar, setSnackbar] = useState({ message: '', type: '' });
    // State for the custom confirm modal
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // --- ADMIN SAFETY FEATURE STATES ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    const db = getFirestore();
    const functions = getFunctions();
    const auth = getAuth();

    const showSnackbar = (message, type) => {
        setSnackbar({ message, type });
    };

    const hideSnackbar = () => {
        setSnackbar({ message: '', type: '' });
    };

    // Function to show the custom confirm modal
    const showConfirm = (title, message, onConfirm) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    const hideConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let userQuery = collection(db, 'users');
            let queries = [where('isRegistered', '==', true)];

            if (filters.studentType !== 'All') {
                const studentTypeValue = filters.studentType === 'Kadu Academy Student' ? 'kadu_academy' : 'college';
                queries.push(where('studentType', '==', studentTypeValue));
            }

            if (filters.approvalStatus === 'Denied') {
                queries.push(where('isDenied', '==', true));
            } else if (filters.approvalStatus === 'Approved' || filters.approvalStatus === 'Unapproved') {
                queries.push(where('isDenied', '==', false));
            }

            if (filters.studentType === 'College Student' && filters.branch !== 'All') {
                queries.push(where('branch', '==', filters.branch));
            }

            if (filters.studentType === 'College Student' && filters.year !== 'All') {
                queries.push(where('year', '==', filters.year));
            }

            let combinedQuery = query(userQuery, ...queries, orderBy('createdAt', 'desc'));

            const querySnapshot = await getDocs(combinedQuery);
            let userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side filtering for Approved/Unapproved statuses
            if (filters.approvalStatus === 'Approved') {
                userList = userList.filter(user => (user.studentType === 'kadu_academy' ? user.isApprovedByAdminKaduAcademy : user.isApprovedByAdminCollegeStudent));
            } else if (filters.approvalStatus === 'Unapproved') {
                userList = userList.filter(user => !(user.studentType === 'kadu_academy' ? user.isApprovedByAdminKaduAcademy : user.isApprovedByAdminCollegeStudent));
            }

            setUsers(userList);
        } catch (e) {
            console.error('Error fetching users:', e);
            setError('Failed to load users.');
        }
        setLoading(false);
    }, [filters, db]);

    // --- ADMIN SAFETY FEATURE: AUTHENTICATION AND ROLE CHECK ---
    useEffect(() => {
        const authInstance = getAuth();
        const dbInstance = getFirestore();

        const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(dbInstance, 'users', currentUser.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
                        setIsAdmin(true);
                    } else {
                        // User is logged in but is not an admin
                        setIsAdmin(false);
                        await signOut(authInstance); // Force sign out
                        navigate('/admin-login');
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setIsAdmin(false);
                    await signOut(authInstance);
                    navigate('/admin-login');
                }
            } else {
                // No user logged in
                setIsAdmin(false);
                navigate('/admin-login');
            }
            setAuthCheckComplete(true);
        });

        // Cleanup function for the listener
        return () => unsubscribe();
    }, [navigate]);

    // This effect now depends on `isAdmin` to fetch data
    useEffect(() => {
        if (authCheckComplete && isAdmin) {
            fetchUsers();
        }
    }, [fetchUsers, authCheckComplete, isAdmin]);
    // --- END OF ADMIN SAFETY FEATURE ---

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            ...(key === 'studentType' && { branch: 'All', year: 'All' })
        }));
    };

    const getApprovalStatus = (user) => {
        if (user.isDenied) return 'Denied';
        if (user.isApprovedByAdminKaduAcademy || user.isApprovedByAdminCollegeStudent) return 'Approved';
        return 'Unapproved';
    };

    const getStatusColor = (status) => {
        if (status === 'Approved') return 'text-green-800 bg-green-100';
        if (status === 'Unapproved') return 'text-yellow-800 bg-yellow-100';
        if (status === 'Denied') return 'text-red-800 bg-red-100';
    };

    const toggleApproval = async (userId, userName, field, currentStatus) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { [field]: !currentStatus });
            showSnackbar(`Updated approval for ${userName}`, 'success');

            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, [field]: !currentStatus } : user
            ));
        } catch (e) {
            console.error(`Error toggling approval for ${userName}:`, e);
            showSnackbar('Failed to update approval.', 'error');
        }
    };

    const toggleDeniedStatus = async (userId, userName, currentStatus) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { isDenied: !currentStatus });
            showSnackbar(`Updated denied status for ${userName}`, 'success');

            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, isDenied: !currentStatus } : user
            ));
        } catch (e) {
            console.error(`Error toggling denied status for ${userName}:`, e);
            showSnackbar('Failed to update denied status.', 'error');
        }
    };

    const deleteUserConfirmed = async (userId, userName) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }

        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
            showSnackbar('You cannot delete your own admin account from here.', 'error');
            hideConfirm();
            return;
        }

        try {
            const deleteUserCallable = httpsCallable(functions, 'deleteUserAccount');
            await deleteUserCallable({ uid: userId });
            showSnackbar(`User "${userName}" deleted successfully.`, 'success');
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        } catch (e) {
            console.error(`Error deleting user "${userName}":`, e);
            showSnackbar(`Failed to delete user: ${e.message}`, 'error');
        }
        hideConfirm(); // Hide the modal after the action
    };

    const handleDeleteClick = (userId, userName) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }
        showConfirm(
            'Confirm Deletion',
            `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
            () => deleteUserConfirmed(userId, userName)
        );
    };

    // --- CONDITIONAL RENDER based on auth and role check ---
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
                    <p className="mt-4 text-gray-600">You do not have the required permissions to view this page.</p>
                    <button
                        onClick={() => navigate('/admin-login')}
                        className="mt-6 w-full py-2 px-4 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                onHide={hideSnackbar}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={hideConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />

          <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
                    </button>
                    <span className="text-2xl font-bold text-gray-800 tracking-wide">Manage Users</span>
                    
                </div>
            </header>
            

            <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-l-4 border-red-600 pl-4">User Filters</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <select
                                value={filters.studentType}
                                onChange={(e) => handleFilterChange('studentType', e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-300"
                            >
                                {kStudentTypeFilterOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <select
                                value={filters.approvalStatus}
                                onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-300"
                            >
                                {kApprovalStatusFilterOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {filters.studentType === 'College Student' && (
                                <>
                                    <select
                                        value={filters.branch}
                                        onChange={(e) => handleFilterChange('branch', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-300"
                                    >
                                        {kBranches.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filters.year}
                                        onChange={(e) => handleFilterChange('year', e.target.value)}
                                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow duration-300"
                                    >
                                        {kYears.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-red-500 border-opacity-20 border-t-red-700"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-600 p-4 font-semibold">
                                {error}
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                                <InfoIcon className="h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold">No users found</h3>
                                <p className="text-sm">Try adjusting your filters to find more users.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-6 flex items-baseline justify-between">
                                    <h3 className="text-2xl font-extrabold text-gray-900">User List</h3>
                                    <span className="text-sm font-bold text-gray-600">Total Users: {users.length}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Details
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Email & Phone
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <div className="text-base font-bold text-gray-800">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-gray-500">Type: {user.studentType === 'kadu_academy' ? 'Kadu Academy' : 'College Student'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.studentType === 'college' && (
                                                            <>
                                                                <div>Roll No: {user.rollNo || 'N/A'}</div>
                                                                <div>Branch: {user.branch || 'N/A'}</div>
                                                                <div>Year: {user.year || 'N/A'}</div>
                                                            </>
                                                        )}
                                                        {user.studentType === 'kadu_academy' && (
                                                            <>
                                                                <div>Courses: {(user.courses || []).join(', ') || 'N/A'}</div>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>{user.email}</div>
                                                        <div>{user.phoneNumber || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(getApprovalStatus(user))}`}>
                                                            {getApprovalStatus(user)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex flex-col space-y-3">
                                                            {user.studentType === 'kadu_academy' && (
                                                                <ToggleSwitch
                                                                    label="Kadu Approved"
                                                                    checked={user.isApprovedByAdminKaduAcademy || false}
                                                                    onChange={() => toggleApproval(user.id, `${user.firstName} ${user.lastName}`, 'isApprovedByAdminKaduAcademy', user.isApprovedByAdminKaduAcademy || false)}
                                                                />
                                                            )}
                                                            {user.studentType === 'college' && (
                                                                <ToggleSwitch
                                                                    label="College Approved"
                                                                    checked={user.isApprovedByAdminCollegeStudent || false}
                                                                    onChange={() => toggleApproval(user.id, `${user.firstName} ${user.lastName}`, 'isApprovedByAdminCollegeStudent', user.isApprovedByAdminCollegeStudent || false)}
                                                                />
                                                            )}
                                                            <ToggleSwitch
                                                                label="Denied Access"
                                                                checked={user.isDenied || false}
                                                                onChange={() => toggleDeniedStatus(user.id, `${user.firstName} ${user.lastName}`, user.isDenied || false)}
                                                            />
                                                            <button
                                                                onClick={() => handleDeleteClick(user.id, `${user.firstName} ${user.lastName}`)}
                                                                className="mt-2 w-full px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md"
                                                            >
                                                                Delete User
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => fetchUsers()} className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300">
                                        Refresh List
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}