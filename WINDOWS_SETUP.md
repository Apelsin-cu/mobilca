# Установка и запуск ShelfLife на Windows

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск Metro bundler
```bash
npm start
```

### 3. Запуск на Android (в новом терминале)
```bash
npm run android
```

## Подробная инструкция

### Предварительные требования

1. **Node.js** (версия 16 или выше)
   - Скачайте с [nodejs.org](https://nodejs.org/)
   - Проверьте: `node --version`

2. **Java Development Kit (JDK) 11)**
   - Скачайте с [Oracle](https://www.oracle.com/java/technologies/downloads/)
   - Или используйте OpenJDK: [adoptium.net](https://adoptium.net/)
   - Проверьте: `java --version`

3. **Android Studio**
   - Скачайте с [developer.android.com](https://developer.android.com/studio)
   - Установите Android SDK (API Level 33 или выше)
   - Настройте переменные окружения:
     ```
     ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk
     ```
     Добавьте в PATH:
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\tools
     %ANDROID_HOME%\tools\bin
     ```

4. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

### Настройка Android

1. **Создайте виртуальное устройство:**
   - Откройте Android Studio
   - Tools → AVD Manager
   - Create Virtual Device
   - Выберите Pixel 4 или новее
   - API Level 33 или выше

2. **Запустите эмулятор:**
   - В AVD Manager нажмите "Play" на созданном устройстве

### Запуск приложения

1. **Убедитесь, что эмулятор запущен**

2. **Запустите Metro bundler:**
   ```bash
   npm start
   ```

3. **В новом терминале запустите приложение:**
   ```bash
   npm run android
   ```

## Возможные проблемы

### "SDK location not found"
**Решение:** Проверьте переменную окружения ANDROID_HOME:
```bash
echo %ANDROID_HOME%
```

### "Metro bundler not found"
**Решение:** Запустите Metro отдельно:
```bash
npx react-native start
```

### "Build failed"
**Решение:** Очистите кэш:
```bash
cd android
gradlew clean
cd ..
npx react-native run-android
```

### "Device not found"
**Решение:** 
- Убедитесь, что эмулятор запущен
- Проверьте список устройств: `adb devices`

## Тестирование приложения

1. **Добавьте тестовый продукт:**
   - Нажмите "Добавить продукт"
   - Нажмите на иконку сканера
   - Выберите тестовый штрих-код: `3017620422003` (Nutella)
   - Установите дату истечения срока
   - Сохраните

2. **Проверьте функциональность:**
   - Просмотр списка продуктов
   - Редактирование продукта
   - Настройки уведомлений
   - Статистика

## Структура проекта

```
├── src/
│   ├── screens/          # Экраны приложения
│   │   ├── HomeScreen.tsx
│   │   ├── AddProductScreen.tsx
│   │   ├── ProductListScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/         # API и сервисы
│   │   ├── OpenFoodFactsAPI.ts
│   │   ├── StorageService.ts
│   │   └── NotificationService.ts
│   ├── components/       # Компоненты
│   │   └── SimpleBarcodeScanner.tsx
│   └── types/           # TypeScript типы
│       └── Product.ts
├── App.tsx              # Главный компонент
├── package.json         # Зависимости
└── README.md           # Документация
```

## Основные функции

- ✅ **Добавление продуктов** - вручную или по штрих-коду
- ✅ **Поиск в Open Food Facts** - автоматическое заполнение данных
- ✅ **Управление сроками** - отслеживание истечения
- ✅ **Уведомления** - напоминания о сроках
- ✅ **Статистика** - обзор всех продуктов
- ✅ **Настройки** - персонализация

## Поддержка

Если возникли проблемы:
1. Проверьте, что все зависимости установлены
2. Убедитесь, что эмулятор Android запущен
3. Очистите кэш и перезапустите
4. Проверьте логи в Metro bundler

Удачной разработки! 🚀
