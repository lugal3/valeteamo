import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Phaser from 'phaser';
import { Garden } from './game';
import './style.css';
function App() {
    const host = useRef<HTMLDivElement>(null);
    const scene = useRef<Garden | undefined>(undefined);
    const [started, S] = useState(false);
    const [paused, P] = useState(false);
    const [muted, M] = useState(false);
    const [hud, H] = useState<any>();
    const [end, E] = useState('');
    useEffect(() => { if (!started || !host.current)
        return; const s = new Garden(H, E); scene.current = s; const game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current, width: 960, height: 540, backgroundColor: '#f8ead5', pixelArt: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: s, input: { activePointers: 4 }, render: { antialias: false } }); const blur = () => { s.setPaused(true); P(true); }; const vis = () => { if (document.hidden)
        blur(); }; const resize = () => { s.clearInput(); if (innerHeight > innerWidth)
        blur(); }; window.addEventListener('blur', blur); document.addEventListener('visibilitychange', vis); window.addEventListener('resize', resize); return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', resize); s.audio.destroy(); game.destroy(true); }; }, [started]);
    const pause = () => { const p = !paused; P(p); scene.current?.setPaused(p); };
    const restart = () => { E(''); P(false); scene.current?.restartRun(); };
    return <main>{!started ? <section className="welcome"><span className="eyebrow">UN PEQUEÑO REGALO · 04.12.2026</span><div className="bow">🎀</div><h1>El jardín<br /><em>de los deseos</em></h1><p>Una aventura de Kitty entre flores,<br />estrellitas y travesuras.</p><button className="primary" onClick={() => { S(true); void document.documentElement.requestFullscreen?.().catch(() => { }); }}>Jugar <span>✦</span></button><p className="instructions">iPhone horizontal · izquierda: moverte · derecha: apuntar y disparar<br />PC: WASD + ratón pulsado o flechas · B bomba · Espacio activo · Esc pausa<br />Explora seis salas. Vence a Mega Kuromi y baja por la escotilla.</p></section> : <><div id="game" ref={host}/><header className="hud"><div><b>{hud?.hearts ?? '♥ ♥ ♥'}</b><span>✦ {hud?.coins ?? 12}　🎀 {hud?.bombs ?? 5}　⚿ {hud?.keys ?? 1}</span></div><div className="room">{hud?.room}<small>{hud?.message}</small></div><nav><button onClick={pause} aria-label="Pausa">Ⅱ</button><button aria-label="Audio" onClick={() => { const m = !muted; M(m); if (scene.current)
        scene.current.audio.muted = m; }}>{muted ? '♪̸' : '♪'}</button></nav></header><div className="actions"><button onPointerDown={e => { e.stopPropagation(); scene.current?.bomb(); }}>🎀<small>BOMBA · B</small></button><button onPointerDown={e => { e.stopPropagation(); scene.current?.active(); }}>{hud?.active === 'head' ? '🐱' : '💩'}<small>{hud?.charge ? 'LISTO · ␣' : 'RECARGANDO'}</small></button></div>{paused && !end && <div className="overlay"><h2>Una pequeña pausa</h2><button className="primary" onClick={pause}>Continuar</button><button onClick={restart}>Volver a empezar</button></div>}{end && <div className="overlay"><span className="bow">{end === 'win' ? '🎀' : '♡'}</span><h2>{end === 'win' ? 'El jardín vuelve a florecer' : 'Un respiro, pequeña Kitty'}</h2><p>{end === 'win' ? '¡Feliz cumpleaños! Tu aventura está completa.' : 'Las flores te esperan para intentarlo otra vez.'}</p><button className="primary" onClick={restart}>Jugar otra vez</button></div>}<div className="rotate"><span>↻</span><h2>Gira tu iPhone</h2><p>El jardín se disfruta en horizontal.</p></div></>}</main>;
}
createRoot(document.getElementById('root')!).render(<App />);
