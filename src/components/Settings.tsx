import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Key, Mic, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [voiceModel, setVoiceModel] = useState('whisper-1');
  const [textModel, setTextModel] = useState('gpt-4o');
  const [enableVoiceResponse, setEnableVoiceResponse] = useState(false);
  const [autoSaveIdeas, setAutoSaveIdeas] = useState(true);
  const { logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('voiceIdeas_apiKey');
    const storedVoiceModel = localStorage.getItem('voiceIdeas_voiceModel');
    const storedTextModel = localStorage.getItem('voiceIdeas_textModel');
    const storedVoiceResponse = localStorage.getItem('voiceIdeas_enableVoiceResponse');
    const storedAutoSave = localStorage.getItem('voiceIdeas_autoSaveIdeas');

    if (storedApiKey) setApiKey(storedApiKey);
    if (storedVoiceModel) setVoiceModel(storedVoiceModel);
    if (storedTextModel) setTextModel(storedTextModel);
    if (storedVoiceResponse) setEnableVoiceResponse(storedVoiceResponse === 'true');
    if (storedAutoSave) setAutoSaveIdeas(storedAutoSave === 'true');
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('voiceIdeas_apiKey', apiKey.trim());
      toast({
        title: "API Key saved",
        description: "Your OpenAI API key has been securely stored.",
      });
    } else {
      localStorage.removeItem('voiceIdeas_apiKey');
      toast({
        title: "API Key removed",
        description: "Your OpenAI API key has been cleared.",
      });
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('voiceIdeas_voiceModel', voiceModel);
    localStorage.setItem('voiceIdeas_textModel', textModel);
    localStorage.setItem('voiceIdeas_enableVoiceResponse', enableVoiceResponse.toString());
    localStorage.setItem('voiceIdeas_autoSaveIdeas', autoSaveIdeas.toString());
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const handleLogout = () => {
    logout();
    onClose();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
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
          <Tabs defaultValue="api" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs">Voice</TabsTrigger>
              <TabsTrigger value="ideas" className="text-xs">Ideas</TabsTrigger>
            </TabsList>

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
              <Button onClick={handleSaveApiKey} size="sm" className="w-full">
                Save API Key
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

              <Button onClick={handleSaveSettings} size="sm" className="w-full">
                Save Voice Settings
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

              <Button onClick={handleSaveSettings} size="sm" className="w-full">
                Save Idea Settings
              </Button>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          
          <Button onClick={handleLogout} variant="destructive" size="sm" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}