import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FormInput, Mail, MessageSquare, Send, Clock } from 'lucide-react';

export const TutorialGuide: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: <FormInput className="w-8 h-8" />,
      image: '/images/tutorial/fill-form.png',
      title: t('tutorial.step1.title'),
      description: t('tutorial.step1.description')
    },
    {
      icon: <Mail className="w-8 h-8" />,
      image: '/images/tutorial/enter-email.png',
      title: t('tutorial.step2.title'),
      description: t('tutorial.step2.description')
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      image: '/images/tutorial/write-message.png',
      title: t('tutorial.step3.title'),
      description: t('tutorial.step3.description')
    },
    {
      icon: <Send className="w-8 h-8" />,
      image: '/images/tutorial/submit-ticket.png',
      title: t('tutorial.step4.title'),
      description: t('tutorial.step4.description')
    },
    {
      icon: <Clock className="w-8 h-8" />,
      image: '/images/tutorial/track-status.png',
      title: t('tutorial.step5.title'),
      description: t('tutorial.step5.description')
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('tutorial.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={index} className="flex flex-col items-center p-4">
                <div className="mb-4 p-2 rounded-full bg-primary/10">
                  {step.icon}
                </div>
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
