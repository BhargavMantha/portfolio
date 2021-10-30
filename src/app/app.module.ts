import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { HeaderComponent } from './components/header/header.component';
import { DogTypingComponent } from './components/dog-typing/dog-typing.component';
import { WorkComponent } from './components/work/work.component';

@NgModule({
  declarations: [
    AppComponent,
    ThemeToggleComponent,
    HeaderComponent,
    DogTypingComponent,
    WorkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
