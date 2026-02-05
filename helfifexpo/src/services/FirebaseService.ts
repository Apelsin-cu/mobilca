import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types/Product';

const COLLECTION_NAME = 'products';

export const FirebaseService = {
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const productData = {
        ...product,
        addedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), productData);
      return { id: docRef.id, ...productData } as Product;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('expiryDate', 'asc'));
      const querySnapshot = await getDocs(q);
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), data);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async updateQuantity(id: string, quantity: number): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), { quantity });
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  },
};
