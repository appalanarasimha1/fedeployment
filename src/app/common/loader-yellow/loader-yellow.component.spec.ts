import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderYellowComponent } from './loader-yellow.component';

describe('LoaderYellowComponent', () => {
  let component: LoaderYellowComponent;
  let fixture: ComponentFixture<LoaderYellowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderYellowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderYellowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
