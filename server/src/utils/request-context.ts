import { AsyncLocalStorage } from 'async_hooks';

interface UploadContext {
  userId?: number;
}

export const uploadContext = new AsyncLocalStorage<UploadContext>();

export const getUploadUserId = (): number | undefined => {
  return uploadContext.getStore()?.userId;
};
