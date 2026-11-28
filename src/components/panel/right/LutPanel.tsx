import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import LUTControl from '../../adjustments/LUTControl';
import { useEditorActions } from '../../../hooks/useEditorActions';
import { useEditorStore } from '../../../store/useEditorStore';

export default function LutPanel() {
  const { t } = useTranslation();
  const { setAdjustments, handleLutSelect } = useEditorActions();
  const adjustments = useEditorStore(useShallow((state) => ({ ...state.adjustments })));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 custom-scrollbar">
      <h2 className="shrink-0 text-sm font-semibold">{t('adjustments.effects.lut')}</h2>
      <LUTControl
        lutPath={adjustments.lutPath || null}
        lutName={adjustments.lutName || null}
        lutIntensity={adjustments.lutIntensity ?? 100}
        onLutSelect={handleLutSelect}
        onIntensityChange={(intensity: number) =>
          setAdjustments((prev) => ({ ...prev, lutIntensity: intensity }))
        }
        onClear={() =>
          setAdjustments((prev) => ({ ...prev, lutPath: null, lutName: null, lutIntensity: 100 }))
        }
      />
    </div>
  );
}
