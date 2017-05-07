import { NgModule, NgZone } from "@angular/core";
import { ConnectionBackend, Http, HttpModule, RequestOptions, XHRBackend } from "@angular/http";
import { HttpBatchConfiguration, HttpBatchConfigurationCollection } from "./batch-configuration";
import { HttpBatcher } from "./services/http-batcher.service";

@NgModule({
  id: "ngx-http-batcher",
  declarations: [],
  exports: [],
  imports: [HttpModule],
  providers: [
    { provide: ConnectionBackend, useClass: XHRBackend },
    {
      provide: Http,
      useClass: HttpBatcher,
      deps: [HttpBatchConfigurationCollection, NgZone, XHRBackend, RequestOptions]
    },
  ]
})
export class NgxHttpBatcherModule { }

export { HttpBatchConfiguration, HttpBatchConfigurationCollection } from "./batch-configuration";
export { IBatchHttpRequestAdapter, WellKnownHttpBatchingAdapters } from "./adapters/batching-adapter";
export { HttpBatcher } from "./services/http-batcher.service";
