/**
 * Slate — mobile preview.
 *
 * A pixel-accurate phone frame rendering a mock Telegram chat whose every
 * color comes from the live palette. This is the primary "what will this
 * theme look like on my phone?" view.
 */

import { ChevronRight, MoreHorizontal, Search, Smartphone } from 'lucide-react';

import { wallpaperCssBackground } from '../../lib/wallpaper';
import type { Palette, Wallpaper } from '../../lib/types';
import {
  CallLogRow,
  EmojiTray,
  FileBubble,
  ForwardedBubble,
  GroupSenderBubble,
  LinkPreviewBubble,
  PinnedBar,
  TickMark,
  UnreadDivider,
  Waveform,
} from './PreviewBits';

interface PreviewMobileProps {
  p: Palette;
  wallpaper: Wallpaper;
}

export function PreviewMobile({ p, wallpaper }: PreviewMobileProps) {
  return (
    <div className="tg-mobile-frame">
      <div className="tg-notch" />
      <div className="tg-mobile-screen" style={{ background: p.bgPrimary, color: p.textPrimary }}>
        <div className="tg-mheader" style={{ background: p.headerBg }}>
          <ChevronRight size={19} color={p.headerIcon} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
          <div className="tg-mavatar" style={{ background: p.peerColor1, color: '#fff' }}>
            NC
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="tg-mheader-name" style={{ color: p.headerText }}>
              Nora Chen
            </div>
            <div className="tg-mheader-status" style={{ color: p.statusOnline }}>
              online
            </div>
          </div>
          <div className="tg-mheader-icons">
            <Search size={16} color={p.headerIcon} />
            <MoreHorizontal size={17} color={p.headerIcon} />
          </div>
        </div>

        <PinnedBar p={p} />

        <div className="tg-mbody" style={wallpaperCssBackground(wallpaper, p)}>
          <div className="tg-service-pill" style={{ background: p.serviceBg, color: p.serviceText }}>
            Today
          </div>

          <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
            <div
              className="tg-bubble in"
              style={{
                background: p.bubbleInBg,
                color: p.bubbleInText,
                boxShadow: `0 1px 1px ${p.bubbleInShadow}`,
              }}
            >
              Hey! Just pushed the new theme build — colors feel a lot more cohesive now 🎨
              <span className="tg-bubble-time" style={{ color: p.bubbleInTime }}>
                11:40
              </span>
            </div>
          </div>

          <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
            <div
              className="tg-bubble out"
              style={{
                background: p.bubbleOutBg,
                color: p.bubbleOutText,
                boxShadow: `0 1px 1px ${p.bubbleOutShadow}`,
              }}
            >
              <div className="tg-bubble-reply" style={{ borderColor: p.bubbleOutReplyBar }}>
                <b style={{ color: p.bubbleOutReplyBar }}>Nora Chen</b>
                <span style={{ opacity: 0.85 }}>the new theme build</span>
              </div>
              Looks incredible, love the accent on the outgoing bubbles
              <span className="tg-bubble-time" style={{ color: p.bubbleOutTime }}>
                11:41 <TickMark color={p.bubbleOutCheckSent} double />
              </span>
            </div>
          </div>

          <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
            <div className="tg-voice-bubble" style={{ background: p.bubbleInBg }}>
              <div className="tg-voice-btn" style={{ background: p.mediaButtonInBg }}>
                <svg width="11" height="13" viewBox="0 0 11 13" fill={p.bubbleInText}>
                  <path d="M0 0L11 6.5L0 13V0Z" />
                </svg>
              </div>
              <Waveform colorActive={p.waveformInActive} colorInactive={p.waveformInInactive} activeFrac={0.35} seed={7} />
              <span style={{ fontSize: 10.5, color: p.bubbleInTime, flexShrink: 0 }}>0:14</span>
            </div>
          </div>

          <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
            <div className="tg-bubble out" style={{ background: p.bubbleOutBg, color: p.bubbleOutText }}>
              sent the files, check them out —{' '}
              <span style={{ color: p.bubbleOutLink, textDecoration: 'underline' }}>theme-v3.attheme</span>
              <span className="tg-bubble-time" style={{ color: p.bubbleOutTime }}>
                11:42 <TickMark color={p.bubbleOutCheckRead} double />
              </span>
            </div>
          </div>

          <FileBubble p={p} />
          <LinkPreviewBubble p={p} />
          <ForwardedBubble p={p} />
          <UnreadDivider p={p} />
          <GroupSenderBubble p={p} name="Marcus" nameColor={p.peerName4} text="pushed a hotfix for the compose bar border" time="11:47" />
          <CallLogRow p={p} missed />
        </div>

        <EmojiTray p={p} />
        <div className="tg-minput" style={{ background: p.bgInputPanel }}>
          <div className="tg-minput-icon-btn">
            <Smartphone size={0} />
          </div>
          <span style={{ color: p.inputIcon, fontSize: 17, lineHeight: 0 }}>😊</span>
          <div
            className="tg-minput-field"
            style={{
              background: p.inputBg,
              color: p.inputPlaceholder,
              border: `1px solid ${p.inputBorder}`,
            }}
          >
            Message
          </div>
          <div className="tg-minput-icon-btn" style={{ background: p.inputSendIcon }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill={p.textOnAccent}>
              <path d="M2 10L18 2L11 18L9 11L2 10Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
