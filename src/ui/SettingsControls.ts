import { audio } from '../engine/Audio';
import { SaveManager } from '../save/SaveManager';
import { el } from './dom';

function slider(label: string, initial: number, onChange: (v: number) => void): HTMLElement {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.value = String(Math.round(initial * 100));
  input.style.width = '160px';
  input.addEventListener('input', () => onChange(Number(input.value) / 100));
  return el('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 0' }, [
    el('span', { class: 'small-hint' }, [label]),
    input,
  ]);
}

/** Volume/mute controls shared by the Settings screen and the in-level
 * pause overlay, so both stay in sync with the same save + audio state. */
export function buildAudioSettings(save: SaveManager): HTMLElement {
  const muteBtn = document.createElement('button');
  muteBtn.className = 'btn secondary';
  const refreshMuteLabel = () => {
    muteBtn.textContent = audio.isMuted() ? '🔇 Unmute' : '🔊 Mute All';
  };
  refreshMuteLabel();
  muteBtn.addEventListener('click', () => {
    const next = !audio.isMuted();
    audio.setMuted(next);
    save.setMuted(next);
    refreshMuteLabel();
  });

  return el('div', { style: 'display:flex;flex-direction:column;gap:2px;min-width:220px' }, [
    slider('Music Volume', save.get().musicVolume, (v) => {
      audio.setMusicVolume(v);
      save.setMusicVolume(v);
    }),
    slider('Sound Effects', save.get().sfxVolume, (v) => {
      audio.setSfxVolume(v);
      save.setSfxVolume(v);
    }),
    el('div', { style: 'margin-top:6px' }, [muteBtn]),
  ]);
}
