import { expect } from 'chai';
import { BigNumber } from '@ethersproject/bignumber';
import { callWithHttp, getPayload } from '../../src';
import { decode, encodeWithId } from '../../src/utils';
import {
  ETHER_BALANCES_ID,
  ETHER_BALANCES_TYPE,
  TOKEN_BALANCES_ID,
  TOKEN_BALANCES_TYPE
} from '../../src/constants';

const BalanceScanner = artifacts.require('BalanceScanner');
const FixedBalanceToken = artifacts.require('FixedBalanceToken');

const LOCAL_PROVIDER: string = (web3 as any).currentProvider.host;

describe('providers/http', () => {
  describe('getPayload()', () => {
    it('should return the request body as JSON string', async () => {
      const { address } = await BalanceScanner.deployed();

      const payload = getPayload(address, '0x');
      expect(payload.method).to.equal('eth_call');
      expect(payload.params[0].to).to.equal(address);
      expect(payload.params[0].data).to.equal('0x');
    });
  });

  describe('callWithHttp()', async () => {
    it('should get Ether balances from the contract', async () => {
      const { address } = await BalanceScanner.deployed();
      const accounts = await web3.eth.getAccounts();
      accounts.shift();

      const data = encodeWithId(ETHER_BALANCES_ID, ETHER_BALANCES_TYPE, accounts);
      const response = await callWithHttp(LOCAL_PROVIDER, address, data);

      const decoded = decode(response);

      for (let i = 0; i < accounts.length; i++) {
        const balance = BigNumber.from(await web3.eth.getBalance(accounts[i]));
        expect(balance.eq(decoded[i])).to.equal(true);
      }
    });

    it('should get token balances from the contract', async () => {
      const { address } = await BalanceScanner.deployed();
      const token = await FixedBalanceToken.new();
      const accounts = await web3.eth.getAccounts();

      const data = encodeWithId(TOKEN_BALANCES_ID, TOKEN_BALANCES_TYPE, accounts, token.address);
      const response = await callWithHttp(LOCAL_PROVIDER, address, data);

      const decoded = decode(response);

      for (let i = 0; i < accounts.length; i++) {
        expect(decoded[i].eq(BigNumber.from('100000000000000000000'))).to.equal(true);
      }
    });
  });
});
