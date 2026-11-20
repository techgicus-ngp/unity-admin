const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};
const n = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);
const iso = (d) => (d instanceof Date && !isNaN(d) ? d.toISOString() : null);

/** Firestore doc → quotation. Dates become Date objects. */
export function normalizeQuotation(data, id) {
  return {
    id,
    customerName: data.customerName ?? '',
    mobileNumber: data.mobileNumber ?? '',
    address: data.address ?? '',
    projectName: data.projectName ?? '',
    plotNumber: data.plotNumber ?? '',
    plotSize: n(data.plotSize),
    ratePerSqFt: n(data.ratePerSqFt),
    totalPlotAmount: n(data.totalPlotAmount),
    bookingAmount: n(data.bookingAmount),
    downPayment: n(data.downPayment),
    loanAmount: n(data.loanAmount),
    stampDutyPercent: n(data.stampDutyPercent, 6),
    stampDutyAmount: n(data.stampDutyAmount),
    registrationPercent: n(data.registrationPercent, 1),
    registrationAmount: n(data.registrationAmount),
    mutation: n(data.mutation),
    societyCharges: n(data.societyCharges),
    adminTotal: n(data.adminTotal),
    finalTotalAmount: n(data.finalTotalAmount),
    quotationDate: toDate(data.quotationDate) ?? new Date(),
    bookingDate: toDate(data.bookingDate),
    downPaymentDate: toDate(data.downPaymentDate),
    saleDeederDate: toDate(data.saleDeederDate),
    createdByUid: data.createdByUid ?? '',
    createdByName: data.createdByName ?? '',
    downPaymentPercent: n(data.downPaymentPercent, 20),
    // Fields written by other clients - preserved on edit.
    extra: {
      customerAge: data.customerAge ?? '',
      nomineeName: data.nomineeName ?? '',
      nomineeAge: data.nomineeAge ?? '',
      relationWithCustomer: data.relationWithCustomer ?? '',
      profession: data.profession ?? '',
      mouza: data.mouza ?? '',
      khNo: data.khNo ?? '',
      emiDate: data.emiDate ?? '',
      emiAmount: n(data.emiAmount),
      alternateNumber: data.alternateNumber ?? '',
      application: data.application ?? '',
      subject: data.subject ?? '',
      advanceEmi: n(data.advanceEmi),
      emiMonths: n(data.emiMonths),
      paymentMode: data.paymentMode ?? 'Monthly',
    },
  };
}

/** Quotation → Firestore document (same field names the Flutter app wrote). */
export function serializeQuotation(q) {
  const { id: _id, extra, ...rest } = q;
  return {
    ...(extra ?? {}),
    ...rest,
    quotationDate: iso(q.quotationDate) ?? new Date().toISOString(),
    bookingDate: iso(q.bookingDate),
    downPaymentDate: iso(q.downPaymentDate),
    saleDeederDate: iso(q.saleDeederDate),
  };
}
