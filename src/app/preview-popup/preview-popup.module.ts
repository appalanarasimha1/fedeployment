import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { PreviewPopupComponent } from './preview-popup.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({

  imports: [
    PdfViewerModule,
  ],
  declarations: [
    PreviewPopupComponent
  ],
  schemas: [
      CUSTOM_ELEMENTS_SCHEMA,
      NO_ERRORS_SCHEMA
    ]
})
export class PreviewPopupModule { }
