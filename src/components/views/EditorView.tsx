import { type RefObject, type PointerEvent as ReactPointerEvent, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';

import Editor from '../panel/Editor';
import BottomBar from '../panel/BottomBar';
import Resizer from '../ui/Resizer';
import { MobilePanelSwitcher } from '../panel/PanelSwitcher';
import MobileDrawer from '../panel/MobileDrawer';
import { useContainerSize } from '../../hooks/useContainerSize';

import { useEditorStore } from '../../store/useEditorStore';
import { isFilmstripDocked, useUIStore } from '../../store/useUIStore';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useProcessStore } from '../../store/useProcessStore';
import { getImageFlag } from '../../utils/imageFlags';

import { ImageFile } from '../../types/library';
import { Orientation, Panel } from '../../types/ui';
import { ThumbnailAspectRatio } from '../../types/settings';

interface EditorViewProps {
  transformWrapperRef: RefObject<any>;
  isResizing: boolean;
  layoutMode: 'compact' | 'wide' | 'full';
  isAndroid: boolean;
  compactEditorPanelHeight: number;
  compactEditorPanelCollapsedHeight: number;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  sortedImageList: ImageFile[];
  createResizeHandler: (stateKey: string, startSize: number) => (e: ReactPointerEvent<HTMLDivElement>) => void;
  createResizeResetHandler: (stateKey: string) => () => void;
  handleBackToLibrary: () => void;
  handleEditorContextMenu: (...args: any) => void;
  handleThumbnailContextMenu: (...args: any) => void;
  handleMainLibraryContextMenu?: (...args: any) => void;
  handleImageClick: (...args: any) => void;
  handleClearSelection: () => void;
  handleCopyAdjustments: () => void;
  handlePasteAdjustments: () => void;
  handleRate: (...args: any) => void;
  handleZoomChange: (zoom: number) => void;
  handlePanelSelect: (panelId: any) => void;
  requestThumbnails: any;
  renderAppPanel: (panelId: any) => React.ReactNode;
}

function FilmstripDropzone({ height }: { height: number }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'layout-bottom', data: { type: 'layout-bottom' } });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx(
        'absolute inset-x-0 bottom-0 z-30 rounded-lg border-2 flex items-center justify-center transition-all duration-200 backdrop-blur-sm overflow-hidden',
        isOver
          ? 'scale-[0.98] border-transparent bg-accent/20 text-accent font-semibold'
          : 'border-dashed border-accent/40 bg-bg-secondary/60 text-text-secondary',
      )}
      style={{ height }}
    >
      <span className="text-xs uppercase tracking-wider pointer-events-none">
        {t('editor.switcher.tooltips.filmstrip')}
      </span>
    </motion.div>
  );
}

export default function EditorView({
  transformWrapperRef,
  isResizing,
  layoutMode,
  isAndroid,
  compactEditorPanelHeight,
  compactEditorPanelCollapsedHeight,
  thumbnailAspectRatio,
  sortedImageList,
  createResizeHandler,
  createResizeResetHandler,
  handleBackToLibrary,
  handleEditorContextMenu,
  handleThumbnailContextMenu,
  handleMainLibraryContextMenu,
  handleImageClick,
  handleClearSelection,
  handleCopyAdjustments,
  handlePasteAdjustments,
  handleRate,
  handleZoomChange,
  handlePanelSelect,
  requestThumbnails,
  renderAppPanel,
}: EditorViewProps) {
  const { selectedImage } = useEditorStore(
    useShallow((state) => ({
      selectedImage: state.selectedImage,
    })),
  );

  const {
    isFullScreen,
    isInstantTransition,
    uiVisibility,
    bottomPanelHeight,
    activePanel,
    isFilmstripInSidePanel,
    isDraggingFilmstrip,
    setUI,
  } = useUIStore(
    useShallow((state) => ({
      isFullScreen: state.isFullScreen,
      isInstantTransition: state.isInstantTransition,
      uiVisibility: state.uiVisibility,
      bottomPanelHeight: state.bottomPanelHeight,
      activePanel: state.activePanel,
      isFilmstripInSidePanel: layoutMode === 'full' && isFilmstripDocked(state),
      isDraggingFilmstrip: state.activeLayoutDragItem === Panel.Filmstrip,
      setUI: state.setUI,
    })),
  );

  const { multiSelectedPaths, imageRatings, flag, isViewLoading } = useLibraryStore(
    useShallow((state) => ({
      multiSelectedPaths: state.multiSelectedPaths,
      imageRatings: state.imageRatings,
      flag: getImageFlag(state.imageList, selectedImage?.path),
      isViewLoading: state.isViewLoading,
    })),
  );

  const { isCopied, isPasted } = useProcessStore(
    useShallow((state) => ({
      isCopied: state.isCopied,
      isPasted: state.isPasted,
    })),
  );

  const editorNode = (
    <Editor
      onBackToLibrary={handleBackToLibrary}
      onContextMenu={handleEditorContextMenu}
      onImageSelect={handleImageClick}
      transformWrapperRef={transformWrapperRef}
    />
  );

  const editorBottomBarComponent = (
    <BottomBar
      filmstripHeight={bottomPanelHeight}
      imageList={sortedImageList}
      imageRatings={imageRatings}
      isCopied={isCopied}
      isCopyDisabled={!selectedImage}
      isFilmstripVisible={uiVisibility.filmstrip}
      isLoading={isViewLoading}
      isPasted={isPasted}
      isPasteDisabled={useEditorStore.getState().copiedAdjustments === null}
      isRatingDisabled={!selectedImage}
      isResizing={isResizing}
      multiSelectedPaths={multiSelectedPaths}
      onClearSelection={handleClearSelection}
      onContextMenu={handleThumbnailContextMenu}
      onEmptyAreaContextMenu={handleMainLibraryContextMenu}
      onCopy={handleCopyAdjustments}
      onOpenCopyPasteSettings={() => setUI({ isCopyPasteSettingsModalOpen: true })}
      onImageSelect={handleImageClick}
      onPaste={() => handlePasteAdjustments()}
      onRate={handleRate}
      onRequestThumbnails={requestThumbnails}
      onZoomChange={handleZoomChange}
      rating={imageRatings[selectedImage?.path || ''] || 0}
      flag={flag}
      selectedImage={selectedImage ?? undefined}
      showFilmstrip={layoutMode !== 'compact'}
      layoutMode={layoutMode}
      showZoomControls={!isAndroid}
      thumbnailAspectRatio={thumbnailAspectRatio}
      totalImages={sortedImageList.length}
    />
  );

  const editorBottomBarNode = (
    <div
      className={clsx(
        'flex flex-col w-full overflow-hidden shrink-0',
        !isResizing && !isInstantTransition && 'transition-all duration-300 ease-in-out',
      )}
      style={{
        maxHeight: isFullScreen ? '0px' : '500px',
        opacity: isFullScreen ? 0 : 1,
      }}
    >
      {layoutMode !== 'compact' &&
        (isFilmstripInSidePanel ? (
          <div className="h-2 shrink-0" />
        ) : (
          <Resizer
            direction={Orientation.Horizontal}
            onMouseDown={createResizeHandler('bottom', bottomPanelHeight)}
            onDoubleClick={createResizeResetHandler('bottom')}
          />
        ))}
      {editorBottomBarComponent}
    </div>
  );

  const [canvasRef] = useContainerSize<HTMLDivElement>();
  const [rootRef, rootSize] = useContainerSize<HTMLDivElement>();
  const [drawerHeight, setDrawerHeight] = useState<number | null>(compactEditorPanelCollapsedHeight);
  const [drawerMinHeight, setDrawerMinHeight] = useState(compactEditorPanelCollapsedHeight);

  // Panel heights follow the tool's content, as the reference app's sheet does: a crop is short,
  // grading is tall. Collapsed, the sheet sits at the tool dock's height.
  const PANEL_PREFERRED_HEIGHT: Partial<Record<Panel, number>> = {
    [Panel.Crop]: 240,
    [Panel.Presets]: 320,
    [Panel.Adjustments]: Math.round(rootSize.height * 0.45),
    [Panel.Masks]: Math.round(rootSize.height * 0.48),
    [Panel.Ai]: 300,
    [Panel.Metadata]: 300,
    [Panel.Export]: 340,
    [Panel.FolderTree]: 320,
    [Panel.Tethering]: 280,
    [Panel.Filmstrip]: 180,
  };

  const drawerMaxHeight = Math.max(drawerMinHeight, Math.round(rootSize.height * 0.52));
  const drawerDefaultHeight = Math.min(
    drawerMaxHeight,
    Math.max(
      drawerMinHeight,
      (activePanel && PANEL_PREFERRED_HEIGHT[activePanel]) || Math.round(rootSize.height * 0.40),
    ),
  );
  const drawerHeightValue = Math.max(
    drawerMinHeight,
    Math.min(drawerHeight ?? drawerDefaultHeight, drawerMaxHeight),
  );
  const isDrawerCollapsed = drawerHeightValue <= drawerMinHeight + 1;

  useEffect(() => {
    if (layoutMode !== 'compact') return;
    const node = canvasRef.current;
    if (!node) return;

    const pointers = new Set<number>();
    const handlePointerDown = (event: PointerEvent) => {
      pointers.add(event.pointerId);
      if (pointers.size >= 2) setDrawerHeight(drawerMinHeight);
    };
    const handlePointerUp = (event: PointerEvent) => pointers.delete(event.pointerId);

    node.addEventListener('pointerdown', handlePointerDown, { capture: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      node.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [layoutMode, drawerMinHeight]);

  useEffect(() => {
    if (layoutMode !== 'compact' || isDrawerCollapsed) return;
    setDrawerHeight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, layoutMode]);

  const handleDrawerSnap = (height: number) => {
    if (height <= drawerMinHeight + 24) {
      setDrawerHeight(drawerMinHeight);
      return;
    }
    setDrawerHeight(Math.min(drawerMaxHeight, Math.max(drawerMinHeight, Math.round(height))));
  };

  const handleToggleDrawer = () => {
    setDrawerHeight(isDrawerCollapsed ? drawerDefaultHeight : drawerMinHeight);
  };

  const handleQuickPanelSelect = (panelId: Panel) => {
    handlePanelSelect(panelId);
    if (isDrawerCollapsed) {
      setDrawerHeight(drawerDefaultHeight);
    }
  };

  return (
    <div
      ref={rootRef}
      className={clsx(
        'flex grow h-full min-h-0',
        layoutMode === 'compact' ? 'relative flex-col' : 'flex-col',
      )}
    >
      <div
        ref={canvasRef}
        className={clsx('relative flex-1 flex flex-col min-w-0', layoutMode === 'compact' && 'min-h-0')}
      >
        {editorNode}
        <AnimatePresence>
          {isFilmstripInSidePanel && isDraggingFilmstrip && <FilmstripDropzone height={bottomPanelHeight} />}
        </AnimatePresence>
      </div>
      {layoutMode === 'compact' ? (
        <MobileDrawer
          height={drawerHeightValue}
          maxHeight={drawerMaxHeight}
          isCollapsed={isDrawerCollapsed}
          isHidden={isFullScreen}
          activePanel={activePanel}
          onHeightChange={setDrawerHeight}
          onSnap={handleDrawerSnap}
          onToggleCollapsed={handleToggleDrawer}
          onMinHeightChange={setDrawerMinHeight}
          renderPanel={renderAppPanel}
          switcher={
            <MobilePanelSwitcher activePanel={activePanel} onPanelSelect={handleQuickPanelSelect} />
          }
        />
      ) : (
        editorBottomBarNode
      )}
      {layoutMode === 'compact' && (
        <div className="pointer-events-none absolute bottom-1 right-1 z-40">
          <div className="pointer-events-auto overflow-hidden rounded-full bg-bg-secondary/92 shadow-lg">
            {editorBottomBarComponent}
          </div>
        </div>
      )}
    </div>
  );
}
