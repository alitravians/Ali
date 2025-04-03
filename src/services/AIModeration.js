import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

class AIModeration {
  static async checkContent(content, userId) {
    try {
      
      const inappropriateResult = this.checkInappropriateContent(content);
      
      const isRepeated = await this.checkRepeatedMessages(content, userId);
      
      const moderationRecord = {
        content,
        userId,
        timestamp: serverTimestamp(),
        verdict: inappropriateResult.isInappropriate || isRepeated ? 'inappropriate' : 'appropriate',
        confidence: inappropriateResult.confidence || 0.9,
        categories: inappropriateResult.categories || [],
        isRepeated,
        action: 'none'
      };
      
      if (inappropriateResult.isInappropriate || isRepeated) {
        const action = await this.determineAction(userId, inappropriateResult.categories || []);
        moderationRecord.action = action;
        
        await addDoc(collection(db, 'AIModeration'), moderationRecord);
        
        return {
          isAllowed: false,
          action,
          reason: isRepeated ? 'repeated' : inappropriateResult.categories[0]
        };
      }
      
      await addDoc(collection(db, 'AIModeration'), moderationRecord);
      
      return {
        isAllowed: true,
        action: 'none',
        reason: null
      };
    } catch (error) {
      console.error('AI Moderation error:', error);
      return {
        isAllowed: true,
        action: 'none',
        reason: null
      };
    }
  }
  
  static checkInappropriateContent(content) {
    
    const lowerContent = content.toLowerCase();
    
    const categories = {
      hateSpeech: ['hate', 'racist', 'discrimination', 'العنصرية', 'الكراهية', 'التمييز'],
      harassment: ['bully', 'harass', 'threaten', 'التنمر', 'التحرش', 'التهديد'],
      explicitContent: ['explicit', 'nude', 'sexual', 'صريح', 'عاري', 'جنسي'],
      spam: ['spam', 'advertise', 'buy now', 'سبام', 'إعلان', 'اشتري الآن'],
      religion: ['religion', 'god', 'prophet', 'الدين', 'الله', 'النبي'],
      politics: ['politics', 'president', 'minister', 'السياسة', 'الرئيس', 'الوزير'],
      insults: ['stupid', 'idiot', 'dumb', 'غبي', 'أحمق', 'غباء']
    };
    
    const detectedCategories = [];
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        detectedCategories.push(category);
      }
    }
    
    return {
      isInappropriate: detectedCategories.length > 0,
      categories: detectedCategories,
      confidence: detectedCategories.length > 0 ? 0.8 : 0.2
    };
  }
  
  static async checkRepeatedMessages(content, userId) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('sender', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const recentMessages = [];
      
      querySnapshot.forEach((doc) => {
        recentMessages.push(doc.data().content);
      });
      
      return recentMessages.includes(content);
    } catch (error) {
      console.error('Error checking repeated messages:', error);
      return false;
    }
  }
  
  static async determineAction(userId, categories) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return 'none';
      }
      
      const userData = userDoc.data();
      
      const q = query(
        collection(db, 'AIModeration'),
        where('userId', '==', userId),
        where('verdict', '==', 'inappropriate'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const violations = [];
      
      querySnapshot.forEach((doc) => {
        violations.push(doc.data());
      });
      
      let banDuration = 10; // Default 10 minutes
      
      if (violations.length >= 5) {
        banDuration = 60; // 1 hour
      } else if (violations.length >= 3) {
        banDuration = 30; // 30 minutes
      }
      
      const severeCategories = ['hateSpeech', 'explicitContent', 'religion', 'politics'];
      if (categories.some(category => severeCategories.includes(category))) {
        banDuration *= 2;
      }
      
      if (banDuration > 0) {
        const banExpiresAt = new Date();
        banExpiresAt.setMinutes(banExpiresAt.getMinutes() + banDuration);
        
        const banInfo = {
          reason: categories.length > 0 ? `Violation: ${categories.join(', ')}` : 'Repeated messages',
          duration: banDuration,
          bannedBy: 'system',
          bannedAt: serverTimestamp(),
          expiresAt: banExpiresAt
        };
        
        await updateDoc(doc(db, 'users', userId), {
          status: 'banned',
          banInfo
        });
        
        return 'ban';
      }
      
      return 'warn';
    } catch (error) {
      console.error('Error determining action:', error);
      return 'none';
    }
  }
  
  static async validateBan(banId) {
    try {
      const appealDoc = await getDoc(doc(db, 'banAppeals', banId));
      
      if (!appealDoc.exists()) {
        return {
          isValid: true,
          confidence: 0.9,
          reason: 'No appeal found'
        };
      }
      
      const appealData = appealDoc.data();
      
      const q = query(
        collection(db, 'AIModeration'),
        where('userId', '==', appealData.userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const moderationRecords = [];
      
      querySnapshot.forEach((doc) => {
        moderationRecords.push(doc.data());
      });
      
      const inappropriateCount = moderationRecords.filter(record => 
        record.verdict === 'inappropriate'
      ).length;
      
      const appropriateCount = moderationRecords.length - inappropriateCount;
      
      if (inappropriateCount <= 2 && appropriateCount > 10) {
        return {
          isValid: false,
          confidence: 0.7,
          reason: 'User has mostly appropriate messages'
        };
      }
      
      if (inappropriateCount >= 3) {
        return {
          isValid: true,
          confidence: 0.8,
          reason: `User has ${inappropriateCount} violations`
        };
      }
      
      return {
        isValid: true,
        confidence: 0.6,
        reason: 'Insufficient data to determine'
      };
    } catch (error) {
      console.error('Error validating ban:', error);
      return {
        isValid: true,
        confidence: 0.5,
        reason: 'Error during validation'
      };
    }
  }
}

export default AIModeration;
