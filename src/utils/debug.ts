// Debug utilities for transaction handling

export const logTransaction = (
  operation: string, 
  hash: string | undefined, 
  error?: any
) => {
  const timestamp = new Date().toISOString();
  
  console.group(`🔍 ${operation} - ${timestamp}`);
  console.log('Hash:', hash);
  console.log('Hash type:', typeof hash);
  console.log('Hash length:', hash?.length);
  
  if (error) {
    console.error('Error:', error);
  }
  
  if (hash) {
    console.log('Valid hash:', hash.startsWith('0x') && hash.length >= 66);
    console.log('Explorer link:', `https://shannon-explorer.somnia.network/tx/${hash}`);
  }
  
  console.groupEnd();
};

export const validateTransactionHash = (hash: any): string | null => {
  if (!hash) {
    console.error('Transaction hash is null or undefined');
    return null;
  }
  
  const hashString = String(hash);
  
  if (!hashString.startsWith('0x')) {
    console.error('Transaction hash does not start with 0x:', hashString);
    return null;
  }
  
  if (hashString.length < 66) {
    console.error('Transaction hash is too short:', hashString);
    return null;
  }
  
  return hashString;
};

export const debugTransactionState = (state: {
  txHash: string;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: any;
}) => {
  console.group('📊 Transaction State');
  console.log('TX Hash:', state.txHash);
  console.log('Is Confirming:', state.isConfirming);
  console.log('Is Success:', state.isSuccess);
  console.log('Is Error:', state.isError);
  
  if (state.error) {
    console.error('Error:', state.error);
  }
  
  console.groupEnd();
};