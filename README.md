# ngx-http-batcher

Angular (2+) HTTP batching module to reduce the number of HTTP requests and increase performance

[![Build Status](https://travis-ci.org/jonsamwell/ngx-http-batcher.svg?branch=master)](https://travis-ci.org/jonsamwell/ngx-http-batcher)


One of the biggest, yet relatively unknown performance boosts you will get with modern web applications is to reduce the number of HTTP request an application makes.  All you need to do is configure the batch endpoint with the library and the rest is taken care of!

Working demo https://plnkr.co/edit/OgvZ09iYO64VoXHLRGQa?p=preview

## Table of contents:
- [Get Started](#get-started)
  - [Installation](#installation)
  - [Examples](#examples)
  - [Usage](#usage)
- [Configuration Object Options](#configuration)
  - [Endpoint Url](#config-endpointurl)
  - [Batch Endpoint Url](#config-batchurl)
  - [Enabled](#config-enabled)

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

The below bit of code is everything you need to get going.  However, I'll explain it below.

```javascript
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpModule, Http } from "@angular/http";
import { NgxHttpBatcherModule,
         HttpBatchConfiguration,
         HttpBatchConfigurationCollection,
         HttpBatcher } from "ngx-http-batcher";

import { AppComponent } from "./app.component";

// Exported function so that HttpBatchConfigurationCollection can be used as in DI.
// Having this as an exported function enabled AOT complication as well :-)
export function httpBatchConfigurationFactory() {
  return new HttpBatchConfigurationCollection([
    // this is a basic configuration object see  [Configuration Object Options](#configuration) 
    // for more information on all the options
    new HttpBatchConfiguration({
      rootEndpointUrl: "https://api.myservice.com",
      batchEndpointUrl: "https://api.myservice.com/$batch"
    })]);
};

// Note the providers block where the Http class is being replaced by the HttpBatcher class.
// This ensures that if you inject the Http service into something you actually get the
// HttpBatcher class and batching becomes transparent to you.
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

Then you can just use the Http service as you normally would safe in the knowlegde that requests to you batchable service (configured above) will be batched.

```javascript
import { Component } from "@angular/core";
import { Http } from "@angular/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  public somedata: string[];
  public otherdata: string[];

  public constructor(private http: Http) {
    http.get("https://api.myservice.com/somedata")
        .subscribe(response => this.somedata = response.json());
    http.get("https://api.myservice.com/otherdata/123-456")
        .subscribe(response => this.otherdata = response.json());
    http.put("https://api.myservice.com/jobs", { id: 1, name: "Angular Wizard" })
        .subscribe();
  }
}
```


### <a name="configuration"></a> Configuration

Below are all the configuration options for a single batch endpoint.  Note that you can have as many batch endpoints as you want but you would need a seperate configuraiton object for each one.

### <a name="config-endpointurl"></a> Endpoint Url
The root endpoint url which is used to determine if the http call is destinted to an endpoint that can be batched.
For example you endpoint might be:

```https://api.myservice.com```

Calls to ```https//api.myservice.com/users``` or ```https//api.myservice.com/users/fdfkhdf-3432e23wd/friends?limit=10&from=0``` would be batched.
Calls to ```https://qa.myservice.com/bugs``` would not be batched as the subdomain are different.

### <a name="config-batchurl"></a> Batch Endpoint Url
The url of the exposed batch endpoint that is associated with the service defined in rootEndpointUrl.

For example

```https://api.myservice.com/$batch```

### <a name="config-enabled"></a> Enabled
This optional parameter defaults to true.  If false calls that would normally be batched to this endpoint will just be passed through as normal HTTP calls.

