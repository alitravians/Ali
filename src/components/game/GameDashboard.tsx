import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy, Star, Clock } from 'lucide-react';

interface GameDashboardProps {
  score: number;
  level: number;
  city: string;
  cityAr: string;
  highScore: number;
  language: 'en' | 'ar';
  requiredScore?: number;
}

const GameDashboard: React.FC<GameDashboardProps> = ({
  score,
  level,
  city,
  cityAr,
  highScore,
  language,
  requiredScore
}) => {
  const translations = {
    en: {
      score: 'Score',
      highScore: 'High Score',
      level: 'Level',
      city: 'City',
      progress: 'Progress to next level',
    },
    ar: {
      score: 'النتيجة',
      highScore: 'أعلى نتيجة',
      level: 'المستوى',
      city: 'المدينة',
      progress: 'التقدم للمستوى التالي',
    }
  };

  const t = translations[language];
  const isRtl = language === 'ar';
  const displayCity = language === 'en' ? city : cityAr;

  return (
    <div className={`${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
              {t.score}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">
              {score}
              {requiredScore && (
                <span className="text-sm text-gray-500 ml-2">/ {requiredScore}</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="mr-2 h-4 w-4 text-yellow-500" />
              {t.highScore}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{highScore}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              {t.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <Badge variant="outline" className="text-lg">
              {level}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">
              {t.city}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <Badge variant="outline" className="text-lg">
              {displayCity}
            </Badge>
          </CardContent>
        </Card>
      </div>
      
      {requiredScore && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, (score / (requiredScore || 1)) * 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-center mt-1 text-gray-500">
            {t.progress} ({score}/{requiredScore})
          </div>
        </div>
      )}
    </div>
  );
};

export default GameDashboard;
