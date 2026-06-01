import CryptoJS from 'crypto-js';
import { appId, appSecret } from './config';

function getSignature() {
  const timestamp = Math.floor(Date.now() / 1000);
  const converttext = `${appId}\n${appSecret}\n${timestamp}`;
  const signature = CryptoJS.HmacSHA1(
    CryptoJS.enc.Utf8.parse(converttext),
    CryptoJS.enc.Utf8.parse(appSecret),
  ).toString(CryptoJS.enc.Base64);
  return {
    timestamp,
    signature,
  };
}

export default getSignature;
