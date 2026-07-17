// Account service — account info, broker connection

import { apiGet, apiPost } from './apiClient';
import type { AccountInfo, BrokerConnectionInfo, ConnectBrokerRequest, AccountSummary } from '../types';

export const accountService = {
  getAccountInfo: () =>
    apiGet<AccountInfo>('/account/info'),

  getBrokerConnection: () =>
    apiGet<BrokerConnectionInfo>('/account/broker'),

  connectBroker: (data: ConnectBrokerRequest) =>
    apiPost<BrokerConnectionInfo>('/account/broker/connect', data),

  disconnectBroker: () =>
    apiPost<BrokerConnectionInfo>('/account/broker/disconnect'),

  getSummary: () =>
    apiGet<AccountSummary>('/account/summary'),
};
