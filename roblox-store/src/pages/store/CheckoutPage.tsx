import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, CheckCircle, AlertCircle, Upload, Image } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/config';

type OrderStatus = 'idle' | 'processing' | 'success' | 'error';

const CheckoutPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();
  const [robloxUsername, setRobloxUsername] = useState('');
  const [email, setEmail] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofImageName, setProofImageName] = useState<string>('');

  // Pre-fill customer info if logged in
  useEffect(() => {
    if (isLoggedIn && customer) {
      setRobloxUsername(customer.robloxUsername || '');
      setEmail(customer.email || '');
    }
  }, [isLoggedIn, customer]);

  // Handle image upload and convert to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(i18n.language === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image size too large (max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setProofImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

    const createOrder = async () => {
      try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        const order = {
          items: items.map(item => ({
            id: item.id,
            name_en: item.name_en,
            name_ar: item.name_ar,
            price: item.price,
            quantity: item.quantity,
            gamePassUrl: item.gamePassUrl || null
          })),
        total,
        paymentMethod: 'gamepass',
                customerInfo: {
                  robloxUsername,
                  robloxId: customer?.robloxId || '',
                  email,
                  customerId: customer?.id || ''
                },
        proofImage: proofImage || null,
        proofImageName: proofImageName || null,
        status: 'pending', // Always pending until admin verifies
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newOrderRef, order);
      return newOrderRef.key;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleGamePassOrder = async () => {
    if (!robloxUsername || !email) {
      alert(i18n.language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    if (!proofImage) {
      alert(i18n.language === 'ar' ? 'يرجى رفع صورة إثبات الشراء' : 'Please upload proof of purchase image');
      return;
    }

    setOrderStatus('processing');
    try {
      const id = await createOrder();
      setOrderId(id);
      setOrderStatus('success');
      clearCart();
    } catch (error) {
      setOrderStatus('error');
    }
  };

  if (items.length === 0 && orderStatus !== 'success') {
    navigate('/cart');
    return null;
  }

    if (orderStatus === 'success') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <CheckCircle size={80} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('checkout.orderSuccess')}</h2>
            <p className="text-gray-600 mb-4">
              {i18n.language === 'ar' 
                ? `رقم الطلب: ${orderId}` 
                : `Order ID: ${orderId}`}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                {i18n.language === 'ar' 
                  ? '⏳ طلبك قيد المراجعة. سيتم إشعارك عند تأكيد الدفع وتسليم العناصر.'
                  : '⏳ Your order is under review. You will be notified when payment is confirmed and items are delivered.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                {t('store.home')}
              </button>
              {isLoggedIn && (
                <button
                  onClick={() => navigate('/my-orders')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  {i18n.language === 'ar' ? 'طلباتي' : 'My Orders'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {i18n.language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    {t('checkout.robloxUsername')}
                  </label>
                  <input
                    type="text"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={i18n.language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    {t('checkout.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={i18n.language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method - Game Pass Only */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {t('checkout.paymentMethod')}
              </h2>
              <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-green-600 bg-green-50">
                <Gamepad2 size={24} className="text-green-600" />
                <div className="text-left">
                  <p className="font-bold text-gray-800">{t('checkout.gamepass')}</p>
                  <p className="text-sm text-gray-500">
                    {i18n.language === 'ar' ? 'الدفع باستخدام Robux' : 'Pay using Robux'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h3 className="font-bold text-blue-800 mb-2">
                                    {i18n.language === 'ar' ? 'تعليمات الدفع بالروبوكس' : 'Robux Payment Instructions'}
                                  </h3>
                                  <ol className="text-blue-700 text-sm space-y-2 list-decimal list-inside">
                                    <li>{i18n.language === 'ar' ? 'اشترِ Game Pass من الرابط أدناه لكل منتج' : 'Purchase the Game Pass from the link below for each product'}</li>
                                    <li>{i18n.language === 'ar' ? 'ارفع صورة إثبات الشراء' : 'Upload proof of purchase screenshot'}</li>
                                    <li>{i18n.language === 'ar' ? 'سنتحقق من عملية الشراء ونسلم العناصر' : 'We will verify and deliver your items'}</li>
                                  </ol>
                                </div>
                
                                {/* Game Pass Links for each product */}
                                <div className="space-y-2">
                                  {items.map((item, index) => {
                                    const itemName = i18n.language === 'ar' ? item.name_ar : item.name_en;
                                    const gamePassUrl = item.gamePassUrl || 'https://www.roblox.com/game-pass/123456789';
                                    return (
                                      <a
                                        key={item.id}
                                        href={gamePassUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold text-center hover:bg-green-700 transition-colors"
                                      >
                                        {i18n.language === 'ar' ? `شراء Game Pass - ${itemName}` : `Buy Game Pass - ${itemName}`}
                                        {items.length > 1 && ` (${index + 1}/${items.length})`}
                                      </a>
                                    );
                                  })}
                                </div>
                
                                {items.length > 1 && (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-orange-800 text-sm">
                                      {i18n.language === 'ar' 
                                        ? '⚠️ لديك أكثر من منتج - يرجى شراء Game Pass لكل منتج ورفع صورة إثبات واحدة تشمل جميع المشتريات' 
                                        : '⚠️ You have multiple products - please purchase Game Pass for each and upload one proof image covering all purchases'}
                                    </p>
                                  </div>
                                )}

                {/* Proof of Purchase Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    {i18n.language === 'ar' ? 'رفع صورة إثبات الشراء *' : 'Upload Proof of Purchase *'}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors">
                        <Upload size={20} />
                        <span>{i18n.language === 'ar' ? 'اختر صورة' : 'Choose Image'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {proofImage && (
                    <div className="mt-3 flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                      <Image size={20} className="text-green-600" />
                      <span className="text-green-700 text-sm flex-1 truncate">{proofImageName}</span>
                      <img src={proofImage} alt="Proof" className="w-16 h-16 object-cover rounded-lg border" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {i18n.language === 'ar' ? 'الحد الأقصى: 5MB - صيغ مدعومة: JPG, PNG, GIF' : 'Max: 5MB - Supported: JPG, PNG, GIF'}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    {i18n.language === 'ar' 
                      ? '⚠️ طلبك سيكون معلقاً حتى تتأكد الإدارة من صحة الدفع' 
                      : '⚠️ Your order will be pending until admin verifies the payment'}
                  </p>
                </div>

                <button
                  onClick={handleGamePassOrder}
                  disabled={orderStatus === 'processing' || !robloxUsername || !email || !proofImage}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {orderStatus === 'processing' ? t('checkout.processing') : t('checkout.placeOrder')}
                </button>
              </div>

              {orderStatus === 'error' && (
                <div className="mt-4 flex items-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  <span>{t('checkout.orderFailed')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {i18n.language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              <div className="space-y-4 mb-6">
                {items.map(item => {
                  const name = i18n.language === 'ar' ? item.name_ar : item.name_en;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/9333ea/white?text=Item';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{name}</p>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-xl font-bold text-gray-800">
                <span>{t('cart.total')}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
