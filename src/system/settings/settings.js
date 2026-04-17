import { SND_Background } from "../../constant/sound/bgm.js";
import { globalScene } from "../../global-scene.js";

const BGM_OPTIONS = [
  {
    value: "None",
    label: "None",
  },
];
for (let i = 0; i <= SND_Background; i++) {
  const value = i.toString();
  BGM_OPTIONS.push({ value, label: value });
}

const OFF_ON = [
  {
    value: "Off",
  },
  {
    value: "On",
  },
];

const AUTO_DISABLED = [
  {
    value: "Auto",
  },
  {
    value: "Disabled",
  },
];

/**
 * Types for helping separate settings to different menus
 */
export const SettingType = {
  GENERAL: 0,
  DISPLAY: 1,
  AUDIO: 2,
}

/**
 * Setting Keys for existing settings
 * to be used when trying to find or update Settings
 */
export const SettingKeys = {
  Battle_Music: "BATTLE_MUSIC",
  Force_Music: "FORCE_MUSIC"
};

export const MusicPreference = {
  NOT_FORCED: 0,
  FORCED: 1,
}

/**
 * All Settings not related to controls
 */
export const Setting = [
  {
    key: SettingKeys.Battle_Music,
    label: "Music that will be playing",
    options: BGM_OPTIONS,
    default: SND_Background.END,
    type: SettingType.AUDIO,
  },
  {
    key: SettingKeys.Force_Music,
    label: "Force the music to not change",
    options: OFF_ON,
    default: 0,
    type: SettingType.AUDIO,
  },
];

/**
 * Return the index of a Setting
 * @param key SettingKey
 * @returns index or -1 if doesn't exist
 */
export function settingIndex(key) {
  return Setting.findIndex(s => s.key === key);
}

/**
 * Resets all settings to their defaults
 */
export function resetSettings() {
  for (const s of Setting) {
    setSetting(s.key, s.default);
  }
}

/**
 * Updates a setting
 * @param setting string ideally from SettingKeys
 * @param value value to update setting with
 * @returns true if successful, false if not
 */
export function setSetting(setting, value) {
  const index = settingIndex(setting);
  if (index === -1) {
    return false;
  }
  switch (Setting[index].key) {
    case SettingKeys.Battle_Music:
      globalScene.musicPreference = value ? value : -1;
      break;
    case SettingKeys.Force_Music:
      globalScene.musicForced = value;
      break;
  }

  return true;
}