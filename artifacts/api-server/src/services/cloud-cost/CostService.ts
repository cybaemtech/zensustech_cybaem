import { ICostProvider } from "./ICostProvider";
import { AzureCostProvider } from "./AzureCostProvider";

export type CloudProviderType = "AZURE" | "AWS" | "GCP";

export class CostService {
  /**
   * Factory method to get the correct provider instance
   */
  static async getProvider(providerType: CloudProviderType, credentials: any): Promise<ICostProvider> {
    let provider: ICostProvider;

    switch (providerType) {
      case "AZURE":
        provider = new AzureCostProvider();
        break;
      case "AWS":
      case "GCP":
        throw new Error(`${providerType} provider is not implemented yet.`);
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const isAuthenticated = await provider.authenticate(credentials);
    if (!isAuthenticated) {
      throw new Error(`Failed to authenticate with ${providerType}`);
    }

    return provider;
  }
}
