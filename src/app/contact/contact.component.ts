import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  @ViewChild('emailForm', { static: true })
  form: ElementRef;
  emailForm: FormGroup;
  constructor(private http: HttpClient) {
    this.emailForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      message: new FormControl(''),
    });
  }
  status: string;
  emailSuccess: boolean;
  ngOnInit(): void {}

  handleSubmit() {
    console.log(this.emailForm.value);

    const formData: any = new FormData();
    formData.append('email', this.emailForm.value.email);
    formData.append('message', this.emailForm.value.message);
    this.http.post<any>('https://formspree.io/f/mrgrwrvb', formData).subscribe({
      next: (data) => {
        if (data.ok === true) {
          this.emailSuccess = true;
          this.status = "Thanks for the message! I'll get back to you soon!";
        } else {
          this.emailSuccess = false;
          this.status = ' Something went wrong.';
        }
        this.emailForm.enable();
        console.log(this.emailSuccess);
      },
      error: (error) => {
        this.status = ' An error occurred.';
        this.emailForm.enable();
        this.emailSuccess = false;
        console.log(error);
      },
    });
  }
}
