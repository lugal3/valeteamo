// This adapter reads the single indexed, uncompressed mesh exported for Emy.
const asset = new URL('../assets/emy/emy-neural-20k.glb', import.meta.url);

export async function loadEmyNeural() {
 const response = await fetch(asset);
 if (!response.ok) throw new Error('No se pudo cargar el GLB de Emy.');
 const buffer = await response.arrayBuffer();
 const header = new DataView(buffer);
 if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 ||
     header.getUint32(8, true) !== buffer.byteLength || header.getUint32(16, true) !== 0x4e4f534a) {
  throw new Error('El archivo de Emy no es un GLB 2 válido.');
 }
 const jsonLength = header.getUint32(12, true);
 const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
 const binary = 28 + jsonLength;
 if (header.getUint32(binary - 4, true) !== 0x004e4942) throw new Error('El GLB de Emy no contiene geometría.');
 const binaryLength = header.getUint32(binary - 8, true);
 const view = (id, bytes, offset = 0) => {
  const entry = doc.bufferViews[id];
  const at = (entry.byteOffset ?? 0) + offset;
  if (entry.buffer !== 0 || entry.byteStride || offset + bytes > entry.byteLength || at + bytes > binaryLength) {
   throw new Error('El GLB de Emy usa una disposición de datos no compatible.');
  }
  return binary + at;
 };
 const attribute = (id, Type, components, glType) => {
  const a = doc.accessors[id];
  if (a.componentType !== glType || a.sparse || a.type !== (components === 1 ? 'SCALAR' : `VEC${components}`)) {
   throw new Error('El GLB de Emy usa un atributo no compatible.');
  }
  const length = a.count * components;
  return new Type(buffer, view(a.bufferView, length * Type.BYTES_PER_ELEMENT, a.byteOffset), length);
 };
 const [mesh] = doc.meshes;
 const [prim] = mesh.primitives;
 if (doc.meshes.length !== 1 || mesh.primitives.length !== 1 || (prim.mode ?? 4) !== 4) {
  throw new Error('El GLB de Emy debe contener una sola malla triangulada.');
 }
 const pos = attribute(prim.attributes.POSITION, Float32Array, 3, 5126);
 const normal = attribute(prim.attributes.NORMAL, Float32Array, 3, 5126);
 const uv = attribute(prim.attributes.TEXCOORD_0, Float32Array, 2, 5126);
 const indices = attribute(prim.indices, Uint16Array, 1, 5123);
 const count = pos.length / 3;
 if (count > 65530 || normal.length !== pos.length || uv.length !== count * 2 ||
     indices.length % 3 !== 0 || indices.some(index => index >= count)) {
  throw new Error('La malla excede los límites del renderizador WebGL1.');
 }
 const vertices = new Float32Array(count * 16);
 for (let i = 0; i < count; i++) {
  const p = i * 3;
  // Convert glTF coordinates to the house renderer’s left-handed basis.
  vertices.set([
   pos[p], pos[p+1], -pos[p+2], 1, 1, 1,
   normal[p], normal[p+1], -normal[p+2], uv[i*2], uv[i*2+1], 20.25, 64, 1, 0, 0,
  ], i * 16);
 }
 const texture = doc.materials[prim.material].pbrMetallicRoughness.baseColorTexture.index;
 const image = doc.images[doc.textures[texture].source];
 const length = doc.bufferViews[image.bufferView].byteLength;
 const bytes = new Uint8Array(buffer, view(image.bufferView, length), length);
 const bitmap = await createImageBitmap(new Blob([bytes], {type:image.mimeType}));
 if (bitmap.width !== 1024 || bitmap.height !== 1024) {
  bitmap.close();
  throw new Error('El pelaje de Emy debe usar un atlas de 1024 × 1024.');
 }
 return {vertices, indices, bitmap, count};
}
