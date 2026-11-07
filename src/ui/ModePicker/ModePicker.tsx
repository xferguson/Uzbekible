import { label, type Script } from '../labels';
import styles from './ModePicker.module.css';

export interface ModePickerProps {
  modes: readonly { id: string; name: { uzLatn: string; uzCyrl: string } }[];
  value: string;
  script: Script;
  onChange: (id: string) => void;
}

/** A plain segmented control for a game's difficulty modes. */
export function ModePicker({ modes, value, script, onChange }: ModePickerProps) {
  return (
    <div role="radiogroup" aria-label={label(script, 'Qiyinlik')} className={styles.group}>
      {modes.map((m) => (
        <label key={m.id} className={styles.option}>
          <input
            type="radio"
            name="mode"
            className={styles.input}
            checked={m.id === value}
            onChange={() => onChange(m.id)}
          />
          <span className={styles.name}>{script === 'cyrl' ? m.name.uzCyrl : m.name.uzLatn}</span>
        </label>
      ))}
    </div>
  );
}
