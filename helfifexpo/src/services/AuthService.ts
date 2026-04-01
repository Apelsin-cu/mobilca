import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  private authReadyPromise: Promise<User>;

  constructor() {
    this.authReadyPromise = this.createSession();
  }

  private createSession(): Promise<User> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
            return;
          }

          try {
            const credentials = await signInAnonymously(auth);
            unsubscribe();
            resolve(credentials.user);
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
  }

  async ensureAnonymousSession(): Promise<User> {
    return this.authReadyPromise;
  }

  async getCurrentUserId(): Promise<string> {
    const user = await this.ensureAnonymousSession();
    return user.uid;
  }
}

export default new AuthService();
