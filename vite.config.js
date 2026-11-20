import {defineConfig} from 'vite';
import {resolve} from 'node:path';

// The PS2-B model viewer is intentionally a separate HTML entry so it can
// load even if the admin React route crashes or a saved game becomes corrupt.
export default defineConfig({
 build:{
  rollupOptions:{
   input:{
    app:resolve(process.cwd(),'index.html'),
    loisPreview:resolve(process.cwd(),'lois-preview.html'),
    emyPreview:resolve(process.cwd(),'emy-preview.html')
   }
  }
 }
});
