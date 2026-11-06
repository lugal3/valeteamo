import { buildArt } from './art';
import Phaser from 'phaser';
import { CONFIG as C, ROOMS, ITEMS } from './config';
import { Sound } from './audio';
type Mob = {
    s: Phaser.GameObjects.Sprite;
    hp: number;
    type: string;
    next: number;
    phase: number;
};
type Shot = {
    s: Phaser.GameObjects.Arc;
    vx: number;
    vy: number;
    life: number;
    enemy: boolean;
    damage: number;
    home: boolean;
};
type Stick = {
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
};
export class Garden extends Phaser.Scene {
    audio = new Sound();
    ui: (h: any) => void;
    finish: (e: string) => void;
    g!: Phaser.GameObjects.Graphics;
    fx!: Phaser.GameObjects.Graphics;
    player!: Phaser.GameObjects.Sprite;
    keys: any;
    room = 0;
    clock = 0;
    paused = false;
    ended = false;
    hp = C.hp;
    coins = C.coins;
    bombs = C.bombs;
    keyCount = C.keys;
    charge = true;
    roomsSinceUse = 0;
    activeItem = 'poop';
    brim = false;
    mantle = false;
    shield = false;
    inv = 0;
    last = 0;
    charging = 0;
    gate = 0;
    unlocked = false;
    hatchReady = false;
    message = '';
    until = 0;
    cleared = new Set<number>();
    visited = new Set<number>();
    mobs: Mob[] = [];
    shots: Shot[] = [];
    loot: {
        s: Phaser.GameObjects.Container;
        type: string;
        cost: number;
    }[] = [];
    piles: Phaser.GameObjects.Sprite[] = [];
    bombList: {
        s: Phaser.GameObjects.Sprite;
        t: number;
    }[] = [];
    zones: {
        x: number;
        y: number;
        t: number;
    }[] = [];
    left?: Stick;
    right?: Stick;
    mouse = false;
    decor: Phaser.GameObjects.GameObject[] = [];
    constructor(ui: (h: any) => void, finish: (e: string) => void) { super('garden'); this.ui = ui; this.finish = finish; }
    create() { buildArt(this); this.g = this.add.graphics(); this.fx = this.add.graphics().setDepth(40); this.player = this.add.sprite(480, 290, 'kitty').setScale(2.4).setDepth(20); this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,B,SPACE,ESC'); this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.paused || this.ended)
        return; if (p.wasTouch) {
        const s = { id: p.id, x: p.x, y: p.y, dx: 0, dy: 0 };
        if (p.x < 480 && !this.left)
            this.left = s;
        else if (p.x >= 480 && !this.right)
            this.right = s;
    }
    else
        this.mouse = true; }); this.input.on('pointermove', (p: Phaser.Input.Pointer) => { for (const s of [this.left, this.right])
        if (s?.id === p.id) {
            s.dx = p.x - s.x;
            s.dy = p.y - s.y;
        } }); this.input.on('pointerup', (p: Phaser.Input.Pointer) => { if (this.left?.id === p.id)
        this.left = undefined; if (this.right?.id === p.id)
        this.right = undefined; this.mouse = false; }); this.game.canvas.addEventListener('pointercancel', () => this.clearInput()); this.input.keyboard!.on('keydown-B', () => this.bomb()); this.input.keyboard!.on('keydown-SPACE', () => this.active()); this.input.keyboard!.on('keydown-ESC', () => document.querySelector<HTMLButtonElement>('[aria-label="Pausa"]')?.click()); this.audio.start(); this.enter(0); }
    clearInput() { this.left = this.right = undefined; this.mouse = false; this.charging = 0; if (this.keys)
        Object.values(this.keys).forEach((k: any) => k.reset()); this.fx?.clear(); }
    setPaused(p: boolean) { this.paused = p; this.clearInput(); if (p)
        void this.audio.ctx?.suspend();
    else
        void this.audio.ctx?.resume(); }
    restartRun() { this.hp = C.hp; this.coins = C.coins; this.bombs = C.bombs; this.keyCount = C.keys; this.charge = true; this.inv = 0; this.activeItem = 'poop'; this.brim = this.mantle = this.unlocked = this.ended = false; this.cleared.clear(); this.visited.clear(); this.setPaused(false); this.enter(0); }
    say(s: string) { this.message = s; this.until = this.clock + 6500; this.sync(); }
    sync() { this.ui({ hearts: [0, 1, 2].map(i => this.hp >= i * 2 + 2 ? ['♥', '♡', '♥'][i] : this.hp === i * 2 + 1 ? '◐' : '·').join(' '), coins: this.coins, bombs: this.bombs, keys: this.keyCount, active: this.activeItem, charge: this.charge, room: ROOMS[this.room].name, message: this.message }); }
    enter(n: number, from = '') { this.clearInput(); [...this.mobs.map(m => m.s), ...this.shots.map(s => s.s), ...this.loot.map(l => l.s), ...this.piles, ...this.bombList.map(b => b.s), ...this.decor].forEach(s => s.destroy()); this.mobs = []; this.shots = []; this.loot = []; this.piles = []; this.bombList = []; this.decor = []; this.zones = []; this.room = n; this.hatchReady = false; this.visited.add(n); this.shield = this.mantle; this.gate = this.clock + 700; this.player.setPosition(from === 'left' ? 112 : from === 'right' ? 848 : 480, from === 'up' ? 144 : from === 'down' ? 414 : 290); this.draw(); const kind = ROOMS[n].kind; if (!this.cleared.has(n)) {
        if (kind === 'fight')
            for (let i = 0; i < 4; i++)
                this.spawn((i + n) % 2 ? 'kuromi' : 'cinna', 330 + i * 95, 220 + (i % 2) * 105);
        if (kind === 'boss')
            this.spawn('boss', 650, 240);
        if (kind === 'treasure')
            this.drop('brim', 480, 280);
    } if (kind === 'shop') {
        if (this.activeItem !== 'head')
            this.drop('head', 395, 260, 5);
        if (!this.mantle)
            this.drop('mantle', 580, 260, 7);
    } this.say(kind === 'start' ? 'Explora el jardín · Las puertas se abren al limpiar cada sala' : kind === 'shop' ? 'Acércate para comprar · Cabeza 5 ✦ · Manto 7 ✦' : kind === 'boss' ? 'Mega Kuromi · ¡Cuidado con las señales rosas!' : ''); }
    draw() {
        const g = this.g;
        g.clear();
        g.fillStyle(0xf1dfca);
        g.fillRect(0, 0, 960, 540);
        g.fillStyle(0xadc39a);
        g.fillRoundedRect(52, 90, 856, 380, 24);
        g.fillStyle(0xeaf0cb);
        g.fillRoundedRect(78, 112, 804, 334, 18);
        for (let y = 130; y < 440; y += 24)
            for (let x = 90; x < 875; x += 24) {
                g.fillStyle((x + y) % 48 ? 0xdfe8bd : 0xe4ecc5, .6);
                g.fillRect(x, y, 20, 20);
            } // Stone paths and flower beds, drawn on the same pixel grid.
        g.fillStyle(0xf4e5be, .55);
        g.fillRoundedRect(430, 130, 100, 295, 18);
        g.fillRoundedRect(100, 240, 760, 85, 18);
        for (let i = 0; i < 26; i++) {
            const x = 114 + (i * 157) % 730, y = i % 2 ? 165 : 389;
            if (Math.abs(x - 480) < 80)
                continue;
            g.fillStyle(0x7fa37c);
            g.fillRoundedRect(x - 14, y - 9, 32, 24, 8);
            g.fillStyle(0x91b58a);
            g.fillRect(x - 9, y - 13, 18, 13);
            for (let j = 0; j < 3; j++) {
                const xx = x - 10 + j * 11, yy = y - 6 + (j % 2) * 7;
                g.fillStyle([0xdf8eac, 0xf2d183, 0xfff3df][(i + j) % 3]);
                g.fillRect(xx - 3, yy - 5, 7, 14);
                g.fillRect(xx - 7, yy - 1, 15, 6);
                g.fillStyle(0xd7ac64);
                g.fillRect(xx - 1, yy, 3, 3);
            }
        }
        for (let i = 0; i < 9; i++) {
            g.fillStyle(0xd6d7b5, .6);
            g.fillRoundedRect(455 + (i % 2) * 22, 146 + i * 30, 21, 12, 3);
        }
        g.lineStyle(5, 0x94aa82);
        g.strokeRoundedRect(72, 106, 816, 346, 19);
        for (let i = 0; i < 32; i++) {
            const x = 95 + (i * 131) % 780, y = i % 2 ? 98 : 449;
            g.fillStyle([0xd98ba4, 0xf4ce79, 0xfff4df][i % 3]);
            g.fillCircle(x, y, 5);
            g.fillStyle(0x718e70);
            g.fillRect(x - 1, y + 5, 2, 8);
        }
        for (const dir of Object.keys(ROOMS[this.room].links)) {
            const [x, y, w, h] = dir === 'left' ? [55, 246, 45, 76] : dir === 'right' ? [860, 246, 45, 76] : dir === 'up' ? [442, 89, 76, 45] : [442, 428, 76, 45];
            g.fillStyle(0x947584);
            g.fillRoundedRect(x, y, w, h, 10);
            g.fillStyle(0xf9e4c2);
            g.fillRoundedRect(x + 7, y + 7, w - 14, h - 14, 7);
        }
        for (let i = 0; i < 6; i++) {
            const r = ROOMS[i];
            g.fillStyle(i === this.room ? 0xb66085 : this.visited.has(i) ? 0xfff3e1 : 0xc7b9ad);
            g.fillRoundedRect(812 + r.x * 21, 117 + r.y * 17, 17, 13, 3);
        }
        const title = this.add.text(480, 106, ROOMS[this.room].kind === 'shop' ? 'MY MELODY · BOUTIQUE' : ROOMS[this.room].kind === 'boss' ? 'MEGA KUROMI' : '✦ EL JARDÍN DE LOS DESEOS ✦', { fontFamily: 'Georgia', fontSize: '15px', color: '#846374' }).setOrigin(.5).setDepth(5);
        this.decor.push(title);
    }
    spawn(type: string, x: number, y: number) { this.mobs.push({ s: this.add.sprite(x, y, type === 'cinna' ? 'cinna' : 'kuromi').setScale(type === 'boss' ? 5 : 2.4).setDepth(15), hp: type === 'boss' ? 85 : type === 'cinna' ? 5 : 7, type, next: this.clock + 1800 + this.mobs.length * 350, phase: 0 }); }
    drop(type: string, x: number, y: number, cost = 0) { const s = this.add.container(x, y).setDepth(10); if (['brim', 'head', 'mantle'].includes(type)) {
        s.add(this.add.ellipse(0, 18, 54, 15, 0x8c9b76, .3));
        s.add(this.add.sprite(0, 0, type).setScale(2.5));
        s.add(this.add.text(0, 33, cost ? `${cost} ✦` : 'REGALO', { fontSize: '12px', color: '#72546a' }).setOrigin(.5));
    }
    else {
        s.add(this.add.circle(0, 0, 8, type === 'coin' ? 0xe9bb56 : type === 'key' ? 0xeae0a5 : 0xe092a4));
        s.add(this.add.text(0, 0, type === 'coin' ? '✦' : type === 'key' ? '⚿' : '♥', { fontSize: '12px', color: '#fff7e9' }).setOrigin(.5));
    } this.loot.push({ s, type, cost }); }
    bomb() { if (this.paused || this.ended || this.bombs <= 0)
        return; this.bombs--; this.bombList.push({ s: this.add.sprite(this.player.x, this.player.y, 'bomb').setScale(2.4).setDepth(12), t: this.clock + 1500 }); this.audio.tone(250, .15); this.sync(); }
    active() { if (this.paused || this.ended || !this.charge)
        return; this.charge = false; this.roomsSinceUse = 0; if (this.activeItem === 'head') {
        for (let i = 0; i < 4; i++)
            this.shoot(this.player.x, this.player.y, Math.cos(i * Math.PI / 2) * 180, Math.sin(i * Math.PI / 2) * 180, false, 4, true);
        this.say('¡Estrellitas al rescate!');
    }
    else {
        this.piles.push(this.add.sprite(this.player.x, this.player.y, 'poop').setScale(2.7).setDepth(10));
        this.say('Una pila adorable bloquea enemigos y sus proyectiles.');
    } this.sync(); }
    shoot(x: number, y: number, vx: number, vy: number, enemy: boolean, damage = 1, home = false) { this.shots.push({ s: this.add.circle(x, y, home ? 7 : enemy ? 6 : 4, enemy ? 0xa76dba : home ? 0xf1bd58 : 0xdf7096).setStrokeStyle(2, 0xfff5e5).setDepth(18), vx, vy, enemy, damage, home, life: home ? 5000 : enemy ? 4500 : C.range / Math.max(1, Math.hypot(vx, vy)) * 1000 }); }
    hurt() { if (this.clock < this.inv || this.ended)
        return; if (this.shield) {
        this.shield = false;
        this.inv = this.clock + 700;
        this.say('Holy Mantle bloqueó el golpe');
        return;
    } this.hp--; this.inv = this.clock + C.invulnerabilityMs; this.cameras.main.shake(140, .006); this.audio.tone(130, .2, .07, 'triangle'); this.sync(); if (this.hp <= 0) {
        this.ended = true;
        this.clearInput();
        this.finish('dead');
    } }
    hit(m: Mob, d: number) { m.hp -= d; m.s.setTint(0xffc3d7); this.time.delayedCall(100, () => { if (m.s.active)
        m.s.clearTint(); }); if (m.hp <= 0) {
        this.drop('coin', m.s.x, m.s.y);
        m.s.destroy();
        this.mobs = this.mobs.filter(v => v !== m);
        this.audio.tone(550, .12);
    } }
    update(_t: number, delta: number) {
        if (this.paused || this.ended)
            return;
        const dt = Math.min(delta, 40), sec = dt / 1000;
        this.clock += dt;
        let mx = +this.keys.D.isDown - +this.keys.A.isDown, my = +this.keys.S.isDown - +this.keys.W.isDown;
        if (this.left) {
            mx = this.left.dx / 40;
            my = this.left.dy / 40;
        }
        let len = Math.hypot(mx, my);
        if (len > 1) {
            mx /= len;
            my /= len;
        }
        this.player.x = Phaser.Math.Clamp(this.player.x + mx * C.speed * sec, 87, 873);
        this.player.y = Phaser.Math.Clamp(this.player.y + my * C.speed * sec, 125, 433);
        this.player.setAlpha(this.clock < this.inv ? (Math.floor(this.clock / 90) % 2 ? .35 : 1) : 1);
        let ax = +this.keys.RIGHT.isDown - +this.keys.LEFT.isDown, ay = +this.keys.DOWN.isDown - +this.keys.UP.isDown;
        if (this.right) {
            ax = this.right.dx;
            ay = this.right.dy;
        }
        else if (this.mouse) {
            ax = this.input.activePointer.x - this.player.x;
            ay = this.input.activePointer.y - this.player.y;
        }
        len = Math.hypot(ax, ay);
        if (len > .1) {
            ax /= len;
            ay /= len;
            if (this.brim) {
                this.charging += dt;
                if (this.charging >= 850) {
                    this.charging = 0;
                    const b = this.add.graphics().setDepth(25);
                    b.lineStyle(18, 0xffd3de, .9);
                    b.lineBetween(this.player.x, this.player.y, this.player.x + ax * 760, this.player.y + ay * 760);
                    b.lineStyle(7, 0xdd5d91);
                    b.lineBetween(this.player.x, this.player.y, this.player.x + ax * 760, this.player.y + ay * 760);
                    this.tweens.add({ targets: b, alpha: 0, duration: 240, onComplete: () => b.destroy() });
                    for (const m of [...this.mobs]) {
                        const dx = m.s.x - this.player.x, dy = m.s.y - this.player.y;
                        if (dx * ax + dy * ay > 0 && Math.abs(dx * ay - dy * ax) < (m.type === 'boss' ? 58 : 30))
                            this.hit(m, 9);
                    }
                    this.audio.tone(110, .22, .05, 'sawtooth');
                }
            }
            else if (this.clock - this.last > C.fireMs) {
                this.last = this.clock;
                this.shoot(this.player.x, this.player.y, ax * 340, ay * 340, false, C.damage);
                this.audio.tone(720, .04, .014);
            }
        }
        else
            this.charging = 0;
        for (const m of [...this.mobs]) {
            const dx = this.player.x - m.s.x, dy = this.player.y - m.s.y, d = Math.hypot(dx, dy) || 1;
            const speed = m.type === 'kuromi' ? 55 : m.type === 'boss' ? 20 : 24;
            const nx = m.s.x + (m.type === 'cinna' ? Math.cos(this.clock / 650) * 42 : dx / d * speed) * sec, ny = m.s.y + (m.type === 'cinna' ? Math.sin(this.clock / 800) * 32 : dy / d * speed) * sec;
            if (!this.piles.some(o => Math.hypot(nx - o.x, ny - o.y) < 34))
                m.s.setPosition(Phaser.Math.Clamp(nx, 120, 840), Phaser.Math.Clamp(ny, 155, 405));
            if (d < (m.type === 'boss' ? 48 : 24))
                this.hurt();
            if (this.clock > m.next - 450)
                m.s.setTint(0xe9a6ce);
            if (this.clock > m.next) {
                m.s.clearTint();
                m.next = this.clock + 2400;
                m.phase++;
                if (m.type === 'boss' && m.phase % 2 === 0) {
                    for (let i = 0; i < 3; i++)
                        this.zones.push({ x: Phaser.Math.Clamp(this.player.x + (i - 1) * 105, 140, 820), y: this.player.y, t: this.clock + 950 });
                    this.say('¡Sal de los círculos de eclipse!');
                }
                else {
                    const count = m.type === 'boss' ? 12 : m.type === 'cinna' ? 3 : 1;
                    for (let i = 0; i < count; i++) {
                        const a = m.type === 'boss' ? i * Math.PI * 2 / count : Math.atan2(dy, dx) + (i - (count - 1) / 2) * .25;
                        this.shoot(m.s.x, m.s.y, Math.cos(a) * (m.type === 'kuromi' ? 150 : 115), Math.sin(a) * (m.type === 'kuromi' ? 150 : 115), true);
                    }
                }
            }
        }
        for (const b of [...this.bombList]) {
            b.s.setAlpha(Math.floor(this.clock / 120) % 2 ? .5 : 1);
            if (this.clock > b.t) {
                const f = this.add.circle(b.s.x, b.s.y, 110, 0xf7adc6, .65).setDepth(25);
                this.tweens.add({ targets: f, scale: 1.6, alpha: 0, duration: 400, onComplete: () => f.destroy() });
                for (const m of [...this.mobs])
                    if (Math.hypot(m.s.x - b.s.x, m.s.y - b.s.y) < 145)
                        this.hit(m, C.bombDamage);
                b.s.destroy();
                this.bombList = this.bombList.filter(v => v !== b);
                this.audio.tone(80, .3, .12, 'triangle');
            }
        }
        for (const s of [...this.shots]) {
            s.life -= dt;
            if (s.home && this.mobs.length) {
                const m = this.mobs.reduce((a, b) => Math.hypot(a.s.x - s.s.x, a.s.y - s.s.y) < Math.hypot(b.s.x - s.s.x, b.s.y - s.s.y) ? a : b);
                const a = Math.atan2(m.s.y - s.s.y, m.s.x - s.s.x);
                s.vx = Math.cos(a) * 240;
                s.vy = Math.sin(a) * 240;
            }
            s.s.x += s.vx * sec;
            s.s.y += s.vy * sec;
            let remove = s.life < 0 || s.s.x < 80 || s.s.x > 880 || s.s.y < 115 || s.s.y > 445;
            if (s.enemy) {
                if (Math.hypot(s.s.x - this.player.x, s.s.y - this.player.y) < 18) {
                    this.hurt();
                    remove = true;
                }
                if (this.piles.some(o => Math.hypot(s.s.x - o.x, s.s.y - o.y) < 25))
                    remove = true;
            }
            else
                for (const m of [...this.mobs])
                    if (Math.hypot(s.s.x - m.s.x, s.s.y - m.s.y) < (m.type === 'boss' ? 42 : 22)) {
                        this.hit(m, s.damage);
                        remove = true;
                        break;
                    }
            if (remove) {
                s.s.destroy();
                this.shots = this.shots.filter(v => v !== s);
            }
        }
        for (const l of [...this.loot])
            if (Math.hypot(l.s.x - this.player.x, l.s.y - this.player.y) < 33) {
                if (l.cost > this.coins) {
                    this.say('Necesitas más monedas ✦');
                    continue;
                }
                this.coins -= l.cost;
                if (l.type === 'coin')
                    this.coins++;
                else if (l.type === 'key')
                    this.keyCount++;
                else if (l.type === 'heart')
                    this.hp = Math.min(C.hp, this.hp + 2);
                else {
                    const item = ITEMS[l.type as keyof typeof ITEMS];
                    if (l.type === 'brim') {
                        this.brim = true;
                        this.cleared.add(3);
                    }
                    if (l.type === 'mantle') {
                        this.mantle = true;
                        this.shield = true;
                    }
                    if (l.type === 'head') {
                        this.activeItem = 'head';
                        this.charge = true;
                    }
                    this.say(`${item.name} · ${item.description}`);
                }
                l.s.destroy();
                this.loot = this.loot.filter(v => v !== l);
                this.audio.tone(880, .2);
                this.sync();
            }
        const kind = ROOMS[this.room].kind;
        if ((kind === 'fight' || kind === 'boss') && !this.mobs.length && !this.cleared.has(this.room)) {
            this.cleared.add(this.room);
            this.roomsSinceUse++; this.charge = this.roomsSinceUse >= C.activeRooms;
            this.drop('heart', 480, 320);
            if (kind === 'fight') {
                this.drop('coin', 445, 280);
                this.drop('key', 515, 280);
                this.say('¡Sala limpia! Activo recargado · recoge tu recompensa');
            }
            else
                this.say('¡Lo lograste! Entra en la escotilla dorada.');
            this.sync();
        }
        this.fx.clear();
        for (const z of [...this.zones]) {
            this.fx.lineStyle(4, 0xc374a7, .8);
            this.fx.strokeCircle(z.x, z.y, 54);
            this.fx.fillStyle(0xd382ba, .15);
            this.fx.fillCircle(z.x, z.y, 54);
            if (this.clock >= z.t) {
                if (Math.hypot(this.player.x - z.x, this.player.y - z.y) < 58)
                    this.hurt();
                this.zones = this.zones.filter(v => v !== z);
                const f = this.add.circle(z.x, z.y, 55, 0xaa78ad, .65);
                this.tweens.add({ targets: f, alpha: 0, duration: 330, onComplete: () => f.destroy() });
            }
        }
        for (const s of [this.left, this.right])
            if (s) {
                this.fx.lineStyle(2, 0x845c80, .22);
                this.fx.strokeCircle(s.x, s.y, 42);
                this.fx.fillStyle(0x845c80, .13);
                const d = Math.hypot(s.dx, s.dy) || 1;
                this.fx.fillCircle(s.x + s.dx / Math.max(1, d / 36), s.y + s.dy / Math.max(1, d / 36), 18);
            }
        if (this.shield) {
            this.fx.lineStyle(2, 0xfffce2, .9);
            this.fx.strokeCircle(this.player.x, this.player.y, 27);
        }
        if (this.charging) {
            this.fx.lineStyle(3, 0xcc729d, .8);
            this.fx.strokeCircle(this.player.x, this.player.y, 18 + this.charging / 100);
        }
        const boss = this.mobs.find(m => m.type === 'boss');
        if (boss) {
            this.fx.fillStyle(0x795069);
            this.fx.fillRoundedRect(335, 465, 290, 10, 5);
            this.fx.fillStyle(0xd88aa9);
            this.fx.fillRoundedRect(338, 468, 284 * Math.max(0, boss.hp / 85), 4, 2);
        }
        if (this.mobs.length) {
            for (const dir of Object.keys(ROOMS[this.room].links)) {
                this.fx.lineStyle(5, 0xb47791, .9);
                if (dir === 'left' || dir === 'right')
                    this.fx.lineBetween(dir === 'left' ? 84 : 876, 253, dir === 'left' ? 84 : 876, 315);
                else
                    this.fx.lineBetween(449, dir === 'up' ? 119 : 440, 511, dir === 'up' ? 119 : 440);
            }
        }
        if (kind === 'boss' && this.cleared.has(this.room)) {
            this.fx.fillStyle(0x87627b);
            this.fx.fillRoundedRect(454, 260, 52, 46, 6);
            this.fx.lineStyle(4, 0xe7bd67);
            this.fx.strokeRoundedRect(454, 260, 52, 46, 6);
            for (let y = 270; y < 304; y += 10)
                this.fx.lineBetween(467, y, 493, y);
            if (Math.hypot(this.player.x - 480, this.player.y - 283) > 48) this.hatchReady = true;
            if (this.hatchReady && Math.hypot(this.player.x - 480, this.player.y - 283) < 25) {
                this.ended = true;
                this.clearInput();
                this.finish('win');
            }
        }
        if (!this.mobs.length && this.clock > this.gate) {
            let dir = '';
            if (this.player.x < 101 && Math.abs(this.player.y - 284) < 40)
                dir = 'left';
            if (this.player.x > 859 && Math.abs(this.player.y - 284) < 40)
                dir = 'right';
            if (this.player.y < 137 && Math.abs(this.player.x - 480) < 40)
                dir = 'up';
            if (this.player.y > 421 && Math.abs(this.player.x - 480) < 40)
                dir = 'down';
            const target = (ROOMS[this.room].links as Record<string, number>)[dir];
            if (target !== undefined) {
                if (target === 3 && !this.unlocked) {
                    if (!this.keyCount) {
                        this.say('El tesoro necesita una llave');
                        return;
                    }
                    this.keyCount--;
                    this.unlocked = true;
                }
                this.enter(target, ({ left: 'right', right: 'left', up: 'down', down: 'up' } as Record<string, string>)[dir]);
            }
        }
        if (this.message && this.clock > this.until) {
            this.message = '';
            this.sync();
        }
    }
}
