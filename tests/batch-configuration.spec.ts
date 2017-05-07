import { RequestMethod } from "@angular/http";
import { WellKnownHttpBatchingAdapters } from "../src/adapters/batching-adapter";
import { HttpBatchConfiguration, HttpBatchConfigurationCollection } from "../src/batch-configuration";

describe("HttpBatchConfiguration", () => {
  it("Can be created", () => {
    const config = new HttpBatchConfiguration({batchEndpointUrl: "", rootEndpointUrl: ""});
    expect(config).toBeDefined();
  });

  it("Sets default values if not provided", () => {
    const config = new HttpBatchConfiguration({
      batchEndpointUrl: "batchEndpointUrl",
      rootEndpointUrl: "rootEndpointUrl"
    });

    expect(config.batchEndpointUrl).toEqual("batchEndpointUrl");
    expect(config.rootEndpointUrl).toEqual("rootEndpointUrl");
    expect(config.batchRequestCollectionDelayMilliseconds).toEqual(75);
    expect(config.enabled).toBeTruthy();
    expect(config.httpBatchingAdapter).toEqual(WellKnownHttpBatchingAdapters.Http_MultipartMixed);
    expect(config.ignoredHttpVerbs).toEqual([RequestMethod.Head, RequestMethod.Options]);
    expect(config.maxRequestsPerBatch).toEqual(20);
    expect(config.minRequestsPerBatch).toEqual(2);
    expect(config.sendCookies).toBeFalsy();
    expect(config.uniqueRequestName).toBeUndefined();
    expect(config.onBeforeSendBatchRequest).toBeDefined();
  });
});

describe("HttpBatchConfigurationCollection", () => {
  it("Can be created", () => {
    const config = new HttpBatchConfiguration({batchEndpointUrl: "", rootEndpointUrl: ""});
    const configurationCollection = new HttpBatchConfigurationCollection([config]);
    expect(configurationCollection).toBeDefined();
  });

  describe("getConfigurationForUrl", () => {
    it("Returns correct configuration for give url", () => {
      const batchEndpointUrl = "https://api.abc.com/$batch";
      const rootEndpointUrl = "https://api.abc.com/";
      const config = new HttpBatchConfiguration({
        batchEndpointUrl,
        rootEndpointUrl
      });
      const configurationCollection = new HttpBatchConfigurationCollection([config]);
      const foundConfig = configurationCollection.getConfigurationForUrl(`${rootEndpointUrl}users`);
      expect(foundConfig).toBeDefined();
      expect(foundConfig.batchEndpointUrl).toEqual(batchEndpointUrl);
    });
    it("Returns correct configuration for give complex url", () => {
      const batchEndpointUrl = "https://api.abc.com/$batch";
      const rootEndpointUrl = "https://api.abc.com/";
      const config = new HttpBatchConfiguration({
        batchEndpointUrl,
        rootEndpointUrl
      });
      const configurationCollection = new HttpBatchConfigurationCollection([config]);
      const foundConfig = configurationCollection
                            .getConfigurationForUrl(`${rootEndpointUrl}users/1/jobs?q=abc&max=10`);
      expect(foundConfig).toBeDefined();
      expect(foundConfig.batchEndpointUrl).toEqual(batchEndpointUrl);
    });
  });
});
