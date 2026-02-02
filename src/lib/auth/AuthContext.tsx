"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase/client"; 
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Detect mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  userProfile: any;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("[AuthContext] 🔥 Firebase Auth Initializing...");
    
    // Handle redirect result (for mobile Google login)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("[AuthContext] 📱 Redirect login successful:", result.user.email);
        router.push("/");
      }
    }).catch((error) => {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("[AuthContext] ❌ Redirect result error:", error);
      }
    });
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log(`[AuthContext] 🔥 Auth State Changed: ${currentUser ? currentUser.email : "No User"}`);
      
      if (currentUser) {
        // Sync user to Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          const profileData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLogin: serverTimestamp(),
          };

          if (!userSnap.exists()) {
             // 1. Check for legacy migration data
             let legacyData: any = {};
             if (currentUser.email) {
                try {
                    const legacySnap = await getDoc(doc(db, "legacy_users", currentUser.email));
                    if (legacySnap.exists()) {
                        console.log(`[AuthContext] ♻️ Restore legacy user data found for ${currentUser.email}`);
                        legacyData = legacySnap.data();
                    }
                } catch (err) {
                    console.warn("[AuthContext] Legacy check failed", err);
                }
             }

             // 2. Create new user record with merged data
             const newUserData = {
               ...profileData,
               createdAt: serverTimestamp(),
               role: legacyData.role || 'user',
               points: legacyData.points || 0,
               nickname: legacyData.nickname || currentUser.displayName || "",
               ...legacyData
             };

             await setDoc(userRef, newUserData);
             setUserProfile(newUserData);
             
             if (Object.keys(legacyData).length > 0) {
                 toast("기존 회원 정보를 성공적으로 불러왔습니다! 🎉");
             }

          } else {
             // Update existing user (sync latest info)
             await setDoc(userRef, profileData, { merge: true });
             setUserProfile(userSnap.data());
          }
        } catch (e) {
          console.error("Error syncing user to Firestore:", e);
        }
      } else {
        setUserProfile(null);
      }

      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("[AuthContext] 🔥 Auth Error:", error);
      setAuthError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Use redirect on mobile, popup on desktop
      if (isMobileDevice()) {
        console.log("[AuthContext] 📱 Mobile detected, using signInWithRedirect");
        await signInWithRedirect(auth, googleProvider);
        // Note: After redirect, the page reloads and getRedirectResult handles the login
      } else {
        console.log("[AuthContext] 💻 Desktop detected, using signInWithPopup");
        await signInWithPopup(auth, googleProvider);
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login Failed", error);
      setAuthError(error.message);
      
      // Fallback: If popup fails (e.g., blocked), try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log("[AuthContext] ⚠️ Popup blocked, falling back to redirect");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error("Redirect also failed:", redirectError);
          throw redirectError;
        }
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Ensure auth is initialized
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error: any) {
       console.error("Email Login Failed", error);
       setAuthError(error.message);
       throw error;
    } finally {
       setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error: any) {
      console.error("Logout Failed", error);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'design@designdlab.co.kr';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user, 
      signInWithGoogle, 
      signInWithEmail,
      signOut, 
      authError,
      userProfile,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
