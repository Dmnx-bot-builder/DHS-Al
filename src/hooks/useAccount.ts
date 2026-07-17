// Account hook — wraps accountService for React components

import { useApi } from './useApi';
import { useMutation } from './useMutation';
import { accountService } from '../services/accountService';
import type { ConnectBrokerRequest } from '../types';

export function useAccountInfo() {
  return useApi(() => accountService.getAccountInfo(), []);
}

export function useBrokerConnection() {
  return useApi(() => accountService.getBrokerConnection(), []);
}

export function useAccountSummary() {
  return useApi(() => accountService.getSummary(), []);
}

export function useConnectBroker() {
  return useMutation((data: ConnectBrokerRequest) => accountService.connectBroker(data));
}

export function useDisconnectBroker() {
  return useMutation(() => accountService.disconnectBroker());
}
