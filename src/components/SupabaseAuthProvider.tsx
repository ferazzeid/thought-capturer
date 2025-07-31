import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('SupabaseAuthProvider: Setting up auth listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('SupabaseAuthProvider: Auth state changed', { event, hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SupabaseAuthProvider: Initial session check', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch((error) => {
      console.error('SupabaseAuthProvider: Error getting session', error);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      console.log('SupabaseAuthProvider: signUp called', { email, hasDisplayName: !!displayName });
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: displayName ? { display_name: displayName } : undefined
        }
      });
      
      console.log('SupabaseAuthProvider: signUp response', { hasError: !!error });
      return { error };
    } catch (err) {
      console.error('SupabaseAuthProvider: signUp exception', err);
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('SupabaseAuthProvider: signIn called', { email });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('SupabaseAuthProvider: signIn response', { hasError: !!error });
      return { error };
    } catch (err) {
      console.error('SupabaseAuthProvider: signIn exception', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('SupabaseAuthProvider: signOut called');
      const { error } = await supabase.auth.signOut();
      console.log('SupabaseAuthProvider: signOut response', { hasError: !!error });
      return { error };
    } catch (err) {
      console.error('SupabaseAuthProvider: signOut exception', err);
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('SupabaseAuthProvider: resetPassword called', { email });
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      console.log('SupabaseAuthProvider: resetPassword response', { hasError: !!error });
      return { error };
    } catch (err) {
      console.error('SupabaseAuthProvider: resetPassword exception', err);
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signUp, 
      signIn, 
      signOut, 
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}