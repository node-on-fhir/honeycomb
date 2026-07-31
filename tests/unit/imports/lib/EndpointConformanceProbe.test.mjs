// tests/unit/imports/lib/EndpointConformanceProbe.test.mjs
//
// node --test tests/unit/imports/lib/EndpointConformanceProbe.test.mjs
// Pure conformance probe (spider core) — DI fetch/clock, never throws.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  probeEndpoint,
  classifySmartConfig,
  classifyCapabilityStatement,
  classifyVendor,
  gradeReadiness
} from '../../../../imports/lib/EndpointConformanceProbe.js';

const SMART_CONFIG = {
  authorization_endpoint: 'https://ehr.example.org/oauth2/authorize',
  token_endpoint: 'https://ehr.example.org/oauth2/token',
  capabilities: ['launch-standalone', 'launch-ehr', 'client-public', 'permission-patient'],
  grant_types_supported: ['authorization_code'],
  scopes_supported: ['openid', 'fhirUser', 'launch/patient', 'patient/Patient.read'],
  code_challenge_methods_supported: ['S256']
};

const CAPABILITY = {
  resourceType: 'CapabilityStatement',
  fhirVersion: '4.0.1',
  software: { name: 'Epic', version: 'February 2026' },
  rest: [{
    mode: 'server',
    security: {
      service: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/restful-security-service', code: 'SMART-on-FHIR' }] }]
    },
    resource: [
      { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }] },
      { type: 'Condition', interaction: [{ code: 'read' }, { code: 'search-type' }] },
      { type: 'Observation', interaction: [{ code: 'read' }, { code: 'search-type' }] },
      { type: 'DocumentReference', interaction: [{ code: 'read' }] }
    ]
  }]
};

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    text: async function() { return JSON.stringify(body); }
  };
}

function fetchFor(routes) {
  return async function(url) {
    for (const [suffix, response] of Object.entries(routes)) {
      if (url.includes(suffix)) {
        return typeof response === 'function' ? response() : response;
      }
    }
    return jsonResponse({}, 404);
  };
}

test('classifySmartConfig extracts endpoints, capabilities, standalone + PKCE flags', () => {
  const smart = classifySmartConfig(SMART_CONFIG);
  assert.equal(smart.authorizationEndpoint, 'https://ehr.example.org/oauth2/authorize');
  assert.equal(smart.tokenEndpoint, 'https://ehr.example.org/oauth2/token');
  assert.ok(smart.capabilities.includes('launch-standalone'));
  assert.deepEqual(smart.grantTypes, ['authorization_code']);
  assert.ok(smart.scopesSupported.includes('launch/patient'));
  assert.equal(smart.supportsStandaloneLaunch, true);
  assert.equal(smart.supportsPkce, true);
});

test('classifyCapabilityStatement extracts version, software, security, resources, usCoreHint', () => {
  const cap = classifyCapabilityStatement(CAPABILITY);
  assert.equal(cap.fhirVersion, '4.0.1');
  assert.equal(cap.softwareName, 'Epic');
  assert.equal(cap.security, 'SMART-on-FHIR');
  assert.equal(cap.usCoreHint, true);
  const patient = cap.resources.find(function(r) { return r.type === 'Patient'; });
  assert.deepEqual(patient.interactions, ['read', 'search-type']);
});

test('classifyVendor identifies epic, oracle-cerner, and unknown', () => {
  assert.equal(classifyVendor({ baseUrl: 'https://haiku.wacofhc.org/FHIR/api/FHIR/R4/', softwareName: 'Epic' }).vendor, 'epic');
  assert.equal(classifyVendor({ baseUrl: 'https://fhir-myrecord.cerner.com/r4/abc/', softwareName: '' }).vendor, 'oracle-cerner');
  assert.equal(classifyVendor({ baseUrl: 'https://mystery.example.org/fhir', softwareName: '' }).vendor, 'unknown');
});

test('probeEndpoint happy path → reachable, up, patientLaunchable, no stored bodies', async () => {
  const fetchImpl = fetchFor({
    '.well-known/smart-configuration': jsonResponse(SMART_CONFIG),
    '/metadata': jsonResponse(CAPABILITY)
  });
  const result = await probeEndpoint({
    baseUrl: 'https://ehr.example.org/FHIR/R4',
    fetchImpl: fetchImpl,
    now: function() { return new Date('2026-07-29T00:00:00Z'); }
  });
  assert.equal(result.reachable, true);
  assert.equal(result.healthTag, 'up');
  assert.equal(result.httpStatus, 200);
  assert.equal(result.fhirVersion, '4.0.1');
  assert.equal(result.smart.authorizationEndpoint, 'https://ehr.example.org/oauth2/authorize');
  assert.equal(result.vendor, 'epic');
  assert.equal(result.patientLaunchable, true);
  assert.equal(result.lastProbedAt.toISOString(), '2026-07-29T00:00:00.000Z');
  assert.equal(result.probeError, undefined);
  // no raw body fields stored
  assert.equal(result.capabilityStatement, undefined);
  assert.equal(result.smartConfiguration, undefined);
});

test('probeEndpoint degraded when metadata works but smart-configuration is missing', async () => {
  const fetchImpl = fetchFor({
    '.well-known/smart-configuration': jsonResponse({}, 404),
    '/metadata': jsonResponse(CAPABILITY)
  });
  const result = await probeEndpoint({ baseUrl: 'https://ehr.example.org/FHIR/R4', fetchImpl: fetchImpl });
  assert.equal(result.reachable, true);
  assert.equal(result.healthTag, 'degraded');
  assert.equal(result.patientLaunchable, false);
});

test('probeEndpoint never throws — network failure → down with redacted probeError', async () => {
  const fetchImpl = async function() { throw new Error('getaddrinfo ENOTFOUND ehr.nowhere secret-token=abc'); };
  const result = await probeEndpoint({ baseUrl: 'https://ehr.nowhere/FHIR/R4', fetchImpl: fetchImpl });
  assert.equal(result.reachable, false);
  assert.equal(result.healthTag, 'down');
  assert.equal(result.patientLaunchable, false);
  assert.ok(typeof result.probeError === 'string' && result.probeError.length > 0);
});

test('probeEndpoint blocks non-https and private-range URLs without fetching', async () => {
  let called = 0;
  const fetchImpl = async function() { called += 1; return jsonResponse({}); };
  for (const bad of ['http://ehr.example.org/fhir', 'https://127.0.0.1/fhir', 'https://10.0.0.5/fhir', 'https://192.168.1.10/fhir', 'https://localhost/fhir']) {
    const result = await probeEndpoint({ baseUrl: bad, fetchImpl: fetchImpl });
    assert.equal(result.reachable, false, bad + ' should be blocked');
    assert.match(result.probeError, /blocked/i);
  }
  assert.equal(called, 0, 'blocked URLs must never be fetched');
});

test('gradeReadiness requires reachable + R4 + standalone launch + usCoreHint', () => {
  const base = {
    reachable: true,
    fhirVersion: '4.0.1',
    usCoreHint: true,
    smart: { authorizationEndpoint: 'https://x/auth', supportsStandaloneLaunch: true },
    smartConfigOk: true,
    metadataOk: true
  };
  assert.equal(gradeReadiness(base).patientLaunchable, true);
  assert.equal(gradeReadiness(Object.assign({}, base, { fhirVersion: '1.0.2' })).patientLaunchable, false);
  assert.equal(gradeReadiness(Object.assign({}, base, { smart: { supportsStandaloneLaunch: false } })).patientLaunchable, false);
  assert.equal(gradeReadiness(Object.assign({}, base, { reachable: false })).patientLaunchable, false);
});
