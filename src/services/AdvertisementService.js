import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

class AdvertisementService {
  constructor() {
    this.listeners = [];
    this.activeAds = [];
    this.currentListener = null;
  }
  
  startListening(callback) {
    this.stopListening();
    
    const q = query(
      collection(db, 'advertisements'),
      where('active', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    this.currentListener = onSnapshot(q, (querySnapshot) => {
      const ads = [];
      querySnapshot.forEach((doc) => {
        ads.push({ ...doc.data(), id: doc.id, isAdvertisement: true });
      });
      
      this.activeAds = ads;
      callback(ads);
    });
    
    this.listeners.push(callback);
    
    return () => this.stopListening(callback);
  }
  
  stopListening(callback = null) {
    if (callback) {
      this.listeners = this.listeners.filter(cb => cb !== callback);
      
      if (this.listeners.length === 0 && this.currentListener) {
        this.currentListener();
        this.currentListener = null;
      }
    } else if (this.currentListener) {
      this.currentListener();
      this.currentListener = null;
      this.listeners = [];
    }
  }
  
  getRandomAdvertisement() {
    if (this.activeAds.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.activeAds.length);
    return this.activeAds[randomIndex];
  }
  
  shouldShowAdvertisement(lastShownTime) {
    if (this.activeAds.length === 0) return false;
    
    if (!lastShownTime) return true;
    
    const now = Timestamp.now().toMillis();
    const lastShown = lastShownTime.toMillis ? lastShownTime.toMillis() : lastShownTime;
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    return (now - lastShown) >= fiveMinutesInMs;
  }
}

const advertisementService = new AdvertisementService();
export default advertisementService;
