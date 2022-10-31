import * as THREE from 'three';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import metaversefile from 'metaversefile';
const {useApp, useScene, usePhysics, useActivate, useLocalPlayer, useFrame, useWear, useUse, useCleanup, getNextInstanceId} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

/* (async () => {
  const u = './hookshot.glb';
  const fileUrl = app.files[u];
  const res = await fetch(fileUrl);
  const file = await res.blob();
  file.name = u;
  let mesh = await runtime.loadFile(file, {
    optimize: false,
  });
  app.object.add(mesh);
})();

const rayColor = 0x64b5f6;
const makeRayMesh = () => {
  const ray = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(0.002, 0.002, 1, 3, 1)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1/2, 0))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2))),
    new THREE.MeshBasicMaterial({
      color: rayColor,
    })
  );
  ray.frustumCulled = false;
  return ray;
};

const rayMesh = makeRayMesh();
rayMesh.visible = false;
rayMesh.target = new THREE.Vector3();
scene.add(rayMesh);

window.addEventListener('mousedown', e => {
  const currentWeapon = appManager.getGrab('right');
  const grabbed = currentWeapon === app.object;
  if (grabbed && e.button === 0) {
    const transforms = physics.getRigTransforms();
    const {position, quaternion} = transforms[0];
    
    const result = physics.raycast(position, quaternion);
    if (result) { // world geometry raycast
      rayMesh.target.fromArray(result.point);
      rayMesh.visible = true;
      
      physics.setGravity(false);
      physics.velocity.setScalar(0);
    } else {
      rayMesh.visible = false;
      
      physics.setGravity(true);
    }
  }
});
window.addEventListener('mouseup', e => {
  if (e.button === 0 && rayMesh.visible) {
    rayMesh.visible = false;
    
    physics.setGravity(true);

    const transforms = physics.getRigTransforms();
    const {position} = transforms[0];
    const direction = rayMesh.target.clone().sub(position).normalize();
    physics.velocity.copy(direction).multiplyScalar(10);
  }
});

app.addEventListener('frame', e => {
  const timestamp = e.data.timestamp || performance.now();
  const timeDiff = Math.min(e.data.timeDiff / 1000, 0.05);

  if (rayMesh.visible) {
    const transforms = physics.getRigTransforms();
    const {position} = transforms[0];

    rayMesh.position.copy(position);
    rayMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), rayMesh.target.clone().sub(position).normalize());
    rayMesh.scale.z = rayMesh.target.distanceTo(position);    
    
    const direction = rayMesh.target.clone().sub(position)
      .normalize()
      .multiplyScalar(10 * timeDiff);

    physics.offset.add(direction);
  }
}); */

const emptyArray = [];
const fnEmptyArray = () => emptyArray;

export default () => {
  const app = useApp();
  const scene = useScene();
  const physics = usePhysics();

  app.name = 'hookshot';

  let hookshotApp = null;
  // const physicsIds = [];
  (async () => {
    let u2 = `${baseUrl}hookshot.glb`;
    const m = await metaversefile.import(u2);
    hookshotApp = metaversefile.createApp({
      name: u2,
    });
    hookshotApp.position.copy(app.position);
    hookshotApp.quaternion.copy(app.quaternion);
    hookshotApp.scale.copy(app.scale);
    hookshotApp.updateMatrixWorld();
    hookshotApp.name = 'hookshot';
    hookshotApp.getPhysicsObjectsOriginal = hookshotApp.getPhysicsObjects;
    hookshotApp.getPhysicsObjects = fnEmptyArray;
    
    const components = [
      {
        "key": "instanceId",
        "value": getNextInstanceId(),
      },
      {
        "key": "contentId",
        "value": u2,
      },
      {
        "key": "physics",
        "value": true,
      },
      {
        "key": "wear",
        "value": {
          "boneAttachment": "leftHand",
          "position": [0, 0, 0],
          "quaternion": [0, 0.7071067811865475, 0, 0.7071067811865476],
          "scale": [1, 1, 1]
        }
      },
      {
        "key": "aim",
        "value": {
          "boneAttachment": "leftHand",
          "position": [0, 0, 0],
          "quaternion": [0, 0.7071067811865475, 0, 0.7071067811865476],
          "scale": [1, 1, 1]
        }
      },
      {
        "key": "use",
        "value": {
          "ik": "pistol"
        }
      }
    ];
    
    for (const {key, value} of components) {
      hookshotApp.setComponent(key, value);
    }
    await hookshotApp.addModule(m);
    scene.add(hookshotApp);
    
    hookshotApp.addEventListener('use', e => {
      console.log('hookshot use');
    });
  })();

  app.getPhysicsObjects = () => {
    return hookshotApp ? hookshotApp.getPhysicsObjectsOriginal() : [];
  };
  
  useActivate(() => {
    const localPlayer = useLocalPlayer();
    localPlayer.wear(app);
  });
  
  let wearing = false;
  useWear(e => {
    const {wear} = e;

    hookshotApp.position.copy(app.position);
    hookshotApp.quaternion.copy(app.quaternion);
    hookshotApp.scale.copy(app.scale);
    hookshotApp.updateMatrixWorld();
    
    hookshotApp.dispatchEvent({
      type: 'wearupdate',
      wear,
    });

    wearing = wear;
  });
  
  useUse(e => {
    if (e.use && hookshotApp) {
      hookshotApp.use();
    }
  });

  useFrame(({timestamp}) => {
    if (!wearing) {
      if (hookshotApp) {
        hookshotApp.position.copy(app.position);
        hookshotApp.quaternion.copy(app.quaternion);
        hookshotApp.updateMatrixWorld();
      }
    } else {
      if (hookshotApp) {
        app.position.copy(hookshotApp.position);
        app.quaternion.copy(hookshotApp.quaternion);
        app.updateMatrixWorld();
      }
    }
  });
  
  useCleanup(() => {
    if (hookshotApp) {
      // metaversefile.removeApp(subApp);
      scene.remove(hookshotApp);
      hookshotApp.destroy();
    }
  });
  
  return app;
};