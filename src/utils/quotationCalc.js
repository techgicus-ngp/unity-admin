import {
  REGISTRATION_CAP_AMOUNT,
  REGISTRATION_CAP_THRESHOLD,
} from '@/config/constants';
import { parseNum } from './format';

/** Registration: 1% up to ₹30 L, otherwise a flat ₹30,000. */
export const autoRegistration = (total) =>
  total <= REGISTRATION_CAP_THRESHOLD ? total * 0.01 : REGISTRATION_CAP_AMOUNT;

const r0 = Math.round;

/**
 * Pure quotation maths - the single source of truth for the form.
 * `manualDownPayment` is null while the down payment follows the 10% / 20% option.
 */
export function calcQuotation({
  plotSize,
  rate,
  booking,
  stampDutyPercent,
  mutation,
  societyCharges,
  downPaymentOption,
  manualDownPayment = null,
}) {
  const size = parseNum(plotSize);
  const total = size * parseNum(rate);
  const book = parseNum(booking);
  const pct = downPaymentOption === '10%' ? 0.1 : 0.2;

  const agreementAmount = total * 0.2;
  const autoDownPayment = Math.max(0, total * pct - book);
  const downPayment = manualDownPayment ?? autoDownPayment;
  const loanAmount = Math.max(0, total - book - downPayment);
  const stampDutyAmount = (total * parseNum(stampDutyPercent, 6)) / 100;
  const registrationAmount = autoRegistration(total);
  const adminTotal =
    r0(stampDutyAmount) + r0(registrationAmount) + parseNum(mutation) + parseNum(societyCharges);
  const totalR = r0(total);

  return {
    totalPlotAmount: totalR,
    agreementAmount: r0(agreementAmount),
    autoDownPayment: r0(autoDownPayment),
    downPayment: r0(downPayment),
    loanAmount: r0(loanAmount),
    stampDutyAmount: r0(stampDutyAmount),
    registrationAmount: r0(registrationAmount),
    adminTotal,
    finalTotalAmount: totalR + adminTotal,
  };
}
