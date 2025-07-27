import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LoginForm } from '@/components/LoginForm';
import { ChatInterface } from '@/components/ChatInterface';
import { Settings } from '@/components/Settings';
import { Header } from '@/components/Header';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('voiceIdeas_apiKey');
    setApiKey(storedApiKey);
  }, [showSettings]); // Re-check when settings close

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        hasApiKey={!!apiKey}
      />
      
      <main className="pb-safe">
        <ChatInterface apiKey={apiKey || undefined} />
      </main>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Index;
