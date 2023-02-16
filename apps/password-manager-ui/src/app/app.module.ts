import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponentsModule } from '@password-manager:ui:components/app-components.module';
import { AppContainerModule } from '@password-manager:ui:pages:app-container/app-container.module';
import { AuthModule } from '@password-manager:ui:pages:auth/auth.module';

import { AppComponent } from './app.component';
import AppRoutes from './app.routes';

@NgModule({
    declarations: [AppComponent],
    imports: [
        RouterModule.forRoot(AppRoutes, { initialNavigation: 'enabledBlocking' }),
        AppComponentsModule,
        AuthModule,
        AppContainerModule,
        BrowserModule,
        HttpClientModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
