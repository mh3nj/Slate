/**
 * Slate — semantic palette.
 *
 * From the ~23 master controls, `deriveFullPalette` produces the ~110 semantic
 * colors Telegram actually uses (bubble text, timestamps, scrollbars, link
 * previews, call logs…), organized into categories for the inspector UI.
 */

import {
  adjustLightness,
  alphaFrac,
  elevate,
  ensureContrast,
  isDarkColor,
  mix,
  pickReadableText,
} from './color';
import type { Masters, Palette } from './types';

export interface CategoryDef {
  id: string;
  label: string;
  hint: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'surfaces', label: 'Surfaces', hint: 'Backgrounds, panels & overlays' },
  { id: 'text', label: 'Text', hint: 'Type hierarchy' },
  { id: 'accent', label: 'Accent', hint: 'Brand & interactive states' },
  { id: 'header', label: 'Header', hint: 'Chat top bar' },
  { id: 'chatlist', label: 'Chat List', hint: 'Dialogs panel' },
  { id: 'bubbleIn', label: 'Bubbles · In', hint: 'Incoming messages' },
  { id: 'bubbleOut', label: 'Bubbles · Out', hint: 'Outgoing messages' },
  { id: 'input', label: 'Compose Bar', hint: 'Message input' },
  { id: 'chrome', label: 'Menus & Dividers', hint: 'Popups, scrollbars' },
  { id: 'controls', label: 'Controls', hint: 'Switches, checkboxes' },
  { id: 'peers', label: 'Peer Colors', hint: 'Avatars & member names' },
  { id: 'status', label: 'Status & Service', hint: 'Online dot, date pills' },
  { id: 'media', label: 'Media', hint: 'Voice notes, downloads' },
  { id: 'files', label: 'Files & Documents', hint: 'File bubbles' },
  { id: 'forward', label: 'Forwards & Replies', hint: 'Quoted & forwarded messages' },
  { id: 'linkpreview', label: 'Link Previews', hint: 'Site cards inside bubbles' },
  { id: 'pinned', label: 'Pinned Bar', hint: 'Pinned message strip' },
  { id: 'group', label: 'Group & Admin', hint: 'Admin badges, unread divider, drafts' },
  { id: 'calls', label: 'Calls', hint: 'Call log & popup' },
  { id: 'panel', label: 'Stickers & Emoji', hint: 'Emoji/sticker tray' },
];

/** [semanticKey, categoryId, label] triples. */
export type SemanticDef = [string, string, string];

export const SEMANTIC_DEFS: SemanticDef[] = [
  ['bgPrimary', 'surfaces', 'Primary Background'],
  ['bgSecondary', 'surfaces', 'Secondary Background'],
  ['bgElevated', 'surfaces', 'Elevated (menus/boxes)'],
  ['bgChatList', 'surfaces', 'Chat List Background'],
  ['bgInputPanel', 'surfaces', 'Compose Panel Background'],
  ['bgHover', 'surfaces', 'Hover Background'],
  ['bgActive', 'surfaces', 'Active/Selected Background'],
  ['bgOverlay', 'surfaces', 'Modal Overlay'],

  ['textPrimary', 'text', 'Primary Text'],
  ['textSecondary', 'text', 'Secondary Text'],
  ['textTertiary', 'text', 'Hint / Placeholder'],
  ['textLink', 'text', 'Link Text'],
  ['textOnAccent', 'text', 'Text On Accent'],
  ['textDestructive', 'text', 'Destructive Text'],
  ['textPositive', 'text', 'Positive Text'],
  ['textDisabled', 'text', 'Disabled Text'],

  ['accentPrimary', 'accent', 'Accent'],
  ['accentHover', 'accent', 'Accent Hover'],
  ['accentPressed', 'accent', 'Accent Pressed'],
  ['accentMuted', 'accent', 'Accent Wash'],
  ['accentSecondary', 'accent', 'Accent Secondary'],
  ['onlineDot', 'accent', 'Online Dot'],

  ['headerBg', 'header', 'Header Background'],
  ['headerBgActive', 'header', 'Header Background (Active Window)'],
  ['headerText', 'header', 'Header Title'],
  ['headerSubtext', 'header', 'Header Subtitle'],
  ['headerIcon', 'header', 'Header Icons'],

  ['listBg', 'chatlist', 'Background'],
  ['listBgHover', 'chatlist', 'Hover'],
  ['listBgActive', 'chatlist', 'Active Chat'],
  ['listName', 'chatlist', 'Chat Name'],
  ['listNameActive', 'chatlist', 'Chat Name (Active)'],
  ['listMessage', 'chatlist', 'Message Preview'],
  ['listMessageActive', 'chatlist', 'Message Preview (Active)'],
  ['listDate', 'chatlist', 'Date'],
  ['listDateActive', 'chatlist', 'Date (Active)'],
  ['listUnreadBg', 'chatlist', 'Unread Badge'],
  ['listUnreadText', 'chatlist', 'Unread Badge Text'],
  ['listUnreadMutedBg', 'chatlist', 'Unread Badge (Muted)'],
  ['listCheckSent', 'chatlist', 'Sent Check'],
  ['listCheckRead', 'chatlist', 'Read Check'],
  ['listVerifiedBg', 'chatlist', 'Verified Badge'],
  ['listVerifiedCheck', 'chatlist', 'Verified Check'],

  ['bubbleInBg', 'bubbleIn', 'Background'],
  ['bubbleInBgSelected', 'bubbleIn', 'Background (Selected)'],
  ['bubbleInText', 'bubbleIn', 'Text'],
  ['bubbleInLink', 'bubbleIn', 'Link'],
  ['bubbleInTime', 'bubbleIn', 'Timestamp'],
  ['bubbleInReplyBar', 'bubbleIn', 'Reply Bar'],
  ['bubbleInShadow', 'bubbleIn', 'Shadow'],

  ['bubbleOutBg', 'bubbleOut', 'Background'],
  ['bubbleOutBgSelected', 'bubbleOut', 'Background (Selected)'],
  ['bubbleOutText', 'bubbleOut', 'Text'],
  ['bubbleOutLink', 'bubbleOut', 'Link'],
  ['bubbleOutTime', 'bubbleOut', 'Timestamp'],
  ['bubbleOutCheckSent', 'bubbleOut', 'Sent Check'],
  ['bubbleOutCheckRead', 'bubbleOut', 'Read Check'],
  ['bubbleOutReplyBar', 'bubbleOut', 'Reply Bar'],
  ['bubbleOutShadow', 'bubbleOut', 'Shadow'],

  ['inputBg', 'input', 'Background'],
  ['inputBorder', 'input', 'Border'],
  ['inputBorderFocus', 'input', 'Border (Focused)'],
  ['inputText', 'input', 'Text'],
  ['inputPlaceholder', 'input', 'Placeholder'],
  ['inputIcon', 'input', 'Icons'],
  ['inputSendIcon', 'input', 'Send Icon'],

  ['divider', 'chrome', 'Divider'],
  ['menuBg', 'chrome', 'Menu Background'],
  ['menuBgHover', 'chrome', 'Menu Hover'],
  ['menuText', 'chrome', 'Menu Text'],
  ['menuIcon', 'chrome', 'Menu Icon'],
  ['scrollbar', 'chrome', 'Scrollbar'],
  ['overlayBackdrop', 'chrome', 'Backdrop'],

  ['switchTrackOff', 'controls', 'Switch Track (Off)'],
  ['switchThumbOff', 'controls', 'Switch Thumb (Off)'],
  ['switchTrackOn', 'controls', 'Switch Track (On)'],
  ['switchThumbOn', 'controls', 'Switch Thumb (On)'],
  ['checkboxUnchecked', 'controls', 'Checkbox (Unchecked)'],
  ['checkboxBg', 'controls', 'Checkbox Background'],
  ['checkboxCheck', 'controls', 'Checkbox Check'],
  ['radioChecked', 'controls', 'Radio (Checked)'],

  ['statusOnline', 'status', 'Online Status'],
  ['statusTyping', 'status', 'Typing Status'],
  ['serviceBg', 'status', 'Service Pill Background'],
  ['serviceText', 'status', 'Service Pill Text'],
  ['destructiveButton', 'status', 'Destructive Button'],
  ['positiveButton', 'status', 'Positive Button'],

  ['mediaButtonInBg', 'media', 'Download Button (In)'],
  ['mediaButtonOutBg', 'media', 'Download Button (Out)'],
  ['waveformInActive', 'media', 'Waveform Active (In)'],
  ['waveformInInactive', 'media', 'Waveform Inactive (In)'],
  ['waveformOutActive', 'media', 'Waveform Active (Out)'],
  ['waveformOutInactive', 'media', 'Waveform Inactive (Out)'],

  ['fileBgIn', 'files', 'Download Circle (In)'],
  ['fileBgOut', 'files', 'Download Circle (Out)'],
  ['fileIconIn', 'files', 'File Icon (In)'],
  ['fileIconOut', 'files', 'File Icon (Out)'],
  ['fileNameIn', 'files', 'File Name (In)'],
  ['fileNameOut', 'files', 'File Name (Out)'],
  ['fileInfoIn', 'files', 'File Size/Status (In)'],
  ['fileInfoOut', 'files', 'File Size/Status (Out)'],

  ['forwardedNameIn', 'forward', 'Forwarded From (In)'],
  ['forwardedNameOut', 'forward', 'Forwarded From (Out)'],
  ['replyNameIn', 'forward', 'Reply Sender Name (In)'],
  ['replyNameOut', 'forward', 'Reply Sender Name (Out)'],
  ['replyTextIn', 'forward', 'Reply Quoted Text (In)'],
  ['replyTextOut', 'forward', 'Reply Quoted Text (Out)'],

  ['previewBarIn', 'linkpreview', 'Accent Bar (In)'],
  ['previewTitleIn', 'linkpreview', 'Site Name (In)'],
  ['previewBarOut', 'linkpreview', 'Accent Bar (Out)'],
  ['previewTitleOut', 'linkpreview', 'Site Name (Out)'],

  ['pinnedBarBg', 'pinned', 'Background'],
  ['pinnedBarTitle', 'pinned', 'Title'],
  ['pinnedBarMessage', 'pinned', 'Message Preview'],
  ['pinnedBarClose', 'pinned', 'Close Icon'],

  ['adminBadgeText', 'group', 'Admin Badge'],
  ['unreadDividerBg', 'group', 'Unread Divider Background'],
  ['unreadDividerText', 'group', 'Unread Divider Text'],
  ['draftLabel', 'group', 'Draft Label'],
  ['mentionBadge', 'group', 'Mention Badge'],

  ['callIconIn', 'calls', 'Received Call Icon'],
  ['callIconInMissed', 'calls', 'Missed Call Icon'],
  ['callIconOut', 'calls', 'Outgoing Call Icon'],
  ['callPopupBg', 'calls', 'Call Popup Background'],
  ['callAnswerBg', 'calls', 'Answer Button'],
  ['callHangupBg', 'calls', 'Hang Up Button'],
  ['callStatusText', 'calls', 'Call Status Text'],

  ['panelBg', 'panel', 'Panel Background'],
  ['panelIcon', 'panel', 'Category Icon'],
  ['panelIconActive', 'panel', 'Category Icon (Active)'],
  ['panelStickerSetName', 'panel', 'Sticker Set Name'],
  ['panelSearchBg', 'panel', 'Search Field Background'],
  ['panelTrendingTitle', 'panel', 'Trending Header'],
];

for (let i = 1; i <= 8; i++) {
  SEMANTIC_DEFS.push([`peerColor${i}`, 'peers', `Peer ${i} Avatar`]);
  SEMANTIC_DEFS.push([`peerName${i}`, 'peers', `Peer ${i} Name`]);
}

export const SEMANTIC_LABELS: Record<string, string> = Object.fromEntries(
  SEMANTIC_DEFS.map(([k, , label]) => [k, label]),
);

export const SEMANTIC_CATEGORY: Record<string, string> = Object.fromEntries(
  SEMANTIC_DEFS.map(([k, cat]) => [k, cat]),
);

export const SEMANTIC_KEYS: string[] = SEMANTIC_DEFS.map(([k]) => k);

/**
 * Derive the full semantic palette from masters + user overrides.
 * `overrides` wins over every derived value, keyed by semantic key.
 */
export function deriveFullPalette(masters: Masters, overrides: Record<string, string> = {}): Palette {
  const M = masters;
  const dark = isDarkColor(M.masterBg);
  const out: Palette = {};
  const set = (key: string, val: string) => {
    out[key] = overrides[key] || val;
  };

  set('bgPrimary', M.masterBg);
  set('bgSecondary', mix(M.masterBg, M.masterSurface, 0.6));
  set('bgElevated', elevate(M.masterSurface, 6));
  set('bgChatList', M.masterChatList);
  set('bgInputPanel', M.masterInput);
  set('bgHover', elevate(out.bgPrimary, 4));
  set('bgActive', mix(M.masterAccent, out.bgPrimary, 0.86));
  set('bgOverlay', alphaFrac('#000000', dark ? 0.6 : 0.42));

  set('textPrimary', M.masterText);
  set('textSecondary', M.masterTextMuted);
  set('textTertiary', alphaFrac(M.masterTextMuted, 0.62));
  set('textLink', M.masterAccent);
  set('textOnAccent', pickReadableText(M.masterAccent));
  set('textDestructive', M.masterDestructive);
  set('textPositive', M.masterPositive);
  set('textDisabled', alphaFrac(M.masterText, 0.35));

  set('accentPrimary', M.masterAccent);
  set('accentHover', adjustLightness(M.masterAccent, dark ? 6 : -6));
  set('accentPressed', adjustLightness(M.masterAccent, dark ? -6 : 10));
  set('accentMuted', alphaFrac(M.masterAccent, 0.15));
  set('accentSecondary', M.masterAccent);
  set('onlineDot', M.masterOnline);

  set('headerBg', M.masterHeader);
  set('headerBgActive', elevate(M.masterHeader, 3));
  set('headerText', pickReadableText(M.masterHeader));
  set('headerSubtext', alphaFrac(out.headerText, 0.65));
  set('headerIcon', out.headerText);

  set('listBg', M.masterChatList);
  set('listBgHover', elevate(out.listBg, 4));
  set('listBgActive', mix(M.masterAccent, out.listBg, 0.82));
  set('listName', M.masterText);
  set('listNameActive', M.masterText);
  set('listMessage', M.masterTextMuted);
  set('listMessageActive', M.masterTextMuted);
  set('listDate', alphaFrac(M.masterTextMuted, 0.8));
  set('listDateActive', out.listDate);
  set('listUnreadBg', M.masterAccent);
  set('listUnreadText', pickReadableText(M.masterAccent));
  set('listUnreadMutedBg', alphaFrac(M.masterTextMuted, 0.4));
  set('listCheckSent', M.masterTextMuted);
  set('listCheckRead', M.masterAccent);
  set('listVerifiedBg', M.masterAccent);
  set('listVerifiedCheck', pickReadableText(M.masterAccent));

  set('bubbleInBg', M.masterBubbleIn);
  set('bubbleInBgSelected', mix(M.masterAccent, M.masterBubbleIn, 0.35));
  set('bubbleInText', pickReadableText(M.masterBubbleIn));
  set('bubbleInLink', ensureContrast(M.masterAccent, M.masterBubbleIn));
  set('bubbleInTime', alphaFrac(out.bubbleInText, 0.55));
  set('bubbleInReplyBar', M.masterAccent);
  set('bubbleInShadow', alphaFrac('#000000', 0.12));

  set('bubbleOutBg', M.masterBubbleOut);
  set('bubbleOutBgSelected', adjustLightness(M.masterBubbleOut, dark ? 6 : -6));
  set('bubbleOutText', pickReadableText(M.masterBubbleOut));
  set('bubbleOutLink', mix(pickReadableText(M.masterBubbleOut), M.masterAccent, 0.25));
  set('bubbleOutTime', alphaFrac(out.bubbleOutText, 0.6));
  set('bubbleOutCheckSent', alphaFrac(out.bubbleOutText, 0.6));
  set('bubbleOutCheckRead', out.bubbleOutText);
  set('bubbleOutReplyBar', out.bubbleOutText);
  set('bubbleOutShadow', alphaFrac('#000000', 0.15));

  set('inputBg', M.masterInput);
  set('inputBorder', elevate(M.masterInput, 8));
  set('inputBorderFocus', M.masterAccent);
  set('inputText', M.masterText);
  set('inputPlaceholder', M.masterTextMuted);
  set('inputIcon', M.masterTextMuted);
  set('inputSendIcon', M.masterAccent);

  set('divider', M.masterDivider);
  set('menuBg', elevate(M.masterSurface, 5));
  set('menuBgHover', elevate(out.menuBg, 4));
  set('menuText', M.masterText);
  set('menuIcon', M.masterTextMuted);
  set('scrollbar', alphaFrac(M.masterText, 0.25));
  set('overlayBackdrop', alphaFrac('#000000', 0.55));

  set('switchTrackOff', alphaFrac(M.masterText, 0.25));
  set('switchThumbOff', dark ? '#8B93A3' : '#FFFFFF');
  set('switchTrackOn', M.masterAccent);
  set('switchThumbOn', '#FFFFFF');
  set('checkboxUnchecked', alphaFrac(M.masterText, 0.35));
  set('checkboxBg', M.masterAccent);
  set('checkboxCheck', '#FFFFFF');
  set('radioChecked', M.masterAccent);

  for (let i = 1; i <= 8; i++) {
    const mk = `masterPeer${i}`;
    set(`peerColor${i}`, M[mk]);
    set(`peerName${i}`, ensureContrast(M[mk], out.bgPrimary, 2.2));
  }

  set('statusOnline', M.masterOnline);
  set('statusTyping', M.masterAccent);
  set('serviceBg', alphaFrac(M.masterServiceBg, dark ? 0.55 : 0.65));
  set('serviceText', '#FFFFFF');
  set('destructiveButton', M.masterDestructive);
  set('positiveButton', M.masterPositive);

  set('mediaButtonInBg', mix(M.masterAccent, out.bubbleInBg, 0.5));
  set('mediaButtonOutBg', adjustLightness(out.bubbleOutBg, dark ? 10 : -10));
  set('waveformInActive', M.masterAccent);
  set('waveformInInactive', alphaFrac(M.masterTextMuted, 0.35));
  set('waveformOutActive', out.bubbleOutText);
  set('waveformOutInactive', alphaFrac(out.bubbleOutText, 0.35));

  set('fileBgIn', mix(M.masterAccent, out.bubbleInBg, 0.55));
  set('fileBgOut', adjustLightness(out.bubbleOutBg, dark ? 12 : -12));
  set('fileIconIn', pickReadableText(out.fileBgIn));
  set('fileIconOut', pickReadableText(out.fileBgOut));
  set('fileNameIn', out.bubbleInText);
  set('fileNameOut', out.bubbleOutText);
  set('fileInfoIn', out.bubbleInTime);
  set('fileInfoOut', out.bubbleOutTime);

  set('forwardedNameIn', ensureContrast(M.masterAccent, M.masterBubbleIn));
  set('forwardedNameOut', mix(out.bubbleOutText, M.masterAccent, 0.2));
  set('replyNameIn', ensureContrast(M.masterAccent, M.masterBubbleIn));
  set('replyNameOut', out.bubbleOutText);
  set('replyTextIn', alphaFrac(out.bubbleInText, 0.72));
  set('replyTextOut', alphaFrac(out.bubbleOutText, 0.78));

  set('previewBarIn', M.masterAccent);
  set('previewTitleIn', ensureContrast(M.masterAccent, M.masterBubbleIn));
  set('previewBarOut', out.bubbleOutText);
  set('previewTitleOut', mix(out.bubbleOutText, M.masterAccent, 0.2));

  set('pinnedBarBg', elevate(M.masterHeader, 4));
  set('pinnedBarTitle', pickReadableText(out.pinnedBarBg));
  set('pinnedBarMessage', alphaFrac(out.pinnedBarTitle, 0.65));
  set('pinnedBarClose', alphaFrac(out.pinnedBarTitle, 0.55));

  set('adminBadgeText', M.masterAccent);
  set('unreadDividerBg', alphaFrac(M.masterAccent, 0.14));
  set('unreadDividerText', ensureContrast(M.masterAccent, out.bgPrimary));
  set('draftLabel', M.masterDestructive);
  set('mentionBadge', M.masterAccent);

  set('callIconIn', M.masterPositive);
  set('callIconInMissed', M.masterDestructive);
  set('callIconOut', M.masterPositive);
  set('callPopupBg', elevate(M.masterBg, dark ? -6 : 6));
  set('callAnswerBg', M.masterPositive);
  set('callHangupBg', M.masterDestructive);
  set('callStatusText', alphaFrac(pickReadableText(out.callPopupBg), 0.7));

  set('panelBg', M.masterSurface);
  set('panelIcon', M.masterTextMuted);
  set('panelIconActive', M.masterAccent);
  set('panelStickerSetName', M.masterTextMuted);
  set('panelSearchBg', elevate(M.masterSurface, 6));
  set('panelTrendingTitle', M.masterAccent);

  return out;
}
