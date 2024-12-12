import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { KEYS } from '../../../utils/localStorage';
import { TeamMember } from '../../../types/team';

export function Team() {
  const [teamMembers] = useLocalStorage<TeamMember[]>(KEYS.TEAM_MEMBERS, []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-pulse">جاري تحميل فريق العمل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="bg-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-6">فريق العمل</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center text-gray-500">
              لا يوجد أعضاء في فريق العمل حالياً
            </div>
          ) : (
            <div className="rounded-md border">
              <Table dir="rtl">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الافتار</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الصلاحية</TableHead>
                    <TableHead className="text-right">تاريخ الانضمام</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString('ar-SA')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
