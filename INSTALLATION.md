# Инструкция по установке и запуску ShelfLife

## Предварительные требования

### Для разработки на Android:
1. **Node.js** (версия 16 или выше)
   - Скачайте с [nodejs.org](https://nodejs.org/)
   - Проверьте установку: `node --version`

2. **Java Development Kit (JDK) 11**
   - Скачайте с [Oracle](https://www.oracle.com/java/technologies/downloads/) или используйте OpenJDK
   - Проверьте установку: `java --version`

3. **Android Studio**
   - Скачайте с [developer.android.com](https://developer.android.com/studio)
   - Установите Android SDK (API Level 33 или выше)
   - Настройте переменные окружения:
     - `ANDROID_HOME` - путь к Android SDK
     - Добавьте в PATH: `%ANDROID_HOME%\platform-tools` и `%ANDROID_HOME%\tools`

4. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

### Для разработки на iOS (только на macOS):
1. **Xcode** (версия 12 или выше)
   - Скачайте из App Store
   - Установите Xcode Command Line Tools: `xcode-select --install`

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## Установка проекта

1. **Клонируйте или скачайте проект**
   ```bash
   cd путь/к/проекту
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Для iOS (только на macOS):**
   ```bash
   cd ios && pod install && cd ..
   ```

## Настройка Android

1. **Создайте виртуальное устройство Android:**
   - Откройте Android Studio
   - Перейдите в AVD Manager
   - Создайте новое виртуальное устройство (рекомендуется Pixel 4 или новее)
   - Выберите API Level 33 или выше

2. **Запустите эмулятор Android**

3. **Запустите приложение:**
   ```bash
   npm run android
   ```

## Настройка iOS (только на macOS)

1. **Откройте проект в Xcode:**
   ```bash
   open ios/ShelfLife.xcworkspace
   ```

2. **Настройте команду разработки:**
   - Выберите вашу команду в разделе "Signing & Capabilities"
   - Убедитесь, что Bundle Identifier уникален

3. **Запустите приложение:**
   ```bash
   npm run ios
   ```

## Разрешения

### Android
Приложение требует следующие разрешения (уже настроены в `android/app/src/main/AndroidManifest.xml`):
- `CAMERA` - для сканирования штрих-кодов
- `VIBRATE` - для уведомлений
- `RECEIVE_BOOT_COMPLETED` - для уведомлений после перезагрузки

### iOS
Приложение требует следующие разрешения (уже настроены в `ios/ShelfLife/Info.plist`):
- `NSCameraUsageDescription` - для сканирования штрих-кодов
- `NSUserNotificationsUsageDescription` - для уведомлений

## Возможные проблемы и решения

### Проблема: "SDK location not found"
**Решение:** Убедитесь, что переменная окружения `ANDROID_HOME` настроена правильно.

### Проблема: "Metro bundler not found"
**Решение:** Запустите Metro bundler отдельно:
```bash
npx react-native start
```

### Проблема: "Build failed" на Android
**Решение:** Очистите кэш:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Проблема: "Pod install failed" на iOS
**Решение:** Обновите CocoaPods и очистите кэш:
```bash
sudo gem update cocoapods
cd ios
pod deintegrate
pod install
cd ..
```

### Проблема: Камера не работает
**Решение:** 
- Убедитесь, что разрешения на камеру предоставлены
- На физическом устройстве проверьте настройки приложения
- На эмуляторе убедитесь, что камера включена

## Тестирование

1. **Запустите приложение**
2. **Добавьте тестовый продукт:**
   - Нажмите "Добавить продукт"
   - Введите штрих-код: `3017620422003` (Nutella)
   - Или введите название продукта
   - Установите дату истечения срока
   - Сохраните

3. **Проверьте уведомления:**
   - Установите дату истечения на завтра
   - Включите уведомления в настройках
   - Проверьте, что уведомление приходит

## Сборка для продакшена

### Android APK:
```bash
cd android
./gradlew assembleRelease
```

### iOS (требует Apple Developer Account):
1. Откройте проект в Xcode
2. Выберите "Generic iOS Device"
3. Product → Archive
4. Следуйте инструкциям для загрузки в App Store

## Дополнительные ресурсы

- [React Native Documentation](https://reactnative.dev/)
- [Open Food Facts API](https://world.openfoodfacts.org/data)
- [React Navigation](https://reactnavigation.org/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
