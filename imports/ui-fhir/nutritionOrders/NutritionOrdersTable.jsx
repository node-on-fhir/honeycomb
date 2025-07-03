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

function NutritionOrdersTable(props){
  const { 
    nutritionOrders = [],
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
    // This would normally fetch from the NutritionOrders collection
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
    const displayData = nutritionOrders.slice(startIndex, endIndex);

    return displayData.map((nutritionOrder, index) => (
      <TableRow key={nutritionOrder.id || index}>
        {!hideCheckbox && (
          <TableCell padding="checkbox">
            <Checkbox />
          </TableCell>
        )}
        {!hideIdentifier && (
          <TableCell>{get(nutritionOrder, 'identifier[0].value', '')}</TableCell>
        )}
        {!hideStatus && (
          <TableCell>{get(nutritionOrder, 'status', '')}</TableCell>
        )}
        {!hideName && (
          <TableCell>{get(nutritionOrder, 'patient.display', '')}</TableCell>
        )}
        <TableCell>{get(nutritionOrder, 'dateTime', '')}</TableCell>
        <TableCell>{get(nutritionOrder, 'orderer.display', '')}</TableCell>
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
              <TableCell>Date/Time</TableCell>
              <TableCell>Orderer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nutritionOrders.length > 0 ? 
              renderRows() : 
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No nutrition orders found
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={nutritionOrders.length}
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

export default NutritionOrdersTable;