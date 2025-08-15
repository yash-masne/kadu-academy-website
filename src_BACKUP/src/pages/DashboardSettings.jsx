// DashboardSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'; // Import auth functions

const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const AddPhotoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/><path d="M12 9v8"/></svg>
);
const DeleteIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

// New Confirmation Dialog component
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-70 p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full animate-fade-in-scale">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h4>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

export default function DashboardSettings() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dialog, setDialog] = useState({ isOpen: false, id: null, imageUrl: null }); // State for the dialog
    const maxImages = 6;
    const db = getFirestore();
    const storage = getStorage();

    const navigate = useNavigate();

    // --- ADMIN SAFETY FEATURE STATES ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    const showSnackbar = useCallback((message, type) => {
        console.log(`Snackbar: ${message} (${type})`);
    }, []);

    const handleClose = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(
                collection(db, 'studentDashboardImages')
            );
            const imageList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            imageList.sort((a, b) => (a.order || 0) - (b.order || 0));

            setImages(imageList);
        } catch (e) {
            console.error("Error fetching dashboard images:", e);
            showSnackbar('Failed to load dashboard images.', 'error');
        }
        setLoading(false);
    }, [db, showSnackbar]);

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
                        setAuthCheckComplete(true);
                    } else {
                        // User is logged in but is not an admin
                        setIsAdmin(false);
                        setAuthCheckComplete(true);
                        await signOut(authInstance); // Force sign out
                        navigate('/admin-login');
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setIsAdmin(false);
                    setAuthCheckComplete(true);
                    await signOut(authInstance);
                    navigate('/admin-login');
                }
            } else {
                // No user logged in
                setIsAdmin(false);
                setAuthCheckComplete(true);
                navigate('/admin-login');
            }
        });

        // Cleanup function for the listener
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (authCheckComplete && isAdmin) {
            fetchImages();
        }
    }, [fetchImages, authCheckComplete, isAdmin]);
    // --- END OF ADMIN SAFETY FEATURE ---


    const handleImageUpload = async (e) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        if (images.length >= maxImages) {
            showSnackbar(`You can only upload up to ${maxImages} images.`, 'error');
            return;
        }

        setUploading(true);
        showSnackbar('Uploading image...', 'info');

        try {
            const fileName = `dashboard_images/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            const newOrder = images.length;

            const docRef = await addDoc(collection(db, 'studentDashboardImages'), {
                imageUrl,
                createdAt: Timestamp.now(),
                order: newOrder,
            });

            const newImage = { id: docRef.id, imageUrl, createdAt: Timestamp.now(), order: newOrder };

            setImages(prevImages => {
                const updatedImages = [...prevImages, newImage];
                updatedImages.sort((a, b) => (a.order || 0) - (b.order || 0));
                return updatedImages;
            });

            showSnackbar('Image uploaded and saved successfully!', 'success');
        } catch (error) {
            console.error('Error during image upload:', error);
            showSnackbar('Image upload failed.', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Function to show the custom confirmation dialog
    const handleShowDeleteDialog = (id, imageUrl) => {
        if (!isAdmin) {
            showSnackbar('Unauthorized action!', 'error');
            return;
        }
        setDialog({ isOpen: true, id, imageUrl });
    };

    // Function to handle the actual deletion
    const handleConfirmDelete = async () => {
        const { id, imageUrl } = dialog;
        setDialog({ isOpen: false, id: null, imageUrl: null }); // Close dialog immediately
        showSnackbar('Deleting image...', 'info');

        const imageToDelete = images.find(img => img.id === id);

        setImages(prevImages => {
            const updatedImages = prevImages.filter(img => img.id !== id);
            updatedImages.sort((a, b) => (a.order || 0) - (b.order || 0));
            return updatedImages;
        });

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);

            await deleteDoc(doc(db, 'studentDashboardImages', id));

            showSnackbar('Image deleted successfully!', 'success');
        } catch (error) {
            console.error('Error during image deletion:', error);
            showSnackbar('Failed to delete image.', 'error');

            if (imageToDelete) {
                setImages(prevImages => [...prevImages, imageToDelete]);
            }
        }
    };

    const handleCancelDelete = () => {
        setDialog({ isOpen: false, id: null, imageUrl: null });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 p-4">
            <div className="bg-white border border-gray-300 p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Dashboard Settings</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <CloseIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Upload up to {maxImages} images for the student dashboard carousel. Recommended aspect ratio is 16:9.
                </p>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-red-500 border-opacity-20 border-t-red-700"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                                <img src={img.imageUrl} alt={`Dashboard image ${img.order}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handleShowDeleteDialog(img.id, img.imageUrl)}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6">
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading || images.length >= maxImages}
                    />
                    <label
                        htmlFor="image-upload"
                        className={`w-full px-6 py-3 flex items-center justify-center gap-2 rounded-lg text-white font-semibold transition-colors duration-200 cursor-pointer ${
                            uploading || images.length >= maxImages ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        <AddPhotoIcon className="w-5 h-5" />
                        {uploading ? 'Uploading...' : `Add New Image (${images.length}/${maxImages})`}
                    </label>
                </div>
                {images.length >= maxImages && (
                    <p className="text-sm text-center text-orange-500 mt-2">
                        Maximum {maxImages} images uploaded. Delete existing images to add more.
                    </p>
                )}
            </div>

            {/* Render the confirmation dialog if state is open */}
            {dialog.isOpen && (
                <ConfirmationDialog
                    message="Are you sure you want to delete this image? This action cannot be undone."
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </div>
    );
}