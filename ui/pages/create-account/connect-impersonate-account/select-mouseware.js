/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-unused-vars */
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '../../../components/ui/button';
import LogoTrezor from '../../../components/ui/logo/logo-trezor';
import EnsInput from '../../send/send-content/add-recipient/ens-input';
import TextField from '../../../components/ui/text-field';
import { DEVICE_NAMES } from '../../../../shared/constants/hardware-wallets';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../../send/send.constants';
import {
  getEnsError,
  getEnsResolution,
  resetEnsResolution,
} from '../../../ducks/ens';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../helpers/utils/util';

export default class SelectMouseware extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    connectToMousewareWallet: PropTypes.func.isRequired,
    browserSupported: PropTypes.bool.isRequired,
    history: PropTypes.object,
  };

  state = {
    selectedDevice: 'trezor',
    input: '',
    // inputAddress: '',
  };

  connect = () => {
    const inputAddress = this.state.input;
    if (this.state.selectedDevice) {
      this.props.connectToMousewareWallet(
        this.state.selectedDevice,
        inputAddress,
      );
    }
    return null;
  };

  renderConnectToTrezorButton() {
    return (
      <button
        className={classnames('hw-connect__btn', {
          selected: this.state.selectedDevice === DEVICE_NAMES.TREZOR,
        })}
        onClick={(_) => this.setState({ selectedDevice: DEVICE_NAMES.TREZOR })}
      >
        <LogoTrezor className="hw-connect__btn__img" ariaLabel="Trezor" />
      </button>
    );
  }

  validate = (address) => {
    const valid =
      !isBurnAddress(address) &&
      isValidHexAddress(address, { mixedCaseUseChecksum: true });
    const validEnsAddress = isValidDomainName(address);
  };

  onChange = (input) => {
    this.setState({ input });
    // this.dValidate(input);
    console.log(input);
  };

  renderInput() {
    return (
      <EnsInput
        onChange={this.onChange}
        onPaste={(text) => {
          this.setState({ input: text });
          this.validate(text);
        }}
        onReset={() => {
          this.setState({ input: '' });
        }}
        userInput={this.state.input}
      />
    );
  }

  renderButtons() {
    const { t } = this.context;

    return (
      <>
        <div className="hw-connect">
          {t('ethereumPublicAddress')}
          {this.renderInput()}
        </div>
      </>
    );
  }

  renderContinueButton() {
    return (
      <Button
        type="primary"
        large
        className="hw-connect__connect-btn"
        onClick={this.connect}
        // disabled={!this.state.selectedDevice}
      >
        {this.context.t('continue')}
      </Button>
    );
  }

  renderUnsupportedBrowser() {
    return (
      <div className="new-external-account-form unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">
            {this.context.t('browserNotSupported')}
          </h3>
          <p className="hw-connect__msg">
            {this.context.t('chromeRequiredForHardwareWallets')}
          </p>
        </div>
        <Button
          type="primary"
          large
          onClick={() =>
            global.platform.openTab({
              url: 'https://google.com/chrome',
            })
          }
        >
          {this.context.t('downloadGoogleChrome')}
        </Button>
      </div>
    );
  }

  renderHeader() {
    return (
      <div className="hw-connect__header">
        <h3 className="hw-connect__header__title">
          {this.context.t('impersonateAddress')}
        </h3>
        <p className="hw-connect__header__msg">
          {this.context.t('impersonateAddressMessage')}
        </p>
      </div>
    );
  }

  renderConnectScreen() {
    return (
      <div className="new-external-account-form">
        {this.renderHeader()}
        {this.renderButtons()}
        {this.renderContinueButton()}
      </div>
    );
  }

  render() {
    if (this.props.browserSupported) {
      return this.renderConnectScreen();
    }
    return this.renderUnsupportedBrowser();
  }
}
