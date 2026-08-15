/**
 * Slate — preview building blocks.
 *
 * Small pieces shared by both the mobile and desktop preview frames: bubbles,
 * voice notes, file bubbles, link previews, the pinned bar, demo contacts…
 * All colors are driven inline from the live `Palette` so the previews
 * re-render instantly as the user edits.
 */

import { useMemo } from 'react';
import { Pin, X } from 'lucide-react';

import type { Palette } from '../../lib/types';

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export interface DemoContact {
  name: string;
  peer: number;
  last: string;
  unread: number;
  time: string;
  online?: boolean;
  muted?: boolean;
  typing?: boolean;
}

export const DEMO_CONTACTS: DemoContact[] = [
  { name: 'Nora Chen', peer: 1, last: 'sent the files, check them out', unread: 3, time: '11:42', online: true },
  { name: 'Design Crew', peer: 4, last: 'Marcus: looks great honestly 🔥', unread: 0, time: '10:15', muted: true },
  { name: 'Yusuf Karim', peer: 5, last: 'Typing…', unread: 0, time: '09:58', typing: true },
  { name: 'Ari Osei', peer: 2, last: 'see you at 6', unread: 12, time: 'Tue' },
  { name: 'Saved Messages', peer: 8, last: 'theme-notes-v3.json', unread: 0, time: 'Mon' },
];

export function Waveform({
  colorActive,
  colorInactive,
  activeFrac = 0.4,
  seed = 1,
}: {
  colorActive: string;
  colorInactive: string;
  activeFrac?: number;
  seed?: number;
}) {
  const bars = useMemo(() => {
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: 26 }, () => 3 + rnd() * 13);
  }, [seed]);
  return (
    <div className="tg-waveform">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            height: h,
            background: i / bars.length < activeFrac ? colorActive : colorInactive,
          }}
        />
      ))}
    </div>
  );
}

export function TickMark({ color, double }: { color: string; double?: boolean }) {
  return (
    <svg
      width={double ? 15 : 11}
      height="10"
      viewBox="0 0 15 10"
      fill="none"
      style={{ display: 'inline-block' }}
    >
      <path d="M1 5.2L4.2 8.4L9.5 1.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {double && (
        <path d="M5.8 5.2L9 8.4L14.3 1.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function PinnedBar({ p }: { p: Palette }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 12px',
        background: p.pinnedBarBg,
        borderBottom: `1px solid ${p.divider}`,
      }}
    >
      <Pin size={13} color={p.pinnedBarTitle} style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: p.pinnedBarTitle }}>
          Pinned Message
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: p.pinnedBarMessage,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          theme-v3-final.attheme is ready for review
        </div>
      </div>
      <X size={13} color={p.pinnedBarClose} style={{ flexShrink: 0 }} />
    </div>
  );
}

export function UnreadDivider({ p }: { p: Palette }) {
  return (
    <div
      style={{
        textAlign: 'center',
        margin: '10px 0',
        fontSize: 10.5,
        fontWeight: 700,
        padding: '4px 0',
        background: p.unreadDividerBg,
        color: p.unreadDividerText,
        borderRadius: 6,
      }}
    >
      3 new messages
    </div>
  );
}

export function GroupSenderBubble({
  p,
  name,
  nameColor,
  text,
  time,
}: {
  p: Palette;
  name: string;
  nameColor: string;
  text: string;
  time: string;
}) {
  return (
    <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
      <div className="tg-bubble in" style={{ background: p.bubbleInBg, color: p.bubbleInText }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: nameColor, marginBottom: 2 }}>
          {name}
        </div>
        {text}
        <span className="tg-bubble-time" style={{ color: p.bubbleInTime }}>
          {time}
        </span>
      </div>
    </div>
  );
}

export function ForwardedBubble({ p }: { p: Palette }) {
  return (
    <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
      <div className="tg-bubble out" style={{ background: p.bubbleOutBg, color: p.bubbleOutText }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: p.forwardedNameOut,
            marginBottom: 3,
            opacity: 0.9,
          }}
        >
          Forwarded from Design Crew
        </div>
        Check the accent contrast on this one, looks solid across both bubbles
        <span className="tg-bubble-time" style={{ color: p.bubbleOutTime }}>
          11:43 <TickMark color={p.bubbleOutCheckSent} double />
        </span>
      </div>
    </div>
  );
}

export function FileBubble({ p }: { p: Palette }) {
  return (
    <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
      <div
        className="tg-bubble in"
        style={{
          background: p.bubbleInBg,
          padding: '9px 11px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          maxWidth: '78%',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: p.fileBgIn,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="15" viewBox="0 0 13 15" fill="none" stroke={p.fileIconIn} strokeWidth="1.3">
            <path d="M1 1h7l4 4v9H1V1z" />
            <path d="M8 1v4h4" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: p.fileNameIn,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            theme-v3-final.attheme
          </div>
          <div style={{ fontSize: 10.5, color: p.fileInfoIn, marginTop: 1 }}>14.2 KB</div>
        </div>
      </div>
    </div>
  );
}

export function LinkPreviewBubble({ p }: { p: Palette }) {
  return (
    <div className="tg-bubble-row" style={{ justifyContent: 'flex-end' }}>
      <div className="tg-bubble out" style={{ background: p.bubbleOutBg, color: p.bubbleOutText }}>
        <div style={{ borderLeft: `2.5px solid ${p.previewBarOut}`, paddingLeft: 7, marginBottom: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: p.previewTitleOut }}>
            core.telegram.org
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.85 }}>
            Telegram APIs — Bot API, themes &amp; more
          </div>
        </div>
        docs are linked below, worth a skim before we finalize
        <span className="tg-bubble-time" style={{ color: p.bubbleOutTime }}>
          11:44
        </span>
      </div>
    </div>
  );
}

export function CallLogRow({ p, missed }: { p: Palette; missed?: boolean }) {
  return (
    <div className="tg-bubble-row" style={{ justifyContent: 'flex-start' }}>
      <div
        className="tg-bubble in"
        style={{ background: p.bubbleInBg, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke={missed ? p.callIconInMissed : p.callIconIn}
          strokeWidth="2"
        >
          <path
            d={missed ? 'M14 6l-6 6M8 6l6 6' : 'M6 12l4-4 4 4'}
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: 12.5, color: p.bubbleInText }}>
          {missed ? 'Missed call' : 'Voice call'} · 4:12
        </span>
      </div>
    </div>
  );
}

export function EmojiTray({ p }: { p: Palette }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '6px 12px 2px',
        justifyContent: 'space-around',
      }}
    >
      {['😊', '😂', '❤️', '👍', '🎨'].map((e, i) => (
        <span
          key={i}
          style={{
            fontSize: 15,
            opacity: i === 2 ? 1 : 0.55,
            filter: i === 2 ? `drop-shadow(0 0 0 ${p.panelIconActive})` : undefined,
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}
