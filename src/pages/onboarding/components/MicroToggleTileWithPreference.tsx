/**
 * MicroToggleTileWithPreference - Extended tile that shows preference dropdown in Edit Mode
 * Uses the rightAccessory slot pattern for clean composition
 */

import { MicroToggleTile, type MicroToggleTileProps } from './MicroToggleTile';
import { PreferencePill } from './PreferencePill';
import type { Preference } from '../types/preferences';

interface MicroToggleTileWithPreferenceProps extends MicroToggleTileProps {
  showPreference?: boolean;
  preference?: Preference;
  onPreferenceChange?: (preference: Preference) => void;
  isPreferenceUpdating?: boolean;
}

export function MicroToggleTileWithPreference({
  showPreference,
  preference = 'neutral',
  onPreferenceChange,
  isPreferenceUpdating,
  ...tileProps
}: MicroToggleTileWithPreferenceProps) {
  const shouldShow = !!showPreference && !!tileProps.isSelected;

  return (
    <MicroToggleTile
      {...tileProps}
      rightAccessory={
        shouldShow ? (
          <PreferencePill
            value={preference}
            disabled={isPreferenceUpdating}
            onChange={(next) => onPreferenceChange?.(next)}
          />
        ) : undefined
      }
    />
  );
}
