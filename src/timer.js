export const WORK_DURATION = 25 * 60;   // seconds
export const BREAK_DURATION = 5 * 60;
export const LONG_BREAK = 15 * 60;

export class PomodoroTimer {
  constructor(onTick, onSessionEnd) {
    this.onTick = onTick;
    this.onSessionEnd = onSessionEnd;

    this.remaining = WORK_DURATION;
    this.running = false;
    this.isBreak = false;
    this.completedPomodoros = 0;
    this._elapsed = 0;
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  reset() {
    this.running = false;
    this.isBreak = false;
    this.remaining = WORK_DURATION;
    this._elapsed = 0;
    this.onTick(this.minutes, this.seconds, this.isBreak);
  }

  get minutes() { return Math.floor(this.remaining / 60); }
  get seconds() { return this.remaining % 60; }
  get progress() {
    const total = this.isBreak
      ? (this.completedPomodoros % 4 === 0 ? LONG_BREAK : BREAK_DURATION)
      : WORK_DURATION;
    return 1 - this.remaining / total;
  }

  update(dt) {
    if (!this.running) return;
    this._elapsed += dt;
    if (this._elapsed >= 1) {
      this._elapsed -= 1;
      this.remaining = Math.max(0, this.remaining - 1);
      this.onTick(this.minutes, this.seconds, this.isBreak);
      if (this.remaining === 0) this._end();
    }
  }

  _end() {
    this.running = false;
    if (!this.isBreak) {
      this.completedPomodoros++;
      this.isBreak = true;
      this.remaining = this.completedPomodoros % 4 === 0 ? LONG_BREAK : BREAK_DURATION;
    } else {
      this.isBreak = false;
      this.remaining = WORK_DURATION;
    }
    this.onSessionEnd(this.isBreak, this.completedPomodoros);
  }
}
