# ngx-http-batcher
=========================

Angular (2+) HTTP batching module to reduce the number of HTTP requests and increase performance

[![Build Status](https://travis-ci.org/jonsamwell/ngx-http-batcher.svg?branch=master)](https://travis-ci.org/jonsamwell/ngx-http-batcher)


One of the biggest, yet relatively unknown performance boosts you will get with modern web applications is to reduce the number of HTTP request an application makes.  All you need to do is configure the batch endpoint with the library and the rest is taken care of!

Working demo https://plnkr.co/edit/OgvZ09iYO64VoXHLRGQa?p=preview

## Table of contents:
- [Get Started](#get-started)
  - [Installation](#installation)
  - [Examples](#examples)
  - [Usage](#usage)
    - [angular-quickstart](#quickstart)
    - [angular-seed](#seed)

## <a name="get-started"></a> Get Started

### <a name="installation"></a> Installation

You can install this package locally with npm.

```bash
npm install ngx-http-batcher --save
```

### <a name="examples"></a> Examples
You can see a working Plunker here https://plnkr.co/edit/OgvZ09iYO64VoXHLRGQa?p=preview
There isn't much too visually see but you will want to open up the network tab on the dev tools and look for a request will '$batch'.  This the the actual batch request for 3 seperate normal http requests.

### <a name="usage"></a> Usage
`NgxHttpBatcherModule` should be registered in the `AppModule` imports.  This module relies on the Angular HttpModule so ensure that is also imported.


```javascript
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpModule, Http } from "@angular/http";
import { NgxHttpBatcherModule,
         HttpBatchConfiguration,
         HttpBatchConfigurationCollection,
         HttpBatcher } from "ngx-http-batcher";

import { AppComponent } from "./app.component";

export function httpBatchConfigurationFactory() {
  return new HttpBatchConfigurationCollection([
    new HttpBatchConfiguration({
      rootEndpointUrl: "https://my.service.com",
      batchEndpointUrl: "https://my.service.com/$batch"
    })]);
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    NgxHttpBatcherModule
  ],
  providers: [
    { provide: HttpBatchConfigurationCollection, useFactory: httpBatchConfigurationFactory },
    { provide: Http, useClass: HttpBatcher }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```


