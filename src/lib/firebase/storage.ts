import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { app } from './config';

export const storage = getStorage(app);

// Helper to upload user avatar or habit attachment
export const uploadUserFile = async (
  userId: string,
  path: string,
  file: Blob | Uint8Array | ArrayBuffer
): Promise<string> => {
  const fileRef = ref(storage, `users/${userId}/${path}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export { ref, uploadBytes, getDownloadURL, deleteObject };
