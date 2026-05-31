import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  name: string;
  lastName: string;
  username: string;
  role: 'student' | 'professor' | 'admin';
  description?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setProfile(userDocSnap.data() as UserProfile);
          } else {
            // If the user logs in as Admin, they might not have a profile document yet
            if (currentUser.email === 'naomi.urrea94@gmail.com') {
              setProfile({
                name: 'Naomi',
                lastName: 'Urrea',
                username: 'Profe Naomi',
                role: 'admin',
                description: 'Profesora apasionada por la enseñanza y creadora de este Espacio Virtual.',
              });
            } else {
              setProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
