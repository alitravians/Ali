import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  category: string;
}

export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/books`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBooks(response.data);
    } catch (err) {
      setError('فشل في تحميل بيانات الكتب');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase())
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
        <CardTitle>إدارة الكتب</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              إضافة كتاب جديد
            </Button>
            <Input
              placeholder="بحث عن كتاب..."
              className="w-64 text-right"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="text-right font-bold">العنوان</TableCell>
                <TableCell className="text-right font-bold">المؤلف</TableCell>
                <TableCell className="text-right font-bold">الرقم التسلسلي</TableCell>
                <TableCell className="text-right font-bold">التصنيف</TableCell>
                <TableCell className="text-right font-bold">النسخ المتوفرة</TableCell>
                <TableCell className="text-right font-bold">الإجراءات</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="text-right">{book.title}</TableCell>
                  <TableCell className="text-right">{book.author}</TableCell>
                  <TableCell className="text-right">{book.isbn}</TableCell>
                  <TableCell className="text-right">{book.category}</TableCell>
                  <TableCell className="text-right">
                    {book.available_copies}/{book.total_copies}
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
