import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, CheckCircle, XCircle, MessageSquare, Trash2, User } from 'lucide-react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../../firebase/config';

interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  adminReply?: string;
  adminReplyAt?: string;
}

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
}

interface ReviewManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewManagementModal: React.FC<ReviewManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const reviewsRef = ref(database, 'reviews');
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsList = Object.entries(data).map(([id, review]) => ({
          id,
          ...(review as Omit<Review, 'id'>)
        }));
        reviewsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(reviewsList);
      } else {
        setReviews([]);
      }
      setLoading(false);
    });

    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsList = Object.entries(data).map(([id, product]) => ({
          id,
          ...(product as Omit<Product, 'id'>)
        }));
        setProducts(productsList);
      }
    });

    return () => {
      unsubscribeReviews();
      unsubscribeProducts();
    };
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? (isArabic ? product.name_ar : product.name_en) : productId;
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return !review.isApproved;
    if (filter === 'approved') return review.isApproved;
    return true;
  });

  const handleApprove = async (reviewId: string) => {
    try {
      await update(ref(database, `reviews/${reviewId}`), {
        isApproved: true
      });
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await update(ref(database, `reviews/${reviewId}`), {
        isApproved: false
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this review?')) {
      try {
        await remove(ref(database, `reviews/${reviewId}`));
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await update(ref(database, `reviews/${reviewId}`), {
        adminReply: replyText,
        adminReplyAt: new Date().toISOString()
      });
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error replying to review:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star size={24} />
            {isArabic ? 'إدارة التقييمات' : 'Review Management'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
              <p className="text-sm text-gray-500">{isArabic ? 'إجمالي التقييمات' : 'Total Reviews'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.isApproved).length}</p>
              <p className="text-sm text-gray-500">{isArabic ? 'معتمدة' : 'Approved'}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{reviews.filter(r => !r.isApproved).length}</p>
              <p className="text-sm text-gray-500">{isArabic ? 'معلقة' : 'Pending'}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'all', label_ar: 'الكل', label_en: 'All' },
              { id: 'pending', label_ar: 'معلقة', label_en: 'Pending' },
              { id: 'approved', label_ar: 'معتمدة', label_en: 'Approved' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isArabic ? f.label_ar : f.label_en}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star size={48} className="mx-auto mb-4 opacity-50" />
              <p>{isArabic ? 'لا توجد تقييمات' : 'No reviews yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white border rounded-lg p-4 ${review.isApproved ? 'border-green-200' : 'border-yellow-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{review.customerName}</p>
                          {review.isVerifiedPurchase && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                              {isArabic ? 'مشتري موثق' : 'Verified'}
                            </span>
                          )}
                          {!review.isApproved && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded">
                              {isArabic ? 'معلق' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{getProductName(review.productId)}</p>
                        <div className="mt-1">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!review.isApproved ? (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title={isArabic ? 'اعتماد' : 'Approve'}
                        >
                          <CheckCircle size={20} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                          title={isArabic ? 'إلغاء الاعتماد' : 'Unapprove'}
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplyingTo(review.id);
                          setReplyText(review.adminReply || '');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title={isArabic ? 'رد' : 'Reply'}
                      >
                        <MessageSquare size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title={isArabic ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-gray-700">{review.comment}</p>
                  
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {/* Admin Reply */}
                  {review.adminReply && replyingTo !== review.id && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        {isArabic ? 'رد الإدارة:' : 'Admin Reply:'}
                      </p>
                      <p className="text-sm text-blue-700">{review.adminReply}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === review.id && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={isArabic ? 'اكتب ردك...' : 'Write your reply...'}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          {isArabic ? 'إرسال' : 'Send'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewManagementModal;
