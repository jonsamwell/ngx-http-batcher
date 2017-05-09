# ngx-http-batcher

Angular (2+) HTTP batching module to reduce the number of HTTP requests and increase performance

[![Build Status](https://travis-ci.org/jonsamwell/ngx-http-batcher.svg?branch=master)](https://travis-ci.org/jonsamwell/ngx-http-batcher)
[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]


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
  - [Min Requests Per Batch](#config-minRequestsPerBatch)
  - [Max Requests Per Batch](#config-maxRequestsPerBatch)
  - [Batch Request Collection Delay Milliseconds](#config-batchRequestCollectionDelayMilliseconds)
  - [Ignored Http Verbs](#config-ignoredHttpVerbs)
  - [Send Cookies](#config-sendCookies)
  - [Unique Request Name (content-dispositon header)](#config-uniqueRequestName)
  - [Http Batching Adapter](#config-httpBatchingAdapter)
  - [On Before Send Batch Request Handler](#config-onBeforeSendBatchRequest)
- [.Net WebApi Configuation](#config-net)
- [Configuring for Java Servlet <= 3.1](#config-javaservlet)


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
    // this is a basic configuration object see [Configuration Object Options]
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

### <a name="config-minRequestsPerBatch"></a> Min Requests Per Batch
The minimum number of http requests that trigger a batch request to be sent.

Http calls are batched into groups.  There is no point batching a single http call therefore the default smallest batch size is 2.

### <a name="config-maxRequestsPerBatch"></a> Max Requests Per Batch
The maximum number of http requests that can be batched in a single batch request.

Http calls are batched into groups.  Batching hundreds of http calls into a single batch request might be unwise due to string processing times and the fact that you would not be taking advantage of being able to send to more than one http request to the same host of once.  Therefore, the default max batch size is 20.

### <a name="config-batchRequestCollectionDelayMilliseconds"></a> Batch Request Collection Delay Milliseconds
The period of time to wait in milliseconds between recieving the first http request and sending the batch.

This is undoubtedly the most important option. As this module tries to be as transparent as possible to the user.

The default time in milliseconds the http batcher should wait to collection all request to this domain after the first http call that can be batched has been collect. This defaults to 75ms. Therefore if you send a HTTP GET call that can be batched the HTTP batcher will receive this call and wait a further 75ms before sending the call in order to wait for other calls to the same domain in order to add them to the current batch request. If no other calls are collected the initial HTTP call will be allowed to continue as normal and will not be batched unless the config property - minRequestBatchSize is set to 2.

### <a name="config-ignoredHttpVerbs"></a> Ignored Http Verbs
Requests with these http verbs will be ignored and not form part of the batch.

By default http requests with the verbs 'HEAD' & 'OPTIONS' are ignored.

### <a name="config-sendCookies"></a> Send Cookies
True to send cookies, defaults to false to reduce request size.

If this is set to true cookies available on the document.cookie property will be set in each segment of a batch request. Note that only non HTTPOnly cookies will be sent as HTTPOnly cookies cannot be access by JavaScript because of security limitations.

### <a name="config-uniqueRequestName"></a> Unique Request Name
An optional parameter to set a unique parameter name on the Content-Disposition header. This requires the a 'Content-Disposition' header is first set on the initial request sending in a Content-Disposition header. Sample configuration:

Some backend servers may require that each part be named in this manner. If the configuration above is used, then each part will have a header like this: Content-Disposition: form-data; name=batchRequest0

If a Content-Disposition header is not added in the request then this parameter is silently ignored.

## <a name="config-net"></a> Configuring .Net WebApi to accept batch requests

This is really simple the web api team have done a really good job here. To enable batch request handling you just add a new route to your application and the rest is done for you! It's so easy I don't see any reason for you not to do it! See this link for a more detailed setup guide. Just add the below code to your web api configuration class and you are good to go!

```
configuration.Routes.MapHttpBatchRoute(
        routeName:"batch",
        routeTemplate:"$batch",
        batchHandler:new DefaultHttpBatchHandler(server));
```

## <a name="config-javaservlet"></a> Configuring for Java Servlet <= 3.1

Java Servlet <= 3.1 parses multipart requests looking for the Content-Disposition header, expecting all multipart requests to include form data. It also expects a content disposition header per request part in the batch.

Therefore you will need to setup the library to do this. Add a 'Content-Disposition' header of 'form-data' and set the 'Unique Request Name' configuration option.



