import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Key, Mic, Brain, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import { useProfile } from '@/hooks/useProfile';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [voiceModel, setVoiceModel] = useState('alloy');
  const [textModel, setTextModel] = useState('gpt-4o-mini');
  const [enableVoiceResponse, setEnableVoiceResponse] = useState(true);
  const [autoSaveIdeas, setAutoSaveIdeas] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useSupabaseAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setApiKey(profile.api_key || '');
      setDisplayName(profile.display_name || '');
      setVoiceModel(profile.voice_model);
      setTextModel(profile.text_model);
      setEnableVoiceResponse(profile.voice_response);
      setAutoSaveIdeas(profile.auto_save_ideas);
    }
  }, [profile]);

  const handleSaveApiKey = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({
      api_key: apiKey.trim() || null
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "API Key saved",
        description: "Your OpenAI API key has been securely stored.",
      });
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({
      voice_model: voiceModel,
      text_model: textModel,
      voice_response: enableVoiceResponse,
      auto_save_ideas: autoSaveIdeas
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({
      display_name: displayName.trim() || null
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      onClose();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Settings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <CardDescription>
            Configure your AI voice assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs">Voice</TabsTrigger>
              <TabsTrigger value="ideas" className="text-xs">Ideas</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label>Profile Information</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                size="sm" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="apiKey">OpenAI API Key</Label>
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleSaveApiKey} 
                size="sm" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save API Key'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never shared.
              </p>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <Label>Voice Settings</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voiceModel">Voice-to-Text Model</Label>
                <select
                  id="voiceModel"
                  value={voiceModel}
                  onChange={(e) => setVoiceModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                >
                  <option value="whisper-1">Whisper v1</option>
                  <option value="whisper-2">Whisper v2 (Coming Soon)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textModel">Text Model</Label>
                <select
                  id="textModel"
                  value={textModel}
                  onChange={(e) => setTextModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voiceResponse">Enable Voice Responses</Label>
                <Switch
                  id="voiceResponse"
                  checked={enableVoiceResponse}
                  onCheckedChange={setEnableVoiceResponse}
                />
              </div>

              <Button 
                onClick={handleSaveSettings} 
                size="sm" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Voice Settings'}
              </Button>
            </TabsContent>

            <TabsContent value="ideas" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <Label>Idea Management</Label>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave">Auto-save Ideas</Label>
                <Switch
                  id="autoSave"
                  checked={autoSaveIdeas}
                  onCheckedChange={setAutoSaveIdeas}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Ideas will be automatically saved to your database when Supabase is connected.
              </p>

              <Button 
                onClick={handleSaveSettings} 
                size="sm" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Idea Settings'}
              </Button>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          
          <Button 
            onClick={handleLogout} 
            variant="destructive" 
            size="sm" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}