# Proyecto Expo + Gradle

Este proyecto utiliza React Native con Expo y soporte para compilación nativa usando Gradle. Es ideal para desarrollo en Android con acceso a funcionalidades nativas.

---

## Requisitos Previos

Antes de comenzar, asegúrese de tener lo siguiente instalado:

- [Node.js](https://nodejs.org/) (recomendado: LTS)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)  
  ```bash
  npm install -g expo-cli
  ```
- [Android Studio](https://developer.android.com/studio) con:
  - SDK de Android 33 o superior
  - Emulador o dispositivo físico conectado
  - Gradle instalado automáticamente al abrir un proyecto nativo
- Modo desarrollador habilitado en el dispositivo Android

---

## Instalación

1. Clonar este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repo.git
   cd tu-repo
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

---

## Ejecución del Proyecto

### Opción 1: Usando emulador o dispositivo físico con Gradle

```bash
npx expo run:android --device
```

Este comando compila y ejecuta la aplicación de forma nativa usando Gradle.

### Opción 2: Usando Metro Bundler

```bash
npx expo start
```

Este comando abre el navegador con herramientas de desarrollo. Se puede escanear el código QR con la aplicación Expo Go si no se requiere compilación nativa.

---

## Problemas Comunes

- Si no se detecta el dispositivo:
  - Verificar que la depuración USB esté activada.
  - Usar `adb devices` para confirmar que el dispositivo está visible.

- Si ocurre un error con Gradle:
  - Abrir el proyecto al menos una vez con Android Studio.
  - Ejecutar `cd android && ./gradlew clean` para limpiar el proyecto.

---

## Estructura Básica del Proyecto

```plaintext
Proyecto2-IC6821/
├── App.js
├── package.json
├── android/
└── ...
```

