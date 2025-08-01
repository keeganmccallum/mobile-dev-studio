import { requireNativeModule, NativeModule } from 'expo-modules-core';

declare class ExpoTermuxModule extends NativeModule {
  test(): string;
  testAsync(): Promise<string>;
}

// This call loads the native module object from the JSI
export default requireNativeModule<ExpoTermuxModule>('ExpoTermux');