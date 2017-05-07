import { Injectable, NgZone } from "@angular/core";
import { BaseRequestOptions, ConnectionBackend, Http, Request, RequestMethod,
         RequestOptions, RequestOptionsArgs, Response } from "@angular/http";
import { RequestArgs } from "@angular/http/src/interfaces";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";

import { IBatchHttpRequestAdapter, WellKnownHttpBatchingAdapters } from "../adapters/batching-adapter";
import { HttpMultipartMixedBoundaryAdapter } from "../adapters/http-multipart-mixed-boundary-adapter";
import { HttpBatchConfiguration, HttpBatchConfigurationCollection } from "../batch-configuration";
import { BatchScheduler } from "./batch-scheduler";

@Injectable()
export class HttpBatcher extends Http {
  private requestManagers: BatchScheduler[];

  public constructor(
    private batchingConfigurations: HttpBatchConfigurationCollection,
    private ngZone: NgZone,
    backend: ConnectionBackend,
    defaultOptions: RequestOptions) {
    super(backend, defaultOptions);
    this.requestManagers = this.batchingConfigurations
      .configurations
      .map((c) => new BatchScheduler(
        c,
        this.getAdapter(c),
        (request: Request) => super.request(request),
        ngZone));
  }

  /**
   * Performs any type of http request. First argument is required, and can either be a url or
   * a {@link Request} instance. If the first argument is a url, an optional {@link RequestOptions}
   * object can be provided as the 2nd argument. The options object will be merged with the values
   * of {@link BaseRequestOptions} before performing the request.
   */
  public request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    const enpointUrl = url instanceof Request ? (url as Request).url : url;
    const configuration = this.batchingConfigurations.getConfigurationForUrl(enpointUrl);
    if (this.canBatchRequest(configuration)) {
      const request = url instanceof Request ?
        url as Request :
        new Request(this.mergeOptions(this._defaultOptions, options, RequestMethod.Get, url as string));
      return this.batchRequest(request, configuration);
    } else {
      return super.request(url, options);
    }
  }

  protected canBatchRequest(configuration: HttpBatchConfiguration): boolean {
    return configuration !== undefined && configuration.enabled;
  }

  protected batchRequest(request: Request, configuration: HttpBatchConfiguration): Observable<Response> {
    return new Observable<Response>((observer: Observer<Response>) => {
      const bacthRequest = {
        observer,
        cancelled: false,
        request
      };
      this.requestManagers
        .find((x) => x.configuration.batchEndpointUrl === configuration.batchEndpointUrl)
        .schedule(bacthRequest);
      return () => bacthRequest.cancelled = true;
    });
  }

  protected getAdapter(configuration: HttpBatchConfiguration): IBatchHttpRequestAdapter {
    switch (configuration.httpBatchingAdapter) {
      case WellKnownHttpBatchingAdapters.Http_MultipartMixed:
        return new HttpMultipartMixedBoundaryAdapter(configuration, this._defaultOptions);
      default:
        return configuration.httpBatchingAdapter as IBatchHttpRequestAdapter;
    }
  }

  private mergeOptions(
    defaultOpts: BaseRequestOptions,
    providedOpts: RequestOptionsArgs | undefined,
    method: RequestMethod,
    url: string): RequestArgs {
    const newOptions = defaultOpts;
    if (providedOpts) {
      return newOptions.merge(new RequestOptions({
        body: providedOpts.body,
        headers: providedOpts.headers,
        method: providedOpts.method || method,
        params: providedOpts.params,
        responseType: providedOpts.responseType,
        search: providedOpts.search,
        url: providedOpts.url || url,
        withCredentials: providedOpts.withCredentials
      })) as RequestArgs;
    }

    return newOptions.merge(new RequestOptions({ method, url })) as RequestArgs;
  }
}
