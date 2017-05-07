import { Headers, Request, RequestMethod, RequestOptions, Response,
         ResponseOptions, ResponseType } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { HttpBatchConfiguration } from "../batch-configuration";
import { IBatchHttpRequestAdapter } from "./batching-adapter";

const XSSI_PREFIX = /^\)\]\}',?\n/;

/**
 * See https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch
 * https://blogs.msdn.microsoft.com/webdev/2013/11/01/introducing-batch-support-in-web-api-and-web-api-odata/
 */
export class HttpMultipartMixedBoundaryAdapter implements IBatchHttpRequestAdapter {
  private static HTTP_VERSION_1_1 = "HTTP/1.1";
  private static BOUNDARY = "1494052623884";
  private static MMM_CONTENT_TYPE = "multipart/mixed; boundary=";
  private static H_CONTENT_ID = "Content-ID";
  private static H_CONTENT_TYPE = "Content-Type";
  private static H_CONTENT_ID_PREFIX_TEMPLATE = "<b29c5de2-0db4-490b-b421-6a51b598bd22+{i}>";
  private static DOUBLE_DASH = "--";
  private static NEW_LINE = "\r\n";
  private static EMPTY_STRING = "";
  private static SPACE = " ";

  public constructor(private configuration: HttpBatchConfiguration, private defaultRequestOptions: RequestOptions) { }

  public batch(requests: Request[]): Request {
    const bodyParts = new Array<string>();
    requests.forEach((r, i) => {
      const urlParts = this.getUrlParts(r.url);
      // request mandatory headers
      bodyParts.push(HttpMultipartMixedBoundaryAdapter.DOUBLE_DASH + HttpMultipartMixedBoundaryAdapter.BOUNDARY);
      bodyParts.push(
        "Content-Type: application/http; msgtype=request",
        "Content-ID: " + HttpMultipartMixedBoundaryAdapter.H_CONTENT_ID_PREFIX_TEMPLATE.replace("{i}", i.toString()),
        HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);

      // http type
      bodyParts.push(
        // tslint:disable-next-line:max-line-length
        `${RequestMethod[r.method].toUpperCase()} ${urlParts.path}${urlParts.search} ${HttpMultipartMixedBoundaryAdapter.HTTP_VERSION_1_1}`,
        `Host: ${urlParts.host}`,
        `Accept: application/json, text/plain, */*`);

      // request's normal headers
      r.headers.forEach((values, name) => {
        let header = `{name}:{values.join(",")}`;
        if (this.configuration.uniqueRequestName !== undefined &&
            name.toLowerCase().indexOf("content-disposition") > -1) {
          header += `; name=${this.configuration.uniqueRequestName}${i.toString()}`;
        }
        bodyParts.push(header);
      });

      if (this.configuration.sendCookies && document.cookie.length > 0) {
        bodyParts.push(`Cookie: ${document.cookie}`);
      }

      bodyParts.push(HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);

      const body = r.getBody(); // returns null if no body :-(
      // tslint:disable-next-line:no-null-keyword
      if (body !== null) {
        bodyParts.push(body);
        bodyParts.push(HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);
      }

      bodyParts.push(HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);
    });

    bodyParts.push(HttpMultipartMixedBoundaryAdapter.DOUBLE_DASH +
                   HttpMultipartMixedBoundaryAdapter.BOUNDARY +
                   HttpMultipartMixedBoundaryAdapter.DOUBLE_DASH);

    const batchRequest = new Request({
      ...this.defaultRequestOptions,
      body: bodyParts.join(HttpMultipartMixedBoundaryAdapter.NEW_LINE)
    });
    batchRequest.url = this.configuration.batchEndpointUrl;
    batchRequest.method = RequestMethod.Post;
    batchRequest.headers = batchRequest.headers || new Headers();
    batchRequest.headers.append(
      HttpMultipartMixedBoundaryAdapter.H_CONTENT_TYPE,
      HttpMultipartMixedBoundaryAdapter.MMM_CONTENT_TYPE + HttpMultipartMixedBoundaryAdapter.BOUNDARY);
    return batchRequest;
  }

  public parse(response: Response): Response[] {
    const contentTypeHeaderValue = response.headers.get(HttpMultipartMixedBoundaryAdapter.H_CONTENT_TYPE);
    // tslint:disable-next-line:no-null-keyword
    if (contentTypeHeaderValue == null ||
        contentTypeHeaderValue.indexOf(HttpMultipartMixedBoundaryAdapter.MMM_CONTENT_TYPE) === -1) {
      throw new Error("A batched repsonse mist contain a content-type: multipart/mixed; boundary header");
    }

    const boundary = contentTypeHeaderValue.split(HttpMultipartMixedBoundaryAdapter.MMM_CONTENT_TYPE)[1]
      .replace(/"/g, HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);

    return response.text()
      .split(HttpMultipartMixedBoundaryAdapter.DOUBLE_DASH + boundary)
      .filter((part) => part !== HttpMultipartMixedBoundaryAdapter.EMPTY_STRING &&
        part !== (HttpMultipartMixedBoundaryAdapter.DOUBLE_DASH + HttpMultipartMixedBoundaryAdapter.NEW_LINE))
      .map((part) => {
        // splitting by two new lines gets
        // 1. The batch content type header
        // 2. The actual response http + headers
        // 3. The response body (if any)
        const batchedParts = part.split(HttpMultipartMixedBoundaryAdapter.NEW_LINE +
                                        HttpMultipartMixedBoundaryAdapter.NEW_LINE);
        const headers = new Headers();
        let status: number;
        let statusText: string;
        let body = batchedParts[2];

        batchedParts[1]
          .split(HttpMultipartMixedBoundaryAdapter.NEW_LINE)
          .forEach((header, i) => {
            const lineParts = header.split(HttpMultipartMixedBoundaryAdapter.SPACE);
            if (i === 0) {
              status = parseInt(lineParts[1], 10);
              statusText = lineParts.slice(2).join(HttpMultipartMixedBoundaryAdapter.SPACE);
            } else {
              headers.append(lineParts[0].replace(":", HttpMultipartMixedBoundaryAdapter.EMPTY_STRING), lineParts[1]);
            }
          });

        // implicitly strip a potential XSSI prefix.
        if (body !== undefined && body.length > 0) {
          body = body.replace(XSSI_PREFIX, HttpMultipartMixedBoundaryAdapter.EMPTY_STRING);
        }

        return new Response(new ResponseOptions({
          status,
          statusText,
          headers,
          body,
          type: ResponseType.Default
        }));
      });
  }

  private getUrlParts(url: string): { host: string; path: string, search: string } {
    const anchorElement = document.createElement("a");
    anchorElement.href = url;
    return {
      host: anchorElement.host,
      path: anchorElement.pathname,
      search: anchorElement.search
    };
  }
}
