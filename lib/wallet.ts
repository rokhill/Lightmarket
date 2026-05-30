export function useWallet() {
  return {
    wallet: null,
    balance: 0,
    connectWallet: () => console.log("connectWallet() not implemented"),
    txPending: false,
    setTxPending: () => {},
  };
}

export async function getProvider() {
  console.log("getProvider() not implemented");
}

export async function getSigner() {
  console.log("getSigner() not implemented");
}
