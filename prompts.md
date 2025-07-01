#### Creating SimpleSchemas Hydration/Dehydration Functions

```
I am writing hydration/dehydration functions for FHIR resources.  An example looks like the following:

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

Could you follow this general pattern, and create one for the Claim resource?  We are basically trying to serialize a structured tree (JSON) into something suitable for a CSV row or table.  We default to the first item in any array; and use lodash and moment libraries.
```