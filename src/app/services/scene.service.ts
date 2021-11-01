import { Injectable, OnDestroy } from '@angular/core';

import {
  AmbientLight,
  AnimationMixer,
  Clock,
  Color,
  ColorRepresentation,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
@Injectable({
  providedIn: 'root',
})
export class SceneService implements OnDestroy {
  aspect: number;
  camera: OrthographicCamera;
  container: HTMLElement;
  controls: OrbitControls;
  hemisphere: HemisphereLight;
  loader: GLTFLoader;
  mainLight: DirectionalLight;
  scene: Scene;
  ambientLight: AmbientLight;
  req: any = null;
  frame: number = 0;
  renderer: WebGLRenderer;
  initialCameraPosition: Vector3 = new Vector3(
    20 * Math.sin(0.2 * Math.PI),
    10,
    20 * Math.cos(0.2 * Math.PI)
  );
  clock = new Clock();
  mixers = new Array<AnimationMixer>();
  dogPosition = new Vector3(7.5, 0, -10);
  dogUrl = '../../assets/dog.glb';
  directionalLightOptions = {
    color: 0x000,
    intensity: 5,
  };
  target = new Vector3(-0.5, 1.2, 0);
  // CAMERA

  private createCamera = () => {
    const scale = this.container.clientHeight * 0.005 + 4.8;
    this.camera = new OrthographicCamera(
      -scale,
      scale,
      scale,
      -scale,
      0.01,
      50000
    );
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(this.target);
    this.scene.add(this.camera);
  };

  // CONTROLS

  private createControls = () => {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.target = this.target;
  };

  // LIGHTING

  private createLight = () => {
    this.ambientLight = new AmbientLight(0xcccccc, 1);
    this.scene.add(this.ambientLight);
  };

  // GEOMETRY

  private createModels = () => {
    return new Promise((resolve, reject) => {
      const options = { receiveShadow: false, castShadow: false };
      this.loader = new GLTFLoader();
      const loadModel = (glb: GLTF, position: Vector3) => {
        const model = glb.scene;
        model.name = 'dog';
        model.position.y = 0;
        model.position.x = 0;
        model.receiveShadow = options.receiveShadow;
        model.castShadow = options.castShadow;
        this.scene.add(model);
        model.traverse(function (child) {
          if (child instanceof Mesh) {
            child.castShadow = options.castShadow;
            child.receiveShadow = options.receiveShadow;
          }
        });
        resolve(model);
      };

      this.loader.load(
        this.dogUrl,
        (gltf) => loadModel(gltf, this.dogPosition),
        () => {},
        (err) => {
          console.log(err);
          reject(err);
        }
      );
    });
  };

  // RENDERER

  private onWindowResize = () => {
    this.camera.updateProjectionMatrix();
    this.renderer &&
      this.renderer.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
  };

  private createRenderer = () => {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputEncoding = sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.onWindowResize);
  };

  easeOutCirc(x: number) {
    return Math.sqrt(1 - Math.pow(x - 1, 4));
  }

  animate = () => {
    this.req = requestAnimationFrame(this.animate);

    this.frame = this.frame <= 100 ? this.frame + 1 : this.frame;
    if (this.frame <= 100) {
      const p = this.initialCameraPosition;
      const rotSpeed = -this.easeOutCirc(this.frame / 120) * Math.PI * 20;
      this.camera.position.x =
        p.x * Math.cos(rotSpeed) + p.z * Math.sin(rotSpeed);
      this.camera.position.y = 10;
      this.camera.position.z =
        p.z * Math.cos(rotSpeed) - p.x * Math.sin(rotSpeed);
      this.camera.lookAt(this.target);
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  };
  // INITIALIZATION

  private update = () => {
    const delta = this.clock.getDelta();
    this.mixers.forEach((x) => x.update(delta));
  };

  private render = () => this.renderer.render(this.scene, this.camera);

  start = () =>
    this.renderer.setAnimationLoop(() => {
      // this.update();
      this.render();
    });

  stop = () => this.renderer.setAnimationLoop(null);

  initialize = async (container: HTMLElement) => {
    this.container = container;
    this.scene = new Scene();
    this.aspect = container.clientWidth / container.clientHeight;
    this.createCamera();
    this.createLight();
    this.createRenderer();

    this.createModels().then(() => {
      this.animate();
    });

    this.createControls();
    this.start();
  };

  ngOnDestroy(): void {
    console.log('unmount');
    cancelAnimationFrame(this.req);
    this.renderer.dispose();
  }
}
