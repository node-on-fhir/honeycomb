// packages/hipaa-audit-starter/tests/nightwatch/commands/components/reviewHipaaAuditLogPage.js

exports.command = function() {
  this
    .verify.elementPresent("#auditLogPage")
    .verify.elementPresent("#hipaaAuditLog")

  return this; 
};