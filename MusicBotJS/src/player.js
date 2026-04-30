/**
 * Per-guild MusicPlayer: manages connection, queue, audio resource lifecycle.
 *
 * Uses @discordjs/voice 0.19+ which has native libdave-backed DAVESession,
 * so we DO NOT have to deal with Lavalink/koe MLS handshake bugs.
 */
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  getVoiceConnection,
} from '@discordjs/voice';
import { openTrackStream } from './resolver.js';

export const LoopMode = Object.freeze({
  NONE: 'none',
  TRACK: 'track',
  QUEUE: 'queue',
});

export class MusicPlayer {
  constructor(guildId, opts = {}) {
    this.guildId = guildId;
    this.queue = [];
    this.current = null;
    this.volume = (opts.defaultVolume ?? 70) / 100;
    this.maxQueue = opts.maxQueueLength ?? 100;
    this.idleSeconds = opts.idleDisconnectSeconds ?? 300;
    this.loopMode = LoopMode.NONE;
    this.connection = null;
    this._textChannel = null; // last channel that ran /play, used for now-playing announcements
    this._idleTimer = null;
    this._hooks = {
      onTrackStart: null,
      onTrackError: null,
      onIdleDisconnect: null,
    };

    this.audio = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    this.audio.on(AudioPlayerStatus.Idle, () => {
      // Track ended naturally → advance the queue
      this._advance().catch((err) => {
        console.error('player advance failed:', err);
      });
    });
    this.audio.on('error', (err) => {
      console.error(`audio player error (guild=${this.guildId}):`, err.message);
      const cur = this.current;
      this.current = null;
      if (cur && this._hooks.onTrackError) {
        try { this._hooks.onTrackError(cur, err); } catch {}
      }
      // Try to keep going with the next track
      this._advance().catch(() => {});
    });
  }

  on(event, fn) {
    this._hooks[event] = fn;
  }

  setTextChannel(channel) {
    this._textChannel = channel;
  }

  get textChannel() {
    return this._textChannel;
  }

  // ----- connection -----

  async connect(voiceChannel) {
    const existing = getVoiceConnection(this.guildId);
    if (existing && existing.joinConfig.channelId === voiceChannel.id) {
      this.connection = existing;
    } else {
      // self_deaf=false so the bot doesn't show the "Deafened" icon
      const conn = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: this.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });
      conn.on('error', (err) => {
        console.error(`voice connection error (guild=${this.guildId}):`, err.message);
      });
      conn.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
            entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          try { conn.destroy(); } catch {}
        }
      });
      try {
        await entersState(conn, VoiceConnectionStatus.Ready, 30_000);
      } catch (err) {
        try { conn.destroy(); } catch {}
        throw err;
      }
      conn.subscribe(this.audio);
      this.connection = conn;
    }
    return this.connection;
  }

  disconnect() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
    this.queue = [];
    this.current = null;
    this.audio.stop(true);
    if (this.connection) {
      try { this.connection.destroy(); } catch {}
      this.connection = null;
    }
  }

  // ----- queue management -----

  enqueue(tracks) {
    let added = 0;
    for (const t of tracks) {
      if (this.queue.length + (this.current ? 1 : 0) >= this.maxQueue) break;
      this.queue.push(t);
      added += 1;
    }
    return added;
  }

  skip() {
    // Force the audio player to stop the current resource; the Idle handler
    // will advance to the next.
    this.audio.stop(true);
  }

  pause() {
    return this.audio.pause(true);
  }

  resume() {
    return this.audio.unpause();
  }

  setVolume(pct) {
    const v = Math.max(0, Math.min(200, pct)) / 100;
    this.volume = v;
    if (this.audio.state.status !== AudioPlayerStatus.Idle) {
      const r = this.audio.state.resource;
      if (r && r.volume && typeof r.volume.setVolume === 'function') {
        r.volume.setVolume(v);
      }
    }
  }

  setLoopMode(mode) {
    if (Object.values(LoopMode).includes(mode)) {
      this.loopMode = mode;
    }
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  clear() {
    const n = this.queue.length;
    this.queue = [];
    return n;
  }

  // ----- playback -----

  /**
   * Start playing if idle. Should be called after enqueue() has added tracks.
   */
  async start() {
    if (this.current) return false; // already playing
    return this._advance();
  }

  async _advance() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }

    // Loop logic
    if (this.loopMode === LoopMode.TRACK && this.current) {
      const t = this.current;
      this.current = null;
      return this._play(t);
    }

    const finished = this.current;
    this.current = null;
    if (this.loopMode === LoopMode.QUEUE && finished) {
      this.queue.push(finished);
    }

    const next = this.queue.shift();
    if (!next) {
      this._scheduleIdleDisconnect();
      return false;
    }
    return this._play(next);
  }

  async _play(track) {
    try {
      const stream = await openTrackStream(track);
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary, // let ffmpeg/prism handle decoding
        inlineVolume: true,
      });
      if (resource.volume) resource.volume.setVolume(this.volume);
      this.current = track;
      this.audio.play(resource);
      if (this._hooks.onTrackStart) {
        try { this._hooks.onTrackStart(track); } catch (err) {
          console.warn('onTrackStart hook failed:', err.message);
        }
      }
      return true;
    } catch (err) {
      console.error(`failed to play track ${track?.title}:`, err.message);
      if (this._hooks.onTrackError) {
        try { this._hooks.onTrackError(track, err); } catch {}
      }
      // try next one
      return this._advance();
    }
  }

  _scheduleIdleDisconnect() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      console.log(`[player] idle disconnect for guild ${this.guildId}`);
      this.disconnect();
      if (this._hooks.onIdleDisconnect) {
        try { this._hooks.onIdleDisconnect(); } catch {}
      }
    }, this.idleSeconds * 1000);
  }

  snapshot() {
    return {
      current: this.current,
      queue: [...this.queue],
      volume: this.volume,
      loopMode: this.loopMode,
      paused: this.audio.state.status === AudioPlayerStatus.Paused,
      playing: this.audio.state.status === AudioPlayerStatus.Playing,
    };
  }
}

const players = new Map();
let _hooksFactory = null;

/**
 * Register a function that wires up hooks on every MusicPlayer the bot creates,
 * including ones created later (e.g. after /stop or /leave drops the previous
 * instance). Without this, hooks installed once at ClientReady are silently
 * lost the first time dropPlayer() runs.
 */
export function setPlayerHooksFactory(factory) {
  _hooksFactory = factory;
  for (const p of players.values()) {
    try { factory(p); } catch (err) { console.warn('hooks factory failed:', err?.message); }
  }
}

export function getPlayer(guildId, opts) {
  let p = players.get(guildId);
  if (!p) {
    p = new MusicPlayer(guildId, opts);
    players.set(guildId, p);
    if (_hooksFactory) {
      try { _hooksFactory(p); } catch (err) { console.warn('hooks factory failed:', err?.message); }
    }
  }
  return p;
}

export function dropPlayer(guildId) {
  const p = players.get(guildId);
  if (p) {
    try { p.disconnect(); } catch {}
    players.delete(guildId);
  }
}
