import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrashViewComponent } from './trash-view.component';

describe('TrashViewComponent', () => {
  let component: TrashViewComponent;
  let fixture: ComponentFixture<TrashViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrashViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrashViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
