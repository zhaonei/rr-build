import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Copy, ClipboardPaste, PencilSparkles, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../ui/CollapsibleSection';
import AdjustmentSection from '../../adjustments/AdjustmentSection';
import Resizer from '../../ui/Resizer';
import AdjustmentSectionsSubMenu from './AdjustmentSectionsSubMenu';
import {
  ActiveTools,
  Adjustments,
  ADJUSTMENT_SECTIONS,
  getActiveTools,
  getVisibleAdjustmentSections,
  isToolActive,
  setToolActive,
  toggleToolActive,
} from '../../../utils/adjustments';
import { useContextMenu } from '../../../context/ContextMenuContext';
import { OPTION_SEPARATOR, Orientation } from '../../../types/ui';
import Text from '../../ui/Text';
import { TextVariants, TextColors, TextWeights } from '../../../types/typography';
import { useShallow } from 'zustand/react/shallow';
import { canvasToolState, useEditorStore } from '../../../store/useEditorStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getOpenImageDefaults } from '../../../utils/developDefaults';
import { useUIStore } from '../../../store/useUIStore';
import { buildAutoAdjustModeOptions, useEditorActions } from '../../../hooks/useEditorActions';
import { useWaveformControls } from '../../../hooks/useWaveformControls';
import type { ParseKeys } from 'i18next';

const MOBILE_GROUP_ORDER = ['basic', 'color', 'curves', 'details', 'effects'];

function AdjustmentSectionContent(props: {
  sectionName: string;
  activeTools: ActiveTools;
  onToggleTool(id: string): void;
  [key: string]: unknown;
}) {
  const adjustments = useEditorStore((state) => state.adjustments);
  return <AdjustmentSection {...props} adjustments={adjustments} />;
}

export default function Controls({ mobileGrouped = false }: { mobileGrouped?: boolean }) {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { isResizingWaveform, onToggleWaveform, setActiveWaveformChannel, handleWaveformResize } =
    useWaveformControls();
  const { setAdjustments, handleAutoAdjustments, handleLutSelect } = useEditorActions();

  const { appSettings, theme } = useSettingsStore(
    useShallow((state) => ({
      appSettings: state.appSettings,
      theme: state.theme,
    })),
  );

  const visibleSections = getVisibleAdjustmentSections(appSettings?.adjustmentLayout);
  const mobileSections = useMemo(
    () => visibleSections.filter((section: string) => MOBILE_GROUP_ORDER.includes(section)),
    [visibleSections],
  );
  const [activeGroup, setActiveGroup] = useState<string>(MOBILE_GROUP_ORDER[0]);

  const { collapsibleSectionsState, setUI } = useUIStore(
    useShallow((state) => ({
      collapsibleSectionsState: state.collapsibleSectionsState,
      setUI: state.setUI,
    })),
  );

  const {
    activeToolsState,
    sectionVisibility,
    copiedSectionAdjustments,
    selectedImage,
    isWbPickerActive,
    isWaveformVisible,
    waveformHeight,
    setEditor,
  } = useEditorStore(
    useShallow((state) => ({
      activeToolsState: state.adjustments.activeTools,
      sectionVisibility: state.adjustments.sectionVisibility,
      copiedSectionAdjustments: state.copiedSectionAdjustments,
      selectedImage: state.selectedImage,
      isWbPickerActive: state.isWbPickerActive,
      isWaveformVisible: state.isWaveformVisible,
      waveformHeight: state.waveformHeight,
      setEditor: state.setEditor,
    })),
  );

  const activeTools = useMemo(
    () => getActiveTools({ activeTools: activeToolsState, sectionVisibility }),
    [activeToolsState, sectionVisibility],
  );

  const setCopiedSectionAdjustments = useCallback(
    (val: any) => setEditor({ copiedSectionAdjustments: val }),
    [setEditor],
  );

  const toggleWbPicker = useCallback(
    () => setEditor((state) => canvasToolState({ isWbPickerActive: !state.isWbPickerActive })),
    [setEditor],
  );

  const onDragStateChange = useCallback(
    (isDragging: boolean) => setEditor({ isSliderDragging: isDragging }),
    [setEditor],
  );

  const setCollapsibleState = useCallback(
    (updater: any) =>
      setUI((state) => ({
        collapsibleSectionsState: typeof updater === 'function' ? updater(state.collapsibleSectionsState) : updater,
      })),
    [setUI],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      setAdjustments((prev: Adjustments) => ({
        ...prev,
        activeTools: toggleToolActive(getActiveTools(prev), id),
      }));
    },
    [setAdjustments],
  );

  const handleResetAdjustments = async () => {
    const defaults = await getOpenImageDefaults();
    setAdjustments(
      (prev: Adjustments) => ({
        ...prev,
        ...Object.keys(ADJUSTMENT_SECTIONS)
          .flatMap((s) => ADJUSTMENT_SECTIONS[s])
          .reduce((acc: any, key: string) => {
            acc[key] = defaults[key as keyof Adjustments];
            return acc;
          }, {}),
        activeTools: { ...defaults.activeTools },
      }),
      t('contextMenus.editor.resetAdjustments'),
    );
  };

  const handleAutoAdjustContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, buildAutoAdjustModeOptions(t, handleAutoAdjustments));
  };

  const handleToggleSection = (section: string) => {
    setCollapsibleState((prev: any) => {
      const isOpening = !prev[section];
      if (appSettings?.enableFocusMode && isOpening) {
        const newState = { ...prev };
        Object.keys(newState).forEach((key) => {
          newState[key] = false;
        });
        newState[section] = true;
        return newState;
      }
      return { ...prev, [section]: !prev[section] };
    });
  };

  const renderedSections = mobileGrouped ? mobileSections.filter((section: string) => section === activeGroup) : visibleSections;

  useEffect(() => {
    if (!mobileGrouped) return;
    if (!mobileSections.includes(activeGroup)) {
      setActiveGroup(mobileSections[0] ?? MOBILE_GROUP_ORDER[0]);
      return;
    }
    setCollapsibleState((prev: any) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
  }, [activeGroup, mobileGrouped, mobileSections, setCollapsibleState]);

  const handleSectionContextMenu = (event: any, sectionName: string) => {
    event.preventDefault();
    event.stopPropagation();

    const sectionKeys = ADJUSTMENT_SECTIONS[sectionName];
    if (!sectionKeys) {
      return;
    }

    const handleCopy = () => {
      const { adjustments } = useEditorStore.getState();
      const adjustmentsToCopy: any = {};
      for (const key of sectionKeys) {
        if (Object.prototype.hasOwnProperty.call(adjustments, key)) {
          adjustmentsToCopy[key] = JSON.parse(JSON.stringify(adjustments[key as keyof Adjustments]));
        }
      }
      setCopiedSectionAdjustments({ section: sectionName, values: adjustmentsToCopy });
    };

    const handlePaste = () => {
      if (!copiedSectionAdjustments || copiedSectionAdjustments.section !== sectionName) {
        return;
      }
      setAdjustments((prev: Adjustments) => ({
        ...prev,
        ...copiedSectionAdjustments.values,
        activeTools: setToolActive(getActiveTools(prev), sectionName, true),
      }));
    };

    const handleReset = async () => {
      const defaults = await getOpenImageDefaults();
      const resetValues: any = {};
      for (const key of sectionKeys) {
        resetValues[key] = defaults[key as keyof Adjustments];
      }
      setAdjustments((prev: Adjustments) => ({
        ...prev,
        ...resetValues,
        activeTools: setToolActive(getActiveTools(prev), sectionName, true),
      }));
    };

    const isPasteAllowed = copiedSectionAdjustments && copiedSectionAdjustments.section === sectionName;
    const translatedSection = t(`editor.adjustments.sections.${sectionName}` as ParseKeys);

    const pasteLabel = copiedSectionAdjustments
      ? t('editor.adjustments.actions.pasteLabel', { section: translatedSection })
      : t('editor.adjustments.actions.pasteSettings');

    const options: any = [
      {
        label: t('editor.adjustments.actions.copySectionSettings', { section: translatedSection }),
        icon: Copy,
        onClick: handleCopy,
      },
      { label: pasteLabel, icon: ClipboardPaste, onClick: handlePaste, disabled: !isPasteAllowed },
      { type: OPTION_SEPARATOR },
      {
        label: t('editor.adjustments.actions.resetSectionSettings', { section: translatedSection }),
        icon: RotateCcw,
        onClick: handleReset,
      },
      { type: OPTION_SEPARATOR },
      {
        label: t('editor.adjustments.actions.customizePanels'),
        icon: LayoutList,
        submenu: [{ customComponent: AdjustmentSectionsSubMenu }],
      },
    ];

    showContextMenu(event.clientX, event.clientY, options);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex justify-between items-center shrink-0 border-b border-surface">
        <Text variant={TextVariants.title}>{t('editor.adjustments.title')}</Text>
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-full hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedImage}
            onClick={() => handleAutoAdjustments()}
            onContextMenu={handleAutoAdjustContextMenu}
            data-tooltip={t('editor.adjustments.tooltips.autoAdjust')}
          >
            <PencilSparkles size={18} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedImage}
            onClick={handleResetAdjustments}
            data-tooltip={t('editor.adjustments.tooltips.resetAdjustments')}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>


      {mobileGrouped && mobileSections.length > 0 && (
        <div className="shrink-0 flex gap-1 overflow-x-auto overscroll-contain custom-scrollbar px-2 py-2 border-b border-surface">
          {mobileSections.map((section: string) => {
            const isActive = section === activeGroup;
            return (
              <button
                key={section}
                onClick={() => setActiveGroup(section)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm shrink-0 transition-colors',
                  isActive ? 'bg-accent text-button-text' : 'bg-surface/60 text-text-secondary',
                )}
              >
                {t(`editor.adjustments.sections.${section}` as ParseKeys)}
              </button>
            );
          })}
        </div>
      )}

      <div className="grow overflow-y-scroll p-3 flex flex-col gap-2">
        {selectedImage ? (
          renderedSections.map((sectionName: string) => {
            const title = t(`editor.adjustments.sections.${sectionName}` as ParseKeys);

            return (
              <div className="shrink-0 group" key={sectionName}>
                <CollapsibleSection
                  isContentVisible={isToolActive(activeTools, sectionName)}
                  isOpen={collapsibleSectionsState[sectionName as keyof typeof collapsibleSectionsState]}
                  onContextMenu={(e: any) => handleSectionContextMenu(e, sectionName)}
                  onToggle={() => handleToggleSection(sectionName)}
                  onToggleVisibility={() => handleToggleVisibility(sectionName)}
                  title={title}
                >
                  <AdjustmentSectionContent
                    sectionName={sectionName}
                    activeTools={activeTools}
                    onToggleTool={handleToggleVisibility}
                    setAdjustments={setAdjustments}
                    theme={theme}
                    handleLutSelect={handleLutSelect}
                    appSettings={appSettings}
                    asShotWhiteBalance={selectedImage.asShotWhiteBalance}
                    isWbPickerActive={isWbPickerActive}
                    toggleWbPicker={toggleWbPicker}
                    onDragStateChange={onDragStateChange}
                  />
                </CollapsibleSection>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <Text
              variant={TextVariants.heading}
              color={TextColors.secondary}
              weight={TextWeights.normal}
              className="text-center"
            >
              {t('editor.ai.noImageSelected')}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
