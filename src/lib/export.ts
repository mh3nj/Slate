/**
 * Slate — export engine.
 *
 * Maps semantic palette keys onto the *real* key names used by Telegram
 * Desktop and Telegram Android, then serializes themes into their native
 * formats:
 *
 *  - `.tdesktop-theme`  — zipped `colors.tdesktop-theme` (+ optional background)
 *  - `.attheme`         — Android color table (`key=ARGB`)
 *
 * Importing `.attheme` works best-effort via the reverse map.
 */

import { parseHex, rgbaToHex } from './color';
import type { Palette } from './types';

/** Turn a project name into a safe filename slug (e.g. "Midnight" → "midnight"). */
export function slugify(name: string): string {
  const slug = (name || 'slate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'slate';
}

/* ----------------------------- key maps --------------------------------- */

const TDESKTOP_MAP: Record<string, string[]> = {
  bgPrimary: ['windowBg', 'contactsBg', 'imageBg'],
  bgSecondary: ['dialogsBg'],
  bgElevated: ['boxBg', 'menuBg', 'mainMenuBg', 'emojiPanBg'],
  bgChatList: ['dialogsBg'],
  bgInputPanel: ['historyComposeAreaBg'],
  bgHover: ['windowBgOver', 'contactsBgOver', 'dialogsBgOver', 'menuBgOver'],
  bgActive: ['windowBgActive', 'dialogsBgActive'],
  bgOverlay: ['layerBg'],
  textPrimary: ['windowFg', 'contactsNameFg', 'boxTextFg'],
  textSecondary: ['windowSubTextFg', 'contactsStatusFg', 'dialogsDateFg'],
  textTertiary: ['placeholderFg'],
  textLink: ['windowActiveTextFg'],
  textOnAccent: ['windowFgActive'],
  textDestructive: ['attentionButtonFg', 'boxTextFgError'],
  textPositive: ['boxTextFgGood'],
  textDisabled: ['menuFgDisabled'],
  accentPrimary: ['activeButtonBg', 'dialogsUnreadBgActive'],
  accentHover: ['activeButtonBgOver'],
  accentPressed: ['activeButtonBgRipple'],
  accentMuted: ['windowBgRipple'],
  accentSecondary: ['mediaviewTextLinkFg'],
  onlineDot: ['contactsStatusFgOnline'],
  headerBg: ['titleBg', 'topBarBg'],
  headerBgActive: ['titleBgActive'],
  headerText: ['titleFgActive'],
  headerSubtext: ['dialogsDateFg'],
  headerIcon: ['dialogsMenuIconFg'],
  listBg: ['dialogsBg'],
  listBgHover: ['dialogsBgOver'],
  listBgActive: ['dialogsBgActive'],
  listName: ['dialogsNameFg'],
  listNameActive: ['dialogsNameFgActive'],
  listMessage: ['dialogsTextFg'],
  listMessageActive: ['dialogsTextFgActive'],
  listDate: ['dialogsDateFg'],
  listDateActive: ['dialogsDateFgActive'],
  listUnreadBg: ['dialogsUnreadBg'],
  listUnreadText: ['dialogsUnreadFg'],
  listUnreadMutedBg: ['dialogsUnreadBgMuted'],
  listCheckSent: ['dialogsSentIconFg'],
  listCheckRead: ['dialogsSentIconFgActive'],
  listVerifiedBg: ['dialogsVerifiedIconBg'],
  listVerifiedCheck: ['dialogsVerifiedIconFg'],
  bubbleInBg: ['msgInBg'],
  bubbleInBgSelected: ['msgInBgSelected'],
  bubbleInText: ['historyTextInFg'],
  bubbleInLink: ['msgInServiceFg'],
  bubbleInTime: ['msgInDateFg'],
  bubbleInReplyBar: ['msgInReplyBarColor'],
  bubbleInShadow: ['msgInShadow'],
  bubbleOutBg: ['msgOutBg'],
  bubbleOutBgSelected: ['msgOutBgSelected'],
  bubbleOutText: ['historyTextOutFg'],
  bubbleOutLink: ['msgOutServiceFg'],
  bubbleOutTime: ['msgOutDateFg'],
  bubbleOutCheckSent: ['historySendingOutIconFg'],
  bubbleOutCheckRead: ['historyOutIconFg'],
  bubbleOutReplyBar: ['msgOutReplyBarColor'],
  bubbleOutShadow: ['msgOutShadow'],
  inputBg: ['historyComposeAreaBg'],
  inputBorder: ['inputBorderFg'],
  inputBorderFocus: ['activeLineFg'],
  inputText: ['historyComposeAreaFg'],
  inputPlaceholder: ['placeholderFg'],
  inputIcon: ['historyComposeIconFg'],
  inputSendIcon: ['historySendIconFg'],
  divider: ['shadowFg'],
  menuBg: ['menuBg'],
  menuBgHover: ['menuBgOver'],
  menuText: ['windowFg'],
  menuIcon: ['menuIconFg'],
  scrollbar: ['scrollBarBg', 'historyScrollBarBg'],
  overlayBackdrop: ['layerBg'],
  switchTrackOff: ['sliderBgInactive'],
  switchThumbOff: ['windowBg'],
  switchTrackOn: ['sliderBgActive'],
  switchThumbOn: ['windowBgActive'],
  checkboxUnchecked: ['checkboxFg'],
  checkboxBg: ['activeButtonBg'],
  checkboxCheck: ['windowFgActive'],
  radioChecked: ['activeButtonBg'],
  statusOnline: ['contactsStatusFgOnline'],
  statusTyping: ['windowActiveTextFg'],
  serviceBg: ['msgServiceBg'],
  serviceText: ['msgServiceFg'],
  destructiveButton: ['attentionButtonFg'],
  positiveButton: ['boxTextFgGood'],
  mediaButtonInBg: ['historyFileInIconFg'],
  mediaButtonOutBg: ['historyFileOutIconFg'],
  waveformInActive: ['msgWaveformInActive'],
  waveformInInactive: ['msgWaveformInInactive'],
  waveformOutActive: ['msgWaveformOutActive'],
  waveformOutInactive: ['msgWaveformOutInactive'],
};

for (let i = 1; i <= 8; i++) {
  TDESKTOP_MAP[`peerColor${i}`] = [`historyPeer${i}UserpicBg`];
  TDESKTOP_MAP[`peerName${i}`] = [`historyPeer${i}NameFg`];
}

Object.assign(TDESKTOP_MAP, {
  fileBgIn: ['msgFileInBg'],
  fileBgOut: ['msgFileOutBg'],
  fileIconIn: ['historyFileInIconFg'],
  fileIconOut: ['historyFileOutIconFg'],
  fileNameIn: ['historyFileNameInFg'],
  fileNameOut: ['historyFileNameOutFg'],
  fileInfoIn: ['mediaInFg'],
  fileInfoOut: ['mediaOutFg'],

  forwardedNameIn: ['msgInServiceFg'],
  forwardedNameOut: ['msgOutServiceFg'],
  replyNameIn: ['msgInServiceFg'],
  replyNameOut: ['msgOutServiceFg'],
  replyTextIn: ['historyTextInFg'],
  replyTextOut: ['historyTextOutFg'],

  previewBarIn: ['msgInReplyBarColor'],
  previewTitleIn: ['msgInServiceFg'],
  previewBarOut: ['msgOutReplyBarColor'],
  previewTitleOut: ['msgOutServiceFg'],

  pinnedBarBg: ['historyPinnedBg'],
  pinnedBarTitle: ['historyComposeAreaFg'],
  pinnedBarMessage: ['msgInDateFg'],
  pinnedBarClose: ['historyReplyCancelFg'],

  adminBadgeText: ['profileAdminStartFg'],
  unreadDividerBg: ['historyUnreadBarBg'],
  unreadDividerText: ['historyUnreadBarFg'],
  draftLabel: ['dialogsDraftFg'],

  callIconIn: ['historyCallArrowInFg'],
  callIconInMissed: ['historyCallArrowMissedInFg'],
  callIconOut: ['historyCallArrowOutFg'],
  callPopupBg: ['callBg'],
  callAnswerBg: ['callAnswerBg'],
  callHangupBg: ['callHangupBg'],
  callStatusText: ['callStatusFg'],

  panelBg: ['emojiPanBg'],
  panelIcon: ['menuIconFg'],
  panelIconActive: ['windowActiveTextFg'],
  panelStickerSetName: ['emojiPanHeaderFg'],
  panelSearchBg: ['filterInputInactiveBg'],
  panelTrendingTitle: ['lightButtonFg'],
});

const ANDROID_PEER_NAMES = ['Red', 'Orange', 'Violet', 'Green', 'Cyan', 'Blue', 'Pink'];

const ATTHEME_MAP: Record<string, string[]> = {
  bgPrimary: ['windowBackgroundWhite'],
  bgSecondary: ['windowBackgroundGray'],
  bgElevated: ['dialogBackground', 'actionBarDefaultSubmenuBackground'],
  bgChatList: ['windowBackgroundWhite'],
  bgInputPanel: ['chat_messagePanelBackground'],
  bgHover: ['listSelectorSDK21'],
  bgActive: ['chats_actionUnreadBackground'],
  bgOverlay: ['chat_gifSaveHintBackground'],
  textPrimary: ['windowBackgroundWhiteBlackText'],
  textSecondary: ['windowBackgroundWhiteGrayText2'],
  textTertiary: ['windowBackgroundWhiteHintText'],
  textLink: ['windowBackgroundWhiteLinkText'],
  textOnAccent: ['windowBackgroundWhiteValueText'],
  textDestructive: ['windowBackgroundWhiteRedText'],
  textPositive: ['windowBackgroundWhiteGreenText'],
  textDisabled: ['windowBackgroundWhiteGrayText7'],
  accentPrimary: ['windowBackgroundWhiteBlueButton', 'chats_actionBackground'],
  accentHover: ['windowBackgroundWhiteBlueIcon'],
  accentPressed: ['chats_actionPressedBackground'],
  accentMuted: ['dialogLinkSelection'],
  accentSecondary: ['windowBackgroundWhiteBlueText'],
  onlineDot: ['chats_onlineCircle'],
  headerBg: ['actionBarDefault'],
  headerBgActive: ['actionBarDefault'],
  headerText: ['actionBarDefaultTitle'],
  headerSubtext: ['actionBarDefaultSubtitle'],
  headerIcon: ['actionBarDefaultIcon'],
  listBg: ['windowBackgroundWhite'],
  listBgHover: ['listSelectorSDK21'],
  listBgActive: ['chats_actionUnreadBackground'],
  listName: ['chats_name'],
  listNameActive: ['chats_name'],
  listMessage: ['chats_message'],
  listMessageActive: ['chats_message'],
  listDate: ['chats_date'],
  listDateActive: ['chats_date'],
  listUnreadBg: ['chats_unreadCounter'],
  listUnreadText: ['chats_unreadCounterText'],
  listUnreadMutedBg: ['chats_unreadCounterMuted'],
  listCheckSent: ['chats_sentCheck'],
  listCheckRead: ['chats_sentReadCheck'],
  listVerifiedBg: ['chats_verifiedBackground'],
  listVerifiedCheck: ['chats_verifiedCheck'],
  bubbleInBg: ['chat_inBubble'],
  bubbleInBgSelected: ['chat_inBubbleSelected'],
  bubbleInText: ['chat_messageTextIn'],
  bubbleInLink: ['chat_messageLinkIn'],
  bubbleInTime: ['chat_inTimeText'],
  bubbleInReplyBar: ['chat_inReplyLine'],
  bubbleInShadow: ['chat_inBubbleShadow'],
  bubbleOutBg: ['chat_outBubble'],
  bubbleOutBgSelected: ['chat_outBubbleSelected'],
  bubbleOutText: ['chat_messageTextOut'],
  bubbleOutLink: ['chat_messageLinkOut'],
  bubbleOutTime: ['chat_outTimeText'],
  bubbleOutCheckSent: ['chat_outSentCheck'],
  bubbleOutCheckRead: ['chat_outSentCheckRead'],
  bubbleOutReplyBar: ['chat_outReplyLine'],
  bubbleOutShadow: ['chat_outBubbleShadow'],
  inputBg: ['chat_messagePanelBackground'],
  inputBorder: ['windowBackgroundWhiteInputField'],
  inputBorderFocus: ['windowBackgroundWhiteInputFieldActivated'],
  inputText: ['chat_messagePanelText'],
  inputPlaceholder: ['chat_messagePanelHint'],
  inputIcon: ['chat_messagePanelIcons'],
  inputSendIcon: ['chat_messagePanelSend'],
  divider: ['divider'],
  menuBg: ['actionBarDefaultSubmenuBackground'],
  menuBgHover: ['listSelectorSDK21'],
  menuText: ['actionBarDefaultSubmenuItem'],
  menuIcon: ['stickers_menu'],
  scrollbar: ['fastScrollInactive'],
  overlayBackdrop: ['chat_gifSaveHintBackground'],
  switchTrackOff: ['switchTrack'],
  switchThumbOff: ['switchTrack'],
  switchTrackOn: ['switchTrackChecked'],
  switchThumbOn: ['switchTrackChecked'],
  checkboxUnchecked: ['checkboxSquareUnchecked'],
  checkboxBg: ['checkboxSquareBackground'],
  checkboxCheck: ['checkboxSquareCheck'],
  radioChecked: ['radioBackgroundChecked'],
  statusOnline: ['chats_onlineCircle'],
  statusTyping: ['windowBackgroundWhiteBlueText'],
  serviceBg: ['chat_serviceBackground'],
  serviceText: ['chat_serviceText'],
  destructiveButton: ['windowBackgroundWhiteRedText2'],
  positiveButton: ['windowBackgroundWhiteGreenText2'],
  mediaButtonInBg: ['chat_inLoader'],
  mediaButtonOutBg: ['chat_outLoader'],
  waveformInActive: ['chat_inVoiceSeekbarFill'],
  waveformInInactive: ['chat_inVoiceSeekbar'],
  waveformOutActive: ['chat_outVoiceSeekbarFill'],
  waveformOutInactive: ['chat_outVoiceSeekbar'],
};

Object.assign(ATTHEME_MAP, {
  fileBgIn: ['chat_inFileBackground'],
  fileBgOut: ['chat_outFileBackground'],
  fileIconIn: ['chat_inFileIcon'],
  fileIconOut: ['chat_outFileIcon'],
  fileNameIn: ['chat_inFileNameText'],
  fileNameOut: ['chat_outFileNameText'],
  fileInfoIn: ['chat_inFileInfoText'],
  fileInfoOut: ['chat_outFileInfoText'],

  forwardedNameIn: ['chat_inForwardedNameText'],
  forwardedNameOut: ['chat_outForwardedNameText'],
  replyNameIn: ['chat_inReplyNameText'],
  replyNameOut: ['chat_outReplyNameText'],
  replyTextIn: ['chat_inReplyMessageText'],
  replyTextOut: ['chat_outReplyMessageText'],

  previewBarIn: ['chat_inPreviewLine'],
  previewTitleIn: ['chat_inSiteNameText'],
  previewBarOut: ['chat_outPreviewLine'],
  previewTitleOut: ['chat_outSiteNameText'],

  pinnedBarBg: ['chat_topPanelBackground'],
  pinnedBarTitle: ['chat_topPanelTitle'],
  pinnedBarMessage: ['chat_topPanelMessage'],
  pinnedBarClose: ['chat_topPanelClose'],

  adminBadgeText: ['chat_adminText'],
  unreadDividerBg: ['chat_unreadMessagesStartBackground'],
  unreadDividerText: ['chat_unreadMessagesStartText'],
  draftLabel: ['chats_draft'],
  mentionBadge: ['chats_mentionIcon'],

  callIconIn: ['chat_inUpCall'],
  callIconInMissed: ['chat_inDownCall'],
  callIconOut: ['chat_outUpCall'],

  panelBg: ['chat_emojiPanelBackground'],
  panelIcon: ['chat_emojiPanelIcon'],
  panelIconActive: ['chat_emojiPanelIconSelected'],
  panelStickerSetName: ['chat_emojiPanelStickerSetName'],
  panelSearchBg: ['chat_emojiSearchBackground'],
  panelTrendingTitle: ['chat_emojiPanelTrendingTitle'],
});

for (let i = 1; i <= 7; i++) {
  ATTHEME_MAP[`peerColor${i}`] = [`avatar_background${ANDROID_PEER_NAMES[i - 1]}`];
  ATTHEME_MAP[`peerName${i}`] = [`avatar_nameInMessage${ANDROID_PEER_NAMES[i - 1]}`];
}
ATTHEME_MAP.peerColor8 = ['avatar_backgroundSaved'];
ATTHEME_MAP.peerName8 = ['avatar_nameInMessageBlue'];

/** Reverse map for best-effort `.attheme` import (real key -> semantic key), first match wins. */
const ATTHEME_REVERSE: Record<string, string> = {};
for (const [sem, keys] of Object.entries(ATTHEME_MAP)) {
  for (const k of keys) if (!(k in ATTHEME_REVERSE)) ATTHEME_REVERSE[k] = sem;
}

/* --------------------------- serialization ------------------------------ */

/** Telegram Android stores colors as ARGB int32. */
export function toAndroidColorInt(hex: string): number {
  const { r, g, b, a } = parseHex(hex);
  return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function androidIntToHex(int32: number): string {
  const u = int32 >>> 0;
  const a = (u >>> 24) & 0xff;
  const r = (u >>> 16) & 0xff;
  const g = (u >>> 8) & 0xff;
  const b = u & 0xff;
  return rgbaToHex({ r, g, b, a });
}

/** Serialize a palette into a Telegram Desktop `colors.tdesktop-theme` file. */
export function exportTdesktopThemeText(palette: Palette): string {
  const lines = ['// Exported by Slate: Telegram Theme Studio'];
  const seen = new Set<string>();
  for (const [semKey, hex] of Object.entries(palette)) {
    const realKeys = TDESKTOP_MAP[semKey];
    if (!realKeys) continue;
    for (const rk of realKeys) {
      if (seen.has(rk)) continue;
      seen.add(rk);
      lines.push(`${rk}: ${hex};`);
    }
  }
  return lines.join('\n') + '\n';
}

/** Serialize a palette into a Telegram Android `.attheme` color table. */
export function exportAtthemeText(palette: Palette): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const [semKey, hex] of Object.entries(palette)) {
    const realKeys = ATTHEME_MAP[semKey];
    if (!realKeys) continue;
    const intVal = toAndroidColorInt(hex);
    for (const rk of realKeys) {
      if (seen.has(rk)) continue;
      seen.add(rk);
      lines.push(`${rk}=${intVal}`);
    }
  }
  return lines.join('\n') + '\n';
}

/** Parse `.attheme` text into semantic-key overrides (best effort). */
export function parseAtthemeText(text: string): { semanticOverrides: Record<string, string> } {
  const colors: Record<string, number> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const valueStr = line.slice(idx + 1).trim();
    const value = parseInt(valueStr, 10);
    if (Number.isNaN(value)) continue;
    colors[key] = value;
  }
  const semanticOverrides: Record<string, string> = {};
  for (const [realKey, intVal] of Object.entries(colors)) {
    const semKey = ATTHEME_REVERSE[realKey];
    if (semKey) semanticOverrides[semKey] = androidIntToHex(intVal);
  }
  return { semanticOverrides };
}
