import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../../../store/actions';
import {
  getCurrentChainId,
  getMetaMaskAccounts,
  getRpcPrefsForCurrentProvider,
  getMetaMaskAccountsConnected,
} from '../../../selectors';
import { formatBalance } from '../../../helpers/utils/util';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { EVENT } from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import SelectMouseware from './select-mouseware';
import AccountList from './account-list';

const U2F_ERROR = 'U2F';

const MEW_PATH = `m/44'/60'/0'`;
const BIP44_PATH = `m/44'/60'/0'/0`;

const TREZOR_TESTNET_PATH = `m/44'/1'/0'/0`;
const TREZOR_HD_PATHS = [
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
];

const HD_PATHS = {
  trezor: TREZOR_HD_PATHS,
};

class ConnectImpersonateForm extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    error: null,
    selectedAccounts: [],
    accounts: [],
    browserSupported: true,
    unlocked: false,
    device: null,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { accounts } = nextProps;
    const newAccounts = this.state.accounts.map((a) => {
      const normalizedAddress = a.address.toLowerCase();
      const balanceValue = accounts[normalizedAddress]?.balance || null;
      a.balance = balanceValue ? formatBalance(balanceValue, 6) : '...';
      return a;
    });
    this.setState({ accounts: newAccounts });
  }

  /*
  componentDidMount() {
    this.checkIfUnlocked();
  }

*/

  connectToMousewareWallet = (device, inputAddress) => {
    this.setState({ device });
    if (this.state.accounts.length) {
      return;
    }

    // Default values
    this.getPage(device, inputAddress);
  };

  onAccountChange = (account) => {
    let { selectedAccounts } = this.state;
    if (selectedAccounts.includes(account)) {
      selectedAccounts = selectedAccounts.filter((acc) => account !== acc);
    } else {
      selectedAccounts.push(account);
    }
    this.setState({ selectedAccounts, error: null });
  };

  onAccountRestriction = () => {
    this.setState({ error: this.context.t('ledgerAccountRestriction') });
  };

  showTemporaryAlert() {
    this.props.showAlert(this.context.t('mousewareWalletConnected'));
    // Autohide the alert after 5 seconds
    setTimeout((_) => {
      this.props.hideAlert();
    }, SECOND * 5);
  }

  // eslint-disable-next-line no-unused-vars
  getPage = (device, inputAddress) => {
    const impersonationAddress = [
      {
        // address: '0xf9710226A0f47d5413016a6275347221aB6Fa5F3',
        address: inputAddress,
        balance: '0',
        index: 0,
      },
    ];
    this.props
      .connectMouseware(impersonationAddress)
      .then((accounts) => {
        if (accounts.length) {
          // If we just loaded the accounts for the first time
          // (device previously locked) show the global alert
          if (this.state.accounts.length === 0 && !this.state.unlocked) {
            this.showTemporaryAlert();
          }

          // Map accounts with balances
          const newAccounts = accounts.map((account) => {
            const normalizedAddress = account.address.toLowerCase();
            const balanceValue =
              this.props.accounts[normalizedAddress]?.balance || null;
            account.balance = balanceValue
              ? formatBalance(balanceValue, 6)
              : '...';
            return account;
          });

          this.setState({
            accounts: newAccounts,
            unlocked: true,
            device,
            error: null,
          });
        }
      })
      .catch((e) => {
        const errorMessage = typeof e === 'string' ? e : e.message;
        if (errorMessage === 'Window blocked') {
          this.setState({ browserSupported: false, error: null });
        } else if (errorMessage.includes(U2F_ERROR)) {
          this.setState({ error: U2F_ERROR });
        } else if (
          errorMessage === 'LEDGER_LOCKED' ||
          errorMessage === 'LEDGER_WRONG_APP'
        ) {
          this.setState({
            error: this.context.t('ledgerLocked'),
          });
        } else if (errorMessage.includes('timeout')) {
          this.setState({
            error: this.context.t('ledgerTimeout'),
          });
        } else if (
          errorMessage
            .toLowerCase()
            .includes(
              'KeystoneError#pubkey_account.no_expected_account'.toLowerCase(),
            )
        ) {
          this.setState({
            error: this.context.t('QRHardwarePubkeyAccountOutOfRange'),
          });
        } else if (
          errorMessage !== 'Window closed' &&
          errorMessage !== 'Popup closed' &&
          errorMessage
            .toLowerCase()
            .includes('KeystoneError#sync_cancel'.toLowerCase()) === false
        ) {
          this.setState({
            error: errorMessage,
          });
        }
      });
  };

  onForgetDevice = (device) => {
    this.props
      .forgetDevice(device)
      .then((_) => {
        this.setState({
          error: null,
          selectedAccounts: [],
          accounts: [],
          unlocked: false,
        });
      })
      .catch((e) => {
        this.setState({ error: e.message });
      });
  };

  onUnlockAccounts = (device, path) => {
    const {
      history,
      mostRecentOverviewPage,
      unlockMousewareWalletAccounts,
    } = this.props;
    const { selectedAccounts } = this.state;
    const { accounts } = this.state;

    if (selectedAccounts.length === 0) {
      this.setState({ error: this.context.t('accountSelectionRequired') });
    }

    const description =
      MEW_PATH === path
        ? this.context.t('hardwareWalletLegacyDescription')
        : '';

    return unlockMousewareWalletAccounts(
      selectedAccounts,
      accounts,
      device,
      path || null,
      description,
    )
      .then((_) => {
        this.context.trackEvent({
          category: EVENT.CATEGORIES.ACCOUNTS,
          event: `Connected Account with: ${device}`,
          properties: {
            action: 'Connected Hardware Wallet',
            legacy_event: true,
          },
        });
        history.push(mostRecentOverviewPage);
      })
      .catch((e) => {
        this.context.trackEvent({
          category: EVENT.CATEGORIES.ACCOUNTS,
          event: 'Error connecting hardware wallet',
          properties: {
            action: 'Connected Hardware Wallet',
            legacy_event: true,
            error: e.message,
          },
        });
        this.setState({ error: e.message });
      });
  };

  onCancel = () => {
    const { history, mostRecentOverviewPage } = this.props;
    history.push(mostRecentOverviewPage);
  };

  renderError() {
    if (this.state.error === U2F_ERROR) {
      return (
        <p className="hw-connect__error">
          {this.context.t('troubleConnectingToWallet', [
            this.state.device,
            // eslint-disable-next-line react/jsx-key
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
              key="hardware-connection-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="hw-connect__link"
              style={{ marginLeft: '5px', marginRight: '5px' }}
            >
              {this.context.t('walletConnectionGuide')}
            </a>,
          ])}
        </p>
      );
    }
    return this.state.error ? (
      <span className="hw-connect__error">{this.state.error}</span>
    ) : null;
  }

  renderContent() {
    if (!this.state.accounts.length) {
      return (
        <SelectMouseware
          connectToMousewareWallet={this.connectToMousewareWallet}
          browserSupported={this.state.browserSupported}
          accounts={this.state.accounts}
          history={this.props.history}
          mostRecentOverviewPage={this.props.mostRecentOverviewPage}
        />
      );
    }

    return (
      <AccountList
        onPathChange={this.onPathChange}
        selectedPath={this.props.defaultHdPaths[this.state.device]}
        device={this.state.device}
        accounts={this.state.accounts}
        connectedAccounts={this.props.connectedAccounts}
        selectedAccounts={this.state.selectedAccounts}
        onAccountChange={this.onAccountChange}
        chainId={this.props.chainId}
        rpcPrefs={this.props.rpcPrefs}
        getPage={this.getPage}
        onUnlockAccounts={this.onUnlockAccounts}
        onForgetDevice={this.onForgetDevice}
        onCancel={this.onCancel}
        onAccountRestriction={this.onAccountRestriction}
        hdPaths={HD_PATHS}
      />
    );
  }

  render() {
    return (
      <>
        {this.renderError()}
        {this.renderContent()}
      </>
    );
  }
}

ConnectImpersonateForm.propTypes = {
  connectMouseware: PropTypes.func,
  forgetDevice: PropTypes.func,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  unlockMousewareWalletAccounts: PropTypes.func,
  history: PropTypes.object,
  chainId: PropTypes.string,
  rpcPrefs: PropTypes.object,
  accounts: PropTypes.object,
  connectedAccounts: PropTypes.array.isRequired,
  defaultHdPaths: PropTypes.object,
  mostRecentOverviewPage: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  chainId: getCurrentChainId(state),
  rpcPrefs: getRpcPrefsForCurrentProvider(state),
  accounts: getMetaMaskAccounts(state),
  connectedAccounts: getMetaMaskAccountsConnected(state),
  defaultHdPaths: state.appState.defaultHdPaths,
  mostRecentOverviewPage: getMostRecentOverviewPage(state),
  ledgerTransportType: state.metamask.ledgerTransportType,
});

const mapDispatchToProps = (dispatch) => {
  return {
    connectMouseware: (impersonationAddress) => {
      return dispatch(actions.connectMouseware(impersonationAddress));
    },
    forgetDevice: (deviceName) => {
      return dispatch(actions.forgetDevice(deviceName));
    },
    unlockMousewareWalletAccounts: (
      indexes,
      accounts,
      deviceName,
      hdPath,
      hdPathDescription,
    ) => {
      return dispatch(
        actions.unlockMousewareWalletAccounts(
          indexes,
          accounts,
          deviceName,
          hdPath,
          hdPathDescription,
        ),
      );
    },
    showAlert: (msg) => dispatch(actions.showAlert(msg)),
    hideAlert: () => dispatch(actions.hideAlert()),
  };
};

ConnectImpersonateForm.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectImpersonateForm);
