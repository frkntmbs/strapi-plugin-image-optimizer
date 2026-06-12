import React, { useEffect, useSyncExternalStore, type MouseEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Typography,
} from '@strapi/design-system';
import { Cross, Sparkle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { AssetOptimizationLabel } from './AssetOptimizationLabel';
import { OptimizationChoicePicker } from './OptimizationChoicePicker';
import { OptimizationCustomForm } from './OptimizationCustomForm';
import { getTranslationKey } from '../pluginId';
import {
  closeAssetEditor,
  createCustomForAsset,
  createCustomFromGlobal,
  getAssetPreference,
  getDraftPreference,
  getEditingAssetId,
  getUploadAssetCards,
  getUploadDialogElement,
  isPreferenceCustomized,
  openAssetEditor,
  saveAssetEditor,
  setDraftChoice,
  setDraftCustom,
  subscribeUploadAssets,
} from '../utils/uploadAssetStore';

const stopEventPropagation = (event: MouseEvent | PointerEvent) => {
  event.stopPropagation();
};

export const UploadEnhancerBridge = () => {
  const { formatMessage } = useIntl();
  const cards = useSyncExternalStore(subscribeUploadAssets, getUploadAssetCards);
  const editingAssetId = useSyncExternalStore(subscribeUploadAssets, getEditingAssetId);
  const draftPreference = useSyncExternalStore(subscribeUploadAssets, getDraftPreference);
  const dialogElement = useSyncExternalStore(subscribeUploadAssets, getUploadDialogElement);

  const editingCard = cards.find((card) => card.assetId === editingAssetId);

  useEffect(() => {
    if (!dialogElement || !editingAssetId) {
      return;
    }

    const previousOverflow = dialogElement.style.overflow;
    dialogElement.style.overflow = 'visible';

    return () => {
      dialogElement.style.overflow = previousOverflow;
    };
  }, [dialogElement, editingAssetId]);

  const editorPanel =
    editingAssetId && dialogElement ? (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{ zIndex: 10, pointerEvents: 'auto' }}
        onPointerDown={stopEventPropagation}
        onMouseDown={stopEventPropagation}
        onClick={stopEventPropagation}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background="neutral800"
          style={{ opacity: 0.2 }}
          onClick={closeAssetEditor}
        />

        <Flex
          direction="column"
          alignItems="stretch"
          background="neutral0"
          hasRadius
          shadow="popupShadow"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(520px, calc(100% - 32px))',
            maxHeight: 'min(90vh, 640px)',
            overflow: 'hidden',
            zIndex: 11,
          }}
        >
          <Flex
            tag="header"
            padding={4}
            paddingLeft={5}
            paddingRight={5}
            background="neutral100"
            justifyContent="space-between"
            alignItems="center"
            borderColor="neutral150"
            borderWidth="0 0 1px"
            borderStyle="solid"
          >
            <Typography variant="omega" fontWeight="bold" textColor="neutral800">
              {formatMessage({ id: getTranslationKey('upload.modal.title') })}
            </Typography>
            <IconButton
              label={formatMessage({ id: getTranslationKey('upload.modal.cancel') })}
              onClick={closeAssetEditor}
            >
              <Cross />
            </IconButton>
          </Flex>

          <Box padding={7} style={{ overflow: 'auto' }}>
            <Flex direction="column" alignItems="stretch" gap={5}>
              {editingCard?.assetName && (
                <Typography variant="pi" textColor="neutral600">
                  {editingCard.assetName}
                </Typography>
              )}
              <OptimizationChoicePicker
                value={draftPreference.choice}
                onChange={setDraftChoice}
              />
              {draftPreference.choice === 'custom' && (
                <Box background="neutral100" padding={5} hasRadius>
                  <OptimizationCustomForm
                    value={
                      draftPreference.custom ??
                      (editingAssetId ? createCustomForAsset(editingAssetId) : createCustomFromGlobal())
                    }
                    onChange={setDraftCustom}
                    assetName={editingCard?.assetName}
                    sourceWidth={editingCard?.width}
                    sourceHeight={editingCard?.height}
                  />
                </Box>
              )}
            </Flex>
          </Box>

          <Flex
            tag="footer"
            gap={2}
            justifyContent="flex-end"
            padding={4}
            paddingLeft={5}
            paddingRight={5}
            background="neutral100"
            borderColor="neutral150"
            borderWidth="1px 0 0"
            borderStyle="solid"
          >
            <Button onClick={closeAssetEditor} variant="tertiary">
              {formatMessage({ id: getTranslationKey('upload.modal.cancel') })}
            </Button>
            <Button onClick={saveAssetEditor}>
              {formatMessage({ id: getTranslationKey('upload.modal.save') })}
            </Button>
          </Flex>
        </Flex>
      </Box>
    ) : null;

  return (
    <>
      {cards.map((card) => (
        <React.Fragment key={card.assetId}>
          {createPortal(
            <IconButton
              label={formatMessage({ id: getTranslationKey('upload.button.label') })}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openAssetEditor(card.assetId);
              }}
              variant={isPreferenceCustomized(card.assetId) ? 'default' : 'ghost'}
            >
              <Sparkle />
            </IconButton>,
            card.actionsContainer
          )}

          {card.footerHost
            ? createPortal(
                <AssetOptimizationLabel preference={getAssetPreference(card.assetId)} />,
                card.footerHost
              )
            : null}
        </React.Fragment>
      ))}

      {editorPanel ? createPortal(editorPanel, dialogElement) : null}
    </>
  );
};
