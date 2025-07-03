import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox
} from '@mui/material';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import FhirUtilities from '../../lib/FhirUtilities';

function MedicationStatementsTable(props){
  const { 
    medicationStatements = [],
    hideCheckbox = true,
    hideActionIcons = true,
    hideIdentifier = true,
    hideStatus = false,
    hideName = false,
    paginationLimit = 10,
    rowsPerPage = 10,
    page = 0,
    onSetPage,
    onSetRowsPerPage,
    ...otherProps
  } = props;

  const [currentPage, setCurrentPage] = useState(0);
  const [currentRowsPerPage, setCurrentRowsPerPage] = useState(rowsPerPage);

  // Data subscription would go here in a real implementation
  const data = useTracker(() => {
    // This would normally fetch from the MedicationStatements collection
    return [];
  }, []);

  const handleChangePage = (event, newPage) => {
    if(onSetPage){
      onSetPage(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if(onSetRowsPerPage){
      onSetRowsPerPage(newRowsPerPage);
    } else {
      setCurrentRowsPerPage(newRowsPerPage);
      setCurrentPage(0);
    }
  };

  const renderRows = () => {
    const startIndex = currentPage * currentRowsPerPage;
    const endIndex = startIndex + currentRowsPerPage;
    const displayData = medicationStatements.slice(startIndex, endIndex);

    return displayData.map((medicationStatement, index) => (
      <TableRow key={medicationStatement.id || index}>
        {!hideCheckbox && (
          <TableCell padding="checkbox">
            <Checkbox />
          </TableCell>
        )}
        {!hideIdentifier && (
          <TableCell>{get(medicationStatement, 'identifier[0].value', '')}</TableCell>
        )}
        {!hideStatus && (
          <TableCell>{get(medicationStatement, 'status', '')}</TableCell>
        )}
        {!hideName && (
          <TableCell>{get(medicationStatement, 'subject.display', '')}</TableCell>
        )}
        <TableCell>{get(medicationStatement, 'medicationCodeableConcept.text', get(medicationStatement, 'medicationReference.display', ''))}</TableCell>
        <TableCell>{get(medicationStatement, 'effectiveDateTime', get(medicationStatement, 'effectivePeriod.start', ''))}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              {!hideCheckbox && <TableCell padding="checkbox"></TableCell>}
              {!hideIdentifier && <TableCell>Identifier</TableCell>}
              {!hideStatus && <TableCell>Status</TableCell>}
              {!hideName && <TableCell>Patient</TableCell>}
              <TableCell>Medication</TableCell>
              <TableCell>Effective Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicationStatements.length > 0 ? 
              renderRows() : 
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No medication statements found
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={medicationStatements.length}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={currentRowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Paper>
    </div>
  );
}

export default MedicationStatementsTable;