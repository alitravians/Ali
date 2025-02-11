import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Table, TableHeader, TableBody, TableRow, TableCell, Button, Input } from '@/components/ui/index';
import axios from 'axios';

interface Student {
  id: number;
  name: string;
  admission_number: string;
  class_name: string;
  grade_level: string;
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStudents(response.data);
    } catch (err) {
      setError('فشل في تحميل بيانات الطلاب');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الطلاب</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              إضافة طالب جديد
            </Button>
            <Input
              placeholder="بحث عن طالب..."
              className="w-64 text-right"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="text-right font-bold">رقم القبول</TableCell>
                <TableCell className="text-right font-bold">الاسم</TableCell>
                <TableCell className="text-right font-bold">الصف</TableCell>
                <TableCell className="text-right font-bold">المستوى</TableCell>
                <TableCell className="text-right font-bold">الإجراءات</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="text-right">{student.admission_number}</TableCell>
                  <TableCell className="text-right">{student.name}</TableCell>
                  <TableCell className="text-right">{student.class_name}</TableCell>
                  <TableCell className="text-right">{student.grade_level}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="ghost" className="text-blue-500 hover:text-blue-600">
                      تعديل
                    </Button>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600">
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
