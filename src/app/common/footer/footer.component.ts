import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild("onboarding",{static:true}) onboarding:ElementRef;

  modalOpen: boolean = true;
  hideVideo: boolean = true;
  modalLoading: boolean = false;
  videoCompleted: boolean = false;
  loading = false;
  readonly adminEmail: string = "groundxfeedback@neom.com";

  tagsMetadataDummy = [
    {
      "id"     : 1,
      "image"  : "../../../assets/images/mask-group1.png"
    },        
    {
      "id"     : 2,
      "image"  : "../../../assets/images/mask-group2.png"
    },        
    {
      "id"     : 3,
      "image"  : "../../../assets/images/mask-group3.png"
    },        
    {
      "id"     : 4,
      "image"  : "../../../assets/images/mask-group4.png"
    }
  ];
  tagsConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
    autoplay: true,
    infinite: true,
    speed: 1000,
    centerMode: false,
    variableWidth: false,
    pauseOnHover: false,
    pauseOnFocus: false, 
    autoplaySpeed:5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
        },
      },
    ],
  };

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private apiService: ApiService,
    ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    if(!JSON.parse(localStorage.getItem('openVideo')) && localStorage.getItem('token')) {
      this.openOnboardingModal(this.onboarding);
      localStorage.setItem("openVideo", "1");
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    
    // if(!JSON.parse(localStorage.getItem('openVideo')) && localStorage.getItem('token')) {
    //   this.openOnboardingModal(this.onboarding);
    //   localStorage.setItem("openVideo", "1");
    // }
  }

  openTermsPage() {
    this.router.navigate(['common', 'terms']);
  }

  openOnboardingModal(onboarding) {
    // setTimeout(() => {
      this.modalService.open(this.onboarding, { size: 'customWidth' });
    // }, 5000);
  }

  closeModal() {
    // this.modalOpen = true;
    // this.hideVideo = true;
    this.modalLoading = false;
    // this.videoCompleted = false;
  }

}
