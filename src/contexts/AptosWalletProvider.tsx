import { HexString } from 'aptos';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { createContext, FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { ActiveAptosWallet } from 'types/aptos';

interface AptosWalletContextType {
  activeWallet?: ActiveAptosWallet;
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

interface TProviderProps {
  children: ReactNode;
}

const AptosWalletContext = createContext<AptosWalletContextType>({} as AptosWalletContextType);

const hexStringV0ToV1 = (v0: any) => {
  if (typeof v0 === 'string') {
    return new HexString(v0);
  } else if (v0.hexString) {
    return new HexString(v0.toString());
  } else {
    throw new Error(`Invalid hex string object: ${v0}`);
  }
};

const AptosWalletProvider: FC<TProviderProps> = ({ children }) => {
  const { connected, account } = useWallet();
  const [activeWallet, setActiveWallet] = useState<ActiveAptosWallet>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (connected && (account?.address || account?.publicKey)) {
      setActiveWallet(hexStringV0ToV1(account?.address || account?.publicKey));
    } else {
      setActiveWallet(undefined);
    }
  }, [connected, account]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <AptosWalletContext.Provider
      value={{
        activeWallet,
        open,
        openModal,
        closeModal
      }}>
      {children}
    </AptosWalletContext.Provider>
  );
};

export { AptosWalletProvider, AptosWalletContext };
