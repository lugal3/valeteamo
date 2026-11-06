// Audio original sintetizado. Todo comienza después del botón Jugar.
export class Sound {
    ctx?: AudioContext;
    muted = false;
    timer?: number;
    step = 0;
    start() { try {
        this.ctx ??= new AudioContext();
        void this.ctx.resume();
        if (!this.timer)
            this.timer = window.setInterval(() => { const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 392]; this.tone(notes[this.step++ % 8], .35, .025, 'sine'); }, 420);
    }
    catch { } }
    tone(f = 440, d = .1, v = .06, type: OscillatorType = 'sine') { try {
        if (!this.ctx || this.muted || this.ctx.state !== 'running')
            return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + d);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + d);
    }
    catch { } }
    destroy() { clearInterval(this.timer); void this.ctx?.close(); }
}
