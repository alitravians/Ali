import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Table, TableHeader, TableBody, TableRow, TableCell, Button, Input } from '@/components/ui/index';
import { handleApiError } from '@/lib/errors';
import api from '@/lib/api';

interface SchoolRule {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export function RuleManagement() {
  const [rules, setRules] = useState<SchoolRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/rules');
      setRules(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err, 'فشل في تحميل القوانين');
      setError(errorMessage);
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredRules = rules.filter((rule) =>
    rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.category.toLowerCase().includes(searchQuery.toLowerCase())
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
        <CardTitle>إدارة القوانين والأنظمة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              إضافة قانون جديد
            </Button>
            {filteredRules.length > 0 && (
              <Input
                placeholder="بحث عن قانون..."
                className="w-64 text-right"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            )}
          </div>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">لا يوجد قوانين مسجلة</p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                إضافة قانون جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="text-right font-bold">العنوان</TableCell>
                  <TableCell className="text-right font-bold">الوصف</TableCell>
                  <TableCell className="text-right font-bold">التصنيف</TableCell>
                  <TableCell className="text-right font-bold">تاريخ الإنشاء</TableCell>
                  <TableCell className="text-right font-bold">آخر تحديث</TableCell>
                  <TableCell className="text-right font-bold">الإجراءات</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-right">{rule.title}</TableCell>
                    <TableCell className="text-right">{rule.description}</TableCell>
                    <TableCell className="text-right">{rule.category}</TableCell>
                    <TableCell className="text-right">
                      {new Date(rule.created_at).toLocaleDateString('ar')}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(rule.updated_at).toLocaleDateString('ar')}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
