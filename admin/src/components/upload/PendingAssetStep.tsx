import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  KeyboardNavigable,
  Modal,
  Typography,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { AssetCard } from '@strapi/upload/dist/admin/components/AssetCard/AssetCard.mjs';
import { UploadingAssetCard } from '@strapi/upload/dist/admin/components/AssetCard/UploadingAssetCard.mjs';
import { AssetType } from '@strapi/upload/dist/admin/enums.mjs';
import { useTracking } from '@strapi/upload/dist/admin/hooks/useTracking.mjs';
import { getTrad } from '@strapi/upload/dist/admin/utils/getTrad.mjs';
import { OptimizationModeSelectCompact } from '../OptimizationModeSelectCompact';
import { useDefaultOptimizationMode } from '../../hooks/useDefaultOptimizationMode';
import type { OptimizationMode } from '../../pluginId';

const Status = {
  Idle: 'IDLE',
  Uploading: 'UPLOADING',
  Intermediate: 'INTERMEDIATE',
} as const;

type UploadStatus = (typeof Status)[keyof typeof Status];

interface PendingAsset {
  url: string;
  name: string;
  mime?: string;
  type?: string;
  ext?: string;
  rawFile?: File;
  optimizationMode?: OptimizationMode;
  [key: string]: unknown;
}

interface PendingAssetStepProps {
  addUploadedFiles?: (files: unknown[]) => void;
  folderId?: number | string | null;
  onClose: () => void;
  onEditAsset: (asset: PendingAsset) => void;
  onRemoveAsset: (asset: PendingAsset) => void;
  assets: PendingAsset[];
  onClickAddAsset: () => void;
  onCancelUpload: (file?: File) => void;
  onUploadSucceed: (file?: File) => void;
  trackedLocation?: string;
  initialAssetsToAdd?: PendingAsset[];
}

const isImageAsset = (asset: PendingAsset) =>
  asset.type === AssetType.Image || asset.mime?.includes(AssetType.Image);

export const PendingAssetStep = ({
  addUploadedFiles,
  folderId = null,
  onClose,
  onEditAsset,
  onRemoveAsset,
  assets,
  onClickAddAsset,
  onCancelUpload,
  onUploadSucceed,
  trackedLocation,
}: PendingAssetStepProps) => {
  const assetCountRef = useRef(0);
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const { defaultMode } = useDefaultOptimizationMode();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(Status.Idle);
  const [optimizationModes, setOptimizationModes] = useState<Record<string, OptimizationMode>>({});

  const getOptimizationMode = useCallback(
    (asset: PendingAsset): OptimizationMode =>
      optimizationModes[asset.url] ?? asset.optimizationMode ?? defaultMode,
    [defaultMode, optimizationModes]
  );

  const assetsWithOptimization = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        optimizationMode: getOptimizationMode(asset),
      })),
    [assets, getOptimizationMode]
  );

  const handleOptimizationChange = (asset: PendingAsset, mode: OptimizationMode) => {
    setOptimizationModes((prev) => ({
      ...prev,
      [asset.url]: mode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const assetsCountByType = assets.reduce<Record<string, string>>((acc, asset) => {
      const { type } = asset;

      if (type !== undefined && !acc[type]) {
        acc[type] = '0';
      }

      if (type !== undefined) {
        const currentCount = acc[type];
        acc[type] = `${parseInt(currentCount, 10) + 1}`;
      }

      return acc;
    }, {});

    trackUsage('willAddMediaLibraryAssets', {
      location: trackedLocation,
      ...assetsCountByType,
    });

    setUploadStatus(Status.Uploading);
  };

  const handleStatusChange = (status: string, file?: File) => {
    if (status === 'success' || status === 'error') {
      assetCountRef.current += 1;

      if (assetCountRef.current === assets.length) {
        assetCountRef.current = 0;
        setUploadStatus(Status.Intermediate);
      }
    }

    if (status === 'success') {
      onUploadSucceed(file);
    }
  };

  const isUploading =
    uploadStatus === Status.Uploading || uploadStatus === Status.Intermediate;

  return (
    <Fragment>
      <Modal.Header>
        <Modal.Title>
          {formatMessage({
            id: getTrad('header.actions.add-assets'),
            defaultMessage: 'Add new assets',
          })}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Flex direction="column" alignItems="stretch" gap={7}>
          <Flex justifyContent="space-between">
            <Flex direction="column" alignItems="stretch" gap={0}>
              <Typography variant="pi" fontWeight="bold" textColor="neutral800">
                {formatMessage(
                  {
                    id: getTrad('list.assets.to-upload'),
                    defaultMessage:
                      '{number, plural, =0 {No asset} one {1 asset} other {# assets}} ready to upload',
                  },
                  { number: assets.length }
                )}
              </Typography>
              <Typography variant="pi" textColor="neutral600">
                {formatMessage({
                  id: getTrad('modal.upload-list.sub-header-subtitle'),
                  defaultMessage: 'Manage the assets before adding them to the Media Library',
                })}
              </Typography>
            </Flex>
            <Button size="S" onClick={onClickAddAsset}>
              {formatMessage({
                id: getTrad('header.actions.add-assets'),
                defaultMessage: 'Add new assets',
              })}
            </Button>
          </Flex>

          <KeyboardNavigable tagName="article">
            <Grid.Root gap={4}>
              {assetsWithOptimization.map((asset) => {
                const assetKey = asset.url;

                if (isUploading) {
                  return (
                    <Grid.Item
                      key={assetKey}
                      m={4}
                      s={6}
                      xs={12}
                      direction="column"
                      alignItems="stretch"
                    >
                      <UploadingAssetCard
                        addUploadedFiles={addUploadedFiles}
                        asset={asset}
                        id={assetKey}
                        onCancel={onCancelUpload}
                        onStatusChange={(status) => handleStatusChange(status, asset.rawFile)}
                        size="S"
                        folderId={folderId}
                      />
                    </Grid.Item>
                  );
                }

                return (
                  <Grid.Item key={assetKey} col={4} direction="column" alignItems="stretch">
                    <Flex direction="column" alignItems="stretch" gap={2}>
                      <AssetCard
                        asset={asset}
                        size="S"
                        local
                        alt={asset.name}
                        onEdit={onEditAsset}
                        onRemove={onRemoveAsset}
                      />
                      {isImageAsset(asset) && (
                        <Box paddingLeft={2} paddingRight={2} paddingBottom={2}>
                          <OptimizationModeSelectCompact
                            value={getOptimizationMode(asset)}
                            onChange={(mode) => handleOptimizationChange(asset, mode)}
                          />
                        </Box>
                      )}
                    </Flex>
                  </Grid.Item>
                );
              })}
            </Grid.Root>
          </KeyboardNavigable>
        </Flex>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onClose} variant="tertiary">
          {formatMessage({
            id: 'app.components.Button.cancel',
            defaultMessage: 'cancel',
          })}
        </Button>
        <Button onClick={handleSubmit} loading={uploadStatus === Status.Uploading}>
          {formatMessage(
            {
              id: getTrad('modal.upload-list.footer.button'),
              defaultMessage: 'Upload {number, plural, one {# asset} other {# assets}} to the library',
            },
            { number: assets.length }
          )}
        </Button>
      </Modal.Footer>
    </Fragment>
  );
};

export default PendingAssetStep;
