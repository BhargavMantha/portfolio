import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SceneService } from 'src/app/services/scene.service';

@Component({
  selector: 'app-dog-typing',
  templateUrl: './dog-typing.component.html',
  styleUrls: ['./dog-typing.component.scss'],
})
export class DogTypingComponent {
  @ViewChild('webgl', { static: true })
  set container(container: ElementRef) {
    this.scene.initialize(container.nativeElement);
  }
  constructor(private scene: SceneService) {}
}
