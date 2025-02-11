import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface BookLoan {
  id: number;
  book_id: number;
  student_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
}

export function LoanManagement() {
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/loans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setLoans(response.data);
    } catch (err) {
      setError('فشل في تحميل بيانات الاستعارات');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getStatusColor = (status: BookLoan['status']) => {
    switch (status) {
      case 'borrowed':
        return 'text-blue-500';
      case 'returned':
        return 'text-green-500';
      case 'overdue':
        return 'text-red-500';
      default:
        return '';
    }
  };

  const getStatusText = (status: BookLoan['status']) => {
    switch (status) {
      case 'borrowed':
        return 'مستعار';
      case 'returned':
        return 'تم الإرجاع';
      case 'overdue':
        return 'متأخر';
      default:
        return status;
    }
  };

  const filteredLoans = loans.filter((loan) =>
    loan.student_id.toString().includes(searchQuery) ||
    loan.book_id.toString().includes(searchQuery) ||
    loan.status.toLowerCase().includes(searchQuery.toLowerCase())
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
        <CardTitle>إدارة الاستعارات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              تسجيل استعارة جديدة
            </Button>
            <Input
              placeholder="بحث عن استعارة..."
              className="w-64 text-right"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="text-right font-bold">رقم الكتاب</TableCell>
                <TableCell className="text-right font-bold">رقم الطالب</TableCell>
                <TableCell className="text-right font-bold">تاريخ الاستعارة</TableCell>
                <TableCell className="text-right font-bold">تاريخ الاستحقاق</TableCell>
                <TableCell className="text-right font-bold">تاريخ الإرجاع</TableCell>
                <TableCell className="text-right font-bold">الحالة</TableCell>
                <TableCell className="text-right font-bold">الإجراءات</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="text-right">{loan.book_id}</TableCell>
                  <TableCell className="text-right">{loan.student_id}</TableCell>
                  <TableCell className="text-right">{new Date(loan.borrow_date).toLocaleDateString('ar')}</TableCell>
                  <TableCell className="text-right">{new Date(loan.due_date).toLocaleDateString('ar')}</TableCell>
                  <TableCell className="text-right">
                    {loan.return_date ? new Date(loan.return_date).toLocaleDateString('ar') : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${getStatusColor(loan.status)}`}>
                    {getStatusText(loan.status)}
                  </TableCell>
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
