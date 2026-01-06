import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { useCustomerAuth } from './CustomerAuthContext';

export interface Review {
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

interface ReviewContextType {
  reviews: Review[];
  loading: boolean;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  canReview: (productId: string) => boolean;
  hasReviewed: (productId: string) => boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};

interface ReviewProviderProps {
  children: ReactNode;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { customer } = useCustomerAuth();

  useEffect(() => {
    const reviewsRef = ref(database, 'reviews');
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsList = Object.entries(data).map(([id, review]) => ({
          id,
          ...(review as Omit<Review, 'id'>)
        }));
        // Sort by createdAt descending
        reviewsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(reviewsList);
      } else {
        setReviews([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getProductReviews = (productId: string) => {
    return reviews.filter(r => r.productId === productId && r.isApproved);
  };

  const getProductRating = (productId: string) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / productReviews.length) * 10) / 10,
      count: productReviews.length
    };
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!customer) throw new Error('Must be logged in to review');
    
    try {
      const newReview = {
        productId,
        customerId: customer.id,
        customerName: customer.username,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        isVerifiedPurchase: true, // TODO: Check if customer actually purchased
        isApproved: true // Auto-approve for now
      };
      await push(ref(database, 'reviews'), newReview);
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  };

  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    try {
      await update(ref(database, `reviews/${reviewId}`), updates);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await remove(ref(database, `reviews/${reviewId}`));
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };

  const canReview = (productId: string) => {
    if (!customer) return false;
    // TODO: Check if customer has purchased this product
    return !hasReviewed(productId);
  };

  const hasReviewed = (productId: string) => {
    if (!customer) return false;
    return reviews.some(r => r.productId === productId && r.customerId === customer.id);
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      loading,
      getProductReviews,
      getProductRating,
      addReview,
      updateReview,
      deleteReview,
      canReview,
      hasReviewed
    }}>
      {children}
    </ReviewContext.Provider>
  );
};
