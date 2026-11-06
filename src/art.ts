import Phaser from 'phaser';
// Original 16×16 sprites. Each letter is one editable pixel.
export function buildArt(scene: Phaser.Scene) { const patterns: Record<string, string[]> = { kitty: ['...ww....ww.....', '..wwwwwwwwww....', '.wwwwwwwwwrrr...', 'wwwwwwwwwwrrrr..', 'wwwkwwwwkwwrrr..', 'wwwwwwywwwwwww..', '.wwwwwwwwwwww...', '...pppppppp.....', '..wppppppppw....', '...pppppppp.....', '....ww..ww......'], kuromi: ['..vv......vv....', '..vvv....vvv....', '.vvvvvvvvvvvv...', 'vvvvvvvvvvvvvv..', 'vvwwwwwwwwwwvv..', 'vvwwkwwwwkwwvv..', 'vvwwwwwpwwwwvv..', '.vvvvvvvvvvvv...', '....vvvvvv......', '...vvvpvvvv.....', '..vvv....vvv....'], cinna: ['..www....www....', '.wwwwwwwwwwww...', 'wwwwwwwwwwwwwww.', 'ww.wwbwwbwww.ww.', 'ww.wwwwwwwww.ww.', '....wwppwww.....', '.....wwwww......', '....bbbbbbb.....', '....wwwwwww.....'], poop: ['......pp........', '.....pppp.......', '....pppppp......', '...pppppppp.....', '....pppppp......', '..pppppppppp....', '.pppppppppppp...', 'pppppppppppppp..'], bomb: ['....rryrr.......', '.....rrr........', '.....vv.........', '...vvvvvv.......', '..vvvpvvvv......', '.vvvvvvvvvv.....', '.vvvvvvvvvv.....', '..vvvvvvvv......'], head: ['...w.....w......', '..www...www.....', '..wwwwwwwww.....', '.wwwwwwwwwww....', '.wwkwwwwwkww....', '.wwwwwywwwww....', '..wwwwwwwww.....'], mantle: ['......y.........', '....yyyyy.......', '...ywwwwwy......', '..ywwwwwwwy.....', '.ywwwwwwwwwy....', '..ywwwwwwwy.....', '...yyyyyyy......'], brim: ['.....rrr........', '...rrrrrrr......', '..rrr...rrr.....', '..rrr...rrr.....', '...rrrrrrr......', '....rrrrr.......', '.....rrr........'] }; const colors: Record<string, string> = { w: '#fff9ed', k: '#493b50', y: '#e6b752', p: '#d783a5', r: '#db5878', v: '#735475', b: '#81bfcf' }; for (const [name, rows] of Object.entries(patterns)) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 16;
        const cx = cv.getContext('2d')!;
        rows.forEach((r, y) => [...r].forEach((v, x) => { if (colors[v]) {
            cx.fillStyle = colors[v];
            cx.fillRect(x, y, 1, 1);
        } }));
        scene.textures.addCanvas(name, cv);
    } }
