import * as React from 'react';
import { useFetchClient, adminApi } from '@strapi/strapi/admin';
import { useQueryClient, useMutation } from 'react-query';
import { useDispatch } from 'react-redux';
import type { OptimizationMode } from '../pluginId';

const UPLOAD_PLUGIN_ID = 'upload';
const endpoint = `/${UPLOAD_PLUGIN_ID}`;

interface UploadAsset {
  name?: string;
  caption?: string;
  alternativeText?: string;
  rawFile?: File;
  optimizationMode?: OptimizationMode;
}

const uploadAssets = (
  assets: UploadAsset | UploadAsset[],
  folderId: number | null,
  signal: AbortSignal,
  post: ReturnType<typeof useFetchClient>['post']
) => {
  const assetsArray = Array.isArray(assets) ? assets : [assets];
  const formData = new FormData();

  assetsArray.forEach((asset) => {
    if (asset.rawFile) {
      formData.append('files', asset.rawFile);
    }
  });

  assetsArray.forEach((asset) => {
    const fileInfo: Record<string, unknown> = {
      name: asset.name,
      caption: asset.caption,
      alternativeText: asset.alternativeText,
      folder: folderId,
    };

    if (asset.optimizationMode) {
      fileInfo.optimizationMode = asset.optimizationMode;
    }

    formData.append('fileInfo', JSON.stringify(fileInfo));
  });

  return post(endpoint, formData, { signal }).then((res) => res.data);
};

export const useUpload = () => {
  const dispatch = useDispatch();
  const [progress, setProgress] = React.useState(0);
  const queryClient = useQueryClient();
  const abortController = new AbortController();
  const signal = abortController.signal;
  const { post } = useFetchClient();

  const mutation = useMutation(
    ({ assets, folderId }: { assets: UploadAsset | UploadAsset[]; folderId: number | null }) => {
      return uploadAssets(assets, folderId, signal, post);
    },
    {
      onSuccess() {
        queryClient.refetchQueries([UPLOAD_PLUGIN_ID, 'assets'], { active: true });
        queryClient.refetchQueries([UPLOAD_PLUGIN_ID, 'asset-count'], { active: true });
        dispatch(adminApi.util.invalidateTags(['HomepageKeyStatistics', 'AiUsage']));
      },
    }
  );

  const upload = (assets: UploadAsset | UploadAsset[], folderId: number | null) =>
    mutation.mutateAsync({ assets, folderId });

  const cancel = () => abortController.abort();

  return {
    upload,
    isLoading: mutation.isLoading,
    cancel,
    error: mutation.error,
    progress,
    status: mutation.status,
  };
};
