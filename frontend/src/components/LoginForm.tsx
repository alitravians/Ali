import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { loginUser } from '../lib/api';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const LoginForm: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useUser();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUser(null);  // Clear user state at start of login attempt

    // Validate empty fields
    if (!username.trim() || !password.trim()) {
      setError(t('login.errorEmptyFields'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(username, password);
      
      // Validate user data structure
      if (!response || !response.id || !response.username || !response.role) {
        setError(t('login.generalError'));
        setIsLoading(false);
        return;
      }

      // Set user state after validation but before navigation
      setUser(response);
      setIsLoading(false);

      // Only navigate after successful user state update
      if (response.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/tickets');
      }
    } catch (error: unknown) {
      console.error('Login failed:', error);
      setIsLoading(false);
      
      if (error instanceof Error && error.name === 'AuthenticationError') {
        setError(t('login.errorInvalidCredentials'));
      } else {
        setError(t('login.generalError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="username">{t('login.username')}</label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">{t('login.password')}</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('common.loading') : t('login.submit')}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>{t('login.loginError')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
