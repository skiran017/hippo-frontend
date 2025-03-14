import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { logger } from 'redux-logger';
import { ErrorBoundary } from 'components';
import reducer from 'modules/rootReducer';
import { AptosWalletProvider } from 'contexts/AptosWalletProvider';
import { HippoClientProvider } from 'contexts/HippoClientProvider';
import {
  WalletProvider,
  //HippoWalletAdapter,
  AptosWalletAdapter,
  //HippoExtensionWalletAdapter,
  MartianWalletAdapter
  // FewchaWalletAdapter
  // NightlyWalletAdapter
} from '@manahippo/aptos-wallet-adapter';
import { useMemo } from 'react';
import { message } from 'antd';

const isDevelopmentMode = process.env.NODE_ENV === 'development';

const store = configureStore({
  reducer,
  devTools: isDevelopmentMode,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: {
        ignoredPaths: ['connection']
      }
    }).concat(isDevelopmentMode ? [logger] : [])
});

type TProps = {
  children: any;
};

const Providers: React.FC<TProps> = (props: TProps) => {
  const wallets = useMemo(
    () => [
      //new HippoWalletAdapter(),
      //new HippoExtensionWalletAdapter(),
      new MartianWalletAdapter(),
      new AptosWalletAdapter()
      // new FewchaWalletAdapter()
      // new MultiMaskWalletAdapter()
      // new NightlyWalletAdapter()
    ],
    []
  );

  return (
    <ErrorBoundary>
      <WalletProvider
        wallets={wallets}
        onError={(error: Error) => {
          if (error instanceof Error) {
            message.error(error?.message);
          } else {
            message.error(`Wallet Error: ${error}`);
          }
        }}>
        <AptosWalletProvider>
          <ReduxProvider store={store}>
            <HippoClientProvider>{props.children}</HippoClientProvider>
          </ReduxProvider>
        </AptosWalletProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default Providers;
