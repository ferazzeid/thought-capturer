import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';
import { ChatInterface } from '@/components/ChatInterface';
import { Settings } from '@/components/Settings';
import { Header } from '@/components/Header';
import { useProfile } from '@/hooks/useProfile';

const Index = () => {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        hasApiKey={!!profile?.api_key}
      />
      
      <main className="pb-safe">
        <ChatInterface apiKey={profile?.api_key || undefined} />
      </main>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Index;
