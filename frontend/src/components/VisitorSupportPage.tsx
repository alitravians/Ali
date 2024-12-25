import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, AlertCircle } from 'lucide-react';
import { TutorialGuide } from './TutorialGuide';
import { createTicket } from '../lib/api';

export const VisitorSupportPage = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (name.length < 2 || name.length > 50) {
      setError(t('visitorSupport.nameValidation'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('visitorSupport.emailValidation'));
      return false;
    }
    if (message.length < 10 || message.length > 500) {
      setError(t('visitorSupport.messageValidation'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createTicket(
        `Support Request from ${name} (${email})`,
        message,
        1 // Using admin user ID since we don't have visitor accounts
      );
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(t('visitorSupport.errorSubmittingRequest'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <TutorialGuide />
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            <CardTitle>{t('visitorSupport.title')}</CardTitle>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
            {t('visitorSupport.loginAsAdmin')}
          </Link>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('visitorSupport.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('visitorSupport.namePlaceholder')}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('visitorSupport.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('visitorSupport.emailPlaceholder')}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('visitorSupport.message')}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('visitorSupport.messagePlaceholder')}
                required
                disabled={isSubmitting}
                className="min-h-[150px]"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  {t('visitorSupport.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('visitorSupport.submit')}
                </>
              )}
            </Button>
          </form>

          {success && (
            <Alert className="mt-4">
              <AlertDescription>{t('visitorSupport.requestSubmittedSuccessfully')}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
