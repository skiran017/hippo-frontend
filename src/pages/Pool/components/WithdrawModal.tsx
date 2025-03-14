import { Modal } from 'components/Antd';
import Button from 'components/Button';
import NumberInput from 'components/NumberInput';
import SlideInput from 'components/SlideInput';
import { useFormik } from 'formik';
import useHippoClient from 'hooks/useHippoClient';
import { useEffect } from 'react';
import { useState } from 'react';
import { CloseIcon, PlusSMIcon } from 'resources/icons';
import { IPool } from 'types/pool';
import styles from './WithdrawModal.module.scss';
import { message } from 'components/Antd';

interface TWithdrawForm {
  amount: number;
}

interface TProps {
  tokenPair?: IPool;
  onDismissModal: () => void;
}

const WithdrawModal: React.FC<TProps> = ({ tokenPair, onDismissModal }) => {
  const isVisible = !!tokenPair;
  const [loading, setLoading] = useState(false);
  const { hippoSwap, tokenStores, requestWithdraw } = useHippoClient();
  const [totalUserLpUiAmt, setTotalUserLpUiAmt] = useState(0);

  useEffect(() => {
    const loadUserLpAmt = async () => {
      if (!tokenPair) {
        return;
      }
      const lhsSymbol = tokenPair.token0.symbol || '';
      const rhsSymbol = tokenPair.token1.symbol || '';
      const poolType = tokenPair.poolType;
      if (lhsSymbol && rhsSymbol && tokenStores && hippoSwap) {
        const pools = await hippoSwap.getDirectPoolsBySymbolsAndPoolType(
          lhsSymbol,
          rhsSymbol,
          poolType
        );
        if (pools.length === 0) {
          throw new Error(`Pool for ${lhsSymbol} and ${rhsSymbol} does not exist!`);
        }
        const pool = pools[0];
        const lpSymbol = pool.lpTokenInfo.symbol.str();
        if (lpSymbol in tokenStores) {
          const uiAmt =
            tokenStores[lpSymbol].coin.value.toJsNumber() /
            Math.pow(10, pool.lpTokenInfo.decimals.toJsNumber());
          setTotalUserLpUiAmt(uiAmt);
        } else {
          setTotalUserLpUiAmt(0);
        }
      }
    };

    loadUserLpAmt();
  }, [hippoSwap, tokenStores, tokenPair]);

  const onSubmitWithdraw = async (values: TWithdrawForm) => {
    if (!tokenPair || !hippoSwap) {
      return;
    }
    setLoading(true);
    const lhsSymbol = tokenPair.token0.symbol || '';
    const rhsSymbol = tokenPair.token1.symbol || '';
    const poolType = tokenPair.poolType;
    const pools = hippoSwap.getDirectPoolsBySymbolsAndPoolType(lhsSymbol, rhsSymbol, poolType);
    if (pools.length === 0) {
      throw new Error(`Direct Pool for ${lhsSymbol} - ${rhsSymbol} does not exist`);
    }
    const pool = pools[0];
    if (tokenStores && tokenStores[pool.lpTokenInfo.symbol.str()]) {
      await requestWithdraw(lhsSymbol, rhsSymbol, poolType, values.amount, 0, 0, () => {
        setLoading(false);
        onDismissModal();
      });
    } else {
      // user does not have this LP
      message.error('You do not have this LP token');
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      amount: 0
    },
    // validationSchema: DepositSchema,
    onSubmit: onSubmitWithdraw
  });

  const [receivedTokenXUiAmt, setReceivedX] = useState(0);
  const [receivedTokenYUiAmt, setReceivedY] = useState(0);

  const onRequestAmountToWithdraw = async (amount: number) => {
    //TODO: this will update the amount of each token to withdraw when user amount change
    const lhsSymbol = tokenPair?.token0.symbol || '';
    const rhsSymbol = tokenPair?.token1.symbol || '';
    if (!hippoSwap || !lhsSymbol || !rhsSymbol || !tokenPair) {
      return;
    }
    const pools = await hippoSwap.getDirectPoolsBySymbolsAndPoolType(
      lhsSymbol,
      rhsSymbol,
      tokenPair.poolType
    );
    if (pools.length === 0) {
      throw new Error(`Direct Pool for ${lhsSymbol} - ${rhsSymbol} does not exist`);
    }
    const pool = pools[0];
    const lpSupplyRawAmt = await hippoSwap.getTokenTotalSupplyBySymbol(
      pool.lpTokenInfo.symbol.str()
    );
    if (!lpSupplyRawAmt) {
      throw new Error('Unable to obtain LP token total supply');
    }
    const lpSupplyUiAmt =
      lpSupplyRawAmt.toJSNumber() / Math.pow(10, pool.lpTokenInfo.decimals.toJsNumber());
    const toReceive = pool.estimateWithdrawalOutput(amount, lpSupplyUiAmt);
    setReceivedX(toReceive.xUiAmt);
    setReceivedY(toReceive.yUiAmt);
  };

  const handleOnChange = (val: any) => {
    formik.setFieldValue('amount', val);
    onRequestAmountToWithdraw(val);
  };

  const paresSlideValue = () => {
    if (typeof formik.values.amount === 'number') return formik.values.amount;
    if (typeof formik.values.amount === 'string') return parseInt(formik.values.amount);
    return 0;
  };

  return (
    <Modal
      onCancel={onDismissModal}
      className=""
      wrapClassName={styles.withdrawModal}
      visible={isVisible}
      footer={null}
      maskClosable={false}
      closeIcon={<CloseIcon />}>
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col items-center gap-12">
          <h5 className="font-bold text-grey-900">Withdraw Liquidity</h5>
          <div className="flex flex-col w-full gap-3">
            <div className="text-grey-900 text-base">Amount(estimated)</div>
            <NumberInput
              className="w-full rounded-xl bg-input h-[56px] header5 bold"
              min={0}
              max={totalUserLpUiAmt}
              placeholder="0.00"
              // onFocus={() => handleOnChange(null)}
              controls={false}
              value={formik.values.amount}
              onChange={(val) => handleOnChange(val)}
            />
            <div className="helpText font-bold text-grey-700">
              <span className="uppercase">
                ({totalUserLpUiAmt} {tokenPair?.token0.symbol} / {tokenPair?.token1.symbol}
              </span>{' '}
              liquidity tokens)
            </div>
            <div className="my-4">
              <SlideInput
                min={0}
                max={totalUserLpUiAmt}
                tipFormatter={(value) => <div className="">{value}</div>}
                step={totalUserLpUiAmt / 10}
                onChange={(val: number) => handleOnChange(val)}
                value={paresSlideValue()}
              />
            </div>
            <div className="flex flex-col w-full gap-2">
              <div className="paragraph">You will receive:</div>
              <div className="flex w-full justify-between items-center">
                <div className="header5 bold text-grey-900 py-2 px-4 uppercase">
                  {receivedTokenXUiAmt.toFixed(7)} {tokenPair?.token0.symbol}
                </div>
                <PlusSMIcon />
                <div className="header5 bold text-grey-900 py-2 px-4 uppercase">
                  {receivedTokenYUiAmt.toFixed(7)} {tokenPair?.token1.symbol}
                </div>
              </div>
            </div>
          </div>
          <Button className="w-full rounded-[8px] font-bold" type="submit" isLoading={loading}>
            <h6 className="text-inherit">Withdraw</h6>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawModal;
