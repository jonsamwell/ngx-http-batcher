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

  it("Should not overwrite given values with default values", () => {
    const config = new HttpBatchConfiguration({
      batchEndpointUrl: "batchEndpointUrl",
      rootEndpointUrl: "rootEndpointUrl",
      enabled: false,
      minRequestsPerBatch: 1,
      maxRequestsPerBatch: 100,
      sendCookies: true,
      batchRequestCollectionDelayMilliseconds: 1000,
      uniqueRequestName: "jon"
    });

    expect(config.batchEndpointUrl).toEqual("batchEndpointUrl");
    expect(config.rootEndpointUrl).toEqual("rootEndpointUrl");
    expect(config.batchRequestCollectionDelayMilliseconds).toEqual(1000);
    expect(config.enabled).toBeFalsy();
    expect(config.maxRequestsPerBatch).toEqual(100);
    expect(config.minRequestsPerBatch).toEqual(1);
    expect(config.sendCookies).toBeTruthy();
    expect(config.uniqueRequestName).toEqual("jon");
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
      const config = [new HttpBatchConfiguration({
        batchEndpointUrl,
        rootEndpointUrl
      }), new HttpBatchConfiguration({
        batchEndpointUrl: "https://api.efg.com/$batch",
        rootEndpointUrl: "https://api.efg.com"
      })];
      const configurationCollection = new HttpBatchConfigurationCollection(config);
      const foundConfig = configurationCollection
                            .getConfigurationForUrl(`${rootEndpointUrl}users/1/jobs?q=abc&max=10`);
      expect(foundConfig).toBeDefined();
      expect(foundConfig.batchEndpointUrl).toEqual(batchEndpointUrl);
    });

    it("Returns correct configuration for give complex url which is similar to the others", () => {
      const batchEndpointUrl1 = "https://api.abc.com/1/$batch";
      const rootEndpointUrl1 = "https://api.abc.com/1/";
      const batchEndpointUrl2 = "https://api.abc.com/2/$batch";
      const rootEndpointUrl2 = "https://api.abc.com/2/";
      const config = [new HttpBatchConfiguration({
        batchEndpointUrl: batchEndpointUrl1,
        rootEndpointUrl: rootEndpointUrl1
      }), new HttpBatchConfiguration({
        batchEndpointUrl: batchEndpointUrl2,
        rootEndpointUrl: rootEndpointUrl2
      })];
      const configurationCollection = new HttpBatchConfigurationCollection(config);
      const foundConfig = configurationCollection
                            .getConfigurationForUrl(`${rootEndpointUrl2}users/1/jobs?q=abc&max=10`);
      expect(foundConfig).toBeDefined();
      expect(foundConfig.batchEndpointUrl).toEqual(batchEndpointUrl2);
    });

    it("Returns undefined if configuration cannot be found", () => {
      const batchEndpointUrl = "https://api.abc.com/$batch";
      const rootEndpointUrl = "https://api.abc.com/";
      const config = [new HttpBatchConfiguration({
        batchEndpointUrl,
        rootEndpointUrl
      }), new HttpBatchConfiguration({
        batchEndpointUrl: "https://api.efg.com/$batch",
        rootEndpointUrl: "https://api.efg.com"
      })];
      const configurationCollection = new HttpBatchConfigurationCollection(config);
      const foundConfig = configurationCollection
                            .getConfigurationForUrl(`https://api.jkl.com/users/1/jobs?q=abc&max=10`);
      expect(foundConfig).toBeUndefined();
    });
  });
});
