import { Injectable } from "@angular/core";
import { Request, RequestMethod } from "@angular/http";
import { IBatchHttpRequestAdapter, WellKnownHttpBatchingAdapters } from "./adapters/batching-adapter";

export interface IHttpBatchConfigurationOptions {
  /**
   * The root endpoint url which is used to determine if the http call is destinted to an endpoint that can be batched.
   *
   * @type {string}
   * @memberof IHttpBatchConfigurationOptions
   */
  rootEndpointUrl: string;

  /**
   * The url of the exposed batch endpoint that is associated with the service defined in rootEndpointUrl.
   *
   * @type {string}
   * @memberof IHttpBatchConfigurationOptions
   */
  batchEndpointUrl: string;

  /**
   * True indicates the calls to the rootEndpointUrl will be batched.  False disabled the batcher.
   *
   * @type {boolean}
   * @memberof IHttpBatchConfigurationOptions
   * @default true
   */
  enabled?: boolean;

  /**
   * The minimum number of http requests that trigger a batch request to be sent.
   *
   * @type {number}
   * @memberof IHttpBatchConfigurationOptions
   * @default 2
   */
  minRequestsPerBatch?: number;

  /**
   * The maximum number of http requests that can be batched in a single batch request.
   *
   * @type {number}
   * @memberof IHttpBatchConfigurationOptions
   * @default 20
   */
  maxRequestsPerBatch?: number;

  /**
   * The period of time to wait in milliseconds between recieving the first http request and sending the batch.
   *
   * @type {number}
   * @memberof IHttpBatchConfigurationOptions
   * @default 50
   */
  batchRequestCollectionDelayMilliseconds?: number;

  /**
   *  Requests with these http verbs will be ignored and not form part of the batch.
   *
   * @type {RequestMethod[]}
   * @memberof IHttpBatchConfigurationOptions
   * @default [RequestMethod.Head, RequestMethod.Options]
   */
  ignoredHttpVerbs?: RequestMethod[];

  /**
   * A request name that is passed as part of the content-disposition header.  Needed for some Java servers.
   *
   * @type {string}
   * @memberof IHttpBatchConfigurationOptions
   */
  uniqueRequestName?: string;

  /**
   * True to send cookies, defaults to false to reduce request size.
   *
   * @type {boolean}
   * @memberof IHttpBatchConfigurationOptions
   * @default false
   */
  sendCookies?: boolean;

  /**
   * The type of batcher that will be used to construct and parse batching requests.
   *
   * @type {(WellKnownHttpBatchingAdapters | IBatchHttpRequestAdapter)}
   * @memberof IHttpBatchConfigurationOptions
   * @default WellKnownHttpBatchingAdapters.Http_MultipartMixed
   */
  httpBatchingAdapter?: WellKnownHttpBatchingAdapters | IBatchHttpRequestAdapter;

  /**
   * Lifecycle hook to modify the batch request just before it is sent.  This can be use to add aditional
   * headers to the request. eg: "Authorisation: Bearer ..."
   *
   * @memberof IHttpBatchConfigurationOptions
   * @type (batchRequest: Request) => void;
   */
  onBeforeSendBatchRequest?: (batchRequest: Request) => void;
}

export class HttpBatchConfiguration {
  public rootEndpointUrl: string;
  public batchEndpointUrl: string;
  public enabled: boolean;
  public minRequestsPerBatch: number;
  public maxRequestsPerBatch: number;
  public batchRequestCollectionDelayMilliseconds: number;
  public ignoredHttpVerbs: RequestMethod[];
  public uniqueRequestName: string;
  public sendCookies: boolean;
  public httpBatchingAdapter: WellKnownHttpBatchingAdapters | IBatchHttpRequestAdapter;
  public onBeforeSendBatchRequest: (batchRequest: Request) => void;

  public constructor(options: IHttpBatchConfigurationOptions) {
    this.rootEndpointUrl = options.rootEndpointUrl;
    this.batchEndpointUrl = options.batchEndpointUrl;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.minRequestsPerBatch = options.minRequestsPerBatch || 2;
    this.maxRequestsPerBatch = options.maxRequestsPerBatch || 20;
    this.batchRequestCollectionDelayMilliseconds = options.batchRequestCollectionDelayMilliseconds || 75;
    this.ignoredHttpVerbs = options.ignoredHttpVerbs || [RequestMethod.Head, RequestMethod.Options];
    this.uniqueRequestName = options.uniqueRequestName;
    this.sendCookies = options.sendCookies !== undefined ? options.sendCookies : false;
    this.httpBatchingAdapter = options.httpBatchingAdapter || WellKnownHttpBatchingAdapters.Http_MultipartMixed;
    // tslint:disable-next-line:no-empty
    this.onBeforeSendBatchRequest = options.onBeforeSendBatchRequest || (() => {});
  }
}

// tslint:disable-next-line:max-classes-per-file
export class HttpBatchConfigurationCollection {
  /**
   * @param {HttpBatchConfiguration[]} configurations A collection of http batch configurations for
   * each batchable endpoint.
   */
  public constructor(public configurations: HttpBatchConfiguration[]) { }

  public getConfigurationForUrl(url: string): HttpBatchConfiguration {
    if (this.configurations === undefined) {
      return undefined;
    }
    return this.configurations.filter((config) => url.indexOf(config.rootEndpointUrl) > -1)[0];
  }
}
