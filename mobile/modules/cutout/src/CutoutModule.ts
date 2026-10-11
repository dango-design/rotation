import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { CutResult, TextLine } from './Cutout.types';

declare class CutoutModule extends NativeModule<{}> {
  readonly isSupported: boolean;
  cutOutAsync(uri: string, maxSide: number, maxPieces: number): Promise<CutResult>;
  readTextAsync(uri: string, maxSide: number): Promise<TextLine[]>;
}

/** Missing in Expo Go, on Android and on the web: the app then keeps photos as they are. */
export default requireOptionalNativeModule<CutoutModule>('Cutout');
