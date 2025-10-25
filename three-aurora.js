// three-aurora.js — gentle moving aurora using three.js
(() => {
  const container = document.getElementById('aurora');
  if(!container || !window.THREE) return;
  const w = container.clientWidth || innerWidth;
  const h = container.clientHeight || innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 1000);
  camera.position.z = 6;
  const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  container.appendChild(renderer.domElement);

  const geom = new THREE.PlaneGeometry(12, 6, 120, 60);
  const cols = [];
  const pos = geom.attributes.position;
  for(let i=0;i<pos.count;i++){
    cols.push(0.2, 0.6, 0.9);
  }
  geom.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.DoubleSide, transparent:true, opacity:0.7 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -0.3;
  scene.add(mesh);

  const orig = new Float32Array(pos.array);

  function animate(t){
    const time = t*0.001;
    for(let i=0;i<pos.count;i++){
      const ix = i*3;
      const ox = orig[ix], oy = orig[ix+1];
      pos.array[ix+2] = Math.sin((ix*0.002) + time*1.0)*0.35 + Math.cos((ix*0.0012)+time*0.3)*0.15;
    }
    pos.needsUpdate = true;
    // color shift
    const colors = geom.attributes.color.array;
    for(let i=0;i<pos.count;i++){
      const z = pos.getZ(i);
      const h = 0.58 + z*0.08;
      const c = new THREE.Color().setHSL(h, 0.7, 0.5);
      const ci = i*3; colors[ci]=c.r; colors[ci+1]=c.g; colors[ci+2]=c.b;
    }
    geom.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate(0);

  window.addEventListener('resize', ()=>{ renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); });
})();
