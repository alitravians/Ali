import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, CheckCircle, AlertCircle, Upload, Image, Tag, X, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useCoupons } from '../../contexts/CouponContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { ref, push, set } from 'firebase/database';
import { database } from '../../firebase/config';

type OrderStatus = 'idle' | 'processing' | 'success' | 'error';

const CheckoutPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { items, total, clearCart } = useCart();
      const { customer, isLoggedIn } = useCustomerAuth();
      const { validateCoupon, applyCoupon } = useCoupons();
      const { settings } = useSiteSettings();
      const [robloxUsername, setRobloxUsername] = useState('');
      const [email, setEmail] = useState('');
      const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle');
      const [orderId, setOrderId] = useState<string | null>(null);
      const [proofImage, setProofImage] = useState<string | null>(null);
      const [proofImageName, setProofImageName] = useState<string>('');
      const [paymentMethod, setPaymentMethod] = useState<'gamepass' | 'paypal'>('gamepass');
      const [paypalInvoiceUrl, setPaypalInvoiceUrl] = useState<string | null>(null);
  
    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; couponId: string } | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
    // Calculate final total with discount
    const finalTotal = appliedCoupon ? Math.max(0, total - appliedCoupon.discount) : total;

    // Pre-fill customer info if logged in
    useEffect(() => {
      if (isLoggedIn && customer) {
        setRobloxUsername(customer.robloxUsername || '');
        setEmail(customer.email || '');
      }
    }, [isLoggedIn, customer]);

    
    // Handle coupon validation
    const handleApplyCoupon = () => {
      if (!couponCode.trim()) {
        setCouponMessage({
          type: 'error',
          text: i18n.language === 'ar' ? 'يرجى إدخال كود الخصم' : 'Please enter a coupon code'
        });
        return;
      }

      const result = validateCoupon(couponCode, total);
    
      if (result.valid && result.coupon) {
        setAppliedCoupon({
          code: couponCode,
          discount: result.discount,
          couponId: result.coupon.id
        });
        setCouponMessage({
          type: 'success',
          text: i18n.language === 'ar' ? result.message_ar : result.message_en
        });
        setCouponCode('');
      } else {
        setCouponMessage({
          type: 'error',
          text: i18n.language === 'ar' ? result.message_ar : result.message_en
        });
      }
    };

    // Remove applied coupon
    const handleRemoveCoupon = () => {
      setAppliedCoupon(null);
      setCouponMessage(null);
    };

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
                subtotal: total,
                discount: appliedCoupon?.discount || 0,
                couponCode: appliedCoupon?.code || null,
                couponId: appliedCoupon?.couponId || null,
                total: finalTotal,
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
      
          // Apply coupon usage if one was used
          if (appliedCoupon) {
            await applyCoupon(appliedCoupon.couponId);
          }
      
          setOrderStatus('success');
          clearCart();
        } catch (error) {
          setOrderStatus('error');
        }
      };

    // PayPal Order Handler
    const handlePayPalOrder = async () => {
      if (!robloxUsername || !email) {
        alert(i18n.language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        return;
      }

      if (!settings?.paypalBusinessEmail) {
        alert(i18n.language === 'ar' ? 'الدفع بـ PayPal غير متاح حالياً' : 'PayPal payment is not available');
        return;
      }

      setOrderStatus('processing');
      try {
        // Create order in Firebase with PayPal payment method
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
      
        const order = {
          items: items.map(item => ({
            id: item.id,
            name_en: item.name_en,
            name_ar: item.name_ar,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            gamePassUrl: item.gamePassUrl || null
          })),
          subtotal: total,
          discount: appliedCoupon?.discount || 0,
          couponCode: appliedCoupon?.code || null,
          couponId: appliedCoupon?.couponId || null,
          total: finalTotal,
          paymentMethod: 'paypal',
          paypalDetails: {
            businessEmail: settings.paypalBusinessEmail,
            businessName: settings.paypalBusinessName || '',
            currency: settings.paypalCurrency || 'USD',
            amount: finalTotal
          },
          customerInfo: {
            robloxUsername,
            robloxId: customer?.robloxId || '',
            email,
            customerId: customer?.id || ''
          },
          proofImage: null, // No proof needed for PayPal
          proofImageName: null,
          status: 'pending_payment', // Waiting for PayPal payment
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await set(newOrderRef, order);
        setOrderId(newOrderRef.key);
      
        // Generate PayPal.me link for direct payment
        const paypalMeUrl = `https://www.paypal.com/paypalme/${settings.paypalBusinessEmail?.split('@')[0]}/${finalTotal.toFixed(2)}${settings.paypalCurrency || 'USD'}`;
        setPaypalInvoiceUrl(paypalMeUrl);
      
        // Apply coupon usage if one was used
        if (appliedCoupon) {
          await applyCoupon(appliedCoupon.couponId);
        }
      
        setOrderStatus('success');
        clearCart();
      } catch (error) {
        console.error('Error creating PayPal order:', error);
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

                        {/* Coupon Code Section */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Tag size={20} className="text-purple-600" />
                            {i18n.language === 'ar' ? 'كود الخصم' : 'Coupon Code'}
                          </h2>
              
                          {appliedCoupon ? (
                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" />
                                <div>
                                  <p className="font-bold text-green-800">{appliedCoupon.code}</p>
                                  <p className="text-sm text-green-600">
                                    {i18n.language === 'ar' 
                                      ? `خصم: $${appliedCoupon.discount.toFixed(2)}` 
                                      : `Discount: $${appliedCoupon.discount.toFixed(2)}`}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={handleRemoveCoupon}
                                className="text-red-500 hover:text-red-700 p-1"
                                title={i18n.language === 'ar' ? 'إزالة الكوبون' : 'Remove coupon'}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder={i18n.language === 'ar' ? 'أدخل كود الخصم' : 'Enter coupon code'}
                                />
                                <button
                                  onClick={handleApplyCoupon}
                                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                >
                                  {i18n.language === 'ar' ? 'تطبيق' : 'Apply'}
                                </button>
                              </div>
                              {couponMessage && (
                                <div className={`flex items-center gap-2 text-sm ${
                                  couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {couponMessage.type === 'success' ? (
                                    <CheckCircle size={16} />
                                  ) : (
                                    <AlertCircle size={16} />
                                  )}
                                  <span>{couponMessage.text}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                                    {/* Payment Method Selection */}
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                      <h2 className="text-xl font-bold text-gray-800 mb-4">
                                        {t('checkout.paymentMethod')}
                                      </h2>
                                      <div className="space-y-3">
                                        {/* Game Pass Option */}
                                        <button
                                          onClick={() => setPaymentMethod('gamepass')}
                                          className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                                            paymentMethod === 'gamepass'
                                              ? 'border-green-600 bg-green-50'
                                              : 'border-gray-200 hover:border-gray-300'
                                          }`}
                                        >
                                          <Gamepad2 size={24} className={paymentMethod === 'gamepass' ? 'text-green-600' : 'text-gray-400'} />
                                          <div className="text-left flex-1">
                                            <p className="font-bold text-gray-800">{t('checkout.gamepass')}</p>
                                            <p className="text-sm text-gray-500">
                                              {i18n.language === 'ar' ? 'الدفع باستخدام Robux' : 'Pay using Robux'}
                                            </p>
                                          </div>
                                          {paymentMethod === 'gamepass' && (
                                            <CheckCircle size={24} className="text-green-600" />
                                          )}
                                        </button>

                                        {/* PayPal Option - Only show if enabled */}
                                        {settings?.paypalEnabled && (
                                          <button
                                            onClick={() => setPaymentMethod('paypal')}
                                            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                                              paymentMethod === 'paypal'
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                          >
                                            <CreditCard size={24} className={paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-400'} />
                                            <div className="text-left flex-1">
                                              <p className="font-bold text-gray-800">PayPal</p>
                                              <p className="text-sm text-gray-500">
                                                {i18n.language === 'ar' ? 'الدفع عبر PayPal' : 'Pay via PayPal'}
                                              </p>
                                            </div>
                                            {paymentMethod === 'paypal' && (
                                              <CheckCircle size={24} className="text-blue-600" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                        </div>

                      {/* Payment Actions */}
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="space-y-4">
                          {/* Game Pass Payment Flow */}
                          {paymentMethod === 'gamepass' && (
                            <>
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
                            </>
                          )}

                          {/* PayPal Payment Flow */}
                          {paymentMethod === 'paypal' && (
                            <>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-bold text-blue-800 mb-2">
                                  {i18n.language === 'ar' ? 'تعليمات الدفع بـ PayPal' : 'PayPal Payment Instructions'}
                                </h3>
                                <ol className="text-blue-700 text-sm space-y-2 list-decimal list-inside">
                                  <li>{i18n.language === 'ar' ? 'اضغط على زر "الدفع بـ PayPal" أدناه' : 'Click the "Pay with PayPal" button below'}</li>
                                  <li>{i18n.language === 'ar' ? 'ستفتح صفحة PayPal لإتمام الدفع' : 'PayPal page will open to complete payment'}</li>
                                  <li>{i18n.language === 'ar' ? 'بعد الدفع، سيتم تأكيد طلبك تلقائياً' : 'After payment, your order will be confirmed automatically'}</li>
                                </ol>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-600">{i18n.language === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}</span>
                                  <span className="text-2xl font-bold text-gray-800">${finalTotal.toFixed(2)} {settings?.paypalCurrency || 'USD'}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {i18n.language === 'ar' 
                                    ? `سيتم إرسال الدفع إلى: ${settings?.paypalBusinessEmail || 'غير محدد'}`
                                    : `Payment will be sent to: ${settings?.paypalBusinessEmail || 'Not configured'}`}
                                </p>
                              </div>

                              {paypalInvoiceUrl ? (
                                <a
                                  href={paypalInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-center hover:bg-blue-700 transition-colors"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <CreditCard size={24} />
                                    {i18n.language === 'ar' ? 'فتح رابط الدفع PayPal' : 'Open PayPal Payment Link'}
                                  </div>
                                </a>
                              ) : (
                                <button
                                  onClick={handlePayPalOrder}
                                  disabled={orderStatus === 'processing' || !robloxUsername || !email || !settings?.paypalBusinessEmail}
                                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <CreditCard size={24} />
                                    {orderStatus === 'processing' 
                                      ? (i18n.language === 'ar' ? 'جاري إنشاء الفاتورة...' : 'Creating Invoice...')
                                      : (i18n.language === 'ar' ? 'الدفع بـ PayPal' : 'Pay with PayPal')}
                                  </div>
                                </button>
                              )}

                              {!settings?.paypalBusinessEmail && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-red-800 text-sm">
                                    {i18n.language === 'ar' 
                                      ? '⚠️ الدفع بـ PayPal غير متاح حالياً - يرجى التواصل مع الإدارة' 
                                      : '⚠️ PayPal payment is not available - please contact admin'}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
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

                        {/* Subtotal */}
                        <div className="flex justify-between text-gray-600 mb-2">
                          <span>{i18n.language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                          <span>${total.toFixed(2)}</span>
                        </div>

                        {/* Discount if applied */}
                        {appliedCoupon && (
                          <div className="flex justify-between text-green-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Tag size={16} />
                              {i18n.language === 'ar' ? 'الخصم' : 'Discount'} ({appliedCoupon.code})
                            </span>
                            <span>-${appliedCoupon.discount.toFixed(2)}</span>
                          </div>
                        )}

                        <hr className="my-2" />

                        {/* Final Total */}
                        <div className="flex justify-between text-xl font-bold text-gray-800">
                          <span>{t('cart.total')}</span>
                          <span className={appliedCoupon ? 'text-green-600' : ''}>${finalTotal.toFixed(2)}</span>
                        </div>

                        {appliedCoupon && (
                          <p className="text-xs text-green-600 mt-2 text-center">
                            {i18n.language === 'ar' 
                              ? `🎉 وفرت $${appliedCoupon.discount.toFixed(2)}!` 
                              : `🎉 You saved $${appliedCoupon.discount.toFixed(2)}!`}
                          </p>
                        )}
                      </div>
                    </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
