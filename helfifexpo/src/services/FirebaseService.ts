import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AuthService from './AuthService';
import { Product } from '../types/Product';
import { GeneratedRecipeSet } from '../types/GeneratedRecipe';
import { normalizeExpiryDate, parseProductDate } from '../utils/productDate';

const COLLECTION_NAME = 'products';
const GENERATED_RECIPE_COLLECTION_NAME = 'generatedRecipeSets';

const getProductsCollection = async () => {
  const uid = await AuthService.getCurrentUserId();
  return collection(db, 'users', uid, COLLECTION_NAME);
};

const getProductDocument = async (id: string) => {
  const uid = await AuthService.getCurrentUserId();
  return doc(db, 'users', uid, COLLECTION_NAME, id);
};

const getGeneratedRecipeDocument = async (cacheKey: string) => {
  const uid = await AuthService.getCurrentUserId();
  return doc(db, 'users', uid, GENERATED_RECIPE_COLLECTION_NAME, cacheKey);
};

export const FirebaseService = {
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const productsCollection = await getProductsCollection();
      const productData = {
        ...product,
        expiryDate: normalizeExpiryDate(product.expiryDate),
        manufactureDate: normalizeExpiryDate(product.manufactureDate),
        addedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(productsCollection, productData);
      return { id: docRef.id, ...productData } as Product;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const productsCollection = await getProductsCollection();
      const querySnapshot = await getDocs(productsCollection);
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Product, 'id'>;
        products.push({
          id: doc.id,
          ...data,
          expiryDate: normalizeExpiryDate(data.expiryDate),
          manufactureDate: normalizeExpiryDate(data.manufactureDate),
        } as Product);
      });
      return products.sort((first, second) => {
        const firstDate =
          parseProductDate(first.expiryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const secondDate =
          parseProductDate(second.expiryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        if (firstDate !== secondDate) {
          return firstDate - secondDate;
        }

        return (first.addedAt || '').localeCompare(second.addedAt || '');
      });
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const productDocument = await getProductDocument(id);
      await deleteDoc(productDocument);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    try {
      const productDocument = await getProductDocument(id);
      await updateDoc(productDocument, {
        ...data,
        expiryDate: data.expiryDate
          ? normalizeExpiryDate(data.expiryDate)
          : data.expiryDate,
        manufactureDate: data.manufactureDate
          ? normalizeExpiryDate(data.manufactureDate)
          : data.manufactureDate,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async updateQuantity(id: string, quantity: number): Promise<void> {
    try {
      const productDocument = await getProductDocument(id);
      await updateDoc(productDocument, { quantity });
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  },

  async getGeneratedRecipeSet(cacheKey: string): Promise<GeneratedRecipeSet | null> {
    try {
      const recipeDocument = await getGeneratedRecipeDocument(cacheKey);
      const snapshot = await getDoc(recipeDocument);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as GeneratedRecipeSet;
    } catch (error) {
      console.error('Error getting generated recipe set:', error);
      throw error;
    }
  },

  async saveGeneratedRecipeSet(recipeSet: GeneratedRecipeSet): Promise<void> {
    try {
      const recipeDocument = await getGeneratedRecipeDocument(recipeSet.cacheKey);
      await setDoc(recipeDocument, recipeSet);
    } catch (error) {
      console.error('Error saving generated recipe set:', error);
      throw error;
    }
  },
};
