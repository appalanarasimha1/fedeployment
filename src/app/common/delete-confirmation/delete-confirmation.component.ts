import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation',
  templateUrl: './delete-confirmation.component.html',
  styleUrls: ['./delete-confirmation.component.css']
})
export class DeleteConfirmationComponent implements OnInit {

  @Input() message;
  @Input() confirmButtonText;
  @Output() onConfirm = new EventEmitter() 
  @Output() onCancle = new EventEmitter() 

  constructor(
  ) { }

  ngOnInit(): void {
    this.datePickerDefaultAction()
  } 

  
  datePickerDefaultAction() {
    $(".dropdownDelete, .mat-datepicker-content").click(function (e) {
      e.stopPropagation();
    });

    $(document).click( ()=> {
      this.closePopup()
    });
  }
  
  closePopup() {
    this.onCancle.emit()
  }


  confirmDelete() {
    this.onConfirm.emit()
  }
}
