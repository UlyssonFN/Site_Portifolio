/* ==========================================================================\n+   Anne OS Kids - QR Code de apoio ao projeto\n+   ========================================================================== */

const SUPPORT_QR_VALUE = 'ulysson52@gmail.com';
const SUPPORT_QR_TITLE = 'Ajude-nos a manter o projeto no ar';

function supportQrMarkup() {
  return `<div class="support-qrcode-card">
    <strong>${SUPPORT_QR_TITLE}</strong>
    <img src="assets/support-qrcode.png" alt="QR Code para ${SUPPORT_QR_VALUE}">
    <span>${SUPPORT_QR_VALUE}</span>
  </div>`;
}