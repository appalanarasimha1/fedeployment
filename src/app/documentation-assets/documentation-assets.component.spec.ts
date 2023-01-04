import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationAssetsComponent } from './documentation-assets.component';

describe('DocumentationAssetsComponent', () => {
  let component: DocumentationAssetsComponent;
  let fixture: ComponentFixture<DocumentationAssetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentationAssetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
