// src/pages/AdminLoginPage.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer'; // Import the new component

// Import icons from lucide-react
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff } from 'lucide-react'; 

// Import your Kadu Academy logo image
import KaduLogo from '/images/kadu_logo_website.png'; 

// HomeIcon for the "Go back to Home screen" button
const HomeIcon = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

// --- NEWLY ADDED FOOTER COMPONENT ---



const AdminLoginPage = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [errorMsg, setErrorMsg] = useState(null);
 const [loading, setLoading] = useState(false);
 const [user, setUser] = useState(null); 
 const [isAdmin, setIsAdmin] = useState(false); 
 
 const [showPassword, setShowPassword] = useState(false); 

 const navigate = useNavigate();

 // Function to handle navigation to the home screen
 const handleGoHome = () => {
  navigate('/'); // Assumes your home page route is '/'
 };

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
   if (currentUser) {
    setUser(currentUser);
    try {
     const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
     if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
      setIsAdmin(true);
      setErrorMsg(null);
      navigate('/dashboard'); 
     } else {
      setIsAdmin(false);
      setErrorMsg('Access denied: Not an admin. Logging out...');
      await auth.signOut();
      setUser(null);
     }
    } catch (error) {
     console.error("Error checking admin status:", error);
     setErrorMsg('Failed to verify admin status. Please try again.');
     setUser(null);
     setIsAdmin(false);
    }
   } else {
    setUser(null);
    setIsAdmin(false);
   }
  });
  return () => unsubscribe();
 }, [navigate]);

 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg(null);

  if (!email.trim() || !password.trim()) {
   setErrorMsg('Please enter email and password.');
   setLoading(false);
   return;
  }

  try {
   const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
   const currentUser = userCredential.user;

   if (currentUser) {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
     console.log('Admin Login Successful!');
     setUser(currentUser);
     setIsAdmin(true);
     setErrorMsg(null);
     navigate('/dashboard');
    } else {
     await auth.signOut();
     setErrorMsg('Access Denied: Not an Admin.');
     console.warn('Access Denied: Not Admin.');
     setUser(null);
     setIsAdmin(false);
    }
   }
  } catch (error) {
   let message;
   switch (error.code) {
    case 'auth/user-not-found': message = 'No user found for that email.'; break;
    case 'auth/wrong-password': message = 'Wrong password provided for that user.'; break;
    case 'auth/invalid-email': message = 'The email address is not valid.'; break;
    case 'auth/invalid-credential': message = 'Invalid credentials. Please check your email and password.'; break;
    case 'auth/operation-not-allowed': message = 'Email/Password sign-in is not enabled. Please enable it in Firebase Console (Authentication -> Sign-in method).'; console.error("ACTION REQUIRED: Email/Password sign-in is not enabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method and enable it."); break;
    case 'auth/api-key-not-valid': message = 'Firebase API Key is not valid. Please check your Firebase configuration.'; console.error("ACTION REQUIRED: Firebase API Key is not valid. Please ensure YOUR_FIREBASE_CONFIG is correct."); break;
    default: message = `Login failed: ${error.message}`; break;
   }
   setErrorMsg(message);
   setUser(null);
   setIsAdmin(false);
   console.error('Firebase Auth Error:', error.code, '-', error.message);
  } finally {
   setLoading(false);
  }
 };

 return (
  <>
   <header className="flex items-center justify-between px-6 h-20 bg-white border-b-2 border-red-700 shadow-md">
    <div className="flex items-center space-x-4">
     <span className="text-xl font-bold text-gray-800">Kadu Academy Admin</span>
    </div>
    <button
     onClick={handleGoHome}
     className="flex items-center gap-2 p-2 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors"
    >
     <HomeIcon />
     Go to Home
    </button>
   </header>
   <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white">
    <img
     src={KaduLogo} 
     alt="Kadu Academy Logo"
     className="max-w-[200px] sm:max-w-[200px] h-auto mb-8 drop-shadow-md" 
    />
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
     <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 leading-tight tracking-tight text-red-700">
      Admin Login
     </h2>
     {errorMsg && (
      <div className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-lg mb-6 text-sm animate-fade-in-down" role="alert">
       <strong className="font-semibold">Error:</strong>
       <span className="block sm:inline ml-1"> {errorMsg}</span>
      </div>
     )}
     <form onSubmit={handleLogin} className="flex flex-col space-y-6">
      <div>
       <label htmlFor="email" className="block text-red-700 text-sm font-medium mb-2">
        Email Address
       </label>
       <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 h-5 w-5 flex items-center pointer-events-none">
         <Mail size={20} />
        </div>
        <input
         type="email"
         id="email"
         className="pl-10 pr-4 py-3 border border-red-300 rounded-lg w-full text-gray-800 text-base leading-tight bg-white transition duration-200 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
         placeholder="Email"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         required
        />
       </div>
      </div>
      <div>
       <label htmlFor="password" className="block text-red-700 text-sm font-medium mb-2">
        Password
       </label>
       <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 h-5 w-5 flex items-center pointer-events-none">
         <Lock size={20} />
        </div>
        <input
         type={showPassword ? 'text' : 'password'}
         id="password"
         className="pl-10 pr-10 py-3 border border-red-300 rounded-lg w-full text-gray-800 text-base leading-tight bg-white transition duration-200 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
         placeholder="********"
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         required
        />
        <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 focus:outline-none"
        >
         {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
       </div>
      </div>
      <button
       type="submit"
       className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:from-red-700 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
       disabled={loading}
      >
       {loading ? (
        <Loader2 className="animate-spin h-6 w-6 text-white" />
       ) : (
        <span className="flex items-center justify-center">
         Login as Admin
         <LogIn size={20} className="ml-2" />
        </span>
       )}
      </button>
     </form>
    </div>
   </div>
   {/* NEWLY ADDED FOOTER CALL */}
   <Footer />
  </>
 );
};

export default AdminLoginPage;