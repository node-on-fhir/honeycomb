import _ from 'lodash';
let get = _.get;
let set = _.set;
let has = _.has;
let findIndex = _.findIndex;

import moment from 'moment';
import sanitizeHtml from 'sanitize-html';
import FhirUtilities from './FhirUtilities';
  
//========================================================================================
// Helper Functions  

function determineSubjectDisplayString(resourceRecord){
  let subjectDisplayString = '';
  if(get(resourceRecord, 'subject')){
    if(get(resourceRecord, 'subject.display', '')){
      subjectDisplayString = get(resourceRecord, 'subject.display', '');
    } else {
      subjectDisplayString = get(resourceRecord, 'subject.reference', '');
    }
  }  
  if(get(resourceRecord, 'patient')){
    if(get(resourceRecord, 'patient.display', '')){
      subjectDisplayString = get(resourceRecord, 'patient.display', '');
    } else {
      subjectDisplayString = get(resourceRecord, 'patient.reference', '');
    }
  }  
  return subjectDisplayString;
}

//========================================================================================
// Flatten Algorithm Template


export function flattenExample(example, internalDateFormat){
    let result = {
      resourceType: 'Example',
      _id: '',
      id: '',
      identifier: '',
      status: '',
      date: ''
    };
    result.resourceType = get(example, 'resourceType', "Unknown");
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
      }
    
    result._id = get(example, '_id');
    result.id = get(example, 'id');
    result.identifier = get(example, 'identifier[0].value');
    result.status = get(example, 'status');
    result.date = moment(get(example, 'status')).format(internalDateFormat);

    return result;
}


//========================================================================================
// Flatten Algorithms

export function flattenActivityDefinition(activity) {
  let result = {
    _id: '',
    id: '',
    resourceType: '',
    url: '',
    identifier: '',
    version: '',
    name: '',
    title: '',
    subtitle: '',
    status: '',
    experimental: false,
    date: '',
    publisher: '',
    description: '',
    purpose: '',
    usage: '',
    jurisdiction: '',
    topic: '',
    author: '',
    editor: '',
    reviewer: '',
    endorser: '',
    // Kind and intent
    kind: '',
    intent: '',
    priority: '',
    doNotPerform: false,
    // Timing
    timingTiming: '',
    timingDateTime: '',
    timingAge: '',
    timingPeriod: '',
    timingRange: '',
    timingDuration: '',
    // Location and participant
    location: '',
    participantCount: 0,
    participantType: '',
    participantRole: '',
    // Product
    productReference: '',
    productCodeableConcept: '',
    quantity: '',
    dosage: '',
    // Body site
    bodySite: '',
    bodySiteCode: '',
    // Dynamic values
    dynamicValueCount: 0,
    // Library references
    libraryCount: 0,
    library: '',
    // Observing
    observationRequirement: '',
    observationResultRequirement: '',
    // Metadata
    lastUpdated: '',
    versionId: '',
    profile: ''
  };

  // Basic resource identification
  result.resourceType = get(activity, 'resourceType', 'ActivityDefinition');
  result.id = get(activity, 'id', '');
  result._id = get(activity, '_id', '');
  
  // Core fields
  result.url = get(activity, 'url', '');
  result.identifier = get(activity, 'identifier[0].value', '');
  result.version = get(activity, 'version', '');
  result.name = get(activity, 'name', '');
  result.title = get(activity, 'title', '');
  result.subtitle = get(activity, 'subtitle', '');
  result.status = get(activity, 'status', '');
  result.experimental = get(activity, 'experimental', false);
  
  // Dates and publishing info
  result.date = moment(get(activity, 'date')).format("YYYY-MM-DD hh:mm a");
  result.publisher = get(activity, 'publisher', '');
  
  // Documentation
  result.description = get(activity, 'description', '');
  result.purpose = get(activity, 'purpose', '');
  result.usage = get(activity, 'usage', '');
  
  // Context
  result.jurisdiction = get(activity, 'jurisdiction[0].coding[0].display', '');
  result.topic = get(activity, 'topic[0].coding[0].display', '');
  
  // Contributors
  result.author = get(activity, 'author[0].name', '');
  result.editor = get(activity, 'editor[0].name', '');
  result.reviewer = get(activity, 'reviewer[0].name', '');
  result.endorser = get(activity, 'endorser[0].name', '');
  
  // Kind and intent
  result.kind = get(activity, 'kind', '');
  result.intent = get(activity, 'intent', '');
  result.priority = get(activity, 'priority', '');
  result.doNotPerform = get(activity, 'doNotPerform', false);
  
  // Timing - handle different timing types
  result.timingTiming = get(activity, 'timing.timing.code.coding[0].display', '');
  result.timingDateTime = moment(get(activity, 'timing.dateTime')).format("YYYY-MM-DD hh:mm a");
  result.timingAge = get(activity, 'timing.age.value', '') + ' ' + get(activity, 'timing.age.unit', '');
  result.timingPeriod = moment(get(activity, 'timing.period.start')).format("YYYY-MM-DD") + ' to ' + 
                        moment(get(activity, 'timing.period.end')).format("YYYY-MM-DD");
  result.timingRange = get(activity, 'timing.range.low.value', '') + '-' + get(activity, 'timing.range.high.value', '');
  result.timingDuration = get(activity, 'timing.duration.value', '') + ' ' + get(activity, 'timing.duration.unit', '');
  
  // Location
  result.location = get(activity, 'location.reference', '') || get(activity, 'location.display', '');
  
  // Participants
  if (Array.isArray(activity.participant)) {
    result.participantCount = activity.participant.length;
    const firstParticipant = activity.participant[0] || {};
    result.participantType = get(firstParticipant, 'type', '');
    result.participantRole = get(firstParticipant, 'role.coding[0].display', '');
  }
  
  // Product
  result.productReference = get(activity, 'productReference.reference', '');
  result.productCodeableConcept = get(activity, 'productCodeableConcept.coding[0].display', '');
  result.quantity = get(activity, 'quantity.value', '') + ' ' + get(activity, 'quantity.unit', '');
  
  // Dosage
  const firstDosage = get(activity, 'dosage[0]', {});
  result.dosage = get(firstDosage, 'text', '') || 
                  (get(firstDosage, 'doseAndRate[0].doseQuantity.value', '') + ' ' + 
                   get(firstDosage, 'doseAndRate[0].doseQuantity.unit', ''));
  
  // Body site
  if (Array.isArray(activity.bodySite)) {
    const firstBodySite = activity.bodySite[0] || {};
    result.bodySite = get(firstBodySite, 'text', '');
    result.bodySiteCode = get(firstBodySite, 'coding[0].code', '');
  }
  
  // Dynamic values
  if (Array.isArray(activity.dynamicValue)) {
    result.dynamicValueCount = activity.dynamicValue.length;
  }
  
  // Library references
  if (Array.isArray(activity.library)) {
    result.libraryCount = activity.library.length;
    result.library = get(activity, 'library[0]', '');
  }
  
  // Observation requirements
  result.observationRequirement = get(activity, 'observationRequirement[0].reference', '');
  result.observationResultRequirement = get(activity, 'observationResultRequirement[0].reference', '');
  
  // Meta fields
  if (activity.meta) {
    result.lastUpdated = moment(get(activity, 'meta.lastUpdated')).format("YYYY-MM-DD hh:mm a");
    result.versionId = get(activity, 'meta.versionId', '');
    result.profile = get(activity, 'meta.profile[0]', '');
  }

  return result;
}

export function flattenAllergyIntolerance(allergy){
  let result = {
    patientDisplay: '',
    asserterDisplay: '',
    identifier: '',
    type: '',
    category: '',
    clinicalStatus: '',
    verificationStatus: '',
    snomedCode: '',
    snomedDisplay: '',
    evidenceDisplay: '',
    barcode: '',
    criticality: '',
    severity: '',
    patient: '',
    recorder: '', 
    reaction: '',
    substance: '',
    onset: '',
    recordedDate: '',
    operationOutcome: ''
  };
  result.resourceType = get(allergy, 'resourceType', "Unknown");

  result.identifier = get(allergy, 'identifier[0].value');
  result.clinicalStatus = get(allergy, 'clinicalStatus');
  result.verificationStatus = get(allergy, 'verificationStatus');
  result.type = get(allergy, 'type');
  result.category = get(allergy, 'category[0]');

  if(has(allergy, 'substance.coding[0].display')){
    result.substance = get(allergy, 'substance.coding[0].display');
  } else {
    result.substance = get(allergy, 'substance.text');
  }

  if(get(allergy, 'code.coding[0]')){            
    result.snomedCode = get(allergy, 'code.coding[0].code');
    result.snomedDisplay = get(allergy, 'code.coding[0].display');
  }

  // DSTU2 v1.0.2
  result.patient = get(allergy, 'patient.display');
  result.recorder = get(allergy, 'recorder.display');
  result.reaction = get(allergy, 'reaction[0].description', '');
  result.onset = moment(get(allergy, 'reaction[0].onset')).format("YYYY-MM-DD");
  result.recordedDate = moment(get(allergy, 'recordedDate')).format("YYYY-MM-DD");

  // DSTU v4
  if(get(allergy, 'onsetDateTime')){
    result.onset = moment(get(allergy, 'onsetDateTime')).format("YYYY-MM-DD");
  }
  if(get(allergy, 'reaction[0].manifestation[0].text')){
    result.reaction = get(allergy, 'reaction[0].manifestation[0].text', '');
  }
  if(get(allergy, 'reaction[0].severity')){
    result.reaction = get(allergy, 'reaction[0].severity', '');
  }

  if(get(allergy, 'criticality')){
    switch (get(allergy, 'criticality')) {
      case "CRITL":
        result.criticality = 'Low Risk';         
        break;
      case "CRITH":
        result.criticality = 'High Risk';         
        break;
      case "CRITU":
        result.criticality = 'Unable to determine';         
        break;        
      default:
        result.criticality = get(allergy, 'criticality');    
      break;
    }
  };

  if(get(allergy, "issue[0].details.text")){
    result.operationOutcome = get(allergy, "issue[0].details.text");
  }

  return result;
}

export function flattenArtifactAssessment(assessment) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    status: '',
    url: '',
    artifact: '',
    artifactReference: '',
    artifactVersion: '',
    artifactCanonical: '',
    title: '',
    date: '',
    publisher: '',
    content: '',
    contentType: '',
    contentParameter: '',
    contentUsageWarning: '',
    contentStrength: '',
    effectivePeriodStart: '',
    effectivePeriodEnd: '',
    disposition: '',
    author: '',
    attesterId: '',
    attesterDisplay: '',
    informationType: '',
    componentCount: 0,
    workflowStatus: '',
    approvalDate: '',
    lastReviewDate: '',
    contributorCount: 0,
    relatedArtifact: "",
    relatedArtifactCount: 0,
    typeCode: '',
    typeDisplay: '',
    quantity: 0,
    note: '',
    operationOutcome: '',
    numContent: 0
  };

  result.resourceType = get(assessment, 'resourceType', 'Unknown');

  // Basic identifiers
  result._id = get(assessment, '_id', '');
  result.id = get(assessment, 'id', '');
  result.identifier = get(assessment, 'identifier[0].value', '');
  result.status = get(assessment, 'status', '');
  result.url = get(assessment, 'url', '');

  // Basic metadata
  result.title = get(assessment, 'title', '');
  result.date = moment(get(assessment, 'date')).format('YYYY-MM-DD hh:mm a');
  result.publisher = get(assessment, 'publisher', '');

  // Artifact references
  result.artifact = get(assessment, 'artifact.display', '');
  result.artifactReference = get(assessment, 'artifact.reference', '');
  result.artifactVersion = get(assessment, 'artifactVersion', '');
  result.artifactCanonical = get(assessment, 'artifact.canonical', '');


  // Content assessment
  result.content = get(assessment, 'content[0].text', '');
  result.contentType = get(assessment, 'content[0].type.coding[0].display', '');
  result.contentParameter = get(assessment, 'content[0].parameter[0].value', '');
  result.contentUsageWarning = get(assessment, 'content[0].usageWarning', '');
  result.contentStrength = get(assessment, 'content[0].strength.coding[0].display', '');

  // Effective period
  result.effectivePeriodStart = moment(get(assessment, 'effectivePeriod.start')).format('YYYY-MM-DD hh:mm a');
  result.effectivePeriodEnd = moment(get(assessment, 'effectivePeriod.end')).format('YYYY-MM-DD hh:mm a');

  // Disposition and authorship
  result.disposition = get(assessment, 'disposition.coding[0].display', '');
  result.author = get(assessment, 'author[0].display', '');
  result.attesterId = get(assessment, 'attestation[0].attester.identifier.value', '');
  result.attesterDisplay = get(assessment, 'attestation[0].attester.display', '');

  // Information type
  result.informationType = get(assessment, 'informationType.coding[0].display', '');

  // Workflow status
  result.workflowStatus = get(assessment, 'workflowStatus.coding[0].display', '');

  // Dates
  result.approvalDate = moment(get(assessment, 'approvalDate')).format('YYYY-MM-DD');
  result.lastReviewDate = moment(get(assessment, 'lastReviewDate')).format('YYYY-MM-DD');

  // Array counts
  if (Array.isArray(assessment.component)) {
    result.componentCount = assessment.component.length;
  }

  if (Array.isArray(assessment.contributor)) {
    result.contributorCount = assessment.contributor.length;
  }

  if (Array.isArray(assessment.relatedArtifact)) {
    result.relatedArtifact = get(assessment, 'relatedArtifact[0].display', '');
    result.relatedArtifactCount = assessment.relatedArtifact.length;
  }

  // type
  if (Array.isArray(assessment.type)) {
    result.typeDisplay = get(assessment, 'type[0].coding[0].display', '');
  }

  if(has(assessment, 'quantity')){
    if(has(assessment, 'quantity.unit')){
      result.quantity = get(assessment, 'quantity.value', '') + ' ' + get(assessment, 'quantity.unit', '');
    } else {
      result.quantity = get(assessment, 'quantity.value', '');
    }
  }

  // Notes
  result.note = get(assessment, 'note[0].text', '');

  // Operation outcome
  if (get(assessment, 'issue[0].details.text')) {
    result.operationOutcome = get(assessment, 'issue[0].details.text');
  }

  if(Array.isArray(assessment.content)){
    result.numContent = assessment.content.length;
  }

  return result;
}

export function flattenAuditEvent(auditEvent){
  let result = {
    _id: auditEvent._id,
    id: auditEvent.id,

    categoryDisplay: '',
    categoryCode: '',

    codeDisplay: '',
    codeCode: '',

    severity: 'routine',

    action: '',
    outcome: '',
    outcomeDesc: '',

    occurredPeriod: '',
    occurredDateTime: '',

    recorded: '',

    outcomeCode: '',
    outcomeDisplay: '',
    outcomeDetail: '',

    authorizationCode: '',
    authorizationDisplay: '',

    baseOnDisplay: '',
    baseOnReference: '',

    patientDisplay: '',
    patientReference: '',

    encounterDisplay: '',
    encounterReference: '',

    agentTypeText: '',
    agentRoleText: '',
    agentWhoDisplay: '',
    agentWhoReference: '',

    
    sourceSiteDisplay: '',
    sourceSiteReference: '',
    sourceObserverDisplay: '',
    sourceObserverReference: '',
    sourceTypeText: '',

    entityWhatDisplay: '',
    entityRoleText: '',
    entitySecurityLabel: '',

  };



  result.severity = get(auditEvent, 'severity', "routine");

  result.categoryDisplay = get(auditEvent, 'category[0].coding[0].display', "");
  result.categoryCode = get(auditEvent, 'category[0].coding[0].display', "");

  result.codeDisplay = get(auditEvent, 'code.coding[0].display', "");
  result.codeCode = get(auditEvent, 'code.coding[0].code', "");

  result.action = get(auditEvent, 'action', "");
  // result.outcome = get(auditEvent, '', "");
  // result.outcomeDesc = get(auditEvent, '', "");

  result.occurredPeriodStart = moment(get(auditEvent, 'occurredPeriod.start')).format("YYYY-MM-DD");
  result.occurredPeriodEnd = moment(get(auditEvent, 'occurredPeriod.end')).format("YYYY-MM-DD");
  result.occurredDateTime = moment(auditEvent.occurredDateTime).format("YYYY-MM-DD");

  result.recorded = moment(auditEvent.recorded).format("YYYY-MM-DD");

  result.outcomeCode = get(auditEvent, 'outcome[0].code.code', "");
  // result.outcomeDisplay = get(auditEvent, 'outcome.code', "");
  result.outcomeDetail = get(auditEvent, 'outcome.detail[0].text', "");

  result.authorizationCode = get(auditEvent, 'authorization[0].coding[0].code', "");
  result.authorizationDisplay = get(auditEvent, 'authorization[0].coding[0].display', "");

  result.baseOnDisplay = get(auditEvent, 'basedOn[0].display', "");
  result.baseOnReference = get(auditEvent, 'basedOn[0].reference', "");

  result.patientDisplay = get(auditEvent, 'patient[0].display', "");
  result.patientReference = get(auditEvent, 'patient[0].reference', "");

  result.encounterDisplay = get(auditEvent, 'encounter[0].display', "");
  result.encounterReference = get(auditEvent, 'encounter[0].reference', "");

  result.agentTypeText = get(auditEvent, 'agent[0].type.text', "");
  result.agentRoleText = get(auditEvent, 'agent[0].role.text', "");
  result.agentWhoDisplay = get(auditEvent, 'agent[0].who.display', "");
  result.agentWhoReference = get(auditEvent, 'agent[0].who.reference', "");

  result.sourceSiteDisplay = get(auditEvent, 'source.site.display', "");
  result.sourceSiteReference = get(auditEvent, 'source.site.reference', "");
  result.sourceObserverDisplay = get(auditEvent, 'source.observer.display', "");
  result.sourceObserverReference = get(auditEvent, 'source.observer.reference', "");
  result.sourceTypeText = get(auditEvent, 'source[0].type.text', "");

  result.entityWhatDisplay = get(auditEvent, 'entity[0].what.display', "");
  result.entityRoleText = get(auditEvent, 'entity[0].role.text', "");
  result.entitySecurityLabel = get(auditEvent, 'entity[0].securityLabel[0].text', "");
  

  // result.resourceType = get(auditEvent, 'resourceType', "Unknown");

  // result.categoryDisplay = get(auditEvent, 'category.text', '');
  // result.categoryCode = get(auditEvent, 'category[0].coding[0].code', '');

  // result.codeDisplay = get(auditEvent, 'code[0].text', '');
  // result.codeCode = get(auditEvent, 'code[0].coding[0].code', '');

  // result.severity = get(auditEvent, 'severity', '');

  // result.action = get(auditEvent, 'action', '');
  // result.outcome = get(auditEvent, 'outcome', '');
  // // result.outcomeDesc = get(auditEvent, 'outcomeDesc', '');

  // result.agentName = get(auditEvent, 'agent[0].name', '');
  // result.sourceSite = get(auditEvent, 'source[0].site', '');
  // result.entityName = get(auditEvent, 'entity[0].name', '');

  // there's an off-by-1 error between momment() and Date() that we want
  // to account for when converting back to a string
  // result.recorded = moment(auditEvent.recorded).format("YYYY-MM-DD");

  if(get(auditEvent, "issue[0].details.text")){
    result.operationOutcome = get(auditEvent, "issue[0].details.text");
  }

  return result;
}

export function flattenBundle(bundle){
  let result = {
    _id: bundle._id,
    id: bundle.id,
    active: true,
    type: '',
    links: 0,
    entries: 0,
    total: 0,
    timestamp: '',
    operationOutcome: ''
  };

  result.resourceType = get(bundle, 'resourceType', "Unknown");

  result.type = get(bundle, 'type', '');
  if(Array.isArray(bundle.links)){
    result.links = bundle.links.length;
  }
  if(Array.isArray(bundle.entry)){
    result.entries = bundle.entry.length;
  }
  result.total = get(bundle, 'total', 0);

  // there's an off-by-1 error between momment() and Date() that we want
  // to account for when converting back to a string
  result.timestamp = moment(bundle.timestamp).format("YYYY-MM-DD hh:mm:ss");

  if(get(bundle, "issue[0].details.text")){
    result.operationOutcome = get(bundle, "issue[0].details.text");
  }

  return result;
}

export function flattenCarePlan(plan){

  let result = {
    _id: '',
    id: '',
    subject: '',
    author: '',
    template: '',
    category: '',
    am: '',
    pm: '',
    activities: 0,
    goals: 0,
    addresses: 0,
    start: '',
    end: '',
    title: '',
    identifier: '',
    status: '',
    operationOutcome: ''
  };

  result.resourceType = get(plan, 'resourceType', "Unknown");

  result.id = get(plan, 'id', '');
  result._id = get(plan, '_id', '');

  if (get(plan, 'template')) {
    result.template = plan.template.toString();
  }

  result.subject = determineSubjectDisplayString(plan);

  result.author = get(plan, 'author.display', '')
  result.start = moment(get(plan, 'period.start')).format("YYYY-MM-DD hh:mm a");
  result.end = moment(get(plan, 'period.start')).format("YYYY-MM-DD hh:mm a");
  result.category = get(plan, 'category[0].text', '')  
  result.status = get(plan, 'status', '')    

  if(Array.isArray(plan.category)){
    plan.category.forEach(function(planCategory){
      if(get(planCategory, 'text')){
        result.category = planCategory.text;
      }
    })
  }

  result.identifier = get(plan, 'identifier[0].value', '')    

  if (get(plan, 'activity')) {
    result.activities = plan.activity.length;
  }
  if (get(plan, 'goal')) {
    result.goals = plan.goal.length;
  }
  if (get(plan, 'addresses')) {
    result.addresses = plan.addresses.length;
  }

  if(!result.title){
    result.title = get(plan, 'title', '')    
  }
  if(!result.title){
    result.title = get(plan, 'description', '')    
  }
  if(!result.title){
    result.title = get(plan, 'category[0].coding[0].display', '')    
  }

  if(get(plan, "issue[0].details.text")){
    result.operationOutcome = get(plan, "issue[0].details.text");
  }

  return result;
}

export function flattenCareTeam(team){

  let result = {
    _id: '',
    id: '',
    identifier: '',
    status: '',
    category: '',
    name: '',
    subject: '',
    periodStart: '',
    periodEnd: '',
    reasonReference: '',
    reasonDisplay: '',
    reasonCode: '',
    participantCount: 0,
    managingOrganization: '',
    telecom: '',
    note: '',
    noteCount: 0,
    operationOutcome: ''
  };

  result.resourceType = get(team, 'resourceType', "Unknown");

  result.id = get(team, 'id', '');
  result._id = get(team, '_id', '');

  result.identifier = get(team, 'identifier[0].value', '')    
  result.status = get(team, 'status', '')    
  result.name = get(team, 'name', '')    
  result.subject = determineSubjectDisplayString(team);
  result.periodStart = moment(get(team, 'period.start')).format("YYYY-MM-DD hh:mm a");
  result.periodEnd = moment(get(team, 'period.start')).format("YYYY-MM-DD hh:mm a");

  result.category = get(team, 'category[0].text', '')  
  if(Array.isArray(team.category)){
    team.category.forEach(function(teamCategory){
      if(get(teamCategory, 'text')){
        result.category = teamCategory.text;
      }
    })
  }

  result.reasonReference = get(team, 'reasonReference[0].reference', '');
  result.reasonDisplay = get(team, 'reasonReference[0].display', '');
  result.reasonCode = get(team, 'reasonCode[0].coding[0].code', '');

  result.managingOrganization = get(team, 'managingOrganization[0].display', '');

  if(Array.isArray(team.participant)){
    result.participantCount = team.participant.length;
  }
  if(Array.isArray(team.note)){
    result.noteCount = team.note.length;
  }

  if(get(team, "issue[0].details.text")){
    result.operationOutcome = get(team, "issue[0].details.text");
  }

  return result;
}

export function flattenClaim(claim) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    status: '',
    type: '',
    use: '',
    patient: '',
    patientName: '',
    patientReference: '',
    billablePeriodStart: '',
    billablePeriodEnd: '',
    created: '',
    provider: '',
    priority: '',
    fundsReserve: '',
    prescription: '',
    originalPrescription: '',
    payee: '',
    referral: '',
    facility: '',
    careTeam: '',
    diagnosisCount: 0,
    procedureCount: 0,
    insuranceCount: 0,
    itemCount: 0,
    total: '',
    operationOutcome: '',
    diagnosis: '',
    servicedDate: '',
    providerNpi: '',
    firstItemText: '',
    billingCode: ''
  };

  result.resourceType = get(claim, 'resourceType', 'Unknown');
  
  // Basic identifiers
  result._id = get(claim, '_id', '');
  result.id = get(claim, 'id', '');
  result.identifier = get(claim, 'identifier[0].value', '');
  
  // Status and classification
  result.status = get(claim, 'status', '');
  result.type = get(claim, 'type.coding[0].display', '');
  result.use = get(claim, 'use', '');
  
  // Dates
  result.created = moment(get(claim, 'created')).format('YYYY-MM-DD hh:mm a');
  result.billablePeriodStart = moment(get(claim, 'billablePeriod.start')).format('YYYY-MM-DD hh:mm a');
  result.billablePeriodEnd = moment(get(claim, 'billablePeriod.end')).format('YYYY-MM-DD hh:mm a');

  result.servicedDate = moment(get(claim, 'servicedDate')).format('YYYY-MM-DD hh:mm a');

  

  // Related parties
  result.patient = get(claim, 'patient.reference', '');
  result.patientName = get(claim, 'patient.display', '');
  result.patientReference = get(claim, 'patient.reference', '');
  result.provider = get(claim, 'provider.display', '');
  result.payee = get(claim, 'payee.party.display', '');
  result.facility = get(claim, 'facility.display', '');
  
  // References
  result.prescription = get(claim, 'prescription.reference', '');
  result.originalPrescription = get(claim, 'originalPrescription.reference', '');
  result.referral = get(claim, 'referral.reference', '');
  
  // Priority and funds
  result.priority = get(claim, 'priority.coding[0].code', '');
  result.fundsReserve = get(claim, 'fundsReserve.coding[0].code', '');
  
  // Care team
  result.careTeam = get(claim, 'careTeam[0].provider.display', '');
  
  // Counts for arrays
  if (Array.isArray(claim.diagnosis)) {
    result.diagnosisCount = claim.diagnosis.length;
  }
  if (Array.isArray(claim.diagnosis)) {
    if(get(claim.diagnosis[0], "diagnosisCodeableConcept.text")){
      result.diagnosis = get(claim.diagnosis[0], "diagnosisCodeableConcept.text");
    } else if (get(claim.diagnosis[0], "diagnosisCodeableConcept.coding[0].code")){
      result.diagnosis = get(claim.diagnosis[0], "diagnosisCodeableConcept.coding[0].code");
    } else if (get(claim.diagnosis[0], "diagnosisReference.display")){
      result.diagnosis = claim.diagnosis[0].diagnosisReference.display;
    }
  }
  
  if (Array.isArray(claim.procedure)) {
    result.procedureCount = claim.procedure.length;
  }
  
  if (Array.isArray(claim.insurance)) {
    result.insuranceCount = claim.insurance.length;
  }
  
  if (Array.isArray(claim.item)) {
    result.itemCount = claim.item.length;
    result.firstItemText = get(claim, 'item[0].productOrService.text')
    result.billingCode = get(claim, 'item[0].productOrService.coding[0].code')
  }
  
  // Total amount
  result.total = get(claim, 'total.value', '');
  
  // Operation outcome
  if (get(claim, 'issue[0].details.text')) {
    result.operationOutcome = get(claim, 'issue[0].details.text');
  }
  
    // Operation outcome
    if (get(claim, 'providerNPI')) {
      result.providerNpi = get(claim, 'providerNPI');
    }
  
  return result;
}

export function flattenComposition(composition){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    status: '',
    typeCode: '',
    typeDisplay: '',
    categoryDisplay: '',
    subject: '',
    subjectReference: '',
    encounter: '',
    encounterReference: '',
    author: '',
    authorReference: '',
    relatesToCode: '',
    relatesToIdentifier: '',
    relatesToDisplay: '',
    relatesToReference: '',
    date: '',
    sectionsCount: 0,
    operationOutcome: ''
  };

  result.resourceType = get(composition, 'resourceType', "Unknown");

  result.id = get(composition, 'id', '');
  result._id = get(composition, '_id', '');

  result.identifier = get(composition, 'identifier[0].value', '')    
  result.status = get(composition, 'status', '');
  result.date = moment(get(composition, 'date', '')).format("YYYY-MM-DD hh:mm");
  result.typeCode = get(composition, 'type.coding[0].code', '');
  result.typeDisplay = get(composition, 'type.coding[0].display', '');
  result.categoryDisplay = get(composition, 'category[0].text', '');


  if(has(composition, 'subject')){
    result.subject = get(composition, 'subject.display', '');
  } else {
    result.subject = get(composition, 'subject.reference', '');
  }
  result.subjectReference = get(composition, 'subject.reference', '');

  if(has(composition, 'encounter')){
    result.encounter = get(composition, 'encounter.display', '');
  } else {
    result.encounter = get(composition, 'encounter.reference', '');
  }
  result.encounterReference = get(composition, 'encounter.reference', '');

  if(has(composition, 'author')){
    result.author = get(composition, 'author.display', '');
  } else {
    result.author = get(composition, 'author.reference', '');
  }
  result.authorReference = get(composition, 'author.reference', '');


  result.relatesToCode = get(composition, 'relatesTo[0].code', '');
  result.relatesToIdentifier = get(composition, 'relatesTo[0].targetIdentifier.value', '');
  result.relatesToDisplay = get(composition, 'relatesTo[0].targetReference.display', '');
  result.relatesToReference = get(composition, 'relatesTo[0].targetReference.reference', '');
  
  let sectionArray = get(composition, 'section', []);
  if(Array.isArray(sectionArray)){
    result.sectionsCount = sectionArray.length;
  }

  if(get(composition, "issue[0].details.text")){
    result.operationOutcome = get(composition, "issue[0].details.text");
  }

  return result;
}

export function flattenCodeSystem(codeSystem, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    url: '',
    version: '',
    name: '',
    status: '',
    experimental: '',
    date: '',
    publisher: '',
    description: '',
    useContext: '',
    jurisdiction: '',
    code: '',
    base: '',
    type: '',
    expression: '',
    xpath: '',
    xpathUsage: '',
    target: '',
    multipleOr: '',
    multipleAnd: '',
    comparator: '',
    modifier: '',
    chain: '',
  };

  result.resourceType = get(codeSystem, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(codeSystem, 'id') ? get(codeSystem, 'id') : get(codeSystem, '_id');
  result.id = get(codeSystem, 'id', '');
  result.identifier = get(codeSystem, 'identifier[0].value', '');
 
  result.version = get(codeSystem, 'version', '');
  result.name = get(codeSystem, 'name', '');
  result.title = get(codeSystem, 'title', '');
  result.status = get(codeSystem, 'status', '');
  result.experimental = get(codeSystem, 'experimental', false);
  result.date = moment(get(codeSystem, 'date', '')).format("YYYY-MM-DD");
  result.publisher = get(codeSystem, 'publisher', '');

  result.contact = get(codeSystem, 'contact[0].name', '');
  result.description = get(codeSystem, 'description', '');
  result.purpose = get(codeSystem, 'purpose', '');
  result.copyright = get(codeSystem, 'copyright', '');
  result.caseSensitive = get(codeSystem, 'caseSensitive', false);

  result.valueset = get(codeSystem, 'valueset', '');
  result.hierarchyMeaning = get(codeSystem, 'hierarchyMeaning', '');

  result.compositional = get(codeSystem, 'compositional', false);
  result.versionNeeded = get(codeSystem, 'versionNeeded', false);

  result.content = get(codeSystem, 'content', '');
  result.supplements = get(codeSystem, 'supplements', '');

  
  return result;
}

export function flattenCondition(condition, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    clinicalStatus: '',
    patientDisplay: '',
    patientReference: '',
    asserterDisplay: '',
    verificationStatus: '',
    severity: '',
    snomedCode: '',
    snomedDisplay: '',
    evidenceDisplay: '',
    barcode: '',
    onsetDateTime: '',
    abatementDateTime: '',
    operationOutcome: ''
  };

  result.resourceType = get(condition, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id = get(condition, '_id', '');
  result.id = get(condition, 'id', '');
  result.identifier = get(condition, 'identifier[0].value', '');

  if(get(condition, 'patient')){
    result.patientDisplay = get(condition, 'patient.display', '');
    result.patientReference = get(condition, 'patient.reference', '');
  } else if (get(condition, 'subject')){
    result.patientDisplay = get(condition, 'subject.display', '');
    result.patientReference = get(condition, 'subject.reference', '');
  }
  result.asserterDisplay = get(condition, 'asserter.display', '');


  if(get(condition, 'clinicalStatus.coding[0].code')){
    result.clinicalStatus = get(condition, 'clinicalStatus.coding[0].code', '');  //R4
  } else {
    result.clinicalStatus = get(condition, 'clinicalStatus', '');                 // DSTU2
  }

  if(get(condition, 'verificationStatus.coding[0].code')){
    result.verificationStatus = get(condition, 'verificationStatus.coding[0].code', '');  // R4
  } else {
    result.verificationStatus = get(condition, 'verificationStatus', '');                 // DSTU2
  }

  result.snomedCode = get(condition, 'code.coding[0].code', '');
  result.snomedDisplay = get(condition, 'code.coding[0].display', '');

  result.evidenceDisplay = get(condition, 'evidence[0].detail[0].display', '');
  result.barcode = get(condition, '_id', '');
  result.severity = get(condition, 'severity.text', '');

  result.onsetDateTime = moment(get(condition, 'onsetDateTime', '')).format("YYYY-MM-DD");
  result.abatementDateTime = moment(get(condition, 'abatementDateTime', '')).format("YYYY-MM-DD");


  if(get(condition, "issue[0].details.text")){
    result.operationOutcome = get(condition, "issue[0].details.text");
  }

  return result;
}

export function flattenCommunication(communication, internalDateFormat){
  let result = {
    _id: communication._id,
    subject: '',
    subjectReference: '',
    recipient: '',
    identifier: '',
    telecom: '',
    sent: '',
    received: '',
    category: '',
    payload: '',
    status: '',
    operationOutcome: ''
  };

  result.resourceType = get(communication, 'resourceType', "Unknown");

  if(get(communication, 'sent')){
    result.sent = moment(get(communication, 'sent')).add(1, 'days').format("YYYY-MM-DD hh:mm")
  }
  if(get(communication, 'received')){
    result.received = moment(get(communication, 'received')).add(1, 'days').format("YYYY-MM-DD")
  }

  let telecomString = "";
  let communicationString = "";

  if(typeof get(communication, 'recipient[0].reference') === "string"){
    communicationString = get(communication, 'recipient[0].reference', '');
  } else if(typeof get(communication, 'recipient.reference') === "string"){
    communicationString = get(communication, 'recipient.reference', '');
  }
  
  if(communicationString.split("/")[1]){
    telecomString = communicationString.split("/")[1];
  } else {
    telecomString = communicationString;
  }

  if(telecomString.length > 0){
    result.telecom = telecomString;
  } else {
    result.telecom = get(communication, 'telecom[0].value', '');
  }

  result.subject = get(communication, 'subject.display') ? get(communication, 'subject.display') : get(communication, 'subject.reference')
  result.recipient = get(communication, 'recipient[0].display') ? get(communication, 'recipient[0].display') : get(communication, 'recipient[0].reference')
  result.identifier = get(communication, 'identifier[0].type.text');
  result.category = get(communication, 'category[0].text');
  result.payload = get(communication, 'payload[0].contentString');
  result.status = get(communication, 'status');

  if(get(communication, "issue[0].details.text")){
    result.operationOutcome = get(communication, "issue[0].details.text");
  }

  return result;
}

export function flattenCommunicationRequest(communicationRequest, internalDateFormat){
  let result = {
    _id: communicationRequest._id,
    id: '',
    authoredOn: '',
    subject: '',
    subjectReference: '',
    recipient: '',
    identifier: '',
    telecom: '',
    sent: '',
    received: '',
    category: '',
    payload: '',
    status: '',
    requester: '',
    operationOutcome: ''
  };

  result.resourceType = get(communicationRequest, 'resourceType', "Unknown");

  if(get(communicationRequest, 'sent')){
    result.sent = moment(get(communicationRequest, 'sent')).add(1, 'days').format("YYYY-MM-DD hh:mm")
  }
  if(get(communicationRequest, 'received')){
    result.received = moment(get(communicationRequest, 'received')).add(1, 'days').format("YYYY-MM-DD")
  }

  if(get(communicationRequest, 'authoredOn')){
    result.authoredOn = moment(get(communicationRequest, 'authoredOn')).format("YYYY-MM-DD hh:mm")
  }

  let telecomString = "";
  let communicationRequestString = "";

  if(typeof get(communicationRequest, 'recipient[0].reference') === "string"){
    communicationRequestString = get(communicationRequest, 'recipient[0].reference', '');
  } else if(typeof get(communicationRequest, 'recipient.reference') === "string"){
    communicationRequestString = get(communicationRequest, 'recipient.reference', '');
  }
  
  if(communicationRequestString.split("/")[1]){
    telecomString = communicationRequestString.split("/")[1];
  } else {
    telecomString = communicationRequestString;
  }

  if(telecomString.length > 0){
    result.telecom = telecomString;
  } else {
    result.telecom = get(communicationRequest, 'telecom[0].value', '');
  }

  result.subject = get(communicationRequest, 'subject.display') ? get(communicationRequest, 'subject.display') : get(communicationRequest, 'subject.reference')
  result.recipient = get(communicationRequest, 'recipient[0].display') ? get(communicationRequest, 'recipient[0].display') : get(communicationRequest, 'recipient[0].reference')
  result.identifier = get(communicationRequest, 'identifier[0].value');
  result.payload = get(communicationRequest, 'payload[0].contentString');
  result.status = get(communicationRequest, 'status');
  result.id = get(communicationRequest, 'id');

  result.requester = get(communicationRequest, 'requester.display');


  if(get(communicationRequest, 'category[0].text')){
    result.category = get(communicationRequest, 'category[0].text');
  } else {
    result.category = get(communicationRequest, 'category[0].coding[0].display');
  }


  if(get(communicationRequest, "issue[0].details.text")){
    result.operationOutcome = get(communicationRequest, "issue[0].details.text");
  }

  return result;
}

export function flattenCommunicationResponse(communicationResponse, internalDateFormat){
  let result = {
    _id: communicationResponse._id,
    subject: '',
    subjectReference: '',
    recipient: '',
    identifier: '',
    telecom: '',
    sent: '',
    received: '',
    category: '',
    payload: '',
    status: '',
    operationOutcome: ''
  };

  result.resourceType = get(communicationResponse, 'resourceType', "Unknown");

  if(get(communicationResponse, 'sent')){
    result.sent = moment(get(communicationResponse, 'sent')).add(1, 'days').format("YYYY-MM-DD hh:mm")
  }
  if(get(communicationResponse, 'received')){
    result.received = moment(get(communicationResponse, 'received')).add(1, 'days').format("YYYY-MM-DD")
  }

  let telecomString = "";
  let communicationResponseString = "";

  if(typeof get(communicationResponse, 'recipient[0].reference') === "string"){
    communicationResponseString = get(communicationResponse, 'recipient[0].reference', '');
  } else if(typeof get(communicationResponse, 'recipient.reference') === "string"){
    communicationResponseString = get(communicationResponse, 'recipient.reference', '');
  }
  
  if(communicationResponseString.split("/")[1]){
    telecomString = communicationResponseString.split("/")[1];
  } else {
    telecomString = communicationResponseString;
  }

  if(telecomString.length > 0){
    result.telecom = telecomString;
  } else {
    result.telecom = get(communicationResponse, 'telecom[0].value', '');
  }

  result.subject = get(communicationResponse, 'subject.display') ? get(communicationResponse, 'subject.display') : get(communicationResponse, 'subject.reference')
  result.recipient = get(communicationResponse, 'recipient[0].display') ? get(communicationResponse, 'recipient[0].display') : get(communicationResponse, 'recipient[0].reference')
  result.identifier = get(communicationResponse, 'identifier[0].type.text');
  result.category = get(communicationResponse, 'category[0].text');
  result.payload = get(communicationResponse, 'payload[0].contentString');
  result.status = get(communicationResponse, 'status');

  if(get(communicationResponse, "issue[0].details.text")){
    result.operationOutcome = get(communicationResponse, "issue[0].details.text");
  }

  return result;
}

export function flattenConsent(document){
  let result = {
    _id: document._id,
    id: get(document, 'id', ''),
    dateTime: moment(get(document, 'dateTime', null)).format("YYYY-MM-DD hh:mm:ss"),
    status: get(document, 'status', ''),
    patientReference: get(document, 'patient.reference', ''),
    patientName: get(document, 'patient.display', ''),
    // consentingParty: get(document, 'consentingParty[0].display', ''),
    performer: get(document, 'performer[0].display', ''),
    organization: get(document, 'organization[0].display', ''),
    policyAuthority: get(document, 'policy[0].authority', ''),
    policyUri: get(document, 'policy[0].uri', ''),
    policyRule: get(document, 'policyRule.text', ''),
    provisionType: get(document, 'provision.type', ''),
    provisionAction: get(document, 'provision.action[0].text', ''),
    provisionClass: get(document, 'provision.class', ''),
    provisionActor: get(document, 'provision.actor[0].reference.display', ''),
    start: '',
    end: '',
    sourceReference: get(document, 'sourceReference.reference', ''),
    category: '',
    scope: get(document, 'scope.coding[0].display'),
    operationOutcome: '',
    actorRole: '',
    actorReference: '',
  };

  result.resourceType = get(document, 'resourceType', "Unknown");

  if(has(document, 'patient.display')){
    result.patientName = get(document, 'patient.display')
  } else {
    result.patientName = get(document, 'patient.reference')
  }

  if(has(document, 'category[0].text')){
    result.category = get(document, 'category[0].text')
  } else {
    result.category = get(document, 'category[0].coding[0].display', '')
  }

  if(has(document, 'period.start')){
    result.start = moment(get(document, 'period.start', '')).format("YYYY-MM-DD hh:mm:ss");
  }
  if(has(document, 'period.end')){
    result.end = moment(get(document, 'period.end', '')).format("YYYY-MM-DD hh:mm:ss");
  }

  if(result.patientReference === ''){
    result.patientReference = get(document, 'patient.reference', '');
  }

  if(get(document, 'provision[0].class')){
    result.provisionClass = "";
    document.provision[0].class.forEach(function(provision){   
      if(result.provisionClass == ''){
        result.provisionClass = provision.code;
      }  else {
        result.provisionClass = result.provisionClass + ' - ' + provision.code;
      }      
    });
  }

  if(get(document, "issue[0].details.text")){
    result.operationOutcome = get(document, "issue[0].details.text");
  }

  if(get(document, "provision[0].actor[0].role.coding[0].display")){
    result.actorRole = get(document, "provision[0].actor[0].role.coding[0].display");
  } else if (get(document, "provision[0].provision[0].actor[0].role.coding[0].display")){
    result.actorRole = get(document, "provision[0].provision[0].actor[0].role.coding[0].display");
  }

  if(get(document, "provision[0].class[0].display")){
    result.provisionClass = get(document, "provision[0].class[0].display");
  } else if (get(document, "provision[0].provision[0].class[0].display")){
    result.provisionClass = get(document, "provision[0].provision[0].class[0].display");
  }

  return result;
}

export function flattenDevice(device, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    status: '',
    identifier: '',
    deviceType: '',
    deviceModel: '',
    manufacturer: '',
    serialNumber: '',
    costOfOwnership: '',
    lotNumber: '',
    deviceName: '',
    operationOutcome: ''
  };

  result.resourceType = get(device, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id = get(device, '_id', '');
  result.id = get(device, 'id', '');
  result.identifier = get(device, 'identifier[0].value', '');

  result.status = get(device, 'status', '');
  result.deviceType = get(device, 'type.text', '');
  result.deviceModel = get(device, 'model', '');
  result.manufacturer = get(device, 'manufacturer', '');
  result.serialNumber = get(device, 'identifier[0].value', '');
  result.lotNumber = get(device, 'lotNumber', '');
  result.note = get(device, 'note[0].text', '');
  result.deviceName = get(device, 'deviceName[0].name', '');


  if(get(device, "issue[0].details.text")){
    result.operationOutcome = get(device, "issue[0].details.text");
  }

  return result;
}

export function flattenDiagnosticReport(report, fhirVersion){  
  var result = {
    _id: '',
    id: '',
    subjectDisplay: '',
    code: '',
    status: '',
    issued: '',
    performerDisplay: '',
    identifier: '',
    category: '',
    effectiveDate: '',
    operationOutcome: ''
  };

  result.resourceType = get(report, 'resourceType', "Unknown");
  
  if (report){
    result.id = get(report, 'id');
    result._id = get(report, '_id');

    if(report.subject){
      if(report.subject.display){
        result.subjectDisplay = report.subject.display;
      } else {
        result.subjectDisplay = report.subject.reference;          
      }
    }
    if(fhirVersion === "v3.0.1"){
      if(get(report, 'performer[0].actor.display')){
        result.performerDisplay = get(report, 'performer[0].actor.display');
      } else {
        result.performerDisplay = get(report, 'performer[0].actor.reference');          
      }
    }
    if(fhirVersion === "v1.0.2"){
      if(report.performer){
        result.performerDisplay = get(report, 'performer.display');
      } else {
        result.performerDisplay = get(report, 'performer.reference'); 
      }      
    }

    if(get(report, 'category.coding[0].code')){
      result.category = get(report, 'category.coding[0].code');
    } else {
      result.category = get(report, 'category.text');
    }

    result.code = get(report, 'code.text', '');
    result.identifier = get(report, 'identifier[0].value', '');
    result.status = get(report, 'status', '');
    result.effectiveDate = moment(get(report, 'effectiveDateTime')).format("YYYY-MM-DD");
    result.issued = moment(get(report, 'issued')).format("YYYY-MM-DD"); 
  } 

  if(get(report, "issue[0].details.text")){
    result.operationOutcome = get(report, "issue[0].details.text");
  }

  return result;  
}

export function flattenDocumentReference(documentReference, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    masterIdentifier: '',
    identifier: '',
    status: '',
    docStatus: '',
    typeDisplay: '',
    typeCode: '',
    category: '',
    subjectReference: '',
    subjectDisplay: '',
    date: '',

    description: '',
    author: '',
    authorReference: '',

    relatesToCode: '',
    relatesToReference: '',

    contentAttachment: '',
    contentFormat: '',
    contentTitle: '',
    contentSize: '',
    contentCount: 0,
    operationOutcome: ''
  };

  result.resourceType = get(documentReference, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id = get(documentReference, '_id', '');
  result.id = get(documentReference, 'id', '');
  result.identifier = get(documentReference, 'identifier[0].value', '');
  result.status = get(documentReference, 'status', '');
  result.docStatus = get(documentReference, 'docStatus', '');
  result.description = get(documentReference, 'description', '');

  result.masterIdentifier = get(documentReference, 'masterIdentifier.value', '');

  result.subjectReference = get(documentReference, 'subject.reference', '');
  result.subjectDisplay = get(documentReference, 'subject.display', '');

  result.date = moment(get(documentReference, 'date')).format("YYYY-MM-DD");

  if(get(documentReference, 'category.coding[0].code')){
    result.category = get(documentReference, 'category.coding[0].code');
  } else {
    result.category = get(documentReference, 'category.text');
  }

  result.typeCode = get(documentReference, 'type.coding[0].code', '');
  result.typeDisplay = get(documentReference, 'type.text', '');

  result.author = get(documentReference, 'author[0].display', '')
  result.authorReference = get(documentReference, 'author[0].reference', '')

  result.relatesToCode = get(documentReference, 'relatesTo[0].code', '')
  result.relatesToReference = get(documentReference, 'relatesTo[0].target.reference', '')

  result.contentAttachment = get(documentReference, 'content[0].attachment.url', '')
  result.contentTitle = get(documentReference, 'content[0].attachment.title', '')
  result.contentSize = get(documentReference, 'content[0].attachment.size', '')
  result.contentFormat = get(documentReference, 'content[0].format.display', '')

  if(Array.isArray(documentReference.content)){
    result.contentCount = documentReference.content.length;
  }

  if(get(documentReference, "issue[0].details.text")){
    result.operationOutcome = get(documentReference, "issue[0].details.text");
  }

  return result;
}

export function flattenEncounter(encounter, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    subject: '',
    subjectId: '',
    status: '',
    statusHistory: 0,
    periodStart: '',
    periodEnd: '',
    reasonCode: '', 
    reasonDisplay: '', 
    typeCode: '',
    typeDisplay: '',
    classCode: '',
    duration: '',
    operationOutcome: ''
  };

  result.resourceType = get(encounter, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result.id =  get(encounter, 'id');
  result._id =  get(encounter, '_id');

  result.subject = determineSubjectDisplayString(encounter);
  result.subjectId = get(encounter, 'subject.reference', '');

  result.status = get(encounter, 'status', '');
  result.reasonCode = get(encounter, 'reason[0].coding[0].code', '');
  result.reasonDisplay = get(encounter, 'reason[0].coding[0].display', '');
  result.typeCode = get(encounter, 'type[0].coding[0].code', '');
  result.typeDisplay = get(encounter, 'type[0].coding[0].display', '');

  if(get(encounter, 'class.code')){
    result.classCode = get(encounter, 'class.code', '');
  } else if(get(encounter, 'class')){
    result.classCode = get(encounter, 'class', '');
  }

  let statusHistory = get(encounter, 'statusHistory', []);

  result.statusHistory = statusHistory.length;

  let momentStart = moment(get(encounter, 'period.start', ''))
  if(get(encounter, 'period.start')){
    momentStart = moment(get(encounter, 'period.start', ''))
  } else if(get(encounter, 'performedPeriod.start')){
    momentStart = moment(get(encounter, 'performedPeriod.start', ''))
  }
  if(momentStart){
    result.periodStart = momentStart.format(internalDateFormat);
  } 

  let momentEnd;
  if(get(encounter, 'period.end')){
    momentEnd = moment(get(encounter, 'period.end', ''))
  } else if(get(encounter, 'performedPeriod.end')){
    momentEnd = moment(get(encounter, 'performedPeriod.end', ''))
  }
  if(momentEnd){
    result.periodEnd = momentEnd.format(internalDateFormat);
  } 

  if(momentStart && momentEnd){
    result.duration = Math.abs(momentStart.diff(momentEnd, 'minutes', true))
  }

  if(get(encounter, "issue[0].details.text")){
    result.operationOutcome = get(encounter, "issue[0].details.text");
  }

  return result;
}

export function flattenEndpoint(endpoint, internalDateFormat){
    let result = {
      resourceType: 'Endpoint',
      _id: '',
      id: '',
      identifier: '',
      status: '',
      periodStart: '',
      periodEnd: '',
      connectionType: '',
      environmentType: '',
      version: '',
      name: '',
      managingOrganization: '',
      payloadType: '',
      payloadMimeType: '',
      address: ''
    };
    result.resourceType = get(endpoint, 'resourceType', "Unknown");
    
    result._id = get(endpoint, '_id');
    result.id = get(endpoint, 'id');
    result.identifier = get(endpoint, 'identifier[0].value');
    result.status = get(endpoint, 'status');
    result.name = get(endpoint, 'name');
    result.payloadType = get(endpoint, 'payloadType[0].text');
    
    result.payloadMimeType = get(endpoint, 'payloadMimeType[0]');
    result.managingOrganization = get(endpoint, 'managingOrganization.display');
    result.address = get(endpoint, 'address');
    // result.address = FhirUtilities.stringifyAddress(get(endpoint, 'address[0]'));

    if(Array.isArray(get(endpoint, 'connectionType'))){
      endpoint.connectionType.forEach(function(connectionType){
        // if(get(connectionType, 'text')){
        //   result.connectionType = get(connectionType, 'text');
        // }
        if(Array.isArray(get(connectionType, 'coding'))){
          connectionType.coding.forEach(function(coding){
            if(get(coding, 'system') === "http://hl7.org/fhir/FHIR-version"){
              result.version = get(coding, 'code');
            }
          });
        }
        if(Array.isArray(get(connectionType, 'coding'))){
          connectionType.coding.forEach(function(coding){
            if(get(coding, 'system') === "http://terminology.hl7.org/CodeSystem/endpoint-connection-type"){
              result.connectionType = get(coding, 'code');
            }
          });
        }
      });
    }

    if(Array.isArray(get(endpoint, 'environmentType'))){
      endpoint.environmentType.forEach(function(environmentType){
        if(get(environmentType, 'text')){
          result.environmentType = get(environmentType, 'text');
        }
      });
    }

    if(!internalDateFormat){
      internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    if(get(endpoint, 'period')){
        result.periodStart = moment(get(endpoint, 'period.start')).format(internalDateFormat);
        result.periodEnd = moment(get(endpoint, 'period.end')).format(internalDateFormat);    
    }

    return result;
}


export function flattenEvidence(evidence) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    url: '',
    version: '',
    title: '',
    status: '',
    experimental: false,
    date: '',
    publisher: '',
    contact: '',
    description: '',
    note: '',
    useContext: '',
    jurisdiction: '',
    purpose: '',
    copyright: '',
    approvalDate: '',
    lastReviewDate: '',
    effectivePeriod: '',
    topic: '',
    author: '',
    editor: '',
    reviewer: '',
    endorser: '',
    relatedArtifactCount: 0,
    variableDefinitionCount: 0,
    synthesisType: '',
    studyType: '',
    statisticalModel: '',
    categoryCount: 0,
    exposureBackground: '',
    exposureAlternative: '',
    outcomeCount: 0,
    populationCount: 0,
    contributorCount: 0,
    certainty: '',
    certaintySubcomponentCount: 0,
    statisticType: '',
    quantity: '',
    numberOfParticipants: 0,
    operationOutcome: ''
  };

  result.resourceType = get(evidence, 'resourceType', 'Unknown');

  // Basic identifiers and metadata
  result._id = get(evidence, '_id', '');
  result.id = get(evidence, 'id', '');
  result.identifier = get(evidence, 'identifier[0].value', '');
  result.url = get(evidence, 'url', '');
  result.version = get(evidence, 'version', '');
  result.title = get(evidence, 'title', '');
  result.status = get(evidence, 'status', '');
  result.experimental = get(evidence, 'experimental', false);

  // Dates
  result.date = moment(get(evidence, 'date')).format('YYYY-MM-DD hh:mm a');
  result.approvalDate = moment(get(evidence, 'approvalDate')).format('YYYY-MM-DD');
  result.lastReviewDate = moment(get(evidence, 'lastReviewDate')).format('YYYY-MM-DD');
  
  // Publisher and contacts
  result.publisher = get(evidence, 'publisher', '');
  result.contact = get(evidence, 'contact[0].name', '');
  
  // Description and context
  result.description = get(evidence, 'description', '');
  result.note = get(evidence, 'note[0].text', '');
  result.useContext = get(evidence, 'useContext[0].valueCodeableConcept.coding[0].display', '');
  result.jurisdiction = get(evidence, 'jurisdiction[0].coding[0].display', '');
  result.purpose = get(evidence, 'purpose', '');
  result.copyright = get(evidence, 'copyright', '');
  
  // Temporal context
  result.effectivePeriod = moment(get(evidence, 'effectivePeriod.start')).format('YYYY-MM-DD');
  
  // Topic and contributors
  result.topic = get(evidence, 'topic[0].coding[0].display', '');
  result.author = get(evidence, 'author[0].name', '');
  result.editor = get(evidence, 'editor[0].name', '');
  result.reviewer = get(evidence, 'reviewer[0].name', '');
  result.endorser = get(evidence, 'endorser[0].name', '');

  // Evidence specific fields
  result.synthesisType = get(evidence, 'synthesisType.coding[0].display', '');
  result.studyType = get(evidence, 'studyType.coding[0].display', '');
  result.statisticalModel = get(evidence, 'statisticalModel.coding[0].display', '');
  
  // Exposure information
  result.exposureBackground = get(evidence, 'exposureBackground.display', '');
  result.exposureAlternative = get(evidence, 'exposureAlternative.display', '');

  // Certainty
  result.certainty = get(evidence, 'certainty[0].rating[0].coding[0].display', '');

  // Array counts
  if (Array.isArray(evidence.relatedArtifact)) {
    result.relatedArtifactCount = evidence.relatedArtifact.length;
  }

  if (Array.isArray(evidence.variableDefinition)) {
    result.variableDefinitionCount = evidence.variableDefinition.length;
  }

  if (Array.isArray(evidence.category)) {
    result.categoryCount = evidence.category.length;
  }

  if (Array.isArray(evidence.outcome)) {
    result.outcomeCount = evidence.outcome.length;
  }

  if (Array.isArray(evidence.population)) {
    result.populationCount = evidence.population.length;
  }

  if (Array.isArray(evidence.contributor)) {
    result.contributorCount = evidence.contributor.length;
  }

  if (Array.isArray(get(evidence, 'certainty[0].subcomponent'))) {
    result.certaintySubcomponentCount = get(evidence, 'certainty[0].subcomponent', []).length;
  }

  if(has(evidence, 'statistic[0].quantity')){
    if(has(evidence, 'statistic[0].quantity.unit')){
      result.quantity = get(evidence, 'statistic[0].quantity.value', '') + ' ' + get(evidence, 'statistic[0].quantity.unit', '');
    } else {
      result.quantity = get(evidence, 'statistic[0].quantity.value', '');
    }
  }

  if(has(evidence, 'statistic[0].sampleSize.numberOfParticipants')){
    result.numberOfParticipants = get(evidence, 'statistic[0].sampleSize.numberOfParticipants');
  }

  // Operation outcome
  if (get(evidence, 'statistic[0].statisticType.coding[0].display')) {
    result.statisticType = get(evidence, 'statistic[0].statisticType.coding[0].display');
  }

  return result;
}

export function flattenExplanationOfBenefit(explanationOfBenefit, internalDateFormat){
  let result = {
    _id: '',
    meta: '',
    identifier: '',
    status: '',
    type: '',
    use: '',
    patientDisplay: '',
    patientReference: '',
    billableStart: '',
    billableEnd: '',
    created: '',
    insurerDisplay: '',
    insurerReference: '',
    providerDisplay: '',
    providerReference: '',
    payeeType: '',
    payeeDisplay: '',
    payeeReference: '',
    outcome: '',
    paymentType: '',
    paymentAmount: '',
    paymentDate: '',
    relatedClaimsCount: 0,
    careTeamMembersCount: 0,
    supportingInfoCount: 0,
    diagnosisCount: 0,
    procedureCount: 0,
    insuranceCount: 0,
    accidentCount: 0,
    itemCount: 0,
    addItemCount: 0,
    detailCount: 0,
    processNoteCount: 0,
    benefitBalance: 0
  };

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(explanationOfBenefit, 'id') ? get(explanationOfBenefit, 'id') : get(explanationOfBenefit, '_id');
  result.id = get(explanationOfBenefit, 'id', '');
  result.identifier = get(explanationOfBenefit, 'identifier[0].value', '');

  result.status = get(explanationOfBenefit, 'status', '');
  result.type = get(explanationOfBenefit, 'type.text', '');
  result.use = get(explanationOfBenefit, 'use', '');
  result.patientDisplay = get(explanationOfBenefit, 'patient.display', '');
  result.patientReference = get(explanationOfBenefit, 'patient.reference', '');
  result.billableStart = moment(get(explanationOfBenefit, 'billablePeriod.start', '')).format("YYYY-MM-DD");
  result.billableEnd = moment(get(explanationOfBenefit, 'billablePeriod.end', '')).format("YYYY-MM-DD");
  result.created = moment(get(explanationOfBenefit, 'created', '')).format("YYYY-MM-DD");
  result.insurerDisplay = get(explanationOfBenefit, 'insurer.display', '');
  result.insurerReference = get(explanationOfBenefit, 'insurer.reference', '');
  result.providerDisplay = get(explanationOfBenefit, 'provider.display', '');
  result.providerReference = get(explanationOfBenefit, 'provider.reference', '');
  result.payeeType = get(explanationOfBenefit, 'payee.type.text', '');
  result.payeeDisplay = get(explanationOfBenefit, 'payee.party.display', '');
  result.payeeReference = get(explanationOfBenefit, 'payee.party.reference', '');
  result.outcome = get(explanationOfBenefit, 'outcome', '');
  result.paymentType = get(explanationOfBenefit, 'payment.type.text', '');
  result.paymentAmount = get(explanationOfBenefit, 'payment.amount.value', '');
  result.paymentDate = moment(get(explanationOfBenefit, 'payment.date', '')).format("YYYY-MM-DD");

  // result.relatedClaimsCount = getLength(explanationOfBenefit.related);
  // result.careTeamMembersCount = getLength(explanationOfBenefit.careTeam);
  // result.supportingInfoCount = getLength(explanationOfBenefit.supportingInfo);
  // result.diagnosisCount = getLength(explanationOfBenefit.diagnosis);
  // result.procedureCount = getLength(explanationOfBenefit.procedures);
  // result.insuranceCount = getLength(explanationOfBenefit.insurance);
  // result.accidentCount = getLength(explanationOfBenefit.accident);
  // result.itemCount = getLength(explanationOfBenefit.item);
  // result.addItemCount = getLength(explanationOfBenefit.addItem);
  // result.detailCount = getLength(explanationOfBenefit.detailCount);
  // result.processNoteCount = getLength(explanationOfBenefit.processNote);
  // result.benefitBalance = getLength(explanationOfBenefit.benefit);

  // console.log('ExplanationOfBenefitsTable.dehydrateExplanationOfBenefit', result)

  return result;
}



export function flattenGoal(goal) {
  let result = {
    _id: '',
    id: '',
    resourceType: '',
    identifier: '',
    lifecycleStatus: '',
    achievementStatus: '',
    achievementStatusDate: '',
    category: '',
    priority: '',
    description: '',
    subject: '',
    startDate: '',
    targetDate: '',
    statusDate: '',
    statusReason: '',
    expressedBy: '',
    addresses: '',
    noteCount: 0,
    note: '',
    outcomeCount: 0,
    outcomeReference: '',
    outcomeCode: '',
    // Target details
    targetMeasure: '',
    targetDetailString: '',
    targetDetailBoolean: '',
    targetDetailInteger: '',
    targetDetailRatio: '',
    targetDueDate: '',
    // First category
    categoryCode: '',
    categoryDisplay: '',
    // Metadata
    lastUpdated: '',
    versionId: '',
    source: ''
  };

  // Basic resource identification
  result.resourceType = get(goal, 'resourceType', 'Goal');
  result.id = get(goal, 'id', '');
  result._id = get(goal, '_id', '');
  
  // Identifiers
  result.identifier = get(goal, 'identifier[0].value', '');
  
  // Status information
  result.lifecycleStatus = get(goal, 'lifecycleStatus', '');
  result.achievementStatus = get(goal, 'achievementStatus.coding[0].display', '');
  result.achievementStatusDate = moment(get(goal, 'achievementStatus.extension[0].valueDateTime')).format("YYYY-MM-DD hh:mm a");
  result.statusDate = moment(get(goal, 'statusDate')).format("YYYY-MM-DD hh:mm a");
  result.statusReason = get(goal, 'statusReason', '');

  // Category and Priority
  if (Array.isArray(goal.category)) {
    const firstCategory = goal.category[0] || {};
    result.categoryCode = get(firstCategory, 'coding[0].code', '');
    result.categoryDisplay = get(firstCategory, 'coding[0].display', '');
    result.category = result.categoryDisplay || result.categoryCode;
  }
  
  result.priority = get(goal, 'priority.coding[0].display', '');
  
  // Description
  result.description = get(goal, 'description.text', '');
  
  // Subject and expressed by
  result.subject = get(goal, 'subject.display', '') || get(goal, 'subject.reference', '');
  result.expressedBy = get(goal, 'expressedBy.display', '') || get(goal, 'expressedBy.reference', '');
  
  // Dates
  result.startDate = moment(get(goal, 'startDate')).format("YYYY-MM-DD");
  result.targetDate = moment(get(goal, 'target[0].dueDate')).format("YYYY-MM-DD");
  
  // Addresses
  result.addresses = get(goal, 'addresses[0].display', '') || get(goal, 'addresses[0].reference', '');
  
  // Notes
  if (Array.isArray(goal.note)) {
    result.noteCount = goal.note.length;
    result.note = get(goal, 'note[0].text', '');
  }
  
  // Outcomes
  if (Array.isArray(goal.outcome)) {
    result.outcomeCount = goal.outcome.length;
    const firstOutcome = goal.outcome[0] || {};
    result.outcomeReference = get(firstOutcome, 'reference', '');
    result.outcomeCode = get(firstOutcome, 'coding[0].display', '') || get(firstOutcome, 'coding[0].code', '');
  }
  
  // Target details
  const firstTarget = get(goal, 'target[0]', {});
  result.targetMeasure = get(firstTarget, 'measure.coding[0].display', '');
  result.targetDetailString = get(firstTarget, 'detailString', '');
  result.targetDetailBoolean = get(firstTarget, 'detailBoolean', '');
  result.targetDetailInteger = get(firstTarget, 'detailInteger', '');
  result.targetDetailRatio = get(firstTarget, 'detailRatio.numerator.value', '') + '/' + 
                            get(firstTarget, 'detailRatio.denominator.value', '');
  result.targetDueDate = moment(get(firstTarget, 'dueDate')).format("YYYY-MM-DD");
  
  // Meta fields
  if (goal.meta) {
    result.lastUpdated = moment(get(goal, 'meta.lastUpdated')).format("YYYY-MM-DD hh:mm a");
    result.versionId = get(goal, 'meta.versionId', '');
    result.source = get(goal, 'meta.source', '');
  }

  return result;
}

export function flattenGroup(group) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    active: false,
    type: '',
    actual: false,
    code: '',
    name: '',
    description: '',
    quantity: 0,
    managingEntity: '',
    memberCount: 0,
    characteristicCount: 0,
    characteristicName: '',
    characteristicValue: '',
    characteristicExclude: false,
    characteristicPeriodStart: '',
    characteristicPeriodEnd: '',
    member1Type: '',
    member1Reference: '',
    member1Display: '',
    member1Period: '',
    member1inactive: false,
    extension: '',
    meta: '',
    version: '',
    establishedDate: '',
    modifiedDate: '',
    note: '',
    operationOutcome: ''
  };

  result.resourceType = get(group, 'resourceType', 'Unknown');

  // Basic identifiers and metadata
  result._id = get(group, '_id', '');
  result.id = get(group, 'id', '');
  result.identifier = get(group, 'identifier[0].value', '');
  result.active = get(group, 'active', false);
  result.type = get(group, 'type', '');
  result.actual = get(group, 'actual', false);
  
  // Core properties
  result.code = get(group, 'code.coding[0].display', '');
  result.name = get(group, 'name', '');
  result.description = get(group, 'description', '');
  
  
  // Managing entity
  result.managingEntity = get(group, 'managingEntity.display', '');
  
  // Characteristics (taking first characteristic as representative)
  if (Array.isArray(group.characteristic)) {
    result.characteristicCount = group.characteristic.length;
    const firstCharacteristic = group.characteristic[0];
    if (firstCharacteristic) {
      result.characteristicName = get(firstCharacteristic, 'code.coding[0].display', '');
      result.characteristicValue = get(firstCharacteristic, 'valueCodeableConcept.coding[0].display', '') || 
                                 get(firstCharacteristic, 'valueBoolean', '') ||
                                 get(firstCharacteristic, 'valueQuantity.value', '');
      result.characteristicExclude = get(firstCharacteristic, 'exclude', false);
      result.characteristicPeriodStart = moment(get(firstCharacteristic, 'period.start')).format('YYYY-MM-DD hh:mm a');
      result.characteristicPeriodEnd = moment(get(firstCharacteristic, 'period.end')).format('YYYY-MM-DD hh:mm a');
    }
  }
  
  // Members
  if (Array.isArray(group.member)) {
    result.memberCount = group.member.length;
    // Capture details of first member as representative
    const firstMember = group.member[0];
    if (firstMember) {
      result.member1Type = get(firstMember, 'entity.type', '');
      result.member1Reference = get(firstMember, 'entity.reference', '');
      result.member1Display = get(firstMember, 'entity.display', '');
      result.member1Period = moment(get(firstMember, 'period.start')).format('YYYY-MM-DD');
      result.member1inactive = get(firstMember, 'inactive', false);
    }
  }
  
  // Additional metadata
  result.extension = get(group, 'extension[0].url', '');
  result.meta = get(group, 'meta.versionId', '');
  result.version = get(group, 'version', '');
  
  // Dates
  result.establishedDate = moment(get(group, 'establishedDate')).format('YYYY-MM-DD');
  result.modifiedDate = moment(get(group, 'modifiedDate')).format('YYYY-MM-DD');
  
  // Notes
  result.note = get(group, 'note[0].text', '');
  
  // Operation outcome
  if (get(group, 'issue[0].details.text')) {
    result.operationOutcome = get(group, 'issue[0].details.text');
  }

  if(get(group, 'quantity', 0)){
    result.quantity = get(group, 'quantity', 0);
  } else if(Array.isArray(group.member)) {
    result.quantity = group.member.length;
  }
  
  return result;
}

export function flattenGuidanceResponse(guidance) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    requestIdentifier: '',
    moduleUri: '',
    moduleCanonical: '',
    moduleCodeSystem: '',
    moduleCodeDisplay: '',
    status: '',
    subject: '',
    encounter: '',
    occurrenceDateTime: '',
    performer: '',
    reasonCode: '',
    reasonReference: '',
    note: '',
    evaluationMessage: '',
    outputParameterCount: 0,
    outputParameter1Name: '',
    outputParameter1Value: '',
    dataRequirementCount: 0,
    dataRequirement1Type: '',
    dataRequirement1Profile: '',
    resultCount: 0,
    result1Reference: '',
    result1Display: '',
    operationOutcome: ''
  };

  result.resourceType = get(guidance, 'resourceType', 'Unknown');

  // Basic identifiers
  result._id = get(guidance, '_id', '');
  result.id = get(guidance, 'id', '');
  result.identifier = get(guidance, 'identifier[0].value', '');
  result.requestIdentifier = get(guidance, 'requestIdentifier.value', '');

  // Module identification (supports multiple ways of identifying the module)
  result.moduleUri = get(guidance, 'moduleUri', '');
  result.moduleCanonical = get(guidance, 'moduleCanonical', '');
  result.moduleCodeSystem = get(guidance, 'moduleCodeableConcept.coding[0].system', '');
  result.moduleCodeDisplay = get(guidance, 'moduleCodeableConcept.coding[0].display', '');

  // Status and context
  result.status = get(guidance, 'status', '');
  result.subject = get(guidance, 'subject.reference', '');
  result.encounter = get(guidance, 'encounter.reference', '');

  // Timing
  result.occurrenceDateTime = moment(get(guidance, 'occurrenceDateTime')).format('YYYY-MM-DD hh:mm a');

  // Participants and reasons
  result.performer = get(guidance, 'performer.display', '');
  result.reasonCode = get(guidance, 'reasonCode[0].coding[0].display', '');
  result.reasonReference = get(guidance, 'reasonReference[0].reference', '');

  // Notes and evaluation messages
  result.note = get(guidance, 'note[0].text', '');
  result.evaluationMessage = get(guidance, 'evaluationMessage[0].text', '');

  // Output parameters
  if (Array.isArray(guidance.outputParameters)) {
    result.outputParameterCount = guidance.outputParameters.length;
    const firstParam = guidance.outputParameters[0];
    if (firstParam) {
      result.outputParameter1Name = get(firstParam, 'name', '');
      result.outputParameter1Value = get(firstParam, 'value[0]', '') || 
                                   get(firstParam, 'valueString', '') ||
                                   get(firstParam, 'valueBoolean', '') ||
                                   get(firstParam, 'valueInteger', '') ||
                                   get(firstParam, 'valueDecimal', '');
    }
  }

  // Data requirements
  if (Array.isArray(guidance.dataRequirement)) {
    result.dataRequirementCount = guidance.dataRequirement.length;
    const firstReq = guidance.dataRequirement[0];
    if (firstReq) {
      result.dataRequirement1Type = get(firstReq, 'type', '');
      result.dataRequirement1Profile = get(firstReq, 'profile[0]', '');
    }
  }

  // Results
  if (Array.isArray(guidance.result)) {
    result.resultCount = guidance.result.length;
    const firstResult = guidance.result[0];
    if (firstResult) {
      result.result1Reference = get(firstResult, 'reference', '');
      result.result1Display = get(firstResult, 'display', '');
    }
  }

  // Operation outcome
  if (get(guidance, 'issue[0].details.text')) {
    result.operationOutcome = get(guidance, 'issue[0].details.text');
  }

  return result;
}

export function flattenHealthcareService(service, internalDateFormat){
    let result = {
      resourceType: 'HealthcareService',
      _id: '',
      id: '',
      identifier1: '',
      identifier2: '',
      identifier3: '',
      active: true,
      category: '',
      type: '',
      specialty: '',
      name: '',
      locationDisplay: '',
      locationReference: '',
      comment: '',
      photo: '',
      phone: '',
      email: '',
      coverageAreaDisplay: '',
      coverageAreaReference: '',
      serviceProvisionCode: '',
      eligibilityCode: '',
      eligibilityCodeDisplay: '',
      eligibilityComment: '',
      providedBy: '',
      numEndpoints: 0
    };
    result.resourceType = get(service, 'resourceType', "Unknown");
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
      }
    
    result._id = get(service, '_id');
    result.id = get(service, 'id');
    result.identifier1 = get(service, 'identifier[0].value');
    result.identifier2 = get(service, 'identifier[1].value');
    result.identifier3 = get(service, 'identifier[2].value');
    result.active = get(service, 'active', true);
    result.type = get(service, 'type[0].text', '');
    result.locationDisplay = get(service, 'location.display', '');
    result.locationReference = get(service, 'location.reference', '');
    result.name = get(service, 'name', '');
    result.comment = get(service, 'comment', '');
    result.extraDetails = get(service, 'extraDetails', '');
    result.photo = get(service, 'attagment.url', '');

    result.phone = FhirUtilities.pluckPhone(get(service, 'telecom'));
    result.email = FhirUtilities.pluckEmail(get(service, 'telecom'));
  
    result.coverageAreaDisplay = get(service, 'coverageArea.display', '');
    result.coverageAreaReference = get(service, 'coverageArea.reference', '');
    result.serviceProvisionCode = get(service, 'serviceProvisionCode[0].text', '');

    result.eligibilityCode = get(service, 'eligibility[0].coding.code', '');
    result.eligibilityCodeDisplay = get(service, 'eligibility[0].coding.display', '');
    result.eligibilityComment = get(service, 'eligibility[0].comment', '');

    result.specialty = FhirUtilities.pluckCodeableConcept(get(service, 'specialty[0]'));
    result.category = FhirUtilities.pluckCodeableConcept(get(service, 'category[0]'));
    result.providedBy = FhirUtilities.pluckReference(get(service, 'providedBy'));

    if(Array.isArray(service.endpoint)){
        result.numEndpoints = service.endpoint.length;
    }

    return result;
}

export function flattenImmunization(immunization, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    patientDisplay: '',
    patientReference: '',
    performerDisplay: '',
    performerReference: '',
    vaccineCode: '',
    vaccineDisplay: '',
    status: '',
    reported: '',
    date: '',
    operationOutcome: ''
  };

  result.resourceType = get(immunization, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id =  get(immunization, 'id') ? get(immunization, 'id') : get(immunization, '_id');
  result.id = get(immunization, 'id', '');
  result.identifier = get(immunization, 'identifier[0].value', '');

  if(get(immunization, 'patient')){
    result.patientDisplay = get(immunization, 'patient.display', '');
    result.patientReference = get(immunization, 'patient.reference', '');
  } else if (get(immunization, 'subject')){
    result.patientDisplay = get(immunization, 'subject.display', '');
    result.patientReference = get(immunization, 'subject.reference', '');
  }

  if(get(immunization, 'performer')){
    result.performerDisplay = get(immunization, 'performer.display', '');
    result.performerReference = get(immunization, 'performer.reference', '');
  } 

  result.performerDisplay = get(immunization, 'asserter.display', '');

  if(get(immunization, 'status.coding[0].code')){
    result.status = get(immunization, 'status.coding[0].code', '');  //R4
  } else {
    result.status = get(immunization, 'status', '');                 // DSTU2
  }

  result.vaccineCode = get(immunization, 'vaccineCode.coding[0].code', '');

  if(get(immunization, 'vaccineCode.coding[0].display')){
    result.vaccineDisplay = get(immunization, 'vaccineCode.coding[0].display', '');  //R4
  } else {
    result.vaccineDisplay = get(immunization, 'vaccineCode.text', '');                 // DSTU2
  }

  result.barcode = get(immunization, '_id', '');

  if(get(immunization, 'occurrenceDateTime')){
    result.date = moment(get(immunization, 'occurrenceDateTime')).format("YYYY-MM-DD");
  } else {
    result.date = moment(get(immunization, 'date')).format("YYYY-MM-DD");
  }
  result.reported = moment(get(immunization, 'reported', '')).format("YYYY-MM-DD");

  if(get(immunization, "issue[0].details.text")){
    result.operationOutcome = get(immunization, "issue[0].details.text");
  }

  if(get(immunization, "issue[0].details.text")){
    result.operationOutcome = get(immunization, "issue[0].details.text");
  }

  return result;
}

export function flattenInsurancePlan(plan, internalDateFormat){
    let result = {
      resourceType: 'InsurancePlan',
      _id: '',
      id: '',
      identifier: '',
      status: '',
      type: '',
      name: '',
      alias: '',
      periodStart: '',
      periodEnd: '',
      ownedBy: '',
      administeredBy: '',
      coverageArea: '',
      coverageAreaDisplay: '',
      coverageAreaReference: '',
      coverageType: '',
      coverageBenefitType: '',
      coverageBenefitRequirement: '',
      numEndpoints: 0
    };
    result.resourceType = get(plan, 'resourceType', "InsurancePlan");
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    if(get(plan, 'period')){
        result.periodStart = moment(get(plan, 'period.start')).format(internalDateFormat);
        result.periodEnd = moment(get(plan, 'period.end')).format(internalDateFormat);    
    }

    result._id = get(plan, '_id');
    result.id = get(plan, 'id');
    result.identifier = get(plan, 'identifier[0].value');
    result.status = get(plan, 'status');
    result.name = get(plan, 'name');
    result.alias = get(plan, 'alias');

    result.coverageAreaDisplay = get(plan, 'coverageArea[0].display', '');
    result.coverageAreaReference = get(plan, 'coverageArea[0].reference', '');
    result.networkDisplay = get(plan, 'network[0].display', '');
    result.networkReference = get(plan, 'network[0].reference', '');

    result.coverageType = get(plan, 'coverage[0].type', '');
    result.coverageBenefitType = get(plan, 'coverage[0].benefit[0].type.text', '');
    result.coverageBenefitRequirement = get(plan, 'coverage[0].benefit[0].requirement', '');

    result.type = FhirUtilities.pluckCodeableConcept(get(plan, 'type[0]'));
    result.ownedBy = FhirUtilities.pluckReference(get(plan, 'ownedBy'));
    result.administeredBy = FhirUtilities.pluckReference(get(plan, 'administeredBy'));
    result.coverageArea = FhirUtilities.pluckReference(get(plan, 'coverageArea[0]'));

    if(Array.isArray(plan.endpoint)){
        result.numEndpoints = plan.endpoint.length;
    }

    return result;
}

export function flattenLibrary(library) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    url: '',
    version: '',
    name: '',
    title: '',
    status: '',
    experimental: false,
    type: '',
    date: '',
    publisher: '',
    description: '',
    purpose: '',
    usage: '',
    jurisdiction: '',
    approvalDate: '',
    lastReviewDate: '',
    effectivePeriod: '',
    topic: '',
    author: '',
    editor: '',
    reviewer: '',
    endorser: '',
    contact: '',
    subjectCodeableConcept: '',
    subjectReference: '',
    relatedArtifactCount: 0,
    parameterCount: 0,
    dataRequirementCount: 0,
    contentCount: 0,
    content1Title: '',
    content1Type: '',
    content1Language: '',
    content1DataFormat: '',
    content1Url: '',
    useContext: '',
    copyright: '',
    contributorCount: 0,
    parameter1Name: '',
    parameter1Use: '',
    parameter1Min: '',
    parameter1Max: '',
    parameter1Type: '',
    dataRequirement1Type: '',
    dataRequirement1Profile: '',
    dataRequirement1CodeFilter: '',
    dataRequirement1DateFilter: '',
    note: '',
    operationOutcome: ''
  };

  result.resourceType = get(library, 'resourceType', 'Unknown');

  // Basic identifiers and metadata
  result._id = get(library, '_id', '');
  result.id = get(library, 'id', '');
  result.identifier = get(library, 'identifier[0].value', '');
  result.url = get(library, 'url', '');
  result.version = get(library, 'version', '');
  result.name = get(library, 'name', '');
  result.title = get(library, 'title', '');
  result.status = get(library, 'status', '');
  result.experimental = get(library, 'experimental', false);
  
  // Type and classification
  result.type = get(library, 'type.coding[0].display', '');
  
  // Dates
  result.date = moment(get(library, 'date')).format('YYYY-MM-DD hh:mm a');
  result.approvalDate = moment(get(library, 'approvalDate')).format('YYYY-MM-DD');
  result.lastReviewDate = moment(get(library, 'lastReviewDate')).format('YYYY-MM-DD');
  result.effectivePeriod = moment(get(library, 'effectivePeriod.start')).format('YYYY-MM-DD');

  // Publisher and contacts
  result.publisher = get(library, 'publisher', '');
  result.contact = get(library, 'contact[0].name', '');

  // Description and context
  result.description = get(library, 'description', '');
  result.purpose = get(library, 'purpose', '');
  result.usage = get(library, 'usage', '');
  result.jurisdiction = get(library, 'jurisdiction[0].coding[0].display', '');
  result.useContext = get(library, 'useContext[0].valueCodeableConcept.coding[0].display', '');
  result.copyright = get(library, 'copyright', '');

  // Topics and contributors
  result.topic = get(library, 'topic[0].coding[0].display', '');
  result.author = get(library, 'author[0].name', '');
  result.editor = get(library, 'editor[0].name', '');
  result.reviewer = get(library, 'reviewer[0].name', '');
  result.endorser = get(library, 'endorser[0].name', '');

  // Subject
  result.subjectCodeableConcept = get(library, 'subject.CodeableConcept.coding[0].display', '');
  result.subjectReference = get(library, 'subject.Reference.reference', '');

  // Content (attachments)
  if (Array.isArray(library.content)) {
    result.contentCount = library.content.length;
    const firstContent = library.content[0];
    if (firstContent) {
      result.content1Title = get(firstContent, 'title', '');
      result.content1Type = get(firstContent, 'contentType', '');
      result.content1Language = get(firstContent, 'language', '');
      result.content1DataFormat = get(firstContent, 'format', '');
      result.content1Url = get(firstContent, 'url', '');
    }
  }

  // Parameters
  if (Array.isArray(library.parameter)) {
    result.parameterCount = library.parameter.length;
    const firstParam = library.parameter[0];
    if (firstParam) {
      result.parameter1Name = get(firstParam, 'name', '');
      result.parameter1Use = get(firstParam, 'use', '');
      result.parameter1Min = get(firstParam, 'min', '');
      result.parameter1Max = get(firstParam, 'max', '');
      result.parameter1Type = get(firstParam, 'type', '');
    }
  }

  // Data Requirements
  if (Array.isArray(library.dataRequirement)) {
    result.dataRequirementCount = library.dataRequirement.length;
    const firstReq = library.dataRequirement[0];
    if (firstReq) {
      result.dataRequirement1Type = get(firstReq, 'type', '');
      result.dataRequirement1Profile = get(firstReq, 'profile[0]', '');
      result.dataRequirement1CodeFilter = get(firstReq, 'codeFilter[0].code[0].display', '');
      result.dataRequirement1DateFilter = get(firstReq, 'dateFilter[0].path', '');
    }
  }

  // Array counts
  if (Array.isArray(library.relatedArtifact)) {
    result.relatedArtifactCount = library.relatedArtifact.length;
  }

  if (Array.isArray(library.contributor)) {
    result.contributorCount = library.contributor.length;
  }

  // Notes
  result.note = get(library, 'note[0].text', '');

  // Operation outcome
  if (get(library, 'issue[0].details.text')) {
    result.operationOutcome = get(library, 'issue[0].details.text');
  }

  return result;
}

export function flattenList(list, extensionUrl){
  
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    status: '',
    mode: '',
    title: '',
    subjectDisplay: '',
    subjectReference: '',
    encounterDisplay: '',
    encounterReference: '',
    date: '',
    sourceDisplay: '',
    sourceReference: '',
    oderedByText: '',
    emptyReason: '',
    itemCount: 0,
    operationOutcome: ''
  };

  result.resourceType = get(list, 'resourceType', "Unknown");

  result._id = get(list, '_id');
  result.id = get(list, 'id');
  result.identifier = get(list, 'identifier[0].value', '');
  result.status = get(list, 'status', '');
  result.mode = get(list, 'mode', '');
  result.title = get(list, 'title', '');
  result.subjectDisplay = get(list, 'subject.display', '');
  result.subjectReference = get(list, 'subject.reference', '');
  result.encounterDisplay = get(list, 'encounter.display', '');
  result.encounterReference = get(list, 'encounter.reference', '');
  result.date = get(list, 'date', '');
  result.sourceDisplay = get(list, 'source.display', '');
  result.sourceReference = get(list, 'source.reference', '');

  if(Array.isArray(list.entry)){
    result.itemCount = list.entry.length;
  }

  if(get(list, "issue[0].details.text")){
    result.operationOutcome = get(list, "issue[0].details.text");
  }

  return result;
}

export function flattenLocation(location, simplifiedAddress, preferredExtensionUrl){
  
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    name: '',
    address: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    type: '',
    typeCode: '',
    typeDisplay: '',
    status: '',
    mode: '',
    telecom: '',
    managingOrganizationDisplay: '',
    managingOrganizationReference: '',
    physicalTypeCode: '',
    physicalTypeDisplay: '',
    operationalStatusCode: '',
    operationalStatusDisplay: '',
    partOfDisplay: '',
    partOfReference: '',
    latitude: '',
    longitude: '',
    altitude: '',
    selectedExtension: '',
    operationOutcome: ''
  };

  result.resourceType = get(location, 'resourceType', "Unknown");

  result.severity = get(location, 'severity.text', '');

  if (get(location, 'id')){
    result.id = get(location, 'id');
  }
  if (get(location, '_id')){
    result._id = get(location, '_id');
  }
  if (get(location, 'identifier[0].value')) {
    result.identifier = get(location, 'identifier[0].value');
  }
  if (get(location, 'name')) {
    result.name = get(location, 'name');
  }
  if (get(location, 'status')) {
    result.status = get(location, 'status');
  }
  if (get(location, 'mode')) {
    result.mode = get(location, 'mode');
  }
  
  // Handle address
  if (get(location, 'address')) {
    if(simplifiedAddress){
      result.address = FhirUtilities.stringifyAddress(get(location, 'address'), {noPrefix: true});
    } else {
      result.address = get(location, 'address');
    }
    result.addressLine = get(location, 'address.line[0]', '');
  } else if (get(location, 'address[0]')) {
    if(simplifiedAddress){
      result.address = FhirUtilities.stringifyAddress(get(location, 'address[0]'), {noPrefix: true});
    } else {
      result.address = get(location, 'address[0]');
    }
    result.addressLine = get(location, 'address[0].line[0]', '');
  }

  if (get(location, 'address.city')) {
    result.city = get(location, 'address.city');
  } else if (get(location, 'address[0].city')) {
    result.city = get(location, 'address[0].city');
  }
  if (get(location, 'address.state')) {
    result.state = get(location, 'address.state');
  } else if (get(location, 'address[0].state')) {
    result.state = get(location, 'address[0].state');
  }
  if (get(location, 'address.postalCode')) {
    result.postalCode = get(location, 'address.postalCode');
  } else if (get(location, 'address[0].postalCode')) {
    result.postalCode = get(location, 'address[0].postalCode');
  }
  if (get(location, 'address.country')) {
    result.country = get(location, 'address.country');
  } else if (get(location, 'address[0].country')) {
    result.country = get(location, 'address[0].country');
  }

  // Handle type
  if (get(location, 'type[0].text')) {
    result.type = get(location, 'type[0].text');
    result.typeDisplay = get(location, 'type[0].text');
  }
  if (get(location, 'type[0].coding[0].code')) {
    result.typeCode = get(location, 'type[0].coding[0].code');
  }
  if (get(location, 'type[0].coding[0].display')) {
    result.typeDisplay = get(location, 'type[0].coding[0].display');
  }

  // Handle telecom
  if (get(location, 'telecom[0].value')) {
    result.telecom = get(location, 'telecom[0].value');
  }

  // Handle managing organization
  if (get(location, 'managingOrganization')) {
    result.managingOrganizationDisplay = get(location, 'managingOrganization.display', '');
    result.managingOrganizationReference = get(location, 'managingOrganization.reference', '');
  }

  // Handle physical type
  if (get(location, 'physicalType')) {
    result.physicalTypeCode = get(location, 'physicalType.coding[0].code', '');
    result.physicalTypeDisplay = get(location, 'physicalType.coding[0].display', '');
  }

  // Handle operational status
  if (get(location, 'operationalStatus')) {
    result.operationalStatusCode = get(location, 'operationalStatus.code', '');
    result.operationalStatusDisplay = get(location, 'operationalStatus.display', '');
  }

  // Handle part of
  if (get(location, 'partOf')) {
    result.partOfDisplay = get(location, 'partOf.display', '');
    result.partOfReference = get(location, 'partOf.reference', '');
  }

  // Handle position
  if (get(location, 'position.latitude')) {
    result.latitude = get(location, 'position.latitude', null);
  }
  if (get(location, 'position.longitude')) {
    result.longitude = get(location, 'position.longitude', null);
  }
  if (get(location, 'position.altitude')) {
    result.altitude = get(location, 'position.altitude', null);
  }

  if (Array.isArray(get(location, 'extension'))) {

    let extensionIndex = findIndex(location.extension, {'url': preferredExtensionUrl});

    if(extensionIndex > -1){
      result.selectedExtension = location.extension[extensionIndex].valueDecimal.toString();
    }
  }

  if(get(location, "issue[0].details.text")){
    result.operationOutcome = get(location, "issue[0].details.text");
  }

  return result;
}

export function flattenMeasure(measure, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    name: '',
    publisher: '',
    status: '',
    title: '',
    date: '',
    approvalDate: '',
    lastReviewDate: '',
    lastEdited: '',
    author: '',
    reviewer: '',
    endorser: '',
    scoring: '',
    type: '',
    riskAdjustment: '',
    rateAggregation: '',
    supplementalDataCount: '',
    context: '', 
    version: '',
    operationOutcome: ''
  };

  result.resourceType = get(measure, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(measure, '_id');
  result.id = get(measure, 'id', '');
  result.identifier = get(measure, 'identifier[0].value', '');

  if(get(measure, 'lastReviewDate')){
    result.lastReviewDate = moment(get(measure, 'lastReviewDate', '')).format(internalDateFormat);
  }
  if(get(measure, 'approvalDate')){
    result.approvalDate = moment(get(measure, 'approvalDate', '')).format(internalDateFormat);
  }
  if(get(measure, 'date')){
    result.lastEdited = moment(get(measure, 'date', '')).format(internalDateFormat);
  }

  result.publisher = get(measure, 'publisher', '');
  result.name = get(measure, 'name', '');
  result.title = get(measure, 'title', '');
  result.description = get(measure, 'description', '');
  result.status = get(measure, 'status', '');
  result.version = get(measure, 'version', '');

  result.context = get(measure, 'useContext[0].valueCodeableConcept.text', '');

  result.editor = get(measure, 'editor[0].name', '');
  result.reviewer = get(measure, 'reviewer[0].name', '');
  result.endorser = get(measure, 'endorser[0].name', '');

  result.scoring = get(measure, 'scoring.coding[0].display', '');
  result.type = get(measure, 'type[0].coding[0].display', '');

  result.riskAdjustment = get(measure, 'riskAdjustment', '');
  result.rateAggregation = get(measure, 'rateAggregation', '');
  
  let supplementalData = get(measure, 'supplementalData', []);
  result.supplementalDataCount = supplementalData.length;

  let cohorts = get(measure, 'group[0].population', []);
  result.cohortCount = cohorts.length;

  if(get(measure, "issue[0].details.text")){
    result.operationOutcome = get(measure, "issue[0].details.text");
  }

  return result;
}

export function flattenMeasureReport(measureReport, measuresCursor, internalDateFormat, measureShorthand, measureScoreType){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    type: '',
    measureUrl: '',
    measureTitle: '',
    date: '',
    subject: '',
    reporter: '',
    periodStart: '',
    periodEnd: '',
    groupCode: '',
    populationCode: '',
    populationCount: '',
    measureScore: '',
    stratifierCount: '',
    numerator: '',
    denominator: '',
    operationOutcome: ''
  };

  result.resourceType = get(measureReport, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id = get(measureReport, '_id');
  result.id = get(measureReport, 'id', '');
  result.identifier = get(measureReport, 'identifier[0].value', '');
  result.type = get(measureReport, 'type', '');

  result.measureUrl = get(measureReport, 'measure', ''); 

  if(measuresCursor && result.measureUrl){
    let measure = measuresCursor.findOne({id: FhirUtilities.pluckReferenceId(result.measureUrl)});
    if(measureShorthand){
      result.measureTitle = get(measure, 'id');
    } else {
      result.measureTitle = get(measure, 'title');
    }
  }

  result.date = moment(get(measureReport, 'date', '')).format(internalDateFormat);
  if(get(measureReport, 'reporter.display', '')){
    result.reporter = get(measureReport, 'reporter.display', '');
  } else {
    result.reporter = FhirUtilities.pluckReferenceId(get(measureReport, 'reporter.reference', ''));
  }

  if(get(measureReport, 'subject.display', '')){
    result.subject = get(measureReport, 'subject.display', '');
  } else {
    result.subject = FhirUtilities.pluckReferenceId(get(measureReport, 'subject.reference', ''));
  }

  result.periodStart = moment(get(measureReport, 'period.start', '')).format(internalDateFormat);
  result.periodEnd = moment(get(measureReport, 'period.end', '')).format(internalDateFormat);

  result.groupCode = get(measureReport, 'group[0].coding[0].code', '');
  result.populationCode = get(measureReport, 'group[0].population[0].coding[0].code', '');
  result.populationCount = get(measureReport, 'group[0].population[0].count', '');

  if(get(measureReport, 'group[0].population')){
    let population = get(measureReport, 'group[0].population');
    population.forEach(function(pop){
      if(get(pop, 'code.text') === "numerator"){
        result.numerator = get(pop, 'count');
      }
      if(get(pop, 'code.text') === "denominator"){
        result.denominator = get(pop, 'count');        
      }
    })
  }

  if(has(measureReport, 'group[0].measureScore.value')){
    result.measureScore = get(measureReport, 'group[0].measureScore.value', '');
  } else if(has(measureReport, 'group[0].population')){
    if(Array.isArray(get(measureReport, 'group[0].population'))){
      measureReport.group[0].population.forEach(function(pop){
        if(Array.isArray(get(pop, 'code.coding'))){
          pop.code.coding.forEach(function(coding){
            if(coding.code === measureScoreType){
              result.measureScore = pop.count;
            }
          })
        }        
      })
    }
  }

  let stratifierArray = get(measureReport, 'group[0].stratifier', []);
  result.stratifierCount = stratifierArray.length;

  if(get(measureReport, "issue[0].details.text")){
    result.operationOutcome = get(measureReport, "issue[0].details.text");
  }

  return result;
}

export function flattenMedication(medication, dateFormat){
  let result = {
    _id: '',
    id: '',
    status: '',
    identifier: '',

    code: '',
    medicationCodeableConceptText: '',
    form: '',
    manufacturer: '',

    marketingAuthorizationHolderDisplay: '',
    marketingAuthorizationHolderReference: '',
    doseForm: '',
    totalVolume: '',

    activeIngredient: '',
    strengthRatio: '',
    strengthQuantity: '',
    lotNumber: '', 
    expirationDate: '',
    definitionReference: '',
    definitionDisplay: ''
  };

  result.resourceType = get(medication, 'resourceType', "Medication");

  result._id = get(medication, '_id');
  result.id = get(medication, 'id', '');


  result.status = get(medication, 'status', '');
  result.identifier = get(medication, 'identifier[0].value', '');

  if(get(medication, 'code.text', '')){
    result.code = get(medication, 'code.text', '');
    result.medicationCodeableConceptText = get(medication, 'code.text', ''); 
  } else {
    result.code = get(medication, 'code.coding[0].code', '');
    result.medicationCodeableConceptText = get(medication, 'code.coding[0].display', '');
  }

  result.marketingAuthorizationHolderDisplay = get(medication, 'marketingAuthorizationHolder.display', '');
  result.marketingAuthorizationHolderReference = get(medication, 'marketingAuthorizationHolder.reference', '');
  result.manufacturer = get(medication, 'marketingAuthorizationHolder.display', '');

  if(get(medication, 'doseForm.text', '')){
    result.doseForm = get(medication, 'doseForm.text', '');
    result.form = get(medication, 'doseForm.text', ''); 
  } else {
    result.doseForm = get(medication, 'doseForm.coding[0].code', '');
    result.form = get(medication, 'doseForm.coding[0].display', '');
  }

  result.totalVolume = get(medication, 'totalVolume.value', '') + ' ' + get(medication, 'totalVolume.unit', ''); 

  if(get(medication, 'ingredient[0].concept.text')){
    result.activeIngredient = get(medication, 'ingredient[0].concept.text', '');
  } else if(get(medication, 'ingredient[0].reference.display')){
    result.activeIngredient = get(medication, 'ingredient[0].reference.display', '');
  } else {
    result.activeIngredient = get(medication, 'ingredient[0].reference.reference', '');
  }

  result.strengthRatio = get(medication, 'ingredient[0].numerator.value', '') + ' ' + get(medication, 'ingredient[0].numerator.unit', '');  + '/' + get(medication, 'ingredient[0].denominator.value', '') + ' ' + get(medication, 'ingredient[0].denominator.unit', ''); ; 
  result.strengthQuantity = get(medication, 'ingredient[0].value', '') + ' ' + get(medication, 'ingredient[0].unit', ''); 

  result.lotNumber = get(medication, 'batch.lotNumber', '');
  result.expirationDate = get(medication, 'batch.expirationDate', '');
  
  result.definitionReference = get(medication, 'definition.reference', '');
  result.definitionDisplay = get(medication, 'definition.display', '');

  return result;
}

export function flattenMedicationOrder(medicationOrder, dateFormat){
  let result = {
    _id: '',
    id: '',
    status: '',
    identifier: '',
    patientDisplay: '',
    patientReference: '',
    prescriberDisplay: '',
    asserterDisplay: '',
    clinicalStatus: '',
    snomedCode: '',
    snomedDisplay: '',
    evidenceDisplay: '',
    barcode: '',
    dateWritten: '',
    dosageInstructionText: '',
    medicationCodeableConcept: '',
    medicationCode: '',
    dosage: '',
    operationOutcome: ''
  };

  result.resourceType = get(medicationOrder, 'resourceType', "Unknown");

  result._id = get(medicationOrder, '_id');
  result.id = get(medicationOrder, 'id', '');

  if(!dateFormat){
    dateFormat = get(Meteor, "settings.public.defaults.dateFormat", "YYYY-MM-DD");
  }

  if (get(medicationOrder, 'medicationReference.display')){
    result.medicationCodeableConcept = get(medicationOrder, 'medicationReference.display');
  } else if(get(medicationOrder, 'medicationCodeableConcept')){
    result.medicationCodeableConcept = get(medicationOrder, 'medicationCodeableConcept.text');
    result.medicationCode = get(medicationOrder, 'medicationCodeableConcept.coding[0].code');
  } 

  result.status = get(medicationOrder, 'status');
  result.identifier = get(medicationOrder, 'identifier[0].value');
  result.patientDisplay = get(medicationOrder, 'patient.display');
  result.patientReference = get(medicationOrder, 'patient.reference');
  result.prescriberDisplay = get(medicationOrder, 'prescriber.display');
  result.dateWritten = moment(get(medicationOrder, 'dateWritten')).format(dateFormat);
  
  result.dosage = get(medicationOrder, 'dosageInstruction[0].text');
  result.barcode = get(medicationOrder, '_id');

  if(get(medicationOrder, "issue[0].details.text")){
    result.operationOutcome = get(medicationOrder, "issue[0].details.text");
  }

  return result;
}

export function flattenMedicationAdministration(medicationAdministration, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    status: '',
    statusReason: '',
    category: '',
    identifier: '',
    patientDisplay: '',
    patientReference: '',
    contextDisplay: '',
    contextReference: '',
    supportingInformation: '',
    effectiveDateTime: '',
    effectivePeriodStart: '',
    effectivePeriodEnd: '',
    performerDisplay: '',
    performerReference: '',
    reasonCode: '',
    reasonDisplay: '',
    requestDisplay: '',
    requestReference: '',
    deviceDisplay: '',
    deviceReference: '',
    note: '',
    medicationDisplay: '',
    medicationReference: '',
    medicationCode: '',
    dosageText: '',
    dosageRoute: '',
    dosageDoseValue: '',
    dosageDoseUnit: '',
    dosageRateRatio: '',
    dosageRateQuantity: '',
    operationOutcome: ''
  };

  result.resourceType = get(medicationAdministration, 'resourceType', "MedicationAdministration");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id = get(medicationAdministration, '_id');
  result.id = get(medicationAdministration, 'id', '');
  result.status = get(medicationAdministration, 'status', '');
  result.statusReason = get(medicationAdministration, 'statusReason[0].coding[0].display', '');
  result.category = get(medicationAdministration, 'category.coding[0].display', '');
  result.identifier = get(medicationAdministration, 'identifier[0].value', '');

  result.patientDisplay = get(medicationAdministration, 'subject.display', '');
  result.patientReference = get(medicationAdministration, 'subject.reference', '');
  
  result.contextDisplay = get(medicationAdministration, 'context.display', '');
  result.contextReference = get(medicationAdministration, 'context.reference', '');

  if(get(medicationAdministration, 'effectiveDateTime')){
    result.effectiveDateTime = moment(get(medicationAdministration, 'effectiveDateTime')).format(internalDateFormat);
  }
  if(get(medicationAdministration, 'effectivePeriod.start')){
    result.effectivePeriodStart = moment(get(medicationAdministration, 'effectivePeriod.start')).format(internalDateFormat);
  }
  if(get(medicationAdministration, 'effectivePeriod.end')){
    result.effectivePeriodEnd = moment(get(medicationAdministration, 'effectivePeriod.end')).format(internalDateFormat);
  }

  result.performerDisplay = get(medicationAdministration, 'performer[0].actor.display', '');
  result.performerReference = get(medicationAdministration, 'performer[0].actor.reference', '');

  result.reasonCode = get(medicationAdministration, 'reasonCode[0].coding[0].code', '');
  result.reasonDisplay = get(medicationAdministration, 'reasonCode[0].text', '');

  result.requestDisplay = get(medicationAdministration, 'request.display', '');
  result.requestReference = get(medicationAdministration, 'request.reference', '');

  result.deviceDisplay = get(medicationAdministration, 'device[0].display', '');
  result.deviceReference = get(medicationAdministration, 'device[0].reference', '');

  result.note = get(medicationAdministration, 'note[0].text', '');

  if(get(medicationAdministration, 'medicationCodeableConcept.text')){
    result.medicationDisplay = get(medicationAdministration, 'medicationCodeableConcept.text');
    result.medicationCode = get(medicationAdministration, 'medicationCodeableConcept.coding[0].code', '');
  } else if(get(medicationAdministration, 'medicationReference')){
    result.medicationDisplay = get(medicationAdministration, 'medicationReference.display', '');
    result.medicationReference = get(medicationAdministration, 'medicationReference.reference', '');
  }

  result.dosageText = get(medicationAdministration, 'dosage.text', '');
  result.dosageRoute = get(medicationAdministration, 'dosage.route.text', '');
  result.route = get(medicationAdministration, 'dosage.route.text', ''); // Table expects 'route' field
  result.dosageDoseValue = get(medicationAdministration, 'dosage.dose.value', '');
  result.dosageDoseUnit = get(medicationAdministration, 'dosage.dose.unit', '');

  if(get(medicationAdministration, 'dosage.rateRatio')){
    result.dosageRateRatio = get(medicationAdministration, 'dosage.rateRatio.numerator.value', '') + ' ' + 
                            get(medicationAdministration, 'dosage.rateRatio.numerator.unit', '') + '/' +
                            get(medicationAdministration, 'dosage.rateRatio.denominator.value', '') + ' ' +
                            get(medicationAdministration, 'dosage.rateRatio.denominator.unit', '');
  } else if(get(medicationAdministration, 'dosage.rateQuantity')){
    result.dosageRateQuantity = get(medicationAdministration, 'dosage.rateQuantity.value', '') + ' ' +
                               get(medicationAdministration, 'dosage.rateQuantity.unit', '');
  }

  if(get(medicationAdministration, "issue[0].details.text")){
    result.operationOutcome = get(medicationAdministration, "issue[0].details.text");
  }

  return result;
}

export function flattenMedicationRequest(medicationRequest, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    status: '',
    intent: '',
    priority: '',
    identifier: '',
    subjectDisplay: '',
    subjectReference: '',
    patientDisplay: '',
    patientReference: '',
    requesterDisplay: '',
    requesterReference: '',
    prescriberDisplay: '',
    prescriberReference: '',
    encounterDisplay: '',
    encounterReference: '',
    authoredOn: '',
    dateWritten: '',
    medicationDisplay: '',
    medicationReference: '',
    medicationCode: '',
    dosageInstructionText: '',
    quantityValue: '',
    quantityUnit: '',
    numberOfRepeatsAllowed: '',
    validityPeriodStart: '',
    validityPeriodEnd: '',
    operationOutcome: ''
  };

  result.resourceType = get(medicationRequest, 'resourceType', "MedicationRequest");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id = get(medicationRequest, '_id');
  result.id = get(medicationRequest, 'id', '');
  result.status = get(medicationRequest, 'status', '');
  result.intent = get(medicationRequest, 'intent', '');
  result.priority = get(medicationRequest, 'priority', '');
  result.identifier = get(medicationRequest, 'identifier[0].value', '');

  // Handle subject/patient fields
  result.subjectDisplay = get(medicationRequest, 'subject.display', '');
  result.subjectReference = get(medicationRequest, 'subject.reference', '');
  result.patientDisplay = get(medicationRequest, 'patient.display', '');
  result.patientReference = get(medicationRequest, 'patient.reference', '');
  
  // Handle requester/prescriber fields
  result.requesterDisplay = get(medicationRequest, 'requester.display', '');
  result.requesterReference = get(medicationRequest, 'requester.reference', '');
  result.prescriberDisplay = get(medicationRequest, 'prescriber.display', '');
  result.prescriberReference = get(medicationRequest, 'prescriber.reference', '');
  
  result.encounterDisplay = get(medicationRequest, 'encounter.display', '');
  result.encounterReference = get(medicationRequest, 'encounter.reference', '');

  if(get(medicationRequest, 'authoredOn')){
    result.authoredOn = moment(get(medicationRequest, 'authoredOn')).format(internalDateFormat);
  }
  if(get(medicationRequest, 'dateWritten')){
    result.dateWritten = moment(get(medicationRequest, 'dateWritten')).format(internalDateFormat);
  }

  if(get(medicationRequest, 'medicationCodeableConcept.text')){
    result.medicationDisplay = get(medicationRequest, 'medicationCodeableConcept.text');
    result.medicationCode = get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '');
  } else if(get(medicationRequest, 'medicationReference')){
    result.medicationDisplay = get(medicationRequest, 'medicationReference.display', '');
    result.medicationReference = get(medicationRequest, 'medicationReference.reference', '');
  }

  result.dosageInstructionText = get(medicationRequest, 'dosageInstruction[0].text', '');

  result.quantityValue = get(medicationRequest, 'dispenseRequest.quantity.value', '');
  result.quantityUnit = get(medicationRequest, 'dispenseRequest.quantity.unit', '');
  result.numberOfRepeatsAllowed = get(medicationRequest, 'dispenseRequest.numberOfRepeatsAllowed', '');

  if(get(medicationRequest, 'dispenseRequest.validityPeriod.start')){
    result.validityPeriodStart = moment(get(medicationRequest, 'dispenseRequest.validityPeriod.start')).format(internalDateFormat);
  }
  if(get(medicationRequest, 'dispenseRequest.validityPeriod.end')){
    result.validityPeriodEnd = moment(get(medicationRequest, 'dispenseRequest.validityPeriod.end')).format(internalDateFormat);
  }

  if(get(medicationRequest, "issue[0].details.text")){
    result.operationOutcome = get(medicationRequest, "issue[0].details.text");
  }

  return result;
}

export function flattenMedicationStatement(statement, fhirVersion){

  var result = {
    _id: '',
    id: '',
    medication: '',
    medicationReference: '',
    medicationDisplay: '',
    reasonCodeCode: '',
    reasonCodeDisplay: '',
    basedOn: '',
    effectiveDateTime: '',
    dateAsserted: '',
    informationSource: '',
    subjectDisplay: '',
    taken: '',
    reasonCodeDisplay: '',
    dosage: '',
    operationOutcome: ''
  };

  result.resourceType = get(statement, 'resourceType', "Unknown");

  result._id = get(statement, '_id');
  result.id = get(statement, 'id', '');

  // DSTU2
  if(fhirVersion === "DSTU2"){
    result.subjectDisplay = get(statement, 'patient.display');
    result.medicationReference = get(statement, 'medicationReference.reference');
    result.medicationDisplay = get(statement, 'medicationReference.display');
    result.medicationCode = get(statement, 'medicationReference.display');
    result.reasonCode = get(statement, 'reasonForUseCodeableConcept.coding[0].code');
    result.reasonCodeDisplay = get(statement, 'reasonForUseCodeableConcept.coding[0].display');
    result.identifier = get(statement, 'identifier[0].value');
    result.effectiveDateTime = moment(get(statement, 'effectiveDateTime')).format("YYYY-MM-DD");
    result.dateAsserted = moment(get(statement, 'dateAsserted')).format("YYYY-MM-DD");
    result.informationSource = get(statement, 'supportingInformation[0].display');
    result.reasonCodeDisplay = get(statement, 'reasonForUseCodeableConcept.coding[0].display');  
  } else if(fhirVersion === "STU3"){
    result.subjectDisplay = get(statement, 'subject.display');
    result.medicationReference = get(statement, 'medicationReference.reference');
    result.medicationDisplay = get(statement, 'medicationReference.display');
    result.medicationCode = get(statement, 'medicationCodeableConcept.coding[0].display');
    result.identifier = get(statement, 'identifier[0].value');
    result.effectiveDateTime = moment(get(statement, 'effectiveDateTime')).format("YYYY-MM-DD");
    result.dateAsserted = moment(get(statement, 'dateAsserted')).format("YYYY-MM-DD");
    result.informationSource = get(statement, 'informationSource.display');
    result.taken = get(statement, 'taken');
    result.reasonCodeDisplay = get(statement, 'reasonCode[0].coding[0].display');  
  } else { // assume R4
    result.subjectDisplay = get(statement, 'subject.display');
    result.medicationReference = get(statement, 'medicationReference.reference');
    result.medicationDisplay = get(statement, 'medicationReference.display');
    result.medicationCode = get(statement, 'medicationCodeableConcept.coding[0].display');
    result.reasonCode = get(statement, 'reasonCode.coding[0].code');
    result.reasonCodeDisplay = get(statement, 'reasonCode.coding[0].display');
    result.identifier = get(statement, 'identifier[0].value');
    result.effectiveDateTime = moment(get(statement, 'effectiveDateTime')).format("YYYY-MM-DD");
    result.dateAsserted = moment(get(statement, 'dateAsserted')).format("YYYY-MM-DD");
    result.informationSource = get(statement, 'informationSource.display');    
  }

  if(get(statement, "issue[0].details.text")){
    result.operationOutcome = get(statement, "issue[0].details.text");
  }
  
  return result;
}

export function flattenNetwork(organization, internalDateFormat){
    let result = {
      resourceType: 'Network',
      _id: '',
      id: '',
      identifier: '',
      active: false,
      periodStart: '',
      periodEnd: '',
      name: '',
      alias: '',
      address: '',
      primaryContactName: '',
      primaryContactPhone: '',
      primaryContactEmail: ''
    };
    result.resourceType = get(organization, 'resourceType', "Network");
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    if(get(organization, 'organization-period')){
        result.periodStart = moment(get(organization, 'organization-period.start')).format(internalDateFormat);
        result.periodEnd = moment(get(organization, 'organization-period.end')).format(internalDateFormat);    
    }

    result._id = get(organization, '_id');
    result.id = get(organization, 'id');
    result.identifier = get(organization, 'identifier[0].value');
    result.active = get(organization, 'active', false);
    result.name = get(organization, 'name');
    result.alias = get(organization, 'alias');
    result.address = FhirUtilities.stringifyAddress(get(organization, 'address[0]'));

    result.primaryContactName = FhirUtilities.pluckPhone(get(organization, 'contact.name'));
    result.primaryContactPhone = FhirUtilities.pluckPhone(get(organization, 'contact.telecom'));
    result.primaryContactEmail = FhirUtilities.pluckEmail(get(organization, 'contact.telecom'));

    if(Array.isArray(organization.endpoint)){
        result.numEndpoints = organization.endpoint.length;
    }

    return result;
}

export function flattenObservation(observation, dateFormat, numeratorCode, denominatorCode, multiComponentValues, sampledData){
  let result = {
    _id: '',
    meta: '',
    category: '',
    codeValue: '',
    codeDisplay: '',
    valueString: '',
    value: '',
    units: '',
    system: '',
    comparator: '',
    quantityCode: '',
    observationValue: '',
    subject: '',
    subjectReference: '',
    status: '',
    device: '',
    deviceReference: '',
    createdBy: '',
    effectiveDateTime: '',
    issued: '',
    unit: '',
    numerator: '',
    denominator: '',

    sampledPeriod: 0,
    sampledMin: 0,
    sampledMax: 0,
    operationOutcome: ''
  };

  result.resourceType = get(observation, 'resourceType', "Unknown");

  if(!dateFormat){
    dateFormat = get(Meteor, "settings.public.defaults.dateFormat", "YYYY-MM-DD hh a");
  }

  result._id =  get(observation, 'id') ? get(observation, 'id') : get(observation, '_id');

  if(get(observation, 'category[0].text')){
    result.category = get(observation, 'category[0].text', '');
  } else if (get(observation, 'category[0].coding[0].display')){
    result.category = get(observation, 'category[0].coding[0].display', '');
  }

  if(Array.isArray(get(observation, 'code.coding'))){
    observation.code.coding.forEach(function(encoding){
      
      // don't display categorical codes
      if(!["8716-3"].includes(get(encoding, 'code'))){
        result.codeValue = get(encoding, 'code', '');
        if(has(encoding, 'display')){
          result.codeDisplay = get(encoding, 'display', '');
        } else {
          result.codeDisplay = get(observation, 'code.text', '');
        }
      }  
    })
  } else {
    result.codeValue = get(observation, 'code.text', '');
    result.codeDisplay = get(observation, 'code.text', '');
  }   

  
  result.subject = get(observation, 'subject.display', '');
  result.subjectReference = get(observation, 'subject.reference', '');
  result.device = get(observation, 'device.display', '');
  result.deviceReference = get(observation, 'device.reference', '');
  result.status = get(observation, 'status', '');
  
  if(get(observation, 'effectiveDateTime')){
    result.effectiveDateTime =  moment(get(observation, 'effectiveDateTime')).format(dateFormat);
  }
  if(get(observation, 'issued')){
    result.effectiveDateTime =  moment(get(observation, 'issued')).format(dateFormat);    
  }

  result.category = get(observation, 'category.text', '');


  // SINGLE COMPONENT OBSERVATIONS
  result.unit = get(observation, 'code.valueQuantity.unit');
  result.system = get(observation, 'code.valueQuantity.system');
  result.value = get(observation, 'code.valueQuantity.value');
  result.quantityCode = get(observation, 'code.valueQuantity.code');

  // MULTICOMPONENT OBSERVATIONS
  if(Array.isArray(get(observation, 'component'))){
    result.valueString = observation.component.length + ' samplesets / sec';
    result.units = 'components / sec';
    // sometimes observations have multiple components
    // a great example is blood pressure, which includes systolic and diastolic measurements
    observation.component.forEach(function(componentObservation){
      // we grab the numerator and denominator and put in separate fields
      if(get(componentObservation, 'code.coding[0].code') === numeratorCode){
        result.numerator = get(componentObservation, 'valueQuantity.value') + get(componentObservation, 'code.valueQuantity.unit')
      }
      if(get(componentObservation, 'code.coding[0].code') === denominatorCode){
        result.denominator = get(componentObservation, 'valueQuantity.value') + get(componentObservation, 'code.valueQuantity.unit')
      }
    })

    // and if it's multiComponentValue, we string it all together into a nice string to be displayed
    if(multiComponentValues){
      result.unit = get(observation, 'valueQuantity.unit', '');  
      result.valueString = result.numerator + " / " + result.denominator + " " +  result.unit;
    }
    if(sampledData){
      result.units = 'samples/sec';
      result.sampledPeriod = get(observation.component[0], 'valueSampledData.period', 0);
      result.sampledMin = get(observation.component[0], 'valueSampledData.lowerLimit', 0);
      result.sampledMax = get(observation.component[0], 'valueSampledData.upperLimit', 0);
      result.valueString = get(observation, 'valueSampledData.period', 0);

      if(has(observation.component[0], 'valueSampledData.data')){
        let sampledData = get(observation.component[0], 'valueSampledData.data');
        if(sampledData){
          let sampledDataArray = sampledData.split(" ")
          result.sampledChecksum = sampledDataArray.length;  
        }
      }
    }

  } else {
    // most observations arrive in a single component
    // some values are a string, such as Blood Type, or pos/neg
    if(get(observation, 'valueString')){
      result.valueString = get(observation, 'valueString', '');
    } else if(get(observation, 'valueCodeableConcept')){
      result.valueString = get(observation, 'valueCodeableConcept.text', '');
    } else if(get(observation, 'valueSampledData')){      
      result.units = 'samples/sec';
      result.sampledPeriod = get(observation, 'valueSampledData.period', 0);
      result.sampledMin = get(observation, 'valueSampledData.lowerLimit', 0);
      result.sampledMax = get(observation, 'valueSampledData.upperLimit', 0);
      result.valueString = get(observation, 'valueSampledData.period', 0);
    } else {
      // other values are quantities with units
      // we need to place the quantity bits in the appropriate cells
      result.comparator = get(observation, 'valueQuantity.comparator', '');
      result.observationValue = Number.parseFloat(get(observation, 'valueQuantity.value', 0)).toFixed(2);;
      result.unit = get(observation, 'valueQuantity.unit', '');  

      // but we also want to string it together into a nice readable string
      result.valueString = result.comparator + " " + result.observationValue + " " + result.unit;
    }
  }

  if(result.valueString.length > 0){
    result.value = result.valueString;
  } else {
    if(result.comparator){
      result.value = result.comparator + ' ';
    } 
    result.value = result.value + result.observationValue + ' ' + result.unit;
  }

  if(get(observation, "issue[0].details.text")){
    result.operationOutcome = get(observation, "issue[0].details.text");
  }

  return result;
}

export function flattenOperationOutcome(outcome) {
  let result = {
    _id: '',
    id: '',
    resourceType: '',
    identifier: '',
    implicitRules: '',
    language: '',
    text: '',
    issueCount: 0,
    // For the first issue
    issueSeverity: '',
    issueCode: '',
    issueDetails: '',
    issueDiagnostics: '',
    issueLocation: '',
    issueExpression: '',
    // Metadata
    lastUpdated: '',
    versionId: '',
    source: ''
  };

  // Basic resource identification
  result.resourceType = get(outcome, 'resourceType', 'OperationOutcome');
  result.id = get(outcome, 'id', '');
  result._id = get(outcome, '_id', '');
  
  // Basic metadata
  result.implicitRules = get(outcome, 'implicitRules', '');
  result.language = get(outcome, 'language', '');
  
  // Narrative text
  result.text = sanitizeHtml(get(outcome, 'text.div', ''), {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {} // Remove all attributes
  });
    
  // Issue details (taking first issue if multiple exist)
  if (Array.isArray(outcome.issue)) {
    result.issueCount = outcome.issue.length;
    
    // Get details from first issue
    const firstIssue = outcome.issue[0] || {};
    result.issueSeverity = get(firstIssue, 'severity', '');
    result.issueCode = get(firstIssue, 'code', '');
    result.issueDetails = get(firstIssue, 'details.text', '');
    result.issueDiagnostics = get(firstIssue, 'diagnostics', '');
    
    // Handle array of locations
    result.issueLocation = get(firstIssue, 'location[0]', '');
    
    // Handle array of expressions
    result.issueExpression = get(firstIssue, 'expression[0]', '');
  }

  // Meta fields
  if (outcome.meta) {
    result.lastUpdated = moment(get(outcome, 'meta.lastUpdated')).format("YYYY-MM-DD hh:mm a");
    result.versionId = get(outcome, 'meta.versionId', '');
    result.source = get(outcome, 'meta.source', '');
  }

  return result;
}

export function flattenOrganization(organization, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    name: '',
    identifier: '',
    phone: '',
    email: '',
    addressLine: '',
    text: '',
    city: '',
    state: '',
    postalCode: '',
    fullAddress: '',
    operationOutcome: '',
    numEndpoints: 0
  };

  result.resourceType = get(organization, 'resourceType', "Unknown");

  result._id = get(organization, '_id', '');
  result.id = get(organization, 'id', '');
  result.identifier = get(organization, 'identifier[0].value', '');

  result.name = get(organization, 'name', '')

  result.phone = FhirUtilities.pluckPhone(get(organization, 'telecom'));
  result.email = FhirUtilities.pluckEmail(get(organization, 'telecom'));

  result.addressLine = get(organization, 'address[0].line[0]');
  result.city = get(organization, 'address[0].city');
  result.state = get(organization, 'address[0].state');
  result.postalCode = get(organization, 'address[0].postalCode');
  result.country = get(organization, 'address[0].country');

  result.fullAddress = FhirUtilities.stringifyAddress(get(organization, 'address[0]'));

  if(get(organization, "issue[0].details.text")){
    result.operationOutcome = get(organization, "issue[0].details.text");
  }

  if(Array.isArray(organization.endpoint)){
    result.numEndpoints = organization.endpoint.length;
  }

  return result;
}

export function flattenOrganizationAffiliation(organization, internalDateFormat){
    let result = {
      resourceType: 'OrganizationAffiliation',
      _id: '',
      id: '',
      identifier: '',
      active: true,
      periodStart: '',
      periodEnd: '',
      organization: '',
      participatingOrganization: '',
      network: '',
      code: '',
      specialty: '',
      location: '',
      healthcareService: '',
      email: '',
      phone: '',
      numEndpoints: 0      
    };
    result.resourceType = get(organization, 'resourceType', "OrganizationAffiliation");
    result._id = get(organization, '_id');
    result.id = get(organization, 'id');
    result.identifier = FhirUtilities.pluckFirstIdentifier(get(organization, 'identifier'));
    result.active = get(organization, 'active', true);
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    if(get(organization, 'period')){
        result.periodStart = moment(get(organization, 'period.start')).format(internalDateFormat);
        result.periodEnd = moment(get(organization, 'period.end')).format(internalDateFormat);    
    }

    result.organization = FhirUtilities.pluckReference(get(organization, 'organization'));
    result.participatingOrganization = FhirUtilities.pluckReference(get(organization, 'participatingOrganization'));
    result.network = FhirUtilities.pluckReference(get(organization, 'network[0]'));
    result.code = FhirUtilities.pluckCodeableConcept(get(organization, 'code[0]'));
    result.specialty = FhirUtilities.pluckCodeableConcept(get(organization, 'specialty[0]'));

    result.location = FhirUtilities.pluckReference(get(organization, 'location[0]'));
    result.healthcareService = FhirUtilities.pluckReference(get(organization, 'healthcareService[0]'));

    result.phone = FhirUtilities.pluckPhone(get(organization, 'telecom'));
    result.email = FhirUtilities.pluckEmail(get(organization, 'telecom'));

    if(Array.isArray(organization.endpoint)){
      result.numEndpoints = organization.endpoint.length;
    }

    return result;
}

export function flattenPatient(patient, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    active: true,
    gender: get(patient, 'gender'),
    name: get(patient, 'name[0].text', ''),
    mrn: '',
    birthDate: '',
    photo: "/thumbnail-blank.png",
    addressLine: '',
    state: '',
    postalCode: '',
    country: '',
    maritalStatus: '',
    preferredLanguage: '',
    species: '',
    resourceCounts: '',
    deceased: false,
    operationOutcome: ''
  };

  result.resourceType = get(patient, 'resourceType', "Unknown");

  result._id = get(patient, '_id', '');
  result.id = get(patient, 'id', '');
  result.identifier = get(patient, 'identifier[0].value', '');

  result.identifier = get(patient, 'identifier[0].value', '');
  result.active = get(patient, 'active', true).toString();
  
  result.gender = get(patient, 'gender', '');

  // patient name has gone through a number of revisions, and we need to search a few different spots, and assemble as necessary  
  let resultingNameString = "";

    // the majority of systems out there are SQL based and make a design choice to store as 'first' and 'last' name
    // critiques of that approach can be saved for a later time
    // but suffice it to say that we need to assemble the parts

    if(get(patient, 'name[0].prefix[0]')){
      resultingNameString = get(patient, 'name[0].prefix[0]')  + ' ';
    }

    if(get(patient, 'name[0].given[0]')){
      resultingNameString = resultingNameString + get(patient, 'name[0].given[0]')  + ' ';
    }

    if(get(patient, 'name[0].family')){
      // R4 - droped the array of family names; one authoritative family name per patient
      resultingNameString = resultingNameString + get(patient, 'name[0].family')  + ' ';
    } else if (get(patient, 'name[0].family[0]')){
      // DSTU2 and STU3 - allows an array of family names
      resultingNameString = resultingNameString + get(patient, 'name[0].family[0]')  + ' ';
    }
    
    if(get(patient, 'name[0].suffix[0]')){
      resultingNameString = resultingNameString + ' ' + get(patient, 'name[0].suffix[0]');
    }

  // some systems will store the name as it is to be displayed in the name[0].text field
  // if that's present, use it
  if(has(patient, 'name[0].text')){
    resultingNameString = get(patient, 'name[0].text', '');    
  }

  // remove any whitespace from the name
  result.name = resultingNameString.trim();

  // there's an off-by-1 error between momment() and Date() that we want
  // to account for when converting back to a string
  // which is why we run it through moment()
  result.birthDate = moment(get(patient, "birthDate")).format("YYYY-MM-DD")

  result.photo = get(patient, 'photo[0].url', '');

  result.maritalStatus = get(patient, 'maritalStatus.text', '');

  let communicationArray = [];
  if(get(patient, 'communication') && Array.isArray(get(patient, 'communication'))){
    communicationArray = get(patient, 'communication');
    // first, we're going to try to loop through the communications array 
    // and find an authoritatively preferred language
    communicationArray.forEach(function(communication){
      if(get(communication, "preferred")){
        if(get(communication, "text")){
          // using the text field if possible
          result.preferredLanguage = get(communication, "text");
        } else {
          // but resorting to a code name, if needed
          result.preferredLanguage = get(communication, "coding[0].display");
        }
      }
    })
    // if we didn't find any langauge that is marked as preferred 
    if(result.preferredLanguage === ""){
      // then we try the same thing on the first language listed
      if(get(communicationArray[0], "text")){
        result.preferredLanguage = get(communicationArray[0], "text");
      } else if (get(communicationArray[0], "coding[0].display")) {
        result.preferredLanguage = get(communicationArray[0], "coding[0].display")
      }
    }
  }


  // is the patient dead?  :(
  result.deceased = get(patient, 'deceasedBoolean', '');

  // DSTU2 & STU3 
  result.species = get(patient, 'animal.species.text', '');


  // address
  result.addressLine = get(patient, 'address[0].line[0]')
  result.state = get(patient, 'address[0].state')
  result.postalCode = get(patient, 'address[0].postalCode')
  result.country = get(patient, 'address[0].country')

  if(get(patient, "issue[0].details.text")){
    result.operationOutcome = get(patient, "issue[0].details.text");
  }

  
  return result;
}

export function flattenPlanDefinition(plan) {
  let result = {
    _id: '',
    id: '',
    resourceType: '',
    url: '',
    identifier: '',
    version: '',
    name: '',
    title: '',
    subtitle: '',
    type: '',
    status: '',
    experimental: false,
    subjectCodeableConcept: '',
    subjectReference: '',
    date: '',
    publisher: '',
    description: '',
    purpose: '',
    usage: '',
    jurisdiction: '',
    topic: '',
    author: '',
    editor: '',
    reviewer: '',
    endorser: '',
    relatedArtifact: '',
    library: '',
    goalCount: 0,
    actionCount: 0,
    // First goal details
    goalDescription: '',
    goalPriority: '',
    goalStart: '',
    goalTarget: '',
    // First action details
    actionTitle: '',
    actionDescription: '',
    actionCode: '',
    actionTiming: '',
    actionParticipant: '',
    actionType: '',
    // Metadata
    lastUpdated: '',
    versionId: '',
    source: ''
  };

  // Basic resource identification
  result.resourceType = get(plan, 'resourceType', 'PlanDefinition');
  result.id = get(plan, 'id', '');
  result._id = get(plan, '_id', '');
  
  // Core fields
  result.url = get(plan, 'url', '');
  result.identifier = get(plan, 'identifier[0].value', '');
  result.version = get(plan, 'version', '');
  result.name = get(plan, 'name', '');
  result.title = get(plan, 'title', '');
  result.subtitle = get(plan, 'subtitle', '');
  result.type = get(plan, 'type.coding[0].display', '');
  result.status = get(plan, 'status', '');
  result.experimental = get(plan, 'experimental', false);
  
  // Subject
  result.subjectCodeableConcept = get(plan, 'subject.CodeableConcept.coding[0].display', '');
  result.subjectReference = get(plan, 'subject.reference', '');
  
  // Dates and publishing info
  result.date = moment(get(plan, 'date')).format("YYYY-MM-DD hh:mm a");
  result.publisher = get(plan, 'publisher', '');
  
  // Documentation
  result.description = get(plan, 'description', '');
  result.purpose = get(plan, 'purpose', '');
  result.usage = get(plan, 'usage', '');
  
  // Context
  result.jurisdiction = get(plan, 'jurisdiction[0].coding[0].display', '');
  result.topic = get(plan, 'topic[0].coding[0].display', '');
  
  // Contributors
  result.author = get(plan, 'author[0].name', '');
  result.editor = get(plan, 'editor[0].name', '');
  result.reviewer = get(plan, 'reviewer[0].name', '');
  result.endorser = get(plan, 'endorser[0].name', '');
  
  // Related content
  result.relatedArtifact = get(plan, 'relatedArtifact[0].display', '');
  result.library = get(plan, 'library[0]', '');
  
  // Goals
  if (Array.isArray(plan.goal)) {
    result.goalCount = plan.goal.length;
    const firstGoal = plan.goal[0] || {};
    result.goalDescription = get(firstGoal, 'description.text', '');
    result.goalPriority = get(firstGoal, 'priority.coding[0].code', '');
    result.goalStart = get(firstGoal, 'start.coding[0].display', '');
    result.goalTarget = get(firstGoal, 'target[0].detail.text', '');
  }
  
  // Actions
  if (Array.isArray(plan.action)) {
    result.actionCount = plan.action.length;
    const firstAction = plan.action[0] || {};
    result.actionTitle = get(firstAction, 'title', '');
    result.actionDescription = get(firstAction, 'description', '');
    result.actionCode = get(firstAction, 'code[0].coding[0].code', '');
    result.actionTiming = get(firstAction, 'timing.timing.code.coding[0].display', '');
    result.actionParticipant = get(firstAction, 'participant[0].type', '');
    result.actionType = get(firstAction, 'type.coding[0].display', '');
  }
  
  // Meta fields
  if (plan.meta) {
    result.lastUpdated = moment(get(plan, 'meta.lastUpdated')).format("YYYY-MM-DD hh:mm a");
    result.versionId = get(plan, 'meta.versionId', '');
    result.source = get(plan, 'meta.source', '');
  }

  return result;
}

export function flattenPractitioner(practitioner, fhirVersion){

  let result = {
    _id: '',
    id: '',
    name: '',
    phone: '',
    email: '',
    identifier: '',
    qualification: '',
    qualificationIssuer: '',
    qualificationIdentifier: '',
    qualificationCode: '',
    qualificationStart: null,
    qualificationEnd: null,
    text: '',
    line: '',
    city: '',
    state: '',
    addressString: '',
    postalCode: '',
    fullName: '',
    operationOutcome: '',
    specialtyCode: ''
  };

  result.resourceType = get(practitioner, 'resourceType', "Unknown");

  result._id = get(practitioner, '_id', '');
  result.id = get(practitioner, 'id', '');

  result.identifier = FhirUtilities.pluckFirstIdentifier(get(practitioner, 'identifier'));

  //---------------------------------------------------------
    // TODO REFACTOR:  HumanName
    // parse name!
    // totally want to extract this

    // STU3 and R4
    if(Array.isArray(practitioner.name)){
      if(get(practitioner, 'name[0].text')){
        result.name = get(practitioner, 'name[0].text');
      } else {
        if(get(practitioner, 'name[0].suffix[0]')){
          result.name = get(practitioner, 'name[0].suffix[0]')  + ' ';
        }
    
        result.name = result.name + get(practitioner, 'name[0].given[0]') + ' ';
        
        if(get(practitioner, 'name[0].family[0]')){
          result.name = result.name + get(practitioner, 'name[0].family[0]');
        } else {
          result.name = result.name + get(practitioner, 'name[0].family');
        }
        
        if(get(practitioner, 'name[0].suffix[0]')){
          result.name = result.name + ' ' + get(practitioner, 'name[0].suffix[0]');
        }
      } 
    } else {
      // DSTU2
      if(get(practitioner, 'name.text')){
        result.name = get(practitioner, 'name.text');
      } else {
        if(get(practitioner, 'name.suffix[0]')){
          result.name = get(practitioner, 'name.suffix[0]')  + ' ';
        }
    
        result.name = result.name + get(practitioner, 'name.given[0]') + ' ';
        
        if(get(practitioner, 'name.family[0]')){
          result.name = result.name + get(practitioner, 'name.family[0]');
        } else {
          result.name = result.name + get(practitioner, 'name.family');
        }
        
        if(get(practitioner, 'name.suffix[0]')){
          result.name = result.name + ' ' + get(practitioner, 'name.suffix[0]');
        }
      } 
    }
  
  //---------------------------------------------------------

  if(has(practitioner, 'qualification[0]')){
    result.qualificationId = get(practitioner, 'qualification[0].identifier[0].value');
    result.qualification = FhirUtilities.pluckCodeableConcept(get(practitioner, 'qualification[0].code'));
    result.qualificationCode = get(practitioner, 'qualification[0].code.coding[0].code');
    result.qualificationStart = moment(get(practitioner, 'qualification[0].period.start')).format("MMM YYYY");
    result.qualificationEnd = moment(get(practitioner, 'qualification[0].period.end')).format("MMM YYYY");
    result.issuer = get(practitioner, 'qualification[0].issuer.display');  
  }

  result.phone = FhirUtilities.pluckPhone(get(practitioner, 'telecom'));
  result.email = FhirUtilities.pluckEmail(get(practitioner, 'telecom'));

  result.text = get(practitioner, 'address[0].text', '')
  result.line = get(practitioner, 'address[0].line[0]', '')
  result.city = get(practitioner, 'address[0].city', '')
  result.state = get(practitioner, 'address[0].state', '')
  result.postalCode = get(practitioner, 'address[0].postalCode', '')
  result.addressString = FhirUtilities.stringifyAddress(get(practitioner, 'address[0]'));

  if(has(practitioner, 'name[0]')){
    result.fullName = FhirUtilities.assembleName(get(practitioner, 'name[0]'))
  }

  if(get(practitioner, "issue[0].details.text")){
    result.operationOutcome = get(practitioner, "issue[0].details.text");
  }
  
  if(Array.isArray(get(practitioner, 'identifier'))){
    practitioner.identifier.forEach(function(ident){
      if(get(ident, 'type.text') === "Healthcare Provider Taxonomy Code"){
        result.specialtyCode = get(ident, 'value')
      }
    })
  }
  if(get(practitioner, "issue[0].details.text")){
    result.operationOutcome = get(practitioner, "issue[0].details.text");
  }

  return result;
}

export function flattenPractitionerRole(role, internalDateFormat){
    let result = {
      resourceType: 'PractitionerRole',
      _id: '',
      id: '',
      status: '',
      active: true,
      identifier: '',
      periodStart: '',
      periodEnd: '',
      practitioner: '',
      organization: '',
      location: '',
      healthcareService: '',
      code: '',
      specialty: '',
      numEndpoints: 0
    };
    result.resourceType = get(role, 'resourceType', "PractitionerRole");
    result._id = get(role, '_id');
    result.id = get(role, 'id');


    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    if(get(role, 'period')){
        result.periodStart = moment(get(role, 'period.start')).format(internalDateFormat);
        result.periodEnd = moment(get(role, 'period.end')).format(internalDateFormat);    
    }
    
    result.active = get(role, 'active', false);
    result.status = get(role, 'status', '');
    result.identifier = FhirUtilities.pluckFirstIdentifier(get(role, 'identifier'));

    result.practitioner = FhirUtilities.pluckReference(get(role, 'practitioner'));
    result.organization = FhirUtilities.pluckReference(get(role, 'organization'));
    result.location = FhirUtilities.pluckReference(get(role, 'location[0]'));
    result.healthcareService = FhirUtilities.pluckReference(get(role, 'healthcareService[0]'));

    result.code = FhirUtilities.pluckCodeableConcept(get(role, 'code[0]'));
    result.specialty = FhirUtilities.pluckCodeableConcept(get(role, 'specialty[0]'));

    result.phone = FhirUtilities.pluckPhone(get(role, 'telecom'));
    result.email = FhirUtilities.pluckEmail(get(role, 'telecom'));
  
    if(Array.isArray(role.endpoint)){
        result.numEndpoints = role.endpoint.length;
    }
    return result;
}

export function flattenProcedure(procedure, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    identifier: '',
    status: '',
    categoryDisplay: '',
    code: '',
    codeDisplay: '',
    subject: '',
    subjectReference: '',
    performerDisplay: '',
    performedStart: '',
    performedEnd: '',
    notesCount: '',
    bodySiteDisplay: '',
    operationOutcome: ''
  };

  result.resourceType = get(procedure, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id = get(procedure, '_id');
  result.id = get(procedure, 'id', '');
  
  result.status = get(procedure, 'status', '');
  result.categoryDisplay = get(procedure, 'category.coding[0].display', '');
  result.identifier = get(procedure, 'identifier[0].value');
  result.code = get(procedure, 'code.coding[0].code');
  result.codeDisplay = get(procedure, 'code.coding[0].display');
  result.categoryDisplay = get(procedure, 'category.coding[0].display')    

  if(get(procedure, 'subject')){
    result.subject = get(procedure, 'subject.display', '');
    result.subjectReference = get(procedure, 'subject.reference', '');
  } else if(get(procedure, 'patient')){
    result.subject = get(procedure, 'patient.display', '');
    result.subjectReference = get(procedure, 'patient.reference', '');
  }

  result.performedStart = moment(get(procedure, 'performedDateTime')).format(internalDateFormat);      
  result.performerDisplay = get(procedure, 'performer.display');
  result.performerReference = get(procedure, 'performer.reference');
  result.bodySiteDisplay = get(procedure, 'bodySite.display');

  if(get(procedure, 'performedPeriod')){
    result.performedStart = moment(get(procedure, 'performedPeriod.start')).format(internalDateFormat);      
    result.performedEnd = moment(get(procedure, 'performedPeriod.end')).format(internalDateFormat);      
  }

  let notes = get(procedure, 'notes')
  if(notes && notes.length > 0){
    result.notesCount = notes.length;
  } else {
    result.notesCount = 0;
  }

  if(get(procedure, "issue[0].details.text")){
    result.operationOutcome = get(procedure, "issue[0].details.text");
  }

  return result;
}

export function flattenProvenance(provenance, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    targetDisplay: '',
    targetType: '',
    targetReference: '',
    occurredDateTime: '',
    occurredPeriodEnd: '',
    recorded: '',
    policy: '',
    locationReference: '',
    locationDisplay: '',
    reason: '',
    activity: '',
    numAgents: 0,
    numEntitites: 0,
    signature: ""
  };

  result.resourceType = get(provenance, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = "YYYY-MM-DD";
  }

  result._id = get(provenance, '_id');
  result.id = get(provenance, 'id', '');

  result.targetReference = get(provenance, 'target[0].reference', '');
  result.targetType = get(provenance, 'target[0].type', '');
  result.targetDisplay = get(provenance, 'target[0].display', '');
  
  result.occurredDateTime = moment(get(provenance, 'occurredDateTime', '')).format(internalDateFormat);

  if(get(provenance, 'occurredPeriod.start')){
    result.occurredDateTime = moment(get(provenance, 'occurredPeriod.start', '')).format(internalDateFormat);
  }
  if(get(provenance, 'occurredPeriod.end')){
    result.occurredPeriodEnd = moment(get(provenance, 'occurredPeriod.end', '')).format(internalDateFormat);    
  }

  result.recorded = moment(get(provenance, 'recorded', '')).format(internalDateFormat);

  result.policy = get(provenance, 'policy[0]', '');

  result.locationReference = get(provenance, 'location[0].reference', '');
  result.locationDisplay = get(provenance, 'location[0].display', '');

  if(Array.isArray(get(provenance, 'agent'))){
    result.numAgents = provenance.agent.length;
  }
  if(Array.isArray(get(provenance, 'entity'))){
    result.numEntitites = provenance.entity.length;
  }

  result.signature = get(provenance, 'signature[0].data', '');

  return result;
}

export function flattenQuestionnaire(questionnaire){
  let result = {
    _id: get(questionnaire, '_id'),
    id: get(questionnaire, 'id'),
    identifier: '',
    title: '',
    state: '',
    date: '',
    numItems: 0,
    operationOutcome: ''
  };

  result.resourceType = get(questionnaire, 'resourceType', "Unknown");

  result.id = get(questionnaire, 'id', '');

  result.date = moment(questionnaire.date).add(1, 'days').format("YYYY-MM-DD")
  result.title = get(questionnaire, 'title', '');
  result.status = get(questionnaire, 'status', '');
  result.identifier = get(questionnaire, 'identifier[0].value', '');

  if(Array.isArray(questionnaire.item)){
    result.numItems = questionnaire.item.length;
  }  
  
  if(get(questionnaire, "issue[0].details.text")){
    result.operationOutcome = get(questionnaire, "issue[0].details.text");
  }
  
  return result;
}

export function flattenQuestionnaireResponse(questionnaireResponse){
  let result = {
    _id: get(questionnaireResponse, '_id'),
    id: get(questionnaireResponse, 'id'),
    title: '',
    identifier: '',
    questionnaire: '',
    status: '',
    subjectDisplay: '',
    subjectReference: '',
    sourceDisplay: '',
    sourceReference: '',
    encounter: '',
    author: '',
    date: '',
    count: 0,
    numItems: 0,
    authored: '',
    operationOutcome: ''
  };

  result.resourceType = get(questionnaireResponse, 'resourceType', "Unknown");

  // there's an off-by-1 error between momment() and Date() that we want
  // to account for when converting back to a string
  result.date = moment(questionnaireResponse.authored).add(1, 'days').format("YYYY-MM-DD HH:mm")
  result.questionnaire = get(questionnaireResponse, 'questionnaire', '');
  result.encounter = get(questionnaireResponse, 'encounter.reference', '');
  result.subjectDisplay = get(questionnaireResponse, 'subject.display', '');
  result.subjectReference = get(questionnaireResponse, 'subject.reference', '');
  result.sourceDisplay = get(questionnaireResponse, 'source.display', '');
  result.sourceReference = get(questionnaireResponse, 'source.reference', '');
  result.author = get(questionnaireResponse, 'author.display', '');
  result.identifier = get(questionnaireResponse, 'identifier[0].value', '');
  result.status = get(questionnaireResponse, 'status', '');
  result.id = get(questionnaireResponse, 'id', '');
  result.identifier = get(questionnaireResponse, 'identifier[0].value', '');

  if(has(questionnaireResponse), 'authored'){
    result.authored = moment(get(questionnaireResponse, 'authored')).format("YYYY-MM-DD HH:mm");
  }

  if(Array.isArray(questionnaireResponse.item)){
    result.count = result.numItems = questionnaireResponse.item.length;
  }

  if(get(questionnaireResponse, "issue[0].details.text")){
    result.operationOutcome = get(questionnaireResponse, "issue[0].details.text");
  }
  
  return result;
}

export function flattenResearchStudy(study) {
  let result = {
    _id: '',
    id: '',
    identifier: '',
    title: '',
    status: '',
    phase: '',
    category: '',
    focus: '',
    condition: '',
    protocol: '',
    partOf: '',
    primaryPurposeType: '',
    enrollmentCount: 0,
    periodStart: '',
    periodEnd: '',
    sponsor: '',
    principalInvestigator: '',
    site: '',
    description: '',
    keyword: '',
    region: '',
    note: '',
    armCount: 0,
    objectiveCount: 0,
    contactCount: 0,
    operationOutcome: ''
  };

  result.resourceType = get(study, 'resourceType', 'Unknown');

  // Basic identifiers
  result._id = get(study, '_id', '');
  result.id = get(study, 'id', '');
  result.identifier = get(study, 'identifier[0].value', '');
  result.title = get(study, 'title', '');
  
  // Classification and status
  result.status = get(study, 'status', '');
  result.phase = get(study, 'phase.coding[0].display', '');
  result.category = get(study, 'category[0].coding[0].display', '');
  result.focus = get(study, 'focus[0].coding[0].display', '');
  result.condition = get(study, 'condition[0].coding[0].display', '');
  
  // References
  result.protocol = get(study, 'protocol[0].reference', '');
  result.partOf = get(study, 'partOf.reference', '');
  
  // Purpose and type
  result.primaryPurposeType = get(study, 'primaryPurposeType.coding[0].display', '');
  
  // Enrollment
  if (Array.isArray(study.enrollment)) {
    result.enrollmentCount = study.enrollment.length;
  }
  
  // Period
  result.periodStart = moment(get(study, 'period.start')).format('YYYY-MM-DD hh:mm a');
  result.periodEnd = moment(get(study, 'period.end')).format('YYYY-MM-DD hh:mm a');
  
  // Parties involved
  result.sponsor = get(study, 'sponsor.display', '');
  result.principalInvestigator = get(study, 'principalInvestigator.display', '');
  result.site = get(study, 'site[0].display', '');
  
  // Description and keywords
  result.description = get(study, 'description', '');
  result.keyword = get(study, 'keyword[0].coding[0].display', '');
  result.region = get(study, 'region[0].coding[0].display', '');
  
  // Notes
  result.note = get(study, 'note[0].text', '');
  
  // Counts for arrays
  if (Array.isArray(study.arm)) {
    result.armCount = study.arm.length;
  }
  
  if (Array.isArray(study.objective)) {
    result.objectiveCount = study.objective.length;
  }
  
  if (Array.isArray(study.contact)) {
    result.contactCount = study.contact.length;
  }
  
  // Operation outcome
  if (get(study, 'issue[0].details.text')) {
    result.operationOutcome = get(study, 'issue[0].details.text');
  }
  
  return result;
}

export function flattenResearchSubject(researchSubject, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    resourceType: '',
    status: '',
    study: '',
    studyTitle: '',
    patientReference: '',
    patientDisplay: '',
    consent: '',
    actualArm: '',
    assignedArm: '',
    period: '',
    startDate: '',
    endDate: ''
  };

  result.resourceType = get(researchSubject, 'resourceType', 'ResearchSubject');
  result._id = get(researchSubject, '_id', '');
  result.id = get(researchSubject, 'id', '');

  // Status of the subject's participation
  result.status = get(researchSubject, 'status', '');

  // Study details
  if (get(researchSubject, 'study.display')) {
    result.study = get(researchSubject, 'study.display', '');
  } else if (get(researchSubject, 'study.reference')) {
    result.study = get(researchSubject, 'study.reference', '');
  }

  // Patient details
  if (get(researchSubject, 'subject.display')) {
    result.patientDisplay = get(researchSubject, 'subject.display', '');
    result.patientReference = get(researchSubject, 'subject.reference', '');
  } else if (get(researchSubject, 'subject.reference')) {
    result.patientReference = get(researchSubject, 'subject.reference', '');
  } else if (get(researchSubject, 'individual.display')) {
    result.patientDisplay = get(researchSubject, 'individual.display', '');
    result.patientReference = get(researchSubject, 'individual.reference', '');
  } else if (get(researchSubject, 'individual.reference')) {
    result.patientReference = get(researchSubject, 'individual.reference', '');
  }

  // Consent status
  result.consent = get(researchSubject, 'consent.display', '');

  // Arm details
  result.actualArm = get(researchSubject, 'actualArm', '');
  result.assignedArm = get(researchSubject, 'assignedArm', '');

  // Period of participation
  if (get(researchSubject, 'period.start')) {
    result.startDate = moment(get(researchSubject, 'period.start')).format("YYYY-MM-DD");
  }

  if (get(researchSubject, 'period.end')) {
    result.endDate = moment(get(researchSubject, 'period.end')).format("YYYY-MM-DD");
  }

  return result;
}

export function flattenRestriction(restriction, internalDateFormat){
    let result = {
        resourceType: 'Restriction',
        _id: document._id,
        id: get(document, 'id', ''),
        dateTime: moment(get(document, 'dateTime', null)).format("YYYY-MM-DD hh:mm:ss"),
        status: get(document, 'status', ''),
        scope: get(document, 'scope.coding[0].display'),
        category: '',        
        policyUri: get(document, 'policy[0].uri', ''),
        provisionType: get(document, 'provision.type', ''),
        provisionActor: get(document, 'provision.actor[0].reference.display', '')
    };

    if(has(document, 'category[0].text')){
        result.category = get(document, 'category[0].text')
    } else {
        result.category = get(document, 'category[0].coding[0].display', '')
    }
    
    return result;
}

export function flattenRiskAssessment(document){
  let result = {
    _id: get(document, '_id', ''),
    id: get(document, 'id', ''),
    occurrenceDateTime: moment(get(document, 'occurrenceDateTime', null)).format("YYYY-MM-DD hh:mm"),
    identifier: get(document, 'identifier[0].value', ''),
    performer: get(document, 'performer.display', ''),
    performerReference: get(document, 'performer.reference', ''),
    status: get(document, 'status', ''),
    subjectReference: get(document, 'subject.reference', ''),
    subjectName: get(document, 'subject.display', ''),
    outcomeText: get(document, 'prediction[0].outcome.text', ''),
    probabilityDecimal: get(document, 'prediction[0].probabilityDecimal', ''),
    text: get(document, 'text.div', ''),
  };

  return result;
}

export function flattenServiceRequest(document){
  let result = {
    _id: get(document, '_id', ''),
    id: get(document, 'id', ''),
    identifier: get(document, 'identifier[0].value', ''),
    authoredOn: moment(get(document, 'authoredOn', null)).format("YYYY-MM-DD"),
    status: get(document, 'status', ''),
    intent: get(document, 'intent', ''),
    subjectReference: get(document, 'subject.reference', ''),
    subjectName: get(document, 'subject.display', ''),
    performer: get(document, 'performer[0].display', ''),
    performerReference: get(document, 'performer[0].reference', ''),
    orderDetail: get(document, 'orderDetail[0].text', ''),
    requestor: get(document, 'requestor[0].display', ''),
    requestorReference: get(document, 'requestor[0].reference', ''),
    locationReference: get(document, 'locationReference[0].name', ''),
    text: get(document, 'text.div', ''),
  };

  return result;
}

export function flattenSearchParameter(parameters, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    url: '',
    version: '',
    name: '',
    status: '',
    experimental: '',
    date: '',
    publisher: '',
    description: '',
    useContext: '',
    jurisdiction: '',
    code: '',
    base: '',
    type: '',
    expression: '',
    xpath: '',
    xpathUsage: '',
    target: '',
    multipleOr: '',
    multipleAnd: '',
    comparator: '',
    modifier: '',
    chain: ''
  };

  result.resourceType = get(parameters, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(parameters, 'id') ? get(parameters, 'id') : get(parameters, '_id');
  result.id = get(parameters, 'id', '');

  result.url = get(parameters, 'url', '');
  result.version = get(parameters, 'version', '');
  result.name = get(parameters, 'name', '');
  result.status = get(parameters, 'status', '');
  result.experimental = get(parameters, 'experimental', false);
  result.date = moment(get(parameters, 'date', '')).format("YYYY-MM-DD");
  result.publisher = get(parameters, 'publisher', '');

  result.contact = get(parameters, 'contact[0].name', '');
  result.description = get(parameters, 'description', '');
  result.purpose = get(parameters, 'purpose', '');

  result.code = get(parameters, 'code', '');
  result.base = get(parameters, 'base.0', '');
  result.type = get(parameters, 'type', '');
  result.expression = get(parameters, 'expression', '');
  result.xpath = get(parameters, 'xpath', '');
  result.xpathUsage = get(parameters, 'xpathUsage', '');
  result.target = get(parameters, 'target', '');
  result.multipleOr = get(parameters, 'multipleOr', false);
  result.multipleAnd = get(parameters, 'multipleAnd', false);
  result.comparator = get(parameters, 'comparator', '');
  result.modifier = get(parameters, 'modifier', '');
  result.chain = get(parameters, 'chain', '');

  return result;
}

export function flattenStructureDefinition(definition, internalDateFormat){
  let result = {
    _id: '',
    id: '',
    meta: '',
    url: '',
    version: '',
    name: '',
    status: '',
    experimental: '',
    date: '',
    publisher: '',
    contact: '',
    description: '',
    jurisdiction: '',
    purpose: '',
    copyright: '',
    fhirVersion: '',
    kind: '',
    abstract: '',
    type: '',
    derivation: ''
  };

  result.resourceType = get(definition, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(definition, 'id') ? get(definition, 'id') : get(definition, '_id');
  result.id = get(definition, 'id', '');

  result.url = get(definition, 'url', '');
  result.version = get(definition, 'version', '');
  result.name = get(definition, 'name', '');
  result.status = get(definition, 'status', '');
  result.experimental = get(definition, 'experimental', false);
  result.date = moment(get(definition, 'date', '')).format("YYYY-MM-DD");
  result.publisher = get(definition, 'publisher', '');

  result.contact = get(definition, 'contact[0].name', '');
  result.description = get(definition, 'description', '');
  result.purpose = get(definition, 'purpose', '');
  result.copyright = get(definition, 'copyright', '');
  result.fhirVersion = get(definition, 'fhirVersion', '');
  result.kind = get(definition, 'kind', '');
  result.abstract = get(definition, 'abstract', false);
  result.type = get(definition, 'type', '');
  result.derivation = get(definition, 'derivation', '');

  return result;
}

export function flattenSubscription(document){
  let result = {
    _id: get(document, '_id', ''),
    id: get(document, 'id', ''),
    status: get(document, 'status', ''),
    contact: get(document, 'contact[0].value', ''),
    end: "",
    reason: get(document, 'reason', ''),
    critera: get(document, 'critera', ''),
    error: get(document, 'error', ''),
    channelType: get(document, 'channel.type', ''),
    channelEndpoint: get(document, 'channel.endpoint', '')
  };

  if(get(document, 'end')){
    result.end = moment(get(document, 'end', '')).format("YYYY-MM-DD hh:mm");
  } else {
    result.end ="No end date specified."
  }

  return result;
}

export function flattenTask(task, internalDateFormat){
  let result = {
    _id: '',
    meta: '',
    identifier: '',
    publisher: '',
    status: '',
    title: '',
    authoredOn: '',
    lastModified: '',
    focus: '',
    for: '',
    intent: '',
    priority: '',
    code: '',
    requester: '',
    requesterReference: '',
    encounter: '',
    encounterReference: '',
    owner: '',
    ownerReference: '',
    operationOutcome: ''
  };

  result.resourceType = get(task, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(task, 'id') ? get(task, 'id') : get(task, '_id');
  result.id = get(task, 'id', '');
  result.identifier = get(task, 'identifier[0].value', '');

  if(get(task, 'authoredOn')){
    result.authoredOn = moment(get(task, 'authoredOn', '')).format(internalDateFormat);
  }
  if(get(task, 'lastModified')){
    result.lastModified = moment(get(task, 'lastModified', '')).format(internalDateFormat);
  }

  result.description = get(task, 'description', '');
  result.status = get(task, 'status', '');
  result.businessStatus = get(task, 'businessStatus.coding[0].display', '');
  result.intent = get(task, 'intent', '');
  result.priority = get(task, 'priority', '');
  result.focus = get(task, 'focus.display', '');
  result.for = get(task, 'for.display', '');
  result.requester = get(task, 'requester.display', '');
  result.code = get(task, 'code.text', '');

  result.requester = get(task, 'requester.display', '');
  result.requesterReference = get(task, 'requester.reference', '');
  result.encounter = get(task, 'encounter.display', '');
  result.encounterReference = get(task, 'encounter.reference', '');
  result.owner = get(task, 'owner.display', '');
  result.ownerReference = get(task, 'owner.reference', '');

  if(get(task, "issue[0].details.text")){
    result.operationOutcome = get(task, "issue[0].details.text");
  }

  return result;
}

export function flattenValueSet(valueSet, internalDateFormat){
  let result = {
    _id: '',
    meta: '',
    identifier: '',
    title: '',
    operationOutcome: ''
  };

  result.resourceType = get(valueSet, 'resourceType', "Unknown");

  if(!internalDateFormat){
    internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
  }

  result._id =  get(valueSet, 'id') ? get(valueSet, 'id') : get(valueSet, '_id');
  result.id = get(valueSet, 'id', '');
  result.identifier = get(valueSet, 'identifier[0].value', '');
  result.title = get(valueSet, 'title', '');

  if(get(valueSet, "issue[0].details.text")){
    result.operationOutcome = get(valueSet, "issue[0].details.text");
  }

  return result;
}

export function flattenVerificationResult(example, internalDateFormat){
    let result = {
      resourceType: 'VerificationResult',
      _id: '',
      id: '',
      target: '',
      need: '',
      status: '',
      statusDate: '',
      validationType: '',
      validationProcess: '',
      lastPerformed: '',
      nextScheduled: '',

      primarySourceWho: '',
      primarySourceType: '',
      primarySourceCommunicationMethod: '',
      primarySourceValidationStatus: '',
      primarySourceValidationDate: '',

      attestationWho: '',
      attestationOnBehalfOf: '',
      attestationCommunicationMethod: '',
      attestationDate: '',

      attestationSourceCert: '',
      attestationProxyCert: '',
      attestationSourceSignature: '',
      attestationProxySignature: '',

      validatorOrgDisplay: '',
      validatorIdentityCert: '',
      validatorAttestationSignature: ''
    };

    result.resourceType = get(example, 'resourceType', "VerificationResult");
    result._id = get(example, '_id');
    result.id = get(example, 'id');
  
    if(!internalDateFormat){
        internalDateFormat = get(Meteor, "settings.public.defaults.internalDateFormat", "YYYY-MM-DD");
    }
    result.statusDate = moment(get(example, 'statusDate')).format(internalDateFormat);
    result.lastPerformed = moment(get(example, 'lastPerformed')).format(internalDateFormat);
    result.nextScheduled = moment(get(example, 'nextScheduled')).format(internalDateFormat);
    
    result.target = get(example, 'target.display');
    result.targetLocation = get(example, 'targetLocation[0]');
    result.need = get(example, 'need.text');
    result.status = get(example, 'status');

    result.validationType = get(example, 'validationType.text');
    result.validationProcess = get(example, 'validationProcess[0].text');

    result.primarySource = get(example, 'primarySource[0].who.display');
    result.primarySourceType = get(example, 'primarySource[0].type[0].text');
    result.primarySourceCommunicationMethod = get(example, 'primarySource[0].communicationMethod[0].text');
    result.primarySourceValidationStatus = get(example, 'primarySource[0].validationStatus[0].text');
    result.primarySourceValidationDate = get(example, 'primarySource[0].validationDate');

    result.attestationWho = get(example, 'attestation[0].who.display');
    result.attestationOnBehalfOf = get(example, 'attestation[0].onBehalfOf.display');
    result.attestationCommunicationMethod = get(example, 'attestation[0].communicationMethod.text');
    result.attestationDate = get(example, 'attestation[0].date');

    result.attestationSourceCert = get(example, 'attestation[0].sourceIdentityCertificate');
    result.attestationProxyCert = get(example, 'attestation[0].proxyIdentityCertificate');
    result.attestationSourceSignature = get(example, 'attestation[0].sourceSignature');
    result.attestationProxySignature = get(example, 'attestation[0].proxySignature');

    result.validatorOrgDisplay = get(example, 'validator[0].organization.display');
    result.validatorIdentityCert = get(example, 'validator[0].identityCertificate');
    result.validatorAttestationSignature = get(example, 'validator[0].attestationSignature.data');

    return result;
}



export function flatten(collectionName, resource){
  
  let notImplementedMessage = {text: "Not implemented  ."};
  switch (collectionName) {    
    case "AllergyIntollerances":
      return flattenAllergyIntolerance(resource);
    case "AuditEvents":
      return flattenAuditEvent(resource);
    case "Bundles":
      return flattenBundle(resource);
    case "CarePlans":
      return flattenCarePlan(resource);
    case "CareTeams":
      return flattenCareTeam(resource);
    case "CodeSystems":
      return flattenCodeSystem(resource);
    case "Conditions":
      return flattenCondition(resource);
    case "Consents":
      return flattenConsent(resource);
    case "Claims":
      return notImplementedMessage;
    case "ClinicalDocuments":
      return notImplementedMessage;
    case "Communications":
      return flattenCommunication(resource);
    case "CommunicationResponses":
      return flattenCommunicationResponse(resource);
    case "CommunicationRequests":
      return flattenCommunicationRequest(resource);
    case "Contracts":
      return notImplementedMessage;
    case "ClinicalImpressionss":
      return notImplementedMessage;
    case "Communications":
      return flattenCommunication(resource)
    case "Devices":
      return flattenDevice(resource);
    case "DiagnosticReports":
      return flattenDiagnosticReport(resource);
    case "DocumentReference":
      return flattenDocumentReference(resource);
    case "Encounters":
      return flattenEncounter(resource);
    case "Goals":
      return notImplementedMessage;          
    case "Immunizations":
      return flattenImmunization(resource);          
    case "ImagingStudies":
      return notImplementedMessage;     
    case "Lists":
      return flattenList(resource);   
    case "Locations":
      return flattenLocation(resource);
    case "HospitalLocations":
      return flattenLocation(resource);
    case "Measures":
      return flattenMeasure(resource);
    case "MeasureReports":
      return flattenMeasureReport(resource);
    case "Medications":
      return flattenMedication(resource);    
    case "MedicationOrders":
      return flattenMedicationOrder(resource);
    case "MedicationStatements":
      return flattenMedicationStatement(resource);
    case "MedicationRequests":
      return flattenMedicationRequest(resource);
    case "MedicationAdministrations":
      return flattenMedicationAdministration(resource);     
    case "Observations":
      return flattenObservation(resource);
    case "Organizations":
      return flattenOrganization(resource);
    case "Patients":
      return flattenPatient(resource);
    case "Persons":
      return notImplementedMessage;        
    case "Practitioners":
      return flattenPractitioner(resource);
    case "Procedures":
      return flattenProcedure(resource);
    case "Provenances":
      return flattenProvenance(resource);
    case "Questionnaires":
      return flattenQuestionnaire(resource);     
    case "QuestionnaireResponses":
      return flattenQuestionnaireResponse(resource);     
    case "RiskAssessments":
      return flattenRiskAssessment(resource);     
    case "Sequences":
      return notImplementedMessage;     
    case "SearchParameters":
      return flattenSearchParameter(resource);           
    case "ServiceRequest":
      return flattenServiceRequest(resource);           
    case "StructureDefinitions":
      return flattenStructureDefinition(resource);  
    case "Subscriptions":
      return flattenSubscription(resource);        
    case "Tasks":
      return flattenTask(resource);
    case "ValueSets":
      return flattenValueSet(resource);
    default:
      break;
  }
}

export function lookupReference(referenceString){
  
  let result = null;
  let resourceBase = FhirUtilities.pluckReferenceBase(referenceString);

  if(typeof window[FhirUtilities.pluralizeResourceName(resourceBase)] === "object"){
    result = window[FhirUtilities.pluralizeResourceName(resourceBase)].findOne({id: FhirUtilities.pluckReferenceId(referenceString)});
  }
  
  return result;
}
export function lookupReferenceName(referenceString){
  
  let result = "";
  let resourceBase = FhirUtilities.pluckReferenceBase(referenceString);

  if(typeof window[FhirUtilities.pluralizeResourceName(resourceBase)] === "object"){

    let resolvedRecord = window[FhirUtilities.pluralizeResourceName(resourceBase)].findOne({id: FhirUtilities.pluckReferenceId(referenceString)});

    if(resolvedRecord){
      if(typeof resolvedRecord.name === "string"){
        result = get(resolvedRecord, 'name');
      } else if (Array.isArray(resolvedRecord.name)){
        result = FhirUtilities.assembleName(resolvedRecord.name[0])
      } else {
        result = referenceString;
      }
    }
  }
  
  return result;
}

export const FhirDehydrator = {
  dehydrateActivityDefinition: flattenActivityDefinition,
  dehydrateAllergyIntolerance: flattenAllergyIntolerance,
  dehydrateArtifactAssessment: flattenArtifactAssessment,
  dehydrateAuditEvent: flattenAuditEvent,
  dehydrateBundle: flattenBundle,
  dehydrateCarePlan: flattenCarePlan,
  dehydrateCareTeam: flattenCareTeam,
  dehydrateClaim: flattenClaim,
  dehydrateCodeSystem: flattenCodeSystem,
  dehydrateComposition: flattenComposition,
  dehydrateCommunication: flattenCommunication,
  dehydrateConsent: flattenConsent,
  dehydrateCommunicationRequest: flattenCommunicationRequest,
  dehydrateCommunicationResponse: flattenCommunicationResponse,
  dehydrateCondition: flattenCondition,
  dehydrateDevice: flattenDevice,
  dehydrateDiagnosticReport: flattenDiagnosticReport,
  dehydrateDocumentReference: flattenDocumentReference,
  dehydrateEncounter: flattenEncounter,
  dehydrateEndpoint: flattenEndpoint,
  dehydrateEvidence: flattenEvidence,
  dehydrateExplanationOfBenefit: flattenExplanationOfBenefit,
  dehydrateGroup: flattenGroup,
  dehydrateGoal: flattenGoal,
  dehydrateGuidanceResponse: flattenGuidanceResponse,
  dehydrateHealthcareService: flattenHealthcareService,
  dehydrateImmunization: flattenImmunization,
  dehydrateInsurancePlan: flattenInsurancePlan,
  dehydrateList: flattenList,
  dehydrateLibrary: flattenLibrary,
  dehydrateLocation: flattenLocation,
  dehydrateMeasureReport: flattenMeasureReport,
  dehydrateMeasure: flattenMeasure,
  dehydrateMedication: flattenMedication,
  dehydrateMedicationOrder: flattenMedicationOrder,
  dehydrateMedicationStatement: flattenMedicationStatement,
  dehydrateMedicationRequest: flattenMedicationRequest,
  dehydrateMedicationAdministration: flattenMedicationAdministration,
  dehydrateNetwork: flattenNetwork,
  dehydrateObservation: flattenObservation,
  dehydrateOrganization: flattenOrganization,
  dehydrateOperationOutcome: flattenOperationOutcome,
  dehydrateOrganizationAffiliation: function(input){
    let flattenedInput = flattenOrganizationAffiliation(input);
    let result = Object.assign({}, flattenedInput);

    result.organization = lookupReferenceName(get(flattenedInput, 'organization'));
    result.network = lookupReferenceName(get(flattenedInput, 'network'));
    result.location = lookupReferenceName(get(flattenedInput, 'location'));
    result.healthcareService = lookupReferenceName(get(flattenedInput, 'healthcareService'));

    return result
  },
  dehydratePatient: flattenPatient,
  dehydratePractitioner: flattenPractitioner,
  dehydratePractitionerRole: function(input){
    let flattenedInput = flattenPractitionerRole(input);
    let result = Object.assign({}, flattenedInput);

    result.practitioner = lookupReferenceName(get(flattenedInput, 'practitioner'));
    result.organization = lookupReferenceName(get(flattenedInput, 'organization'));
    result.location = lookupReferenceName(get(flattenedInput, 'location'));
    result.healthcareService = lookupReferenceName(get(flattenedInput, 'healthcareService'));

    return result
  },
  dehydratePlanDefinition: flattenPlanDefinition,
  dehydrateProcedure: flattenProcedure,
  dehydrateProvenance: flattenProvenance,
  dehydrateQuestionnaire: flattenQuestionnaire,
  dehydrateQuestionnaireResponse: flattenQuestionnaireResponse,
  dehydrateResearchStudy: flattenResearchStudy,
  dehydrateResearchSubject: flattenResearchSubject,
  dehydrateRestriction: flattenRestriction,
  dehydrateRiskAssessment: flattenRiskAssessment,
  dehydrateSearchParameter: flattenSearchParameter,
  dehydrateServiceRequest: flattenServiceRequest,
  dehydrateStructureDefinition: flattenStructureDefinition,
  dehydrateSubscription: flattenSubscription,
  dehydrateTask: flattenTask,
  dehydrateValueSet: flattenValueSet,
  dehydrateVerificationResult: flattenVerificationResult,
  flatten: flatten
}

export default {
  FhirDehydrator,
  lookupReference,
  lookupReferenceName,
  flattenActivityDefinition,
  flattenAllergyIntolerance,
  flattenArtifactAssessment,
  flattenAuditEvent,
  flattenBundle,
  flattenCarePlan,
  flattenCareTeam,
  flattenClaim,
  flattenCodeSystem,
  flattenComposition,
  flattenCondition,
  flattenConsent,
  flattenCommunication,
  flattenCommunicationRequest,
  flattenCommunicationResponse,
  flattenDevice,
  flattenDiagnosticReport,
  flattenDocumentReference,
  flattenEncounter,
  flattenEndpoint,
  flattenEvidence,
  flattenExplanationOfBenefit,
  flattenGoal,
  flattenGroup,
  flattenGuidanceResponse,
  flattenHealthcareService,
  flattenImmunization,
  flattenInsurancePlan,
  flattenLibrary,
  flattenList,
  flattenLocation,
  flattenMeasureReport,
  flattenMeasure,
  flattenMedication,
  flattenMedicationOrder,
  flattenMedicationStatement,
  flattenMedicationRequest,
  flattenMedicationAdministration,
  flattenObservation,
  flattenOperationOutcome,
  flattenOrganization,
  flattenOrganizationAffiliation,
  flattenPatient,
  flattenPlanDefinition,
  flattenPractitioner,
  flattenPractitionerRole,
  flattenProcedure,
  flattenProvenance,
  flattenQuestionnaire,
  flattenQuestionnaireResponse,
  flattenResearchStudy,
  flattenResearchSubject,
  flattenRestriction,
  flattenRiskAssessment,
  flattenSearchParameter,
  flattenServiceRequest,
  flattenStructureDefinition,
  flattenSubscription,
  flattenTask,
  flattenValueSet,
  flattenVerificationResult,
  flatten
}

