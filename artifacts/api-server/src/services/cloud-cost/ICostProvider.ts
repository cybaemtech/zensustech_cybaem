export interface CloudSubscription {
  id: string;
  name: string;
  state: string;
}

export interface CostData {
  totalCost: number;
  currency: string;
  breakdown: Array<{
    name: string; // e.g. service name or subscription name
    cost: number;
  }>;
}

export interface ICostProvider {
  /**
   * Initializes the provider with credentials
   */
  authenticate(credentials: any): Promise<boolean>;

  /**
   * Gets a list of subscriptions/accounts
   */
  getSubscriptions(): Promise<CloudSubscription[]>;

  /**
   * Gets cost data for a specific scope (like a subscription) and time frame
   */
  getCostData(scope: string, startDate: string, endDate: string): Promise<CostData>;
}
