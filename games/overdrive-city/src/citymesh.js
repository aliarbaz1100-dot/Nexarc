// Turns city data into Three.js meshes. Everything static is merged or
// instanced: the whole city renders in ~10 draw calls.
import * as THREE from 'three';
import { T, DIR } from './city.js';

export function buildCityMeshes(city) {
  const group = new THREE.Group();
  const { N, TILE } = city;

  // ---- ground: one plane per tile type via merged BufferGeometry ----
  const GROUND_COLORS = {
    [T.GRASS]: 0x4d7a3a, [T.ROAD]: 0x33363b, [T.SIDEWALK]: 0x8f9499,
    [T.PARK]: 0x3f7a44, [T.LOT]: 0x5b5f66, [T.BUILDING]: 0x3a3d42,
  };
  const positions = [], colors = [], col = new THREE.Color();
  for (let tz = 0; tz < N; tz++) for (let tx = 0; tx < N; tx++) {
    const t = city.tiles[tx + tz * N];
    col.setHex(GROUND_COLORS[t]);
    // tiny per-tile shade variation breaks up the flatness (subtle on asphalt)
    const amp = t === T.ROAD ? 0.012 : 0.06;
    const v = ((tx * 31 + tz * 17) % 7) / 7 * amp - amp / 2;
    const r = col.r + v, g = col.g + v, b = col.b + v;
    const x0 = tx * TILE, z0 = tz * TILE, x1 = x0 + TILE, z1 = z0 + TILE;
    positions.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x0, 0, z0, x1, 0, z1, x1, 0, z0);
    for (let i = 0; i < 6; i++) colors.push(r, g, b);
  }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo,
    new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  group.add(ground);

  // ---- road center dashes (lane divider between the 2-tile pairs) ----
  const dashGeo = new THREE.PlaneGeometry(0.35, 2.4).rotateX(-Math.PI / 2);
  const dashes = [];
  for (const x of city.vRoads) for (let z = 2; z < N - 2; z += 2) {
    if (city.lane[x + z * N] === DIR.ANY) continue;
    dashes.push([( x + 1) * TILE, (z + 0.5) * TILE, 0]);
  }
  for (const z of city.hRoads) for (let x = 2; x < N - 2; x += 2) {
    if (city.lane[x + z * N] === DIR.ANY) continue;
    dashes.push([(x + 0.5) * TILE, (z + 1) * TILE, Math.PI / 2]);
  }
  const dashMesh = new THREE.InstancedMesh(dashGeo,
    new THREE.MeshBasicMaterial({ color: 0xd8d8c8 }), dashes.length);
  const m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  dashes.forEach(([x, z, ry], i) => {
    q.setFromEuler(e.set(0, ry, 0));
    m4.compose(p.set(x, 0.02, z), q, one);
    dashMesh.setMatrixAt(i, m4);
  });
  group.add(dashMesh);

  // ---- buildings: one instanced box, per-instance color/scale ----
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const bMat = new THREE.MeshLambertMaterial({ vertexColors: false });
  const bMesh = new THREE.InstancedMesh(bGeo, bMat, city.buildings.length);
  bMesh.castShadow = bMesh.receiveShadow = true;
  const s = new THREE.Vector3();
  city.buildings.forEach((b, i) => {
    m4.compose(p.set(b.x, b.h / 2, b.z), q.identity(), s.set(b.w, b.h, b.d));
    bMesh.setMatrixAt(i, m4);
    bMesh.setColorAt(i, col.setHex(b.color));
  });
  bMesh.instanceColor.needsUpdate = true;
  group.add(bMesh);

  // roof caps in a darker shade give silhouettes a "cornice" line
  const roofGeo = new THREE.BoxGeometry(1, 1, 1);
  const roofMesh = new THREE.InstancedMesh(roofGeo,
    new THREE.MeshLambertMaterial({ color: 0x2e3238 }), city.buildings.length);
  city.buildings.forEach((b, i) => {
    m4.compose(p.set(b.x, b.h + 0.35, b.z), q.identity(), s.set(b.w * 0.94, 0.7, b.d * 0.94));
    roofMesh.setMatrixAt(i, m4);
  });
  group.add(roofMesh);

  // ---- lit windows (emissive at night) ----
  const winGeo = new THREE.PlaneGeometry(1.5, 1.9);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0 });
  const winMesh = new THREE.InstancedMesh(winGeo, winMat, city.windows.length);
  city.windows.forEach((w, i) => {
    q.setFromEuler(e.set(0, w.ry, 0));
    m4.compose(p.set(w.x, w.y, w.z), q, one);
    winMesh.setMatrixAt(i, m4);
  });
  group.add(winMesh);

  // ---- street lamps: pole + head; head glows at night ----
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.2, 6);
  const poleMesh = new THREE.InstancedMesh(poleGeo,
    new THREE.MeshLambertMaterial({ color: 0x3c4148 }), city.lamps.length);
  const headGeo = new THREE.SphereGeometry(0.26, 8, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: 0x332e20 });
  const headMesh = new THREE.InstancedMesh(headGeo, headMat, city.lamps.length);
  city.lamps.forEach((l, i) => {
    m4.compose(p.set(l.x, 2.6, l.z), q.identity(), one);
    poleMesh.setMatrixAt(i, m4);
    m4.compose(p.set(l.x, 5.3, l.z), q.identity(), one);
    headMesh.setMatrixAt(i, m4);
  });
  poleMesh.castShadow = true;
  group.add(poleMesh, headMesh);

  // ---- trees: trunk + cone canopy ----
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.6, 5);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo,
    new THREE.MeshLambertMaterial({ color: 0x5d4630 }), city.trees.length);
  const canopyGeo = new THREE.ConeGeometry(1.5, 3.2, 7);
  const canopyMesh = new THREE.InstancedMesh(canopyGeo,
    new THREE.MeshLambertMaterial({ color: 0x2f6b34 }), city.trees.length);
  city.trees.forEach((t, i) => {
    m4.compose(p.set(t.x, 0.8 * t.s, t.z), q.identity(), s.set(t.s, t.s, t.s));
    trunkMesh.setMatrixAt(i, m4);
    m4.compose(p.set(t.x, (1.6 + 1.4) * t.s, t.z), q.identity(), s.set(t.s, t.s, t.s));
    canopyMesh.setMatrixAt(i, m4);
    canopyMesh.setColorAt?.(i, col.setHex(0x2f6b34).offsetHSL(0, 0, ((i * 37) % 10) / 100 - 0.05));
  });
  canopyMesh.castShadow = true;
  group.add(trunkMesh, canopyMesh);

  // night dial: 0 = day, 1 = night — fades window/lamp emissives in
  function setNight(f) {
    winMat.opacity = f * 0.95;
    headMat.color.setHex(f > 0.4 ? 0xffe9b0 : 0x332e20);
  }

  return { group, setNight };
}
