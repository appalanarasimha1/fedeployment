import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveCopyAssetsComponent } from './move-copy-assets.component';

describe('MoveCopyAssetsComponent', () => {
  let component: MoveCopyAssetsComponent;
  let fixture: ComponentFixture<MoveCopyAssetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoveCopyAssetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveCopyAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
