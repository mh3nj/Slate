/**
 * Slate — desktop preview.
 *
 * A mock Telegram Desktop window (chat list + active chat) mirroring the same
 * live palette, so a theme can be sanity-checked across both platforms.
 */

import { Search } from 'lucide-react';

import { wallpaperCssBackground } from '../../lib/wallpaper';
import type { Palette, Wallpaper } from '../../lib/types';
import {
  CallLogRow,
  DEMO_CONTACTS,
  EmojiTray,
  FileBubble,
  ForwardedBubble,
  GroupSenderBubble,
  initials,
  LinkPreviewBubble,
  PinnedBar,
  TickMark,
  UnreadDivider,
  Waveform,
} from './PreviewBits';

interface PreviewDesktopProps {
  p: Palette;
  wallpaper: Wallpaper;
}

export function PreviewDesktop({ p, wallpaper }: PreviewDesktopProps) {
  return (
    <div className="tg-desktop-frame" style={{ background: p.bgPrimary }}>
      <div
        className="tg-dtitlebar"
        style={{
          background: p.headerBgActive,
          color: p.headerText,
          borderBottom: `1px solid ${p.divider}`,
        }}
      >
        <span className="dot" style={{ background: p.destructiveButton }} />
        <span className="dot" style={{ background: p.positiveButton, opacity: 0.5 }} />
        <span className="dot" style={{ background: p.textTertiary, opacity: 0.5 }} />
        <span style={{ marginLeft: 8, opacity: 0.85 }}>Telegram</span>
      </div>
      <div className="tg-dbody">
        <div className="tg-dlist" style={{ background: p.listBg, borderColor: p.divider }}>
          <div className="tg-dlist-search" style={{ background: p.bgHover, color: p.textTertiary }}>
            <Search size={12} style={{ marginRight: 6 }} /> Search
          </div>
          <div className="tg-dlist-scroll">
            {DEMO_CONTACTS.map((c, i) => {
              const active = i === 0;
              const peerColor = p[`peerColor${c.peer}`];
              return (
                <div
                  key={c.name}
                  className="tg-dchat-item"
                  style={{ background: active ? p.listBgActive : 'transparent' }}
                >
                  <div className="tg-dchat-avatar" style={{ background: peerColor, color: '#fff' }}>
                    {initials(c.name)}
                  </div>
                  <div className="tg-dchat-main">
                    <div className="tg-dchat-row1">
                      <span
                        className="tg-dchat-name"
                        style={{ color: active ? p.listNameActive : p.listName }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="tg-dchat-date"
                        style={{ color: active ? p.listDateActive : p.listDate }}
                      >
                        {c.time}
                      </span>
                    </div>
                    <div className="tg-dchat-row2">
                      <span
                        className="tg-dchat-msg"
                        style={{
                          color: active ? p.listMessageActive : c.typing ? p.statusTyping : p.listMessage,
                        }}
                      >
                        {c.name === 'Design Crew' && (
                          <b style={{ color: p.adminBadgeText, fontWeight: 700 }}>Admin </b>
                        )}
                        {c.name === 'Ari Osei' && (
                          <span style={{ color: p.draftLabel, fontWeight: 700 }}>Draft: </span>
                        )}
                        {c.last}
                      </span>
                      {c.unread > 0 && (
                        <span
                          className="tg-dchat-badge"
                          style={{
                            background: c.muted ? p.listUnreadMutedBg : p.listUnreadBg,
                            color: p.listUnreadText,
                          }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tg-dmain">
          <div className="tg-dheader" style={{ background: p.headerBg, borderColor: p.divider }}>
            <div
              className="tg-dchat-avatar"
              style={{ width: 34, height: 34, fontSize: 11, background: p.peerColor1, color: '#fff' }}
            >
              NC
            </div>
            <div>
              <div className="tg-dheader-name" style={{ color: p.headerText }}>
                Nora Chen
              </div>
              <div className="tg-dheader-status" style={{ color: p.statusOnline }}>
                online
              </div>
            </div>
          </div>

          <PinnedBar p={p} />

          <div className="tg-dchat-body" style={wallpaperCssBackground(wallpaper, p)}>
            <div className="tg-service-pill" style={{ background: p.serviceBg, color: p.serviceText }}>
              Today
            </div>

            <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
              <div className="tg-bubble in" style={{ background: p.bubbleInBg, color: p.bubbleInText }}>
                Hey! Just pushed the new theme build — colors feel a lot more cohesive now 🎨
                <span className="tg-bubble-time" style={{ color: p.bubbleInTime }}>
                  11:40
                </span>
              </div>
            </div>
            <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
              <div className="tg-bubble out" style={{ background: p.bubbleOutBg, color: p.bubbleOutText }}>
                Looks incredible — the accent really pops against {'{'}bubbleOutBg{'}'}
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
                <Waveform colorActive={p.waveformInActive} colorInactive={p.waveformInInactive} activeFrac={0.5} seed={3} />
                <span style={{ fontSize: 10.5, color: p.bubbleInTime, flexShrink: 0 }}>0:22</span>
              </div>
            </div>
            <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
              <div className="tg-bubble out" style={{ background: p.bubbleOutBg, color: p.bubbleOutText }}>
                sent the files, check them out —{' '}
                <span style={{ color: p.bubbleOutLink, textDecoration: 'underline' }}>
                  theme-v3.tdesktop-theme
                </span>
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
          <div className="tg-dcompose" style={{ background: p.bgInputPanel }}>
            <span style={{ color: p.inputIcon, fontSize: 16 }}>😊</span>
            <div
              className="tg-dcompose-field"
              style={{
                background: p.inputBg,
                color: p.inputPlaceholder,
                border: `1px solid ${p.inputBorder}`,
              }}
            >
              Write a message…
            </div>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: p.inputSendIcon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill={p.textOnAccent}>
                <path d="M2 10L18 2L11 18L9 11L2 10Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
