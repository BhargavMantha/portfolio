import { Injectable } from '@angular/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Scene, Mesh } from 'three';

@Injectable({
  providedIn: 'root',
})
export class GltfLoaderService {
  constructor() {}

  loadGLTFModel(
    scene: Scene,
    glbPath: string,
    options = { receiveShadow: true, castShadow: true }
  ) {
    const { receiveShadow, castShadow } = options;
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        glbPath,
        (gltf) => {
          const obj = gltf.scene;
          obj.name = 'dog';
          obj.position.y = 0;
          obj.position.x = 0;
          obj.receiveShadow = receiveShadow;
          obj.castShadow = castShadow;
          scene.add(obj);

          obj.traverse(function (child) {
            if (child instanceof Mesh) {
              child.castShadow = castShadow;
              child.receiveShadow = receiveShadow;
            }
          });
          resolve(obj);
        },
        undefined,
        function (error) {
          reject(error);
        }
      );
    });
  }
}
