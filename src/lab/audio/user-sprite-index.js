// Nine recordings supplied by the player. One Opus audio sprite avoids nine downloads.
// All times are offsets in the decoded 24-kHz source; no story timing changes.
export const USER_AUDIO_SPRITE=Object.freeze({
 'cat-meow':{start:0,duration:.455125},
 'cat-purr':{start:.655125,duration:5.3},
 'churu-open':{start:6.155125,duration:7.008375},
 'danger-alert':{start:13.3635,duration:2,leadIn:.28}, // Skip nearly silent opening for instant discovery cue
 'hatch-close':{start:15.5635,duration:2.961292},
 'power-cut':{start:18.724792,duration:2.460208},
 'rc-motor':{start:21.385,duration:6.333333,loop:true},
 'van-door':{start:27.918333,duration:1.44},
 'van-away':{start:29.558333,duration:13}
});
export const USER_AUDIO_FOR_2D=Object.freeze({
 cat:'cat-meow',churu:'churu-open','van-door':'van-door','van-away':'van-away'
});
