import { Headers, Request, RequestMethod, RequestOptions } from "@angular/http";
import { HttpMultipartMixedBoundaryAdapter } from "../../src/adapters/http-multipart-mixed-boundary-adapter";
import { HttpBatchConfiguration } from "../../src/batch-configuration";

describe("HttpMultipartMixedBoundaryAdapter", () => {
  it("Can be created", () => {
    const config = new HttpBatchConfiguration({ batchEndpointUrl: "", rootEndpointUrl: "" });
    const defaultRequestOptions = new RequestOptions();
    const adapter = new HttpMultipartMixedBoundaryAdapter(config, defaultRequestOptions);
    expect(adapter).toBeDefined();
  });

  describe("batchRequests", () => {
    it("Should configure a single get batch request correctly", () => {
      const rootUrl = "https://api.abc.com/";
      const batchUrl = `${rootUrl}$batch`;
      const config = new HttpBatchConfiguration({
        batchEndpointUrl: batchUrl,
        rootEndpointUrl: rootUrl
      });
      const defaultRequestOptions = new RequestOptions();
      const adapter = new HttpMultipartMixedBoundaryAdapter(config, defaultRequestOptions);

      const requests = [new Request({ url: `${rootUrl}users`, method: RequestMethod.Get })];
      const batchRequest = adapter.batch(requests);

      expect(batchRequest).toBeDefined();
      expect(batchRequest.url).toEqual(batchUrl);
      expect(batchRequest.method).toEqual(RequestMethod.Post);
      expect(batchRequest.headers).toBeDefined();
      expect(batchRequest.headers.get("Content-Type")).toEqual("multipart/mixed; boundary=1494052623884");
      expect(batchRequest.getBody().length).toBeGreaterThan(1);
      expect(batchRequest.getBody()).toEqual([
        "--1494052623884",
        "Content-Type: application/http; msgtype=request",
        "Content-ID: <b29c5de2-0db4-490b-b421-6a51b598bd22+0>",
        "",
        "GET /users HTTP/1.1",
        "Host: api.abc.com",
        "Accept: application/json, text/plain, */*",
        "",
        "",
        "--1494052623884--"
      ].join("\r\n"));
    });

    it("Should configure a single get batch request correctly with custom headers", () => {
      const rootUrl = "https://api.abc.com/";
      const batchUrl = `${rootUrl}$batch`;
      const config = new HttpBatchConfiguration({
        batchEndpointUrl: batchUrl,
        rootEndpointUrl: rootUrl
      });
      const defaultRequestOptions = new RequestOptions();
      const adapter = new HttpMultipartMixedBoundaryAdapter(config, defaultRequestOptions);
      const customHeaders = new Headers();
      customHeaders.append("Jon", "Samwell");
      const requests = [new Request({
        url: `${rootUrl}users`,
        method: RequestMethod.Get,
        headers: customHeaders
      })];
      const batchRequest = adapter.batch(requests);

      expect(batchRequest).toBeDefined();
      expect(batchRequest.url).toEqual(batchUrl);
      expect(batchRequest.method).toEqual(RequestMethod.Post);
      expect(batchRequest.headers).toBeDefined();
      expect(batchRequest.headers.get("Content-Type")).toEqual("multipart/mixed; boundary=1494052623884");
      expect(batchRequest.getBody()).toEqual([
        "--1494052623884",
        "Content-Type: application/http; msgtype=request",
        "Content-ID: <b29c5de2-0db4-490b-b421-6a51b598bd22+0>",
        "",
        "GET /users HTTP/1.1",
        "Host: api.abc.com",
        "Accept: application/json, text/plain, */*",
        "Jon: Samwell",
        "",
        "",
        "--1494052623884--"
      ].join("\r\n"));
    });

    it("Should configure a single get batch request correctly with content disposition header", () => {
      const rootUrl = "https://api.abc.com/";
      const batchUrl = `${rootUrl}$batch`;
      const config = new HttpBatchConfiguration({
        batchEndpointUrl: batchUrl,
        rootEndpointUrl: rootUrl,
        uniqueRequestName: "unique"
      });
      const defaultRequestOptions = new RequestOptions();
      const adapter = new HttpMultipartMixedBoundaryAdapter(config, defaultRequestOptions);
      const customHeaders = new Headers();
      customHeaders.append("content-disposition", "something");
      const requests = [new Request({
        url: `${rootUrl}users`,
        method: RequestMethod.Get,
        headers: customHeaders
      })];
      const batchRequest = adapter.batch(requests);

      expect(batchRequest).toBeDefined();
      expect(batchRequest.url).toEqual(batchUrl);
      expect(batchRequest.method).toEqual(RequestMethod.Post);
      expect(batchRequest.headers).toBeDefined();
      expect(batchRequest.headers.get("Content-Type")).toEqual("multipart/mixed; boundary=1494052623884");
      expect(batchRequest.getBody()).toEqual([
        "--1494052623884",
        "Content-Type: application/http; msgtype=request",
        "Content-ID: <b29c5de2-0db4-490b-b421-6a51b598bd22+0>",
        "",
        "GET /users HTTP/1.1",
        "Host: api.abc.com",
        "Accept: application/json, text/plain, */*",
        "content-disposition: something; name=unique0",
        "",
        "",
        "--1494052623884--"
      ].join("\r\n"));
    });
  });
});
