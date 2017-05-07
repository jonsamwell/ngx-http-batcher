import { HttpBatchConfiguration } from "../../src/batch-configuration";

describe("HttpBatchConfiguration", () => {
  it("Can create instance", () => {
    const config = new HttpBatchConfiguration({batchEndpointUrl: "", rootEndpointUrl: ""});
    expect(config).toBeDefined();
  });
});
