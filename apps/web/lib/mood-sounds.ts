import type { MoodSoundKey } from "@tiptop/domain";

export function moodSoundChoices(messages: {
  moodSoundOriginal: string;
  moodSoundOff: string;
  moodSoundPulse: string;
  moodSoundNight: string;
  moodSoundGlow: string;
}): Array<{ key: MoodSoundKey; label: string }> {
  return [
    { key: "original", label: messages.moodSoundOriginal },
    { key: "pulse", label: messages.moodSoundPulse },
    { key: "night", label: messages.moodSoundNight },
    { key: "glow", label: messages.moodSoundGlow },
    { key: "off", label: messages.moodSoundOff },
  ];
}
