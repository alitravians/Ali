import React from 'react';
import { Card, CardContent } from './ui/card';

export const TutorialPreview: React.FC = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Step 1: Fill Form */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4 text-right">تعبئة المعلومات الشخصية</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-right mb-2">الاسم الكامل</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md text-right"
                placeholder="أدخل اسمك الكامل"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Enter Email */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4 text-right">إدخال البريد الإلكتروني</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-right mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                className="w-full p-2 border rounded-md text-right"
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Write Message */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4 text-right">كتابة الرسالة</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-right mb-2">رسالتك</label>
              <textarea
                className="w-full p-2 border rounded-md text-right"
                rows={4}
                placeholder="اكتب رسالتك هنا"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Submit Ticket */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4 text-right">إرسال التذكرة</h2>
          <div className="text-right">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              إرسال الطلب
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Track Status */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl mb-4 text-right">متابعة حالة الطلب</h2>
          <div className="space-y-4">
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  قيد المعالجة
                </span>
                <span className="text-gray-600">رقم التذكرة: #12345</span>
              </div>
              <h3 className="text-lg font-semibold mt-2 text-right">مشكلة في تسجيل الدخول</h3>
              <p className="text-gray-600 mt-1 text-right">تم استلام طلبك وسيتم الرد عليه قريباً</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
