import { TokenInfo } from '@manahippo/hippo-sdk/dist/generated/coin_registry/coin_registry';
import CoinIcon from 'components/CoinIcon';
import useTokenBalane from 'hooks/useTokenBalance';

interface TProps {
  item: TokenInfo;
}

const CoinRow: React.FC<TProps> = ({ item }) => {
  const balance = useTokenBalane(item.symbol.str());
  return (
    <div className="flex items-center justify-between gap-2 border-2 border-grey-900 w-full p-2 hover:bg-primePurple-100">
      <div className="flex items-center gap-2">
        <CoinIcon logoSrc={item.logo_url.str()} />
        <div className="">
          <div className="font-bold text-grey-900 uppercase">{item.symbol.str()}</div>
          <small className="text-grey-500 font-bold">{item.name.str()}</small>
        </div>
      </div>
      <small className="text-grey-700 font-bold">{balance}</small>
    </div>
  );
};

export default CoinRow;
