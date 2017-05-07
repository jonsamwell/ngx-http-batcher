import { NgZone } from "@angular/core";
import { Request, Response, ResponseType } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { IBatchHttpRequestAdapter } from "../adapters/batching-adapter";
import { HttpBatchConfiguration } from "../batch-configuration";

export interface IBatchRequest {
  request: Request;
  observer: Observer<Response>;
  cancelled: boolean;
}

export class BatchScheduler {
  private pendingRequest: IBatchRequest[];
  private currentTimeoutHandle: any;

  public constructor(
    public configuration: HttpBatchConfiguration,
    private batchAdapter: IBatchHttpRequestAdapter,
    private httpRequestFn: (request: Request) => Observable<Response>,
    private ngZone: NgZone) {
    this.pendingRequest = new Array<IBatchRequest>();
  }

  public schedule(request: IBatchRequest): void {
    this.pendingRequest.push(request);

    if (this.pendingRequest.length === 1) {
      this.ngZone.runOutsideAngular(() => {
        this.currentTimeoutHandle = setTimeout(
          () => this.ngZone.run(() => this.flushRequests()),
          this.configuration.batchRequestCollectionDelayMilliseconds);
      });
    }

    if (this.pendingRequest.length >= this.configuration.maxRequestsPerBatch) {
      this.flushRequests();
    }
  }

  public flushRequests(): void {
    if (this.currentTimeoutHandle) {
      clearTimeout(this.currentTimeoutHandle);
      this.currentTimeoutHandle = undefined;
    }

    const requests = this.pendingRequest.filter((r) => !r.cancelled).map((r) => r);
    this.pendingRequest.length = 0;

    if (requests.length < this.configuration.minRequestsPerBatch) {
      this.performHttpRequest(requests);
    } else {
      this.performBatchRequest(requests);
    }
  }

  protected performHttpRequest(requests: IBatchRequest[]): void {
    requests.forEach((r) => this.httpRequestFn(r.request)
      .subscribe(
      (response) => r.observer.next(response),
      (err) => r.observer.error(err),
      () => r.observer.complete()));
  }

  protected performBatchRequest(requests: IBatchRequest[]): void {
    const batchRequest = this.batchAdapter.batch(requests.map((r) => r.request));
    this.configuration.onBeforeSendBatchRequest(batchRequest);
    this.httpRequestFn(batchRequest)
      .subscribe(
      (response) => {
        const responses = this.batchAdapter.parse(response);
        responses.forEach((r, i) => {
          try {
            const request = requests[i];
            r.url = request.request.url;
            if (r.status >= 200 && r.status < 300) {
              request.observer.next(r);
              request.observer.complete();
            } else {
              r.type = ResponseType.Error;
              request.observer.error(r);
            }
          // tslint:disable-next-line:no-empty
          } catch (e) { }
        });
      },
      (err) => requests.forEach((r) => r.observer.error(err)));
  }
}
