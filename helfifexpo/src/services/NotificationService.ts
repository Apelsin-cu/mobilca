import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Product } from '../types/Product';
import { getDaysUntilExpiry, parseProductDate } from '../utils/productDate';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Уведомления работают только на реальном устройстве');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Разрешение на уведомления не получено');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry-alerts', {
        name: 'Срок годности',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: 'default',
      });
    }

    return true;
  }

  async sendImmediateNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null,
    });
  }

  async scheduleExpiryNotification(product: Product): Promise<string | null> {
    try {
      const expiryDate = this.parseExpiryDate(product.expiryDate);
      if (!expiryDate) return null;

      const now = new Date();
      const notifications: string[] = [];

      const oneDayBefore = new Date(expiryDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      oneDayBefore.setHours(9, 0, 0, 0);

      const expiryDay = new Date(expiryDate);
      expiryDay.setHours(9, 0, 0, 0);

      const threeDaysBefore = new Date(expiryDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
      threeDaysBefore.setHours(9, 0, 0, 0);

      if (oneDayBefore > now) {
        const id1 = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Внимание! Скоро просрочится',
            body: `${product.name} просрочится завтра!${product.purchaseLocation ? ` (куплен в ${product.purchaseLocation})` : ''}`,
            sound: 'default',
            data: { productId: product.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: oneDayBefore,
          },
        });
        notifications.push(id1);
      }

      if (expiryDay > now) {
        const id2 = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Продукт просрочен!',
            body: `${product.name} просрочился сегодня!${product.purchaseLocation ? ` (куплен в ${product.purchaseLocation})` : ''}`,
            sound: 'default',
            data: { productId: product.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: expiryDay,
          },
        });
        notifications.push(id2);
      }

      if (threeDaysBefore > now) {
        const id3 = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Напоминание о сроке годности',
            body: `${product.name} просрочится через 3 дня${product.purchaseLocation ? ` (куплен в ${product.purchaseLocation})` : ''}`,
            sound: 'default',
            data: { productId: product.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: threeDaysBefore,
          },
        });
        notifications.push(id3);
      }

      console.log(`Запланировано ${notifications.length} уведомлений для ${product.name}`);
      return notifications[0] || null;
    } catch (error) {
      console.error('Ошибка планирования уведомления:', error);
      return null;
    }
  }

  private parseExpiryDate(dateStr: string): Date | null {
    return parseProductDate(dateStr);
  }

  async cancelProductNotifications(productId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.productId === productId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async checkExpiredProducts(products: Product[]): Promise<void> {
    const now = new Date();

    for (const product of products) {
      const expiryDate = this.parseExpiryDate(product.expiryDate);
      if (!expiryDate) continue;

      const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate, now);

      if (daysUntilExpiry <= 0) {
        await this.sendImmediateNotification(
          'Просроченный продукт!',
          `${product.name} уже просрочен!${product.purchaseLocation ? ` (куплен в ${product.purchaseLocation})` : ''}`
        );
      } else if (daysUntilExpiry === 1) {
        await this.sendImmediateNotification(
          'Срочно использовать!',
          `${product.name} просрочится завтра!${product.purchaseLocation ? ` (куплен в ${product.purchaseLocation})` : ''}`
        );
      }
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default NotificationService.getInstance();
