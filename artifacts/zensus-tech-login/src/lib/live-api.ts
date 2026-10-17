export const LIVE_API_BASE = '/api/v1';

export function getLiveApiHeaders(): Headers {
  const headers = new Headers();
  const managementToken = sessionStorage.getItem('mgmt_token');
  const graphToken = sessionStorage.getItem('graph_token');

  if (managementToken) headers.set('Authorization', `Bearer ${managementToken}`);
  if (graphToken) headers.set('X-Graph-Token', graphToken);

  return headers;
}
