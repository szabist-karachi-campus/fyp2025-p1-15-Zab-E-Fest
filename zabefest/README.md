# Zabefest App

Event based University application

## Getting Started

This project is a Flutter application that connects to a backend API. Follow these steps to set up and run the application:

### Prerequisites

- Flutter SDK (latest stable version)
- Dart SDK
- Android Studio / VS Code with Flutter extensions
- A running backend server

### Configuration

#### API Configuration

The app needs to know the location of your backend API server. By default:
- For web deployment: Uses `localhost:5000`
- For mobile (Android emulator): Uses `10.0.2.2:5000`

You can override these defaults by setting the `API_HOST` environment variable:

```bash
# For Windows
set API_HOST=your-api-host:port
flutter run

# For Unix/Linux/Mac
export API_HOST=your-api-host:port
flutter run
```

For production deployment, make sure to set the appropriate API host:
```bash
flutter run --dart-define=API_HOST=your-production-api-host
```

### Running the App

1. Clone the repository
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Run the app:
   ```bash
   # For web
   flutter run -d chrome

   # For Android emulator
   flutter run -d android

   # For iOS simulator
   flutter run -d ios
   ```

### Development Resources

For help getting started with Flutter development:
- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)
- [Online documentation](https://docs.flutter.dev/)