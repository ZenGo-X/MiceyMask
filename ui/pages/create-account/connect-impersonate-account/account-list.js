import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { getAccountLink } from '@metamask/etherscan-link';

import Button from '../../../components/ui/button';
import Checkbox from '../../../components/ui/check-box';

import { getURLHostName } from '../../../helpers/utils/util';

import { DEVICE_NAMES } from '../../../../shared/constants/hardware-wallets';
import { EVENT } from '../../../../shared/constants/metametrics';

class AccountList extends Component {
  renderHdPathSelector() {
    return (
      <div>
        <p className="hw-connect__msg">
          {this.context.t('selectImpersonateHelp')}
        </p>
      </div>
    );
  }

  capitalizeDevice(device) {
    return device.slice(0, 1).toUpperCase() + device.slice(1);
  }

  renderHeader() {
    const { device } = this.props;
    const shouldShowHDPaths = [
      DEVICE_NAMES.LEDGER,
      DEVICE_NAMES.LATTICE,
      DEVICE_NAMES.TREZOR,
    ].includes(device.toLowerCase());
    return (
      <div className="hw-connect">
        <h3 className="hw-connect__unlock-title">
          {this.context.t('selectAnAccount')}
        </h3>
        {shouldShowHDPaths ? this.renderHdPathSelector() : null}
        <h3 className="hw-connect__hdPath__title">
          {this.context.t('selectAnAccount')}
        </h3>
      </div>
    );
  }

  renderAccounts() {
    const { accounts, connectedAccounts, rpcPrefs, chainId } = this.props;

    return (
      <div className="hw-account-list">
        {accounts.map((account, idx) => {
          const accountAlreadyConnected = connectedAccounts.includes(
            account.address.toLowerCase(),
          );
          const value = account.index;
          const checked =
            this.props.selectedAccounts.includes(account.index) ||
            accountAlreadyConnected;

          return (
            <div
              className="hw-account-list__item"
              key={account.address}
              title={
                accountAlreadyConnected
                  ? this.context.t('selectAnAccountAlreadyConnected')
                  : ''
              }
            >
              <div className="hw-account-list__item__checkbox">
                <Checkbox
                  id={`address-${idx}`}
                  checked={checked}
                  disabled={accountAlreadyConnected}
                  onClick={() => {
                    this.props.onAccountChange(value);
                  }}
                />
                <label
                  className="hw-account-list__item__label"
                  htmlFor={`address-${idx}`}
                >
                  <span className="hw-account-list__item__index">
                    {account.index + 1}
                  </span>
                  {`${account.address.slice(0, 4)}...${account.address.slice(
                    -4,
                  )}`}
                  <span className="hw-account-list__item__balance">{`${account.balance}`}</span>
                </label>
              </div>
              <a
                className="hw-account-list__item__link"
                onClick={() => {
                  const accountLink = getAccountLink(
                    account.address,
                    chainId,
                    rpcPrefs,
                  );
                  this.context.trackEvent({
                    category: EVENT.CATEGORIES.ACCOUNTS,
                    event: 'Clicked Block Explorer Link',
                    properties: {
                      actions: 'Hardware Connect',
                      link_type: 'Account Tracker',
                      block_explorer_domain: getURLHostName(accountLink),
                    },
                  });
                  global.platform.openTab({
                    url: accountLink,
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
                title={this.context.t('etherscanView')}
              >
                <i
                  className="fa fa-share-square"
                  style={{ color: 'var(--color-icon-default)' }}
                />
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  renderButtons() {
    const disabled = this.props.selectedAccounts.length === 0;
    const buttonProps = {};
    if (disabled) {
      buttonProps.disabled = true;
    }

    return (
      <div className="new-external-account-form__buttons">
        <Button
          type="secondary"
          large
          className="new-external-account-form__button"
          onClick={this.props.onCancel.bind(this)}
        >
          {this.context.t('cancel')}
        </Button>
        <Button
          type="primary"
          large
          className="new-external-account-form__button unlock"
          disabled={disabled}
          onClick={this.props.onUnlockAccounts.bind(
            this,
            this.props.device,
            this.props.selectedPath,
          )}
        >
          {this.context.t('unlock')}
        </Button>
      </div>
    );
  }

  render() {
    return (
      <div className="new-external-account-form account-list">
        {this.renderHeader()}
        {this.renderAccounts()}
        {this.renderButtons()}
      </div>
    );
  }
}

AccountList.propTypes = {
  selectedPath: PropTypes.string.isRequired,
  device: PropTypes.string.isRequired,
  accounts: PropTypes.array.isRequired,
  connectedAccounts: PropTypes.array.isRequired,
  onAccountChange: PropTypes.func.isRequired,
  chainId: PropTypes.string,
  rpcPrefs: PropTypes.object,
  selectedAccounts: PropTypes.array.isRequired,
  onUnlockAccounts: PropTypes.func,
  onCancel: PropTypes.func,
};

AccountList.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

export default AccountList;
