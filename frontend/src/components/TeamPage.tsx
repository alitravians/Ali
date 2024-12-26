import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TeamMember {
  name: string;
  responsibility: string;
  avatar?: string;
}

interface TeamSection {
  title: string;
  members: TeamMember[];
  colorClass: string;
}

const TeamPage: React.FC = () => {
  const { t, direction } = useLanguage();

  // Placeholder data - will be replaced with dynamic data from API
  const teamSections: TeamSection[] = [
    {
      title: t('team.sections.generalManagement'),
      members: [
        {
          name: 'الريم',
          responsibility: t('team.roles.administrator'),
          avatar: ''
        },
        {
          name: 'Burger',
          responsibility: t('team.roles.general'),
          avatar: ''
        },
        {
          name: 'Boon',
          responsibility: t('team.roles.general'),
          avatar: ''
        }
      ],
      colorClass: 'text-red-600'
    },
    {
      title: t('team.sections.subAdministrator'),
      members: [],
      colorClass: 'text-blue-600'
    },
    {
      title: t('team.sections.janitors'),
      members: [],
      colorClass: 'text-blue-600'
    },
    {
      title: t('team.sections.support'),
      members: [],
      colorClass: 'text-blue-600'
    }
  ];

  return (
    <div className={`container mx-auto p-4 ${direction}`}>
      {/* Community Manager Notice */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">[{t('team.communityManager')}]</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-blue-600 animate-pulse">{t('team.notices.noNews')}</p>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8">{t('team.title')}</h1>
      
      {teamSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`p-4 ${section.colorClass} text-center font-bold text-xl`}>
              {section.title}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {section.members.length > 0 ? (
                section.members.map((member, memberIndex) => (
                  <div key={memberIndex} className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mb-4">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={`${member.name} avatar`}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-full" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{member.name}</h3>
                    <p className={`${section.colorClass}`}>{member.responsibility}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 text-center text-gray-500">
                  {t('team.noMembers')}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamPage;
