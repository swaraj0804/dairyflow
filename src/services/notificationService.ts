import {
  getStoredNotificationSettings,
  saveStoredNotificationSettings,
  type ShiftNotificationSettings,
  localDb
} from '../db/indexedDb';
import type { MilkInwardEntry } from '../types';

export class NotificationScheduler {
  private timer: number | null = null;
  private settings: ShiftNotificationSettings | null = null;

  constructor() {
    this.init();
  }

  public async init() {
    this.settings = await getStoredNotificationSettings();
    this.startScheduleLoop();
  }

  public async getSettings(): Promise<ShiftNotificationSettings> {
    if (!this.settings) {
      this.settings = await getStoredNotificationSettings();
    }
    return this.settings;
  }

  public async updateSettings(newSettings: Partial<ShiftNotificationSettings>): Promise<ShiftNotificationSettings> {
    this.settings = await saveStoredNotificationSettings(newSettings);
    return this.settings;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Plays a pleasant dairy reminder chime using Web Audio API
   */
  public playReminderChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play a warm two-tone chime (E5 -> G#5)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(659.25, now, 0.45); // E5
      playTone(830.61, now + 0.22, 0.65); // G#5
    } catch (e) {
      // Audio autoplay may be constrained; silently ignore
    }
  }

  /**
   * Fires a browser notification and optional chime
   */
  public async sendNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (Notification.permission !== 'granted') {
      const res = await this.requestPermission();
      if (res !== 'granted') return false;
    }

    try {
      if (this.settings?.soundEnabled) {
        this.playReminderChime();
      }

      // Trigger device haptics if supported
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // Ignore vibration permission issues
        }
      }

      // Check if service worker registration is available
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: 'dairyflow-milk-reminder',
            ...options
          } as NotificationOptions);
          return true;
        }
      }

      // Fallback to standard window Notification
      new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options
      });
      return true;
    } catch (err) {
      console.warn('Failed to display browser notification:', err);
      return false;
    }
  }

  /**
   * Sends an immediate test reminder so user can verify permissions and audio
   */
  public async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return { success: false, message: 'Browser notifications are not supported on this device/browser.' };
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission was denied. Please allow notifications in your browser settings.' };
    }

    const sent = await this.sendNotification('DairyFlow Milk Reminder 🥛', {
      body: 'Morning/Evening reminder test succeeded! You will receive prompt alerts when shift collection begins.',
      tag: 'dairyflow-test-reminder',
      requireInteraction: false
    });

    if (sent) {
      return { success: true, message: 'Notification sent successfully!' };
    }
    return { success: false, message: 'Unable to display notification.' };
  }

  /**
   * Starts the background scheduler loop checking every 30 seconds
   */
  private startScheduleLoop() {
    if (typeof window === 'undefined') return;
    if (this.timer) clearInterval(this.timer);
    
    // Immediate check
    this.checkShiftReminders();

    // Check every 30 seconds
    this.timer = window.setInterval(() => {
      this.checkShiftReminders();
    }, 30000);
  }

  /**
   * Compares the current local time with configured morning and evening shift reminder times
   */
  public async checkShiftReminders(): Promise<void> {
    if (!this.settings) {
      this.settings = await getStoredNotificationSettings();
    }
    if (!this.settings) return;

    // Must have granted permission
    if (this.getPermissionStatus() !== 'granted') return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // 1. Check Morning Shift
    if (this.settings.morningEnabled) {
      if (this.settings.lastMorningNotifiedDate !== todayStr) {
        if (currentTimeStr >= this.settings.morningTime && now.getHours() < 13) {
          // Check if smart check is enabled: is morning shift already logged today?
          let shouldNotify = true;
          if (this.settings.smartCheckEnabled) {
            const morningEntries = await localDb.milkInward
              .where('date')
              .equals(todayStr)
              .filter(e => e.shift === 'Morning')
              .count();
            if (morningEntries > 0) {
              shouldNotify = false;
            }
          }

          if (shouldNotify) {
            await this.sendNotification('Morning Milk Collection Reminder 🌅', {
              body: 'Morning shift collection is open! Remember to record liters, fat%, and SNF readings.',
              tag: `morning-reminder-${todayStr}`,
              requireInteraction: true
            });
          }

          // Mark today as notified for morning
          await this.updateSettings({ lastMorningNotifiedDate: todayStr });
        }
      }
    }

    // 2. Check Evening Shift
    if (this.settings.eveningEnabled) {
      if (this.settings.lastEveningNotifiedDate !== todayStr) {
        if (currentTimeStr >= this.settings.eveningTime && now.getHours() >= 13) {
          let shouldNotify = true;
          if (this.settings.smartCheckEnabled) {
            const eveningEntries = await localDb.milkInward
              .where('date')
              .equals(todayStr)
              .filter(e => e.shift === 'Evening')
              .count();
            if (eveningEntries > 0) {
              shouldNotify = false;
            }
          }

          if (shouldNotify) {
            await this.sendNotification('Evening Milk Collection Reminder 🌇', {
              body: 'Evening shift collection has begun! Record evening milk inward and quality metrics.',
              tag: `evening-reminder-${todayStr}`,
              requireInteraction: true
            });
          }

          // Mark today as notified for evening
          await this.updateSettings({ lastEveningNotifiedDate: todayStr });
        }
      }
    }
  }

  public getNextReminderDetails(): { shift: 'Morning' | 'Evening'; timeStr: string; isToday: boolean } | null {
    if (!this.settings) return null;
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    if (this.settings.morningEnabled && currentTimeStr < this.settings.morningTime) {
      return { shift: 'Morning', timeStr: this.settings.morningTime, isToday: true };
    }

    if (this.settings.eveningEnabled && currentTimeStr < this.settings.eveningTime) {
      return { shift: 'Evening', timeStr: this.settings.eveningTime, isToday: true };
    }

    if (this.settings.morningEnabled) {
      return { shift: 'Morning', timeStr: this.settings.morningTime, isToday: false };
    }

    if (this.settings.eveningEnabled) {
      return { shift: 'Evening', timeStr: this.settings.eveningTime, isToday: false };
    }

    return null;
  }
}

export const notificationScheduler = new NotificationScheduler();
