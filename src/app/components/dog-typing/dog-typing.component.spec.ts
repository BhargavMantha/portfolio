import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DogTypingComponent } from './dog-typing.component';

describe('DogTypingComponent', () => {
  let component: DogTypingComponent;
  let fixture: ComponentFixture<DogTypingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DogTypingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DogTypingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
